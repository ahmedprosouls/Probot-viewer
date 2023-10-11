import { ExecuteIntegrationResponse } from '../../../types'
import { GoogleAnalyticsBlock, SessionState } from '@typebot.io/schemas'
import { deepParseVariables } from '../../../variables/deepParseVariables'

export const executeGoogleAnalyticsBlock = (
  state: SessionState,
  block: GoogleAnalyticsBlock
): ExecuteIntegrationResponse => {
  const { probot, resultId } = state.probotsQueue[0]
  if (!resultId || state.whatsApp)
    return { outgoingEdgeId: block.outgoingEdgeId }
  const googleAnalytics = deepParseVariables(probot.variables, {
    guessCorrectTypes: true,
    removeEmptyStrings: true,
  })(block.options)
  return {
    outgoingEdgeId: block.outgoingEdgeId,
    clientSideActions: [
      {
        googleAnalytics,
      },
    ],
  }
}
