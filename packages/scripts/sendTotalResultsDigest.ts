import {
  MemberInWorkspace,
  PrismaClient,
  WorkspaceRole,
} from '@typebot.io/prisma'
import { isDefined } from '@typebot.io/lib'
import { getChatsLimit } from '@typebot.io/lib/pricing'
import { promptAndSetEnvironment } from './utils'
import { TelemetryEvent } from '@typebot.io/schemas/features/telemetry'
import { sendTelemetryEvents } from '@typebot.io/lib/telemetry/sendTelemetryEvent'
import { Workspace } from '@typebot.io/schemas'

const prisma = new PrismaClient()

type WorkspaceForDigest = Pick<
  Workspace,
  | 'id'
  | 'plan'
  | 'customChatsLimit'
  | 'customStorageLimit'
  | 'additionalChatsIndex'
  | 'additionalStorageIndex'
  | 'isQuarantined'
> & {
  members: (Pick<MemberInWorkspace, 'role'> & {
    user: { id: string; email: string | null }
  })[]
}

export const sendTotalResultsDigest = async () => {
  await promptAndSetEnvironment('production')

  console.log("Generating total results yesterday's digest...")
  const todayMidnight = new Date()
  todayMidnight.setUTCHours(0, 0, 0, 0)
  const yesterday = new Date(todayMidnight)
  yesterday.setDate(yesterday.getDate() - 1)

  const results = await prisma.result.groupBy({
    by: ['probotId'],
    _count: {
      _all: true,
    },
    where: {
      hasStarted: true,
      createdAt: {
        gte: yesterday,
        lt: todayMidnight,
      },
    },
  })

  console.log(
    `Found ${results.reduce(
      (total, result) => total + result._count._all,
      0
    )} results collected yesterday.`
  )

  const workspaces = await prisma.workspace.findMany({
    where: {
      probots: {
        some: {
          id: { in: results.map((result) => result.probotId) },
        },
      },
    },
    select: {
      id: true,
      probots: { select: { id: true } },
      members: {
        select: { user: { select: { id: true, email: true } }, role: true },
      },
      additionalChatsIndex: true,
      additionalStorageIndex: true,
      customChatsLimit: true,
      customStorageLimit: true,
      plan: true,
      isQuarantined: true,
    },
  })

  const resultsWithWorkspaces = results
    .flatMap((result) => {
      const workspace = workspaces.find((workspace) =>
        workspace.probots.some((probot) => probot.id === result.probotId)
      )
      if (!workspace) return
      return workspace.members
        .filter((member) => member.role !== WorkspaceRole.GUEST)
        .map((member, memberIndex) => ({
          userId: member.user.id,
          workspace: workspace,
          probotId: result.probotId,
          totalResultsYesterday: result._count._all,
          isFirstOfKind: memberIndex === 0 ? (true as const) : undefined,
        }))
    })
    .filter(isDefined)

  console.log('Computing workspaces limits...')

  const workspaceLimitReachedEvents = await sendAlertIfLimitReached(
    resultsWithWorkspaces
      .filter((result) => result.isFirstOfKind)
      .map((result) => result.workspace)
  )

  const newResultsCollectedEvents = resultsWithWorkspaces.map(
    (result) =>
      ({
        name: 'New results collected',
        userId: result.userId,
        workspaceId: result.workspace.id,
        probotId: result.probotId,
        data: {
          total: result.totalResultsYesterday,
          isFirstOfKind: result.isFirstOfKind,
        },
      } satisfies TelemetryEvent)
  )

  await sendTelemetryEvents(
    workspaceLimitReachedEvents.concat(newResultsCollectedEvents)
  )

  console.log(
    `Sent ${workspaceLimitReachedEvents.length} workspace limit reached events.`
  )
  console.log(
    `Sent ${newResultsCollectedEvents.length} new results collected events.`
  )
}

const sendAlertIfLimitReached = async (
  workspaces: WorkspaceForDigest[]
): Promise<TelemetryEvent[]> => {
  const events: TelemetryEvent[] = []
  const taggedWorkspaces: string[] = []
  for (const workspace of workspaces) {
    if (taggedWorkspaces.includes(workspace.id) || workspace.isQuarantined)
      continue
    taggedWorkspaces.push(workspace.id)
    const { totalChatsUsed } = await getUsage(workspace.id)
    const chatsLimit = getChatsLimit(workspace)
    if (chatsLimit > 0 && totalChatsUsed >= chatsLimit) {
      events.push(
        ...workspace.members
          .filter((member) => member.role === WorkspaceRole.ADMIN)
          .map(
            (member) =>
              ({
                name: 'Workspace limit reached',
                userId: member.user.id,
                workspaceId: workspace.id,
                data: {
                  totalChatsUsed,
                  chatsLimit,
                },
              } satisfies TelemetryEvent)
          )
      )
      continue
    }
  }
  return events
}

const getUsage = async (workspaceId: string) => {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const probots = await prisma.probot.findMany({
    where: {
      workspace: {
        id: workspaceId,
      },
    },
    select: { id: true },
  })

  const [totalChatsUsed] = await Promise.all([
    prisma.result.count({
      where: {
        probotId: { in: probots.map((probot) => probot.id) },
        hasStarted: true,
        createdAt: {
          gte: firstDayOfMonth,
          lt: firstDayOfNextMonth,
        },
      },
    }),
  ])

  return {
    totalChatsUsed,
  }
}

sendTotalResultsDigest().then()