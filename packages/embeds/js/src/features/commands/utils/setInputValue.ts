import { CommandData } from '../types'

export const setInputValue = (value: string) => {
  const message: CommandData = {
    isFromProbot: true,
    command: 'setInputValue',
    value,
  }
  window.postMessage(message)
}
