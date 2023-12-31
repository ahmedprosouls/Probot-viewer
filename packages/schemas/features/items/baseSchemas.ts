import { z } from 'zod'

export const itemBaseSchema = z.object({
  id: z.string(),
  blockId: z.string().optional().describe('Deprecated'),
  outgoingEdgeId: z.string().optional(),
})

export type ItemBase = z.infer<typeof itemBaseSchema>
