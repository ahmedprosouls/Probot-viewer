import { closeIframe } from '../embedTypes/chat/iframe'
import { closePopup } from '../embedTypes/popup'

export const close = () => {
  const existingPopup = document.querySelector('#probot-popup')
  if (existingPopup) closePopup(existingPopup)
  const existingBubble = document.querySelector('#probot-bubble')
  if (existingBubble) closeIframe(existingBubble)
}
