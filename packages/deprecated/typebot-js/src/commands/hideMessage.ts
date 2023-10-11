import { closeProactiveMessage } from '../embedTypes/chat/proactiveMessage'

export const hideMessage = () => {
  const existingBubble = document.querySelector('#probot-bubble')
  if (existingBubble) closeProactiveMessage(existingBubble)
}
