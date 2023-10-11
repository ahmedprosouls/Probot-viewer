import { LinkedProbot } from '@/providers/ProbotProvider'
import { EdgeId, LogicState } from '@/types'
import { ProbotLinkBlock, Edge, PublicProbot } from '@typebot.io/schemas'
import { fetchAndInjectProbot } from '../queries/fetchAndInjectProbotQuery'

export const executeProbotLink = async (
  block: ProbotLinkBlock,
  context: LogicState
): Promise<{
  nextEdgeId?: EdgeId
  linkedProbot?: PublicProbot | LinkedProbot
}> => {
  const {
    probot,
    linkedProbots,
    onNewLog,
    createEdge,
    setCurrentProbotId,
    pushEdgeIdInLinkedProbotQueue,
    pushParentProbotId,
    currentProbotId,
  } = context
  const linkedProbot = (
    block.options.probotId === 'current'
      ? probot
      : [probot, ...linkedProbots].find((probot) =>
          'probotId' in probot
            ? probot.probotId === block.options.probotId
            : probot.id === block.options.probotId
        ) ?? (await fetchAndInjectProbot(block, context))
  ) as PublicProbot | LinkedProbot | undefined
  if (!linkedProbot) {
    onNewLog({
      status: 'error',
      description: 'Failed to link probot',
      details: '',
    })
    return { nextEdgeId: block.outgoingEdgeId }
  }
  if (block.outgoingEdgeId)
    pushEdgeIdInLinkedProbotQueue({
      edgeId: block.outgoingEdgeId,
      probotId: currentProbotId,
    })
  pushParentProbotId(currentProbotId)
  setCurrentProbotId(
    'probotId' in linkedProbot ? linkedProbot.probotId : linkedProbot.id
  )
  const nextGroupId =
    block.options.groupId ??
    linkedProbot.groups.find((b) => b.blocks.some((s) => s.type === 'start'))
      ?.id
  if (!nextGroupId) return { nextEdgeId: block.outgoingEdgeId }
  const newEdge: Edge = {
    id: (Math.random() * 1000).toString(),
    from: { blockId: '', groupId: '' },
    to: {
      groupId: nextGroupId,
    },
  }
  createEdge(newEdge)
  return {
    nextEdgeId: newEdge.id,
    linkedProbot: {
      ...linkedProbot,
      edges: [...linkedProbot.edges, newEdge],
    },
  }
}
