import { PrismaClient } from '@typebot.io/prisma'
import { writeFileSync } from 'fs'
import {
  Block,
  BlockOptions,
  BlockType,
  defaultEmailInputOptions,
  Group,
  InputBlockType,
  PublicProbot,
  publicProbotSchema,
  Theme,
  Probot,
} from '@typebot.io/schemas'
import { isDefined, isNotDefined } from '@typebot.io/lib'
import { promptAndSetEnvironment } from './utils'
import { detailedDiff } from 'deep-object-diff'

const fixProbot = (brokenProbot: Probot | PublicProbot) =>
  ({
    ...brokenProbot,
    theme: fixTheme(brokenProbot.theme),
    groups: fixGroups(brokenProbot.groups),
  } satisfies Probot | PublicProbot)

const fixTheme = (brokenTheme: Theme) =>
  ({
    ...brokenTheme,
    chat: {
      ...brokenTheme.chat,
      hostAvatar: brokenTheme.chat.hostAvatar
        ? {
            isEnabled: brokenTheme.chat.hostAvatar.isEnabled,
            url: brokenTheme.chat.hostAvatar.url ?? undefined,
          }
        : undefined,
    },
  } satisfies Theme)

const fixGroups = (brokenGroups: Group[]) =>
  brokenGroups.map(
    (brokenGroup, index) =>
      ({
        ...brokenGroup,
        graphCoordinates: {
          ...brokenGroup.graphCoordinates,
          x: brokenGroup.graphCoordinates.x ?? 0,
          y: brokenGroup.graphCoordinates.y ?? 0,
        },
        blocks: fixBlocks(brokenGroup.blocks, brokenGroup.id, index),
      } satisfies Group)
  )

const fixBlocks = (
  brokenBlocks: Block[],
  groupId: string,
  groupIndex: number
) => {
  if (groupIndex === 0 && brokenBlocks.length > 1) return [brokenBlocks[0]]
  return brokenBlocks
    .filter((block) => block && Object.keys(block).length > 0)
    .map((brokenBlock) => {
      return removeUndefinedFromObject({
        ...brokenBlock,
        webhookId:
          ('webhookId' in brokenBlock ? brokenBlock.webhookId : undefined) ??
          ('webhook' in brokenBlock && brokenBlock.webhook
            ? //@ts-ignore
              brokenBlock.webhook.id
            : undefined),
        webhook: undefined,
        groupId: brokenBlock.groupId ?? groupId,
        options:
          brokenBlock && 'options' in brokenBlock && brokenBlock.options
            ? fixBrokenBlockOption(brokenBlock.options, brokenBlock.type)
            : undefined,
      })
    }) as Block[]
}

const fixBrokenBlockOption = (options: BlockOptions, blockType: BlockType) =>
  removeUndefinedFromObject({
    ...options,
    sheetId:
      'sheetId' in options && isDefined(options.sheetId)
        ? options.sheetId.toString()
        : undefined,
    step:
      'step' in options && isDefined(options.step) ? options.step : undefined,
    value:
      'value' in options && isDefined(options.value)
        ? options.value
        : undefined,
    retryMessageContent: fixRetryMessageContent(
      //@ts-ignore
      options.retryMessageContent,
      blockType
    ),
  }) as BlockOptions

const fixRetryMessageContent = (
  retryMessageContent: string | undefined,
  blockType: BlockType
) => {
  if (isNotDefined(retryMessageContent) && blockType === InputBlockType.EMAIL)
    return defaultEmailInputOptions.retryMessageContent
  if (isNotDefined(retryMessageContent)) return undefined
  return retryMessageContent
}

const removeUndefinedFromObject = (obj: any) => {
  Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key])
  return obj
}

const resolve = (path: string, obj: object, separator = '.') => {
  const properties = Array.isArray(path) ? path : path.split(separator)
  //@ts-ignore
  return properties.reduce((prev, curr) => prev?.[curr], obj)
}

const fixProbots = async () => {
  await promptAndSetEnvironment()
  const prisma = new PrismaClient({
    log: [{ emit: 'event', level: 'query' }, 'info', 'warn', 'error'],
  })

  const probots = await prisma.publicProbot.findMany({
    where: {
      updatedAt: {
        gte: new Date('2023-01-01T00:00:00.000Z'),
      },
    },
  })

  writeFileSync('logs/probots.json', JSON.stringify(probots))

  const total = probots.length
  let totalFixed = 0
  let progress = 0
  const fixedProbots: (Probot | PublicProbot)[] = []
  const diffs: any[] = []
  for (const probot of probots) {
    progress += 1
    console.log(
      `Progress: ${progress}/${total} (${Math.round(
        (progress / total) * 100
      )}%) (${totalFixed} fixed probots)`
    )
    const parser = publicProbotSchema.safeParse({
      ...probot,
      updatedAt: new Date(probot.updatedAt),
      createdAt: new Date(probot.createdAt),
    })
    if ('error' in parser) {
      const fixedProbot = {
        ...fixProbot(probot as Probot | PublicProbot),
        updatedAt: new Date(),
        createdAt: new Date(probot.createdAt),
      }
      publicProbotSchema.parse(fixedProbot)
      fixedProbots.push(fixedProbot)
      totalFixed += 1
      diffs.push({
        id: probot.id,
        failedObject: resolve(parser.error.issues[0].path.join('.'), probot),
        ...detailedDiff(probot, fixedProbot),
      })
    }
  }
  writeFileSync('logs/fixedProbots.json', JSON.stringify(fixedProbots))
  writeFileSync(
    'logs/diffs.json',
    JSON.stringify(diffs.reverse().slice(0, 100))
  )

  const queries = fixedProbots.map((fixedProbot) =>
    prisma.publicProbot.updateMany({
      where: { id: fixedProbot.id },
      data: {
        ...fixedProbot,
        // theme: fixedProbot.theme ?? undefined,
        // settings: fixedProbot.settings ?? undefined,
        // resultsTablePreferences:
        //   'resultsTablePreferences' in fixedProbot &&
        //   fixedProbot.resultsTablePreferences
        //     ? fixedProbot.resultsTablePreferences
        //     : undefined,
      } as any,
    })
  )

  const totalQueries = queries.length
  progress = 0
  prisma.$on('query', () => {
    progress += 1
    console.log(`Progress: ${progress}/${totalQueries}`)
  })

  await prisma.$transaction(queries)
}

fixProbots()
