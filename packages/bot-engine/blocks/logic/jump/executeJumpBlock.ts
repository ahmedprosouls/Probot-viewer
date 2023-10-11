import { addEdgeToProbot, createPortalEdge } from '../../../addEdgeToProbot'
import { ExecuteLogicResponse } from '../../../types'
import { TRPCError } from '@trpc/server'
import { SessionState } from '@typebot.io/schemas'
import { JumpBlock } from '@typebot.io/schemas/features/blocks/logic/jump'

export const executeJumpBlock = (
  state: SessionState,
  { groupId, blockId }: JumpBlock['options']
): ExecuteLogicResponse => {
  const { probot } = state.probotsQueue[0]
  const groupToJumpTo = probot.groups.find((group) => group.id === groupId)
  const blockToJumpTo =
    groupToJumpTo?.blocks.find((block) => block.id === blockId) ??
    groupToJumpTo?.blocks[0]

  if (!blockToJumpTo?.groupId)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Block to jump to is not found',
    })

  const portalEdge = createPortalEdge({
    to: { groupId: blockToJumpTo?.groupId, blockId: blockToJumpTo?.id },
  })
  const newSessionState = addEdgeToProbot(state, portalEdge)

  return { outgoingEdgeId: portalEdge.id, newSessionState }
}
