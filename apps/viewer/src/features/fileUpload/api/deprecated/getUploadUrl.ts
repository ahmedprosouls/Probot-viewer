import { publicProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import {
  FileInputBlock,
  InputBlockType,
  LogicBlockType,
  PublicProbot,
  ProbotLinkBlock,
} from '@typebot.io/schemas'
import { byId, isDefined } from '@typebot.io/lib'
import { z } from 'zod'
import { generatePresignedUrl } from '@typebot.io/lib/s3/deprecated/generatePresignedUrl'
import { env } from '@typebot.io/env'
import prisma from '@typebot.io/lib/prisma'

export const getUploadUrl = publicProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/probots/{probotId}/blocks/{blockId}/storage/upload-url',
      summary: 'Get upload URL for a file',
      description: 'Used for the web client to get the bucket upload file.',
      deprecated: true,
    },
  })
  .input(
    z.object({
      probotId: z.string(),
      blockId: z.string(),
      filePath: z.string(),
      fileType: z.string().optional(),
    })
  )
  .output(
    z.object({
      presignedUrl: z.string(),
      hasReachedStorageLimit: z.boolean(),
    })
  )
  .query(async ({ input: { probotId, blockId, filePath, fileType } }) => {
    if (!env.S3_ENDPOINT || !env.S3_ACCESS_KEY || !env.S3_SECRET_KEY)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'S3 not properly configured. Missing one of those variables: S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY',
      })

    const PublicProbot = (await prisma.publicProbot.findFirst({
      where: { probotId },
      select: {
        groups: true,
        probotId: true,
      },
    })) as Pick<PublicProbot, 'groups' | 'probotId'>

    const fileUploadBlock = await getFileUploadBlock(PublicProbot, blockId)

    if (!fileUploadBlock)
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'File upload block not found',
      })

    const presignedUrl = await generatePresignedUrl({
      fileType,
      filePath,
    })

    return {
      presignedUrl,
      hasReachedStorageLimit: false,
    }
  })

const getFileUploadBlock = async (
  publicprobot: Pick<PublicProbot, 'groups' | 'probotId'>,
  blockId: string
): Promise<FileInputBlock | null> => {
  const fileUploadBlock = publicprobot.groups
    .flatMap((group) => group.blocks)
    .find(byId(blockId))
  if (fileUploadBlock?.type === InputBlockType.FILE) return fileUploadBlock
  const linkedprobotIds = publicprobot.groups
    .flatMap((group) => group.blocks)
    .filter((block) => block.type === LogicBlockType.PROBOT_LINK)
    .flatMap((block) => (block as ProbotLinkBlock).options.probotId)
    .filter(isDefined)
  const linkedprobots = (await prisma.publicProbot.findMany({
    where: { probotId: { in: linkedprobotIds } },
    select: {
      groups: true,
    },
  })) as Pick<PublicProbot, 'groups'>[]
  const fileUploadBlockFromLinkedprobots = linkedprobots
    .flatMap((probot) => probot.groups)
    .flatMap((group) => group.blocks)
    .find(byId(blockId))
  if (fileUploadBlockFromLinkedprobots?.type === InputBlockType.FILE)
    return fileUploadBlockFromLinkedprobots
  return null
}
