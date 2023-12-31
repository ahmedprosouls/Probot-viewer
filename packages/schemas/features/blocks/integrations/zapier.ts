import { z } from 'zod'
import { blockBaseSchema } from '../baseSchemas'
import { IntegrationBlockType } from './enums'
import { webhookOptionsSchema } from './webhook/schemas'

export const zapierBlockSchema = blockBaseSchema.merge(
  z.object({
    type: z.enum([IntegrationBlockType.ZAPIER]),
    options: webhookOptionsSchema,
    webhookId: z
      .string()
      .describe('Deprecated, use webhook.id instead')
      .optional(),
  })
)

export type ZapierBlock = z.infer<typeof zapierBlockSchema>
