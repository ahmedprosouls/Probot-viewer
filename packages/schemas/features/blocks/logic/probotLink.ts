import { z } from 'zod'
import { blockBaseSchema } from '../baseSchemas'
import { LogicBlockType } from './enums'

export const probotLinkOptionsSchema = z.object({
  probotId: z.string().optional(),
  groupId: z.string().optional(),
  mergeResults: z.boolean().optional(),
})

export const probotLinkBlockSchema = blockBaseSchema.merge(
  z.object({
    type: z.enum([LogicBlockType.PROBOT_LINK]),
    options: probotLinkOptionsSchema,
  })
)

export const defaultProbotLinkOptions: ProbotLinkOptions = {
  mergeResults: false,
}

export type ProbotLinkBlock = z.infer<typeof probotLinkBlockSchema>
export type ProbotLinkOptions = z.infer<typeof probotLinkOptionsSchema>
