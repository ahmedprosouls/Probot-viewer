import {
  InputBlock,
  InputBlockType,
  LogicBlockType,
  PublicProbot,
  ResultHeaderCell,
  Block,
  Probot,
  ProbotLinkBlock,
  Variable,
} from '@typebot.io/schemas'
import { isInputBlock, byId, isNotDefined } from '@typebot.io/lib'
import { parseResultHeader } from '@typebot.io/lib/results'

export const parseSampleResult =
  (
    probot: Pick<Probot | PublicProbot, 'groups' | 'variables' | 'edges'>,
    linkedProbots: (Probot | PublicProbot)[]
  ) =>
  async (
    currentGroupId: string,
    variables: Variable[]
  ): Promise<Record<string, string | boolean | undefined>> => {
    const header = parseResultHeader(probot, linkedProbots)
    const linkedInputBlocks = await extractLinkedInputBlocks(
      probot,
      linkedProbots
    )(currentGroupId)

    return {
      message: 'This is a sample result, it has been generated ⬇️',
      submittedAt: new Date().toISOString(),
      ...parseResultSample(linkedInputBlocks, header, variables),
    }
  }

const extractLinkedInputBlocks =
  (
    probot: Pick<Probot | PublicProbot, 'groups' | 'variables' | 'edges'>,
    linkedProbots: (Probot | PublicProbot)[]
  ) =>
  async (
    currentGroupId?: string,
    direction: 'backward' | 'forward' = 'backward'
  ): Promise<InputBlock[]> => {
    const previousLinkedProbotBlocks = walkEdgesAndExtract(
      'linkedBot',
      direction,
      probot
    )({
      groupId: currentGroupId,
    }) as ProbotLinkBlock[]

    const linkedBotInputs =
      previousLinkedProbotBlocks.length > 0
        ? await Promise.all(
            previousLinkedProbotBlocks.map((linkedBot) =>
              extractLinkedInputBlocks(
                linkedProbots.find((t) =>
                  'probotId' in t
                    ? t.probotId === linkedBot.options.probotId
                    : t.id === linkedBot.options.probotId
                ) as Probot | PublicProbot,
                linkedProbots
              )(linkedBot.options.groupId, 'forward')
            )
          )
        : []

    return (
      walkEdgesAndExtract(
        'input',
        direction,
        probot
      )({
        groupId: currentGroupId,
      }) as InputBlock[]
    ).concat(linkedBotInputs.flatMap((l) => l))
  }

const parseResultSample = (
  inputBlocks: InputBlock[],
  headerCells: ResultHeaderCell[],
  variables: Variable[]
) =>
  headerCells.reduce<Record<string, string | (string | null)[] | undefined>>(
    (resultSample, cell) => {
      const inputBlock = inputBlocks.find((inputBlock) =>
        cell.blocks?.some((block) => block.id === inputBlock.id)
      )
      if (isNotDefined(inputBlock)) {
        if (cell.variableIds) {
          const variableValue = variables.find(
            (variable) =>
              cell.variableIds?.includes(variable.id) && variable.value
          )?.value
          return {
            ...resultSample,
            [cell.label]: variableValue ?? 'content',
          }
        }

        return resultSample
      }
      const variableValue = variables.find(
        (variable) => cell.variableIds?.includes(variable.id) && variable.value
      )?.value
      const value = variableValue ?? getSampleValue(inputBlock)
      return {
        ...resultSample,
        [cell.label]: value,
      }
    },
    {}
  )

const getSampleValue = (block: InputBlock): string => {
  switch (block.type) {
    case InputBlockType.CHOICE:
      return block.options.isMultipleChoice
        ? block.items.map((item) => item.content).join(', ')
        : block.items[0]?.content ?? 'Item'
    case InputBlockType.DATE:
      return new Date().toUTCString()
    case InputBlockType.EMAIL:
      return 'test@email.com'
    case InputBlockType.NUMBER:
      return '20'
    case InputBlockType.PHONE:
      return '+33665566773'
    case InputBlockType.TEXT:
      return 'answer value'
    case InputBlockType.URL:
      return 'https://test.com'
    case InputBlockType.FILE:
      return 'https://domain.com/fake-file.png'
    case InputBlockType.RATING:
      return '8'
    case InputBlockType.PAYMENT:
      return 'Success'
    case InputBlockType.PICTURE_CHOICE:
      return block.options.isMultipleChoice
        ? block.items.map((item) => item.title ?? item.pictureSrc).join(', ')
        : block.items[0]?.title ?? block.items[0]?.pictureSrc ?? 'Item'
  }
}

const walkEdgesAndExtract =
  (
    type: 'input' | 'linkedBot',
    direction: 'backward' | 'forward',
    probot: Pick<Probot | PublicProbot, 'groups' | 'variables' | 'edges'>
  ) =>
  ({ groupId }: { groupId?: string }): Block[] => {
    const currentGroupId =
      groupId ??
      (probot.groups.find((b) => b.blocks[0].type === 'start')?.id as string)
    const blocksInGroup = extractBlocksInGroup(
      type,
      probot
    )({
      groupId: currentGroupId,
    })
    const otherGroupIds = getGroupIds(probot, direction)(currentGroupId)
    return [
      ...blocksInGroup,
      ...otherGroupIds.flatMap((groupId) =>
        extractBlocksInGroup(type, probot)({ groupId })
      ),
    ]
  }

const getGroupIds =
  (
    probot: Pick<Probot | PublicProbot, 'groups' | 'variables' | 'edges'>,
    direction: 'backward' | 'forward',
    existingGroupIds?: string[]
  ) =>
  (groupId: string): string[] => {
    const groups = probot.edges.reduce<string[]>((groupIds, edge) => {
      if (direction === 'forward')
        return (!existingGroupIds ||
          !existingGroupIds?.includes(edge.to.groupId)) &&
          edge.from.groupId === groupId
          ? [...groupIds, edge.to.groupId]
          : groupIds
      return (!existingGroupIds ||
        !existingGroupIds.includes(edge.from.groupId)) &&
        edge.to.groupId === groupId
        ? [...groupIds, edge.from.groupId]
        : groupIds
    }, [])
    const newGroups = [...(existingGroupIds ?? []), ...groups]
    return groups.concat(
      groups.flatMap(getGroupIds(probot, direction, newGroups))
    )
  }

const extractBlocksInGroup =
  (
    type: 'input' | 'linkedBot',
    probot: Pick<Probot | PublicProbot, 'groups' | 'variables' | 'edges'>
  ) =>
  ({ groupId, blockId }: { groupId: string; blockId?: string }) => {
    const currentGroup = probot.groups.find(byId(groupId))
    if (!currentGroup) return []
    const blocks: Block[] = []
    for (const block of currentGroup.blocks) {
      if (block.id === blockId) break
      if (type === 'input' && isInputBlock(block)) blocks.push(block)
      if (type === 'linkedBot' && block.type === LogicBlockType.PROBOT_LINK)
        blocks.push(block)
    }
    return blocks
  }
