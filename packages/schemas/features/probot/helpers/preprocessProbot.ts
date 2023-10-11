import { Block } from '../../blocks'
import { edgeSchema } from '../edge'
import type { Group } from '../probot'

export const preprocessProbot = (probot: any) => {
  if (!probot || probot.version === '5') return probot
  return {
    ...probot,
    version: probot.version === undefined ? null : probot.version,
    groups: probot.groups ? probot.groups.map(preprocessGroup) : [],
    edges: probot.edges
      ? probot.edges?.filter((edge: any) => edgeSchema.safeParse(edge).success)
      : [],
  }
}

const preprocessGroup = (group: Group) => ({
  ...group,
  blocks: group.blocks.map((block) =>
    preprocessBlock(block, { groupId: group.id })
  ),
})

const preprocessBlock = (block: Block, { groupId }: { groupId: string }) => ({
  ...block,
  groupId: block.groupId ?? groupId,
})
