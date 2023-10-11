import {
  Background,
  BackgroundType,
  ChatTheme,
  ContainerColors,
  GeneralTheme,
  InputColors,
  Theme,
} from '@typebot.io/schemas'

const cssVariableNames = {
  general: {
    bgImage: '--probot-container-bg-image',
    bgColor: '--probot-container-bg-color',
    fontFamily: '--probot-container-font-family',
  },
  chat: {
    hostBubbles: {
      bgColor: '--probot-host-bubble-bg-color',
      color: '--probot-host-bubble-color',
    },
    guestBubbles: {
      bgColor: '--probot-guest-bubble-bg-color',
      color: '--probot-guest-bubble-color',
    },
    inputs: {
      bgColor: '--probot-input-bg-color',
      color: '--probot-input-color',
      placeholderColor: '--probot-input-placeholder-color',
    },
    buttons: {
      bgColor: '--probot-button-bg-color',
      color: '--probot-button-color',
    },
  },
}

export const setCssVariablesValue = (
  theme: Theme | undefined,
  documentStyle: CSSStyleDeclaration
) => {
  if (!theme) return
  if (theme.general) setGeneralTheme(theme.general, documentStyle)
  if (theme.chat) setChatTheme(theme.chat, documentStyle)
}

const setGeneralTheme = (
  generalTheme: GeneralTheme,
  documentStyle: CSSStyleDeclaration
) => {
  const { background, font } = generalTheme
  if (background) setProbotBackground
  if (font) documentStyle.setProperty(cssVariableNames.general.fontFamily, font)
}

const setChatTheme = (
  chatTheme: ChatTheme,
  documentStyle: CSSStyleDeclaration
) => {
  const { hostBubbles, guestBubbles, buttons, inputs } = chatTheme
  if (hostBubbles) setHostBubbles(hostBubbles, documentStyle)
  if (guestBubbles) setGuestBubbles(guestBubbles, documentStyle)
  if (buttons) setButtons(buttons, documentStyle)
  if (inputs) setInputs(inputs, documentStyle)
}

const setHostBubbles = (
  hostBubbles: ContainerColors,
  documentStyle: CSSStyleDeclaration
) => {
  if (hostBubbles.backgroundColor)
    documentStyle.setProperty(
      cssVariableNames.chat.hostBubbles.bgColor,
      hostBubbles.backgroundColor
    )
  if (hostBubbles.color)
    documentStyle.setProperty(
      cssVariableNames.chat.hostBubbles.color,
      hostBubbles.color
    )
}

const setGuestBubbles = (
  guestBubbles: ContainerColors,
  documentStyle: CSSStyleDeclaration
) => {
  if (guestBubbles.backgroundColor)
    documentStyle.setProperty(
      cssVariableNames.chat.guestBubbles.bgColor,
      guestBubbles.backgroundColor
    )
  if (guestBubbles.color)
    documentStyle.setProperty(
      cssVariableNames.chat.guestBubbles.color,
      guestBubbles.color
    )
}

const setButtons = (
  buttons: ContainerColors,
  documentStyle: CSSStyleDeclaration
) => {
  if (buttons.backgroundColor)
    documentStyle.setProperty(
      cssVariableNames.chat.buttons.bgColor,
      buttons.backgroundColor
    )
  if (buttons.color)
    documentStyle.setProperty(
      cssVariableNames.chat.buttons.color,
      buttons.color
    )
}

const setInputs = (inputs: InputColors, documentStyle: CSSStyleDeclaration) => {
  if (inputs.backgroundColor)
    documentStyle.setProperty(
      cssVariableNames.chat.inputs.bgColor,
      inputs.backgroundColor
    )
  if (inputs.color)
    documentStyle.setProperty(cssVariableNames.chat.inputs.color, inputs.color)
  if (inputs.placeholderColor)
    documentStyle.setProperty(
      cssVariableNames.chat.inputs.placeholderColor,
      inputs.placeholderColor
    )
}

const setProbotBackground = (
  background: Background,
  documentStyle: CSSStyleDeclaration
) => {
  documentStyle.setProperty(
    background?.type === BackgroundType.IMAGE
      ? cssVariableNames.general.bgImage
      : cssVariableNames.general.bgColor,
    background.type === BackgroundType.NONE
      ? 'transparent'
      : background.content ?? '#ffffff'
  )
}
