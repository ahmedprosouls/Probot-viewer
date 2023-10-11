import { Plan } from '@typebot.io/prisma'
import { z } from 'zod'

const userEvent = z.object({
  userId: z.string(),
})

const workspaceEvent = userEvent.merge(
  z.object({
    workspaceId: z.string(),
  })
)

const probotEvent = workspaceEvent.merge(
  z.object({
    probotId: z.string(),
  })
)

const workspaceCreatedEventSchema = workspaceEvent.merge(
  z.object({
    name: z.literal('Workspace created'),
    data: z.object({
      name: z.string().optional(),
      plan: z.nativeEnum(Plan),
    }),
  })
)

const userCreatedEventSchema = userEvent.merge(
  z.object({
    name: z.literal('User created'),
    data: z.object({
      email: z.string(),
      name: z.string().optional(),
    }),
  })
)

const probotCreatedEventSchema = probotEvent.merge(
  z.object({
    name: z.literal('Probot created'),
    data: z.object({
      name: z.string(),
      template: z.string().optional(),
    }),
  })
)

const publishedProbotEventSchema = probotEvent.merge(
  z.object({
    name: z.literal('Probot published'),
    data: z.object({
      name: z.string(),
      isFirstPublish: z.literal(true).optional(),
    }),
  })
)

const subscriptionUpdatedEventSchema = workspaceEvent.merge(
  z.object({
    name: z.literal('Subscription updated'),
    data: z.object({
      plan: z.nativeEnum(Plan),
      additionalChatsIndex: z.number(),
    }),
  })
)

const newResultsCollectedEventSchema = probotEvent.merge(
  z.object({
    name: z.literal('New results collected'),
    data: z.object({
      total: z.number(),
      isFirstOfKind: z.literal(true).optional(),
    }),
  })
)

const workspaceLimitReachedEventSchema = workspaceEvent.merge(
  z.object({
    name: z.literal('Workspace limit reached'),
    data: z.object({
      chatsLimit: z.number(),
      totalChatsUsed: z.number(),
    }),
  })
)

const workspaceAutoQuarantinedEventSchema = workspaceEvent.merge(
  z.object({
    name: z.literal('Workspace automatically quarantined'),
    data: z.object({
      chatsLimit: z.number(),
      totalChatsUsed: z.number(),
    }),
  })
)

export const eventSchema = z.discriminatedUnion('name', [
  workspaceCreatedEventSchema,
  userCreatedEventSchema,
  probotCreatedEventSchema,
  publishedProbotEventSchema,
  subscriptionUpdatedEventSchema,
  newResultsCollectedEventSchema,
  workspaceLimitReachedEventSchema,
  workspaceAutoQuarantinedEventSchema,
])

export type TelemetryEvent = z.infer<typeof eventSchema>
