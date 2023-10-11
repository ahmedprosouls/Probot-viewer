import { Result } from '@typebot.io/schemas'
import { sendRequest } from '@typebot.io/lib'

export const createResultQuery = async (probotId: string) => {
  return sendRequest<{ result: Result; hasReachedLimit: boolean }>({
    url: `/api/probots/${probotId}/results`,
    method: 'POST',
  })
}
