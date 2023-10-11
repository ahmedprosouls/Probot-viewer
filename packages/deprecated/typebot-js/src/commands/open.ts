import { openIframe } from '../embedTypes/chat/iframe'
import { openPopup } from '../embedTypes/popup'

export const open = () => {
  const existingPopup = document.querySelector('#probot-popup')
  if (existingPopup) openPopup(existingPopup)
  const existingBubble = document.querySelector('#probot-bubble')
  if (existingBubble) openIframe(existingBubble)
}
