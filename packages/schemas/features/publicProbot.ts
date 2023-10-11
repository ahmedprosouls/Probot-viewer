import { PublicProbot as PrismaPublicProbot } from '@typebot.io/prisma'
import {
  groupSchema,
  variableSchema,
  themeSchema,
  settingsSchema,
} from './probot'
import { z } from 'zod'
import { preprocessProbot } from './probot/helpers/preprocessProbot'
import { edgeSchema } from './probot/edge'

export const publicProbotSchema = z.preprocess(
  preprocessProbot,
  z.object({
    id: z.string(),
    version: z.enum(['3', '4', '5']).nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    probotId: z.string(),
    groups: z.array(groupSchema),
    edges: z.array(edgeSchema),
    variables: z.array(variableSchema),
    theme: themeSchema,
    settings: settingsSchema,
  })
) satisfies z.ZodType<PrismaPublicProbot, z.ZodTypeDef, unknown>

export type PublicProbot = z.infer<typeof publicProbotSchema>
