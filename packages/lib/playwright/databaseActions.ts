import {
  Plan,
  Prisma,
  PrismaClient,
  User,
  Workspace,
  WorkspaceRole,
} from '@typebot.io/prisma'
import { createId } from '@paralleldrive/cuid2'
import { Probot, Webhook } from '@typebot.io/schemas'
import { readFileSync } from 'fs'
import { proWorkspaceId, userId } from './databaseSetup'
import {
  parseTestProbot,
  parseProbotToPublicProbot,
} from './databaseHelpers'

const prisma = new PrismaClient()

type CreateFakeResultsProps = {
  probotId: string
  count: number
  customResultIdPrefix?: string
  isChronological?: boolean
}

export const injectFakeResults = async ({
  count,
  customResultIdPrefix,
  probotId,
  isChronological,
}: CreateFakeResultsProps) => {
  const resultIdPrefix = customResultIdPrefix ?? createId()
  await prisma.result.createMany({
    data: [
      ...Array.from(Array(count)).map((_, idx) => {
        const today = new Date()
        const rand = Math.random()
        return {
          id: `${resultIdPrefix}-result${idx}`,
          probotId,
          createdAt: isChronological
            ? new Date(
                today.setTime(today.getTime() + 1000 * 60 * 60 * 24 * idx)
              )
            : new Date(),
          isCompleted: rand > 0.5,
          hasStarted: true,
          variables: [],
        } satisfies Prisma.ResultCreateManyInput
      }),
    ],
  })
  return createAnswers({ resultIdPrefix, count })
}

const createAnswers = ({
  count,
  resultIdPrefix,
}: { resultIdPrefix: string } & Pick<CreateFakeResultsProps, 'count'>) => {
  return prisma.answer.createMany({
    data: [
      ...Array.from(Array(count)).map((_, idx) => ({
        resultId: `${resultIdPrefix}-result${idx}`,
        content: `content${idx}`,
        blockId: 'block1',
        groupId: 'group1',
      })),
    ],
  })
}

export const importProbotInDatabase = async (
  path: string,
  updates?: Partial<Probot>
) => {
  const probot: Probot = {
    ...JSON.parse(readFileSync(path).toString()),
    workspaceId: proWorkspaceId,
    ...updates,
    version: '3',
  }
  await prisma.probot.create({
    data: parseCreateProbot(probot),
  })
  return prisma.publicProbot.create({
    data: parseProbotToPublicProbot(
      updates?.id ? `${updates?.id}-public` : 'publicBot',
      probot
    ),
  })
}

export const deleteWorkspaces = async (workspaceIds: string[]) => {
  await prisma.workspace.deleteMany({
    where: { id: { in: workspaceIds } },
  })
}

export const deleteProbots = async (probotIds: string[]) => {
  await prisma.probot.deleteMany({
    where: { id: { in: probotIds } },
  })
}

export const deleteCredentials = async (credentialIds: string[]) => {
  await prisma.credentials.deleteMany({
    where: { id: { in: credentialIds } },
  })
}

export const deleteWebhooks = async (webhookIds: string[]) => {
  await prisma.webhook.deleteMany({
    where: { id: { in: webhookIds } },
  })
}

export const createWorkspaces = async (workspaces: Partial<Workspace>[]) => {
  const workspaceIds = workspaces.map((workspace) => workspace.id ?? createId())
  await prisma.workspace.createMany({
    data: workspaces.map((workspace, index) => ({
      id: workspaceIds[index],
      name: 'Free workspace',
      plan: Plan.FREE,
      ...workspace,
    })),
  })
  await prisma.memberInWorkspace.createMany({
    data: workspaces.map((_, index) => ({
      userId,
      workspaceId: workspaceIds[index],
      role: WorkspaceRole.ADMIN,
    })),
  })
  return workspaceIds
}

export const updateUser = (data: Partial<User>) =>
  prisma.user.update({
    data: {
      ...data,
      onboardingCategories: data.onboardingCategories ?? [],
    },
    where: {
      id: userId,
    },
  })

export const createWebhook = async (
  probotId: string,
  webhookProps?: Partial<Webhook>
) => {
  try {
    await prisma.webhook.delete({ where: { id: 'webhook1' } })
  } catch {}
  return prisma.webhook.create({
    data: {
      method: 'GET',
      probotId,
      id: 'webhook1',
      ...webhookProps,
      queryParams: webhookProps?.queryParams ?? [],
      headers: webhookProps?.headers ?? [],
    },
  })
}

export const createProbots = async (partialProbots: Partial<Probot>[]) => {
  const probotsWithId = partialProbots.map((probot) => {
    const probotId = probot.id ?? createId()
    return {
      ...probot,
      id: probotId,
      publicId: probot.publicId ?? probotId + '-public',
    }
  })
  await prisma.probot.createMany({
    data: probotsWithId.map(parseTestProbot).map(parseCreateProbot),
  })
  return prisma.publicProbot.createMany({
    data: probotsWithId.map((t) =>
      parseProbotToPublicProbot(t.publicId, parseTestProbot(t))
    ),
  })
}

export const updateProbot = async (
  partialProbot: Partial<Probot> & { id: string }
) => {
  await prisma.probot.updateMany({
    where: { id: partialProbot.id },
    data: parseUpdateProbot(partialProbot),
  })
  return prisma.publicProbot.updateMany({
    where: { probotId: partialProbot.id },
    data: partialProbot,
  })
}

export const updateWorkspace = async (
  id: string,
  data: Prisma.WorkspaceUncheckedUpdateManyInput
) => {
  await prisma.workspace.updateMany({
    where: { id: proWorkspaceId },
    data,
  })
}

export const parseCreateProbot = (probot: Probot) => ({
  ...probot,
  resultsTablePreferences:
    probot.resultsTablePreferences === null
      ? Prisma.DbNull
      : probot.resultsTablePreferences,
})

const parseUpdateProbot = (probot: Partial<Probot>) => ({
  ...probot,
  resultsTablePreferences:
    probot.resultsTablePreferences === null
      ? Prisma.DbNull
      : probot.resultsTablePreferences,
})
