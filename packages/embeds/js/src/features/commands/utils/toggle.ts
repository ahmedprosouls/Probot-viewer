import { CommandData } from '../types'

export const toggle = () => {
  const message: CommandData = {
    isFromProbot: true,
    command: 'toggle',
  }
  window.postMessage(message)
}
