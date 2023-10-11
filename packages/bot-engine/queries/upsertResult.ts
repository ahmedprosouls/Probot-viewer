import prisma from '@typebot.io/lib/prisma'
import { getDefinedVariables } from '@typebot.io/lib/results'
import { ProbotInSession } from '@typebot.io/schemas'

type Props = {
  resultId: string
  probot: ProbotInSession
  hasStarted: boolean
  isCompleted: boolean
}
export const upsertResult = async ({
  resultId,
  probot,
  hasStarted,
  isCompleted,
}: Props) => {
  const existingResult = await prisma.result.findUnique({
    where: { id: resultId },
    select: { id: true },
  })
  const variablesWithValue = getDefinedVariables(probot.variables)

  if (existingResult) {
    return prisma.result.updateMany({
      where: { id: resultId },
      data: {
        isCompleted: isCompleted ? true : undefined,
        hasStarted,
        variables: variablesWithValue,
      },
    })
  }
  return prisma.result.createMany({
    data: [
      {
        id: resultId,
        probotId: probot.id,
        isCompleted: isCompleted ? true : false,
        hasStarted,
        variables: variablesWithValue,
      },
    ],
  })
}
