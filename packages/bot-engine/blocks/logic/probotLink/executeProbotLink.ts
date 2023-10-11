import { addEdgeToProbot, createPortalEdge } from '../../../addEdgeToProbot'
import {
  ProbotLinkBlock,
  SessionState,
  Variable,
  ReplyLog,
  Edge,
  probotInSessionStateSchema,
  ProbotInSession,
} from '@typebot.io/schemas'
import { ExecuteLogicResponse } from '../../../types'
import { createId } from '@paralleldrive/cuid2'
import { isNotDefined } from '@typebot.io/lib/utils'
import { createResultIfNotExist } from '../../../queries/createResultIfNotExist'
import { executeJumpBlock } from '../jump/executeJumpBlock'
import prisma from '@typebot.io/lib/prisma'

export const executeProbotLink = async (
  state: SessionState,
  block: ProbotLinkBlock
): Promise<ExecuteLogicResponse> => {
  const logs: ReplyLog[] = []
  const probotId = block.options.probotId
  if (
    probotId === 'current' ||
    probotId === state.probotsQueue[0].probot.id
  ) {
    return executeJumpBlock(state, {
      groupId: block.options.groupId,
    })
  }
  if (!probotId) {
    logs.push({
      status: 'error',
      description: `Failed to link probot`,
      details: `Probot ID is not specified`,
    })
    return { outgoingEdgeId: block.outgoingEdgeId, logs }
  }
  const linkedProbot = await fetchProbot(state, probotId)
  if (!linkedProbot) {
    logs.push({
      status: 'error',
      description: `Failed to link probot`,
      details: `Probot with ID ${block.options.probotId} not found`,
    })
    return { outgoingEdgeId: block.outgoingEdgeId, logs }
  }
  let newSessionState = await addLinkedProbotToState(
    state,
    block,
    linkedProbot
  )

  const nextGroupId =
    block.options.groupId ??
    linkedProbot.groups.find((group) =>
      group.blocks.some((block) => block.type === 'start')
    )?.id
  if (!nextGroupId) {
    logs.push({
      status: 'error',
      description: `Failed to link probot`,
      details: `Group with ID "${block.options.groupId}" not found`,
    })
    return { outgoingEdgeId: block.outgoingEdgeId, logs }
  }

  const portalEdge = createPortalEdge({ to: { groupId: nextGroupId } })

  newSessionState = addEdgeToProbot(newSessionState, portalEdge)

  return {
    outgoingEdgeId: portalEdge.id,
    newSessionState,
  }
}

const addLinkedProbotToState = async (
  state: SessionState,
  block: ProbotLinkBlock,
  linkedProbot: ProbotInSession
): Promise<SessionState> => {
  const currentProbotInQueue = state.probotsQueue[0]
  const isPreview = isNotDefined(currentProbotInQueue.resultId)

  const resumeEdge = createResumeEdgeIfNecessary(state, block)

  const currentProbotWithResumeEdge = resumeEdge
    ? {
        ...currentProbotInQueue,
        probot: {
          ...currentProbotInQueue.probot,
          edges: [...currentProbotInQueue.probot.edges, resumeEdge],
        },
      }
    : currentProbotInQueue

  const shouldMergeResults = block.options.mergeResults !== false

  if (
    currentProbotInQueue.resultId &&
    currentProbotInQueue.answers.length === 0 &&
    shouldMergeResults
  ) {
    await createResultIfNotExist({
      resultId: currentProbotInQueue.resultId,
      probot: currentProbotInQueue.probot,
      hasStarted: false,
      isCompleted: false,
    })
  }

  return {
    ...state,
    probotsQueue: [
      {
        probot: {
          ...linkedProbot,
          variables: fillVariablesWithExistingValues(
            linkedProbot.variables,
            currentProbotInQueue.probot.variables
          ),
        },
        resultId: isPreview
          ? undefined
          : shouldMergeResults
          ? currentProbotInQueue.resultId
          : createId(),
        edgeIdToTriggerWhenDone: block.outgoingEdgeId ?? resumeEdge?.id,
        answers: shouldMergeResults ? currentProbotInQueue.answers : [],
        isMergingWithParent: shouldMergeResults,
      },
      currentProbotWithResumeEdge,
      ...state.probotsQueue.slice(1),
    ],
  }
}

const createResumeEdgeIfNecessary = (
  state: SessionState,
  block: ProbotLinkBlock
): Edge | undefined => {
  const currentProbotInQueue = state.probotsQueue[0]
  const blockId = block.id
  if (block.outgoingEdgeId) return
  const currentGroup = currentProbotInQueue.probot.groups.find((group) =>
    group.blocks.some((block) => block.id === blockId)
  )
  if (!currentGroup) return
  const currentBlockIndex = currentGroup.blocks.findIndex(
    (block) => block.id === blockId
  )
  const nextBlockInGroup =
    currentBlockIndex === -1
      ? undefined
      : currentGroup.blocks[currentBlockIndex + 1]
  if (!nextBlockInGroup) return
  return {
    id: createId(),
    from: {
      groupId: '',
      blockId: '',
    },
    to: {
      groupId: nextBlockInGroup.groupId,
      blockId: nextBlockInGroup.id,
    },
  }
}

const fillVariablesWithExistingValues = (
  emptyVariables: Variable[],
  existingVariables: Variable[]
): Variable[] =>
  emptyVariables.map((emptyVariable) => {
    const matchedVariable = existingVariables.find(
      (existingVariable) => existingVariable.name === emptyVariable.name
    )

    return {
      ...emptyVariable,
      value: matchedVariable?.value,
    }
  })

const fetchProbot = async (state: SessionState, probotId: string) => {
  const { resultId } = state.probotsQueue[0]
  const isPreview = !resultId
  if (isPreview) {
    const probot = await prisma.probot.findUnique({
      where: { id: probotId },
      select: {
        version: true,
        id: true,
        edges: true,
        groups: true,
        variables: true,
      },
    })
    return probotInSessionStateSchema.parse(probot)
  }
  const probot = await prisma.publicProbot.findUnique({
    where: { probotId },
    select: {
      version: true,
      id: true,
      edges: true,
      groups: true,
      variables: true,
    },
  })
  if (!probot) return null
  return probotInSessionStateSchema.parse({
    ...probot,
    id: probotId,
  })
}
