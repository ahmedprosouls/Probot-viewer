import { customElement } from 'solid-element'
import {
  defaultBotProps,
  defaultBubbleProps,
  defaultPopupProps,
} from './constants'
import { Bubble } from './features/bubble'
import { Popup } from './features/popup'
import { Standard } from './features/standard'

export const registerWebComponents = () => {
  if (typeof window === 'undefined') return
  // @ts-expect-error element incorect type
  customElement('probot-standard', defaultBotProps, Standard)
  customElement('probot-bubble', defaultBubbleProps, Bubble)
  customElement('probot-popup', defaultPopupProps, Popup)
}
