import prisma from '@typebot.io/lib/prisma'
import { User } from '@typebot.io/prisma'

type Props = {
  isPreview?: boolean
  probotIds: string[]
  user?: User
}

export const fetchLinkedProbots = async ({
  user,
  isPreview,
  probotIds,
}: Props) => {
  if (!user || !isPreview)
    return prisma.publicProbot.findMany({
      where: { id: { in: probotIds } },
    })
  const linkedProbots = await prisma.probot.findMany({
    where: { id: { in: probotIds } },
    include: {
      collaborators: {
        select: {
          userId: true,
        },
      },
      workspace: {
        select: {
          members: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  })

  return linkedProbots.filter(
    (probot) =>
      probot.collaborators.some(
        (collaborator) => collaborator.userId === user.id
      ) || probot.workspace.members.some((member) => member.userId === user.id)
  )
}
