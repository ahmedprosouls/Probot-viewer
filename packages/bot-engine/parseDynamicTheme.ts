import { SessionState, ChatReply } from '@typebot.io/schemas'
import { parseVariables } from './variables/parseVariables'

export const parseDynamicTheme = (
  state: SessionState | undefined
): ChatReply['dynamicTheme'] => {
  if (!state?.dynamicTheme) return
  return {
    hostAvatarUrl: parseVariables(state?.probotsQueue[0].probot.variables)(
      state.dynamicTheme.hostAvatarUrl
    ),
    guestAvatarUrl: parseVariables(state?.probotsQueue[0].probot.variables)(
      state.dynamicTheme.guestAvatarUrl
    ),
  }
}
