import { CommandData } from '../types'

export const close = () => {
  const message: CommandData = {
    isFromProbot: true,
    command: 'close',
  }
  window.postMessage(message)
}
