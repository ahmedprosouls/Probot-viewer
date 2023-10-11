import { LinkedProbot } from '@/providers/ProbotProvider'
import { LogicState } from '@/types'
import { ProbotLinkBlock, Probot, PublicProbot } from '@typebot.io/schemas'
import { sendRequest } from '@typebot.io/lib'

export const fetchAndInjectProbot = async (
  block: ProbotLinkBlock,
  { apiHost, injectLinkedProbot, isPreview }: LogicState
): Promise<LinkedProbot | undefined> => {
  const { data, error } = isPreview
    ? await sendRequest<{ probot: Probot }>(
        `/api/probots/${block.options.probotId}`
      )
    : await sendRequest<{ probot: PublicProbot }>(
        `${apiHost}/api/publicProbots/${block.options.probotId}`
      )
  if (!data || error) return
  return injectLinkedProbot(data.probot)
}
