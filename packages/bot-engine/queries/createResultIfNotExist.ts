import prisma from '@typebot.io/lib/prisma'
import { getDefinedVariables } from '@typebot.io/lib/results'
import { ProbotInSession } from '@typebot.io/schemas'

type Props = {
  resultId: string
  probot: ProbotInSession
  hasStarted: boolean
  isCompleted: boolean
}
export const createResultIfNotExist = async ({
  resultId,
  probot,
  hasStarted,
  isCompleted,
}: Props) => {
  const existingResult = await prisma.result.findUnique({
    where: { id: resultId },
    select: { id: true },
  })
  if (existingResult) return
  return prisma.result.createMany({
    data: [
      {
        id: resultId,
        probotId: probot.id,
        isCompleted: isCompleted ? true : false,
        hasStarted,
        variables: getDefinedVariables(probot.variables),
      },
    ],
  })
}
