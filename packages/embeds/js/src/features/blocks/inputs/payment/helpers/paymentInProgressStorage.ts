import { BotContext } from '@/types'

export const setPaymentInProgressInStorage = (state: {
  sessionId: string
  probot: BotContext['probot']
}) => {
  sessionStorage.setItem('probotPaymentInProgress', JSON.stringify(state))
}

export const getPaymentInProgressInStorage = () =>
  sessionStorage.getItem('probotPaymentInProgress')

export const removePaymentInProgressFromStorage = () => {
  sessionStorage.removeItem('probotPaymentInProgress')
}
