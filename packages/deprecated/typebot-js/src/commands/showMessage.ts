import { openProactiveMessage } from '../embedTypes/chat/proactiveMessage'

export const showMessage = () => {
  const existingBubble = document.querySelector('#probot-bubble')
  if (existingBubble) openProactiveMessage(existingBubble)
}
