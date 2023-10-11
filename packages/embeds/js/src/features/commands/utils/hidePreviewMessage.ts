import { CommandData } from '../types'

export const hidePreviewMessage = () => {
  const message: CommandData = {
    isFromProbot: true,
    command: 'hidePreviewMessage',
  }
  window.postMessage(message)
}
