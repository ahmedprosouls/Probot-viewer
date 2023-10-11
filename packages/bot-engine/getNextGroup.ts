import { byId, isDefined, isNotDefined } from '@typebot.io/lib'
import { Group, SessionState, VariableWithValue } from '@typebot.io/schemas'
import { upsertResult } from './queries/upsertResult'

export type NextGroup = {
  group?: Group
  newSessionState: SessionState
}

export const getNextGroup =
  (state: SessionState) =>
  async (edgeId?: string): Promise<NextGroup> => {
    const nextEdge = state.probotsQueue[0].probot.edges.find(byId(edgeId))
    if (!nextEdge) {
      if (state.probotsQueue.length > 1) {
        const nextEdgeId = state.probotsQueue[0].edgeIdToTriggerWhenDone
        const isMergingWithParent = state.probotsQueue[0].isMergingWithParent
        const currentResultId = state.probotsQueue[0].resultId
        if (!isMergingWithParent && currentResultId)
          await upsertResult({
            resultId: currentResultId,
            probot: state.probotsQueue[0].probot,
            isCompleted: true,
            hasStarted: state.probotsQueue[0].answers.length > 0,
          })
        const newSessionState = {
          ...state,
          probotsQueue: [
            {
              ...state.probotsQueue[1],
              probot: isMergingWithParent
                ? {
                    ...state.probotsQueue[1].probot,
                    variables: state.probotsQueue[1].probot.variables
                      .map((variable) => ({
                        ...variable,
                        value:
                          state.probotsQueue[0].answers.find(
                            (answer) => answer.key === variable.name
                          )?.value ?? variable.value,
                      }))
                      .concat(
                        state.probotsQueue[0].probot.variables.filter(
                          (variable) =>
                            isDefined(variable.value) &&
                            isNotDefined(
                              state.probotsQueue[1].probot.variables.find(
                                (v) => v.name === variable.name
                              )
                            )
                        ) as VariableWithValue[]
                      ),
                  }
                : state.probotsQueue[1].probot,
              answers: isMergingWithParent
                ? [
                    ...state.probotsQueue[1].answers.filter(
                      (incomingAnswer) =>
                        !state.probotsQueue[0].answers.find(
                          (currentAnswer) =>
                            currentAnswer.key === incomingAnswer.key
                        )
                    ),
                    ...state.probotsQueue[0].answers,
                  ]
                : state.probotsQueue[1].answers,
            },
            ...state.probotsQueue.slice(2),
          ],
        } satisfies SessionState
        const nextGroup = await getNextGroup(newSessionState)(nextEdgeId)
        if (!nextGroup)
          return {
            newSessionState,
          }
        return {
          ...nextGroup,
          newSessionState,
        }
      }
      return {
        newSessionState: state,
      }
    }
    const nextGroup = state.probotsQueue[0].probot.groups.find(
      byId(nextEdge.to.groupId)
    )
    if (!nextGroup)
      return {
        newSessionState: state,
      }
    const startBlockIndex = nextEdge.to.blockId
      ? nextGroup.blocks.findIndex(byId(nextEdge.to.blockId))
      : 0
    return {
      group: {
        ...nextGroup,
        blocks: nextGroup.blocks.slice(startBlockIndex),
      },
      newSessionState: state,
    }
  }
