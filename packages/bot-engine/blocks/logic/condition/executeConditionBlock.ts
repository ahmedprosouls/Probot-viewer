import { ConditionBlock, SessionState } from '@typebot.io/schemas'
import { ExecuteLogicResponse } from '../../../types'
import { executeCondition } from './executeCondition'

export const executeConditionBlock = (
  state: SessionState,
  block: ConditionBlock
): ExecuteLogicResponse => {
  const { variables } = state.probotsQueue[0].probot
  const passedCondition = block.items.find((item) =>
    executeCondition(variables)(item.content)
  )
  return {
    outgoingEdgeId: passedCondition
      ? passedCondition.outgoingEdgeId
      : block.outgoingEdgeId,
  }
}
