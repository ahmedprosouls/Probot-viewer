import prisma from '@typebot.io/lib/prisma'

type Props = {
  publicId: string
}

export const findPublicProbot = ({ publicId }: Props) =>
  prisma.publicProbot.findFirst({
    where: { probot: { publicId } },
    select: {
      version: true,
      groups: true,
      edges: true,
      settings: true,
      theme: true,
      variables: true,
      probotId: true,
      probot: {
        select: {
          isArchived: true,
          isClosed: true,
          workspace: {
            select: {
              id: true,
              plan: true,
              additionalChatsIndex: true,
              customChatsLimit: true,
              isQuarantined: true,
              isSuspended: true,
            },
          },
        },
      },
    },
  })
