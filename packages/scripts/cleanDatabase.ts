import { PrismaClient } from '@typebot.io/prisma'
import { promptAndSetEnvironment } from './utils'
import { archiveResults } from '@typebot.io/lib/api/helpers/archiveResults'
import { Probot } from '@typebot.io/schemas'

const prisma = new PrismaClient()

export const cleanDatabase = async () => {
  await promptAndSetEnvironment('production')

  console.log('Starting database cleanup...')
  await deleteOldChatSessions()
  await deleteExpiredAppSessions()
  await deleteExpiredVerificationTokens()
  const isFirstOfMonth = new Date().getDate() === 1
  if (isFirstOfMonth) {
    await deleteArchivedResults()
    await deleteArchivedProbots()
    await resetBillingProps()
  }
  console.log('Database cleaned!')
}

const deleteArchivedProbots = async () => {
  const lastDayTwoMonthsAgo = new Date()
  lastDayTwoMonthsAgo.setMonth(lastDayTwoMonthsAgo.getMonth() - 1)
  lastDayTwoMonthsAgo.setDate(0)

  const probots = await prisma.probot.findMany({
    where: {
      updatedAt: {
        lte: lastDayTwoMonthsAgo,
      },
      isArchived: true,
    },
    select: { id: true },
  })

  console.log(`Deleting ${probots.length} archived probots...`)

  const chunkSize = 1000
  for (let i = 0; i < probots.length; i += chunkSize) {
    const chunk = probots.slice(i, i + chunkSize)
    await deleteResultsFromArchivedProbotsIfAny(chunk)
    await prisma.probot.deleteMany({
      where: {
        id: {
          in: chunk.map((probot) => probot.id),
        },
      },
    })
  }
  console.log('Done!')
}

const deleteArchivedResults = async () => {
  const lastDayTwoMonthsAgo = new Date()
  lastDayTwoMonthsAgo.setMonth(lastDayTwoMonthsAgo.getMonth() - 1)
  lastDayTwoMonthsAgo.setDate(0)
  let totalResults
  do {
    const results = await prisma.result.findMany({
      where: {
        createdAt: {
          lte: lastDayTwoMonthsAgo,
        },
        isArchived: true,
      },
      select: { id: true },
      take: 80000,
    })
    totalResults = results.length
    console.log(`Deleting ${results.length} archived results...`)
    const chunkSize = 1000
    for (let i = 0; i < results.length; i += chunkSize) {
      const chunk = results.slice(i, i + chunkSize)
      await prisma.result.deleteMany({
        where: {
          id: {
            in: chunk.map((result) => result.id),
          },
        },
      })
    }
  } while (totalResults === 80000)

  console.log('Done!')
}

const deleteOldChatSessions = async () => {
  const twoDaysAgo = new Date()
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
  let totalChatSessions
  do {
    const chatSessions = await prisma.chatSession.findMany({
      where: {
        updatedAt: {
          lte: twoDaysAgo,
        },
      },
      select: {
        id: true,
      },
      take: 80000,
    })

    totalChatSessions = chatSessions.length

    console.log(`Deleting ${chatSessions.length} old chat sessions...`)
    const chunkSize = 1000
    for (let i = 0; i < chatSessions.length; i += chunkSize) {
      const chunk = chatSessions.slice(i, i + chunkSize)
      await prisma.chatSession.deleteMany({
        where: {
          id: {
            in: chunk.map((chatSession) => chatSession.id),
          },
        },
      })
    }
  } while (totalChatSessions === 80000)
}

const deleteExpiredAppSessions = async () => {
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const { count } = await prisma.session.deleteMany({
    where: {
      expires: {
        lte: threeDaysAgo,
      },
    },
  })
  console.log(`Deleted ${count} expired user sessions.`)
}

const deleteExpiredVerificationTokens = async () => {
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  let totalVerificationTokens
  do {
    const verificationTokens = await prisma.verificationToken.findMany({
      where: {
        expires: {
          lte: threeDaysAgo,
        },
      },
      select: {
        token: true,
      },
      take: 80000,
    })

    totalVerificationTokens = verificationTokens.length

    console.log(`Deleting ${verificationTokens.length} expired tokens...`)
    const chunkSize = 1000
    for (let i = 0; i < verificationTokens.length; i += chunkSize) {
      const chunk = verificationTokens.slice(i, i + chunkSize)
      await prisma.verificationToken.deleteMany({
        where: {
          token: {
            in: chunk.map((verificationToken) => verificationToken.token),
          },
        },
      })
    }
  } while (totalVerificationTokens === 80000)
  console.log('Done!')
}

const resetBillingProps = async () => {
  console.log('Resetting billing props...')
  const { count } = await prisma.workspace.updateMany({
    where: {
      OR: [
        {
          isQuarantined: true,
        },
        {
          chatsLimitFirstEmailSentAt: { not: null },
        },
        {
          storageLimitFirstEmailSentAt: { not: null },
        },
      ],
    },
    data: {
      isQuarantined: false,
      chatsLimitFirstEmailSentAt: null,
      storageLimitFirstEmailSentAt: null,
      chatsLimitSecondEmailSentAt: null,
      storageLimitSecondEmailSentAt: null,
    },
  })
  console.log(`Resetted ${count} workspaces.`)
}

const deleteResultsFromArchivedProbotsIfAny = async (
  probotIds: { id: string }[]
) => {
  console.log('Checking for archived probots with non-archived results...')
  const archivedProbotsWithResults = (await prisma.probot.findMany({
    where: {
      id: {
        in: probotIds.map((probot) => probot.id),
      },
      isArchived: true,
      results: {
        some: {},
      },
    },
    select: {
      id: true,
      groups: true,
    },
  })) as Pick<Probot, 'groups' | 'id'>[]
  if (archivedProbotsWithResults.length === 0) return
  console.log(
    `Found ${archivedProbotsWithResults.length} archived probots with non-archived results.`
  )
  for (const archivedProbot of archivedProbotsWithResults) {
    await archiveResults(prisma)({
      probot: archivedProbot,
      resultsFilter: {
        probotId: archivedProbot.id,
      },
    })
  }
  console.log('Delete archived results...')
  await deleteArchivedResults()
}

cleanDatabase().then()
