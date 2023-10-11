import { publicProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { getSession } from '@typebot.io/bot-engine/queries/getSession'
import {
  PublicProbot,
  SessionState,
  Probot,
  Variable,
} from '@typebot.io/schemas'
import prisma from '@typebot.io/lib/prisma'

export const updateProbotInSession = publicProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/sessions/{sessionId}/updateProbot',
      summary: 'Update Probot in session',
      description:
        'Update chat session with latest Probot modifications. This is useful when you want to update the Probot in an ongoing session after making changes to it.',
      protect: true,
    },
  })
  .input(
    z.object({
      sessionId: z.string(),
    })
  )
  .output(z.object({ message: z.literal('success') }))
  .mutation(async ({ input: { sessionId }, ctx: { user } }) => {
    if (!user)
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized' })
    const session = await getSession(sessionId)
    if (!session)
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' })

    const PublicProbot = (await prisma.publicProbot.findFirst({
      where: {
        probot: {
          id: session.state.probotsQueue[0].probot.id,
          OR: [
            {
              workspace: {
                members: {
                  some: { userId: user.id, role: { in: ['ADMIN', 'MEMBER'] } },
                },
              },
            },
            {
              collaborators: {
                some: { userId: user.id, type: { in: ['WRITE'] } },
              },
            },
          ],
        },
      },
      select: {
        edges: true,
        groups: true,
        variables: true,
      },
    })) as Pick<PublicProbot, 'edges' | 'variables' | 'groups'> | null

    if (!PublicProbot)
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized' })

    const newSessionState = updateSessionState(session.state, PublicProbot)

    await prisma.chatSession.updateMany({
      where: { id: session.id },
      data: { state: newSessionState },
    })

    return { message: 'success' }
  })

const updateSessionState = (
  currentState: SessionState,
  newProbot: Pick<PublicProbot, 'edges' | 'variables' | 'groups'>
): SessionState => ({
  ...currentState,
  probotsQueue: currentState.probotsQueue.map((probotInQueue, index) =>
    index === 0
      ? {
          ...probotInQueue,
          probot: {
            ...probotInQueue.probot,
            edges: newProbot.edges,
            groups: newProbot.groups,
            variables: updateVariablesInSession(
              probotInQueue.probot.variables,
              newProbot.variables
            ),
          },
        }
      : probotInQueue
  ),
})

const updateVariablesInSession = (
  currentVariables: Variable[],
  newVariables: Probot['variables']
): Variable[] => [
  ...currentVariables,
  ...newVariables.filter(
    (newVariable) =>
      !currentVariables.find(
        (currentVariable) => currentVariable.id === newVariable.id
      )
  ),
]
