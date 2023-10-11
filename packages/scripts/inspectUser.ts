import { PrismaClient } from '@typebot.io/prisma'
import { promptAndSetEnvironment } from './utils'
import prompts from 'prompts'
import { isEmpty } from '@typebot.io/lib'

const inspectUser = async () => {
  await promptAndSetEnvironment('production')
  const response = await prompts({
    type: 'text',
    name: 'email',
    message: 'User email',
  })

  if (isEmpty(response.email)) process.exit()
  const prisma = new PrismaClient({
    log: [{ emit: 'event', level: 'query' }, 'info', 'warn', 'error'],
  })

  const user = await prisma.user.findFirst({
    where: {
      email: response.email,
    },
    select: {
      name: true,
      lastActivityAt: true,
      company: true,
      onboardingCategories: true,
      workspaces: {
        where: {
          role: 'ADMIN',
        },
        select: {
          workspace: {
            select: {
              name: true,
              plan: true,
              members: {
                where: {
                  user: { email: { not: response.email } },
                },
              },
              additionalChatsIndex: true,
              additionalStorageIndex: true,
              probots: {
                orderBy: {
                  updatedAt: 'desc',
                },
                select: {
                  id: true,
                  name: true,
                  createdAt: true,
                  updatedAt: true,
                  publishedProbot: {
                    select: {
                      probot: {
                        select: { publicId: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!user) {
    console.log('User not found')
    process.exit()
  }

  console.log('Name:', user.name)
  console.log('Last activity:', user.lastActivityAt.toLocaleDateString())
  console.log('Company:', user.company)
  console.log('Onboarding categories:', user.onboardingCategories)
  console.log('Total workspaces:', user.workspaces.length)
  console.log('Workspaces:')

  for (const workspace of user.workspaces) {
    console.log('  - Name:', workspace.workspace.name)
    console.log('    Plan:', workspace.workspace.plan)
    console.log('    Members:', workspace.workspace.members.length + 1)
    console.log(
      '    Additional chats:',
      workspace.workspace.additionalChatsIndex
    )
    console.log(
      '    Additional storage:',
      workspace.workspace.additionalStorageIndex
    )
    console.log('    Probots:', workspace.workspace.probots.length)

    for (const probot of workspace.workspace.probots) {
      console.log('      - Name:', probot.name)
      console.log('        Created:', probot.createdAt.toLocaleDateString())
      console.log(
        '        Last updated:',
        probot.updatedAt.toLocaleDateString()
      )
      console.log(
        '        Public ID:',
        probot.publishedProbot?.probot.publicId
      )
      console.log(
        '        URL:',
        `https://app.probot.io/probots/${probot.id}/edit`
      )

      if (!probot.publishedProbot) continue

      const totalTraffic = await prisma.result.count({
        where: {
          probotId: probot.id,
          isArchived: false,
        },
        select: {
          _all: true,
          hasStarted: true,
        },
      })

      console.log('        Total traffic:', totalTraffic._all)
      console.log('        Started:', totalTraffic.hasStarted)
    }
  }
}

inspectUser()
