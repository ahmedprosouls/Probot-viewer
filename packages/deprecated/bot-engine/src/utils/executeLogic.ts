import { ProbotViewerProps } from '@/components/ProbotViewer'
import { executeCondition } from '@/features/blocks/logic/condition'
import { executeRedirect } from '@/features/blocks/logic/redirect'
import { executeSetVariable } from '@/features/blocks/logic/setVariable'
import { executeProbotLink } from '@/features/blocks/logic/probotLink'
import { executeWait } from '@/features/blocks/logic/wait'
import { LinkedProbot } from '@/providers/ProbotProvider'
import { EdgeId, LogicState } from '@/types'
import { LogicBlock, LogicBlockType } from '@typebot.io/schemas'
import { executeScript } from '@/features/blocks/logic/script/executeScript'

export const executeLogic = async (
  block: LogicBlock,
  context: LogicState
): Promise<{
  nextEdgeId?: EdgeId
  linkedProbot?: ProbotViewerProps['probot'] | LinkedProbot
  blockedPopupUrl?: string
}> => {
  switch (block.type) {
    case LogicBlockType.SET_VARIABLE:
      return { nextEdgeId: executeSetVariable(block, context) }
    case LogicBlockType.CONDITION:
      return { nextEdgeId: executeCondition(block, context) }
    case LogicBlockType.REDIRECT:
      return executeRedirect(block, context)
    case LogicBlockType.SCRIPT:
      return { nextEdgeId: await executeScript(block, context) }
    case LogicBlockType.PROBOT_LINK:
      return executeProbotLink(block, context)
    case LogicBlockType.WAIT:
      return { nextEdgeId: await executeWait(block, context) }
    default:
      return {}
  }
}
