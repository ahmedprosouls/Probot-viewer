/* eslint-disable solid/reactivity */
import { BubbleProps } from './features/bubble'
import { PopupProps } from './features/popup'
import { BotProps } from './components/Bot'
import {
  close,
  hidePreviewMessage,
  open,
  setPrefilledVariables,
  showPreviewMessage,
  toggle,
  setInputValue,
} from './features/commands'

export const initStandard = (props: BotProps & { id?: string }) => {
  const standardElement = props.id
    ? document.getElementById(props.id)
    : document.querySelector('probot-standard')
  if (!standardElement) throw new Error('<probot-standard> element not found.')
  Object.assign(standardElement, props)
}

export const initPopup = (props: PopupProps) => {
  const popupElement = document.createElement('probot-popup')
  Object.assign(popupElement, props)
  document.body.appendChild(popupElement)
}

export const initBubble = (props: BubbleProps) => {
  const bubbleElement = document.createElement('probot-bubble')
  Object.assign(bubbleElement, props)
  document.body.appendChild(bubbleElement)
}

type Probot = {
  initStandard: typeof initStandard
  initPopup: typeof initPopup
  initBubble: typeof initBubble
  close: typeof close
  hidePreviewMessage: typeof hidePreviewMessage
  open: typeof open
  setPrefilledVariables: typeof setPrefilledVariables
  showPreviewMessage: typeof showPreviewMessage
  toggle: typeof toggle
  setInputValue: typeof setInputValue
}

declare const window:
  | {
      Probot: Probot | undefined
    }
  | undefined

export const parseProbot = () => ({
  initStandard,
  initPopup,
  initBubble,
  close,
  hidePreviewMessage,
  open,
  setPrefilledVariables,
  showPreviewMessage,
  toggle,
  setInputValue,
})

export const injectProbotInWindow = (probot: Probot) => {
  if (typeof window === 'undefined') return
  window.Probot = { ...probot }
}
