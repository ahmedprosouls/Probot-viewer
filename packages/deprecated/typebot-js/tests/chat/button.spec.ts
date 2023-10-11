import * as Probot from '../../src'

beforeEach(() => {
  document.body.innerHTML = ''
})

it('should have the corresponding custom color', () => {
  expect.assertions(1)
  Probot.initBubble({
    button: { color: '#222222' },
    url: 'https://probot.io/probot-id',
  })
  const buttonElement = document.querySelector(
    '#probot-bubble > button'
  ) as HTMLElement
  expect(buttonElement.style.backgroundColor).toBe('rgb(34, 34, 34)')
})

it('should have the default svg icon', () => {
  expect.assertions(1)
  Probot.initBubble({
    url: 'https://probot.io/probot-id',
  })
  const buttonIconElement = document.querySelector(
    '#probot-bubble > button > .icon'
  ) as HTMLElement
  expect(buttonIconElement.tagName).toBe('svg')
})

it('should have the corresponding custom icon', () => {
  expect.assertions(1)
  Probot.initBubble({
    button: { iconUrl: 'https://web.com/icon.png' },
    url: 'https://probot.io/probot-id',
  })
  const buttonIconElement = document.querySelector(
    '#probot-bubble > button > .icon'
  ) as HTMLImageElement
  expect(buttonIconElement.src).toBe('https://web.com/icon.png')
})
