import { safeStringify } from '@typebot.io/lib/safeStringify'
import {
  SessionState,
  VariableWithUnknowValue,
  Variable,
} from '@typebot.io/schemas'

export const updateVariablesInSession =
  (state: SessionState) =>
  (newVariables: VariableWithUnknowValue[]): SessionState => ({
    ...state,
    probotsQueue: state.probotsQueue.map((probotInQueue, index) =>
      index === 0
        ? {
            ...probotInQueue,
            probot: {
              ...probotInQueue.probot,
              variables: updateProbotVariables(probotInQueue.probot)(
                newVariables
              ),
            },
          }
        : probotInQueue
    ),
  })

const updateProbotVariables =
  (probot: { variables: Variable[] }) =>
  (newVariables: VariableWithUnknowValue[]): Variable[] => {
    const serializedNewVariables = newVariables.map((variable) => ({
      ...variable,
      value: Array.isArray(variable.value)
        ? variable.value.map(safeStringify)
        : safeStringify(variable.value),
    }))

    return [
      ...probot.variables.filter((existingVariable) =>
        serializedNewVariables.every(
          (newVariable) => existingVariable.id !== newVariable.id
        )
      ),
      ...serializedNewVariables,
    ]
  }
