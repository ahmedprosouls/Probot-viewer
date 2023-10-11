import { CollaborationType, CollaboratorsOnProbots } from '@typebot.io/prisma'
import { z } from 'zod'

export const collaboratorSchema = z.object({
  type: z.nativeEnum(CollaborationType),
  userId: z.string(),
  probotId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
}) satisfies z.ZodType<CollaboratorsOnProbots>
