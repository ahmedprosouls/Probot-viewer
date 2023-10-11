import { createId } from '@paralleldrive/cuid2'
import { SessionState, Edge } from '@typebot.io/schemas'

export const addEdgeToProbot = (
  state: SessionState,
  edge: Edge
): SessionState => ({
  ...state,
  probotsQueue: state.probotsQueue.map((probot, index) =>
    index === 0
      ? {
          ...probot,
          probot: {
            ...probot.probot,
            edges: [...probot.probot.edges, edge],
          },
        }
      : probot
  ),
})

export const createPortalEdge = ({ to }: Pick<Edge, 'to'>) => ({
  id: createId(),
  from: { blockId: '', groupId: '' },
  to,
})
