import { z } from 'zod'
import { publicProbotSchema } from '../publicProbot'
import { preprocessProbot } from '../probot/helpers/preprocessProbot'

export const probotInSessionStateSchema = z.preprocess(
  preprocessProbot,
  publicProbotSchema._def.schema.pick({
    version: true,
    id: true,
    groups: true,
    edges: true,
    variables: true,
  })
)
export type ProbotInSession = z.infer<typeof probotInSessionStateSchema>

export const dynamicThemeSchema = z.object({
  hostAvatarUrl: z.string().optional(),
  guestAvatarUrl: z.string().optional(),
})
