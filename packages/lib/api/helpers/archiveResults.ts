import { Prisma, PrismaClient } from '@typebot.io/prisma'
import { InputBlockType, Probot } from '@typebot.io/schemas'
import { deleteFilesFromBucket } from '../../s3/deleteFilesFromBucket'

type ArchiveResultsProps = {
  probot: Pick<Probot, 'groups'>
  resultsFilter?: Omit<Prisma.ResultWhereInput, 'probotId'> & {
    probotId: string
  }
}

export const archiveResults =
  (prisma: PrismaClient) =>
  async ({ probot, resultsFilter }: ArchiveResultsProps) => {
    const batchSize = 100
    const fileUploadBlockIds = probot.groups
      .flatMap((group) => group.blocks)
      .filter((block) => block.type === InputBlockType.FILE)
      .map((block) => block.id)

    let currentTotalResults = 0

    const resultsCount = await prisma.result.count({
      where: {
        ...resultsFilter,
        OR: [{ isArchived: false }, { isArchived: null }],
      },
    })

    if (resultsCount === 0) return { success: true }

    let progress = 0

    do {
      progress += batchSize
      console.log(`Archiving ${progress} / ${resultsCount} results...`)
      const resultsToDelete = await prisma.result.findMany({
        where: {
          ...resultsFilter,
          OR: [{ isArchived: false }, { isArchived: null }],
        },
        select: {
          id: true,
        },
        take: batchSize,
      })

      if (resultsToDelete.length === 0) break

      currentTotalResults = resultsToDelete.length

      const resultIds = resultsToDelete.map((result) => result.id)

      if (fileUploadBlockIds.length > 0) {
        const filesToDelete = await prisma.answer.findMany({
          where: {
            resultId: { in: resultIds },
            blockId: { in: fileUploadBlockIds },
          },
        })
        if (filesToDelete.length > 0)
          await deleteFilesFromBucket({
            urls: filesToDelete.flatMap((a) => a.content.split(', ')),
          })
      }

      await prisma.$transaction([
        prisma.log.deleteMany({
          where: {
            resultId: { in: resultIds },
          },
        }),
        prisma.answer.deleteMany({
          where: {
            resultId: { in: resultIds },
          },
        }),
        prisma.result.updateMany({
          where: {
            id: { in: resultIds },
          },
          data: {
            isArchived: true,
            variables: [],
          },
        }),
      ])
    } while (currentTotalResults >= batchSize)

    return { success: true }
  }
