import { PixelBlock, SessionState } from '@typebot.io/schemas'
import { ExecuteIntegrationResponse } from '../../../types'
import { deepParseVariables } from '../../../variables/deepParseVariables'

export const executePixelBlock = (
  state: SessionState,
  block: PixelBlock
): ExecuteIntegrationResponse => {
  const { probot, resultId } = state.probotsQueue[0]
  if (
    !resultId ||
    !block.options.pixelId ||
    !block.options.eventType ||
    state.whatsApp
  )
    return { outgoingEdgeId: block.outgoingEdgeId }
  const pixel = deepParseVariables(probot.variables, {
    guessCorrectTypes: true,
    removeEmptyStrings: true,
  })(block.options)
  return {
    outgoingEdgeId: block.outgoingEdgeId,
    clientSideActions: [
      {
        pixel: {
          ...pixel,
          pixelId: block.options.pixelId,
        },
      },
    ],
  }
}
