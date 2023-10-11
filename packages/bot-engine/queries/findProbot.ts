import prisma from '@typebot.io/lib/prisma'

type Props = {
  id: string
  userId?: string
}

export const findProbot = ({ id, userId }: Props) =>
  prisma.probot.findFirst({
    where: { id, workspace: { members: { some: { userId } } } },
    select: {
      version: true,
      id: true,
      groups: true,
      edges: true,
      settings: true,
      theme: true,
      variables: true,
      isArchived: true,
    },
  })
