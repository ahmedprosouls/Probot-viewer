import { getPrefilledInputValue } from '../../../getPrefilledValue'
import {
  DateInputBlock,
  DateInputOptions,
  SessionState,
  Variable,
} from '@typebot.io/schemas'
import { deepParseVariables } from '../../../variables/deepParseVariables'
import { parseVariables } from '../../../variables/parseVariables'

export const parseDateInput =
  (state: SessionState) => (block: DateInputBlock) => {
    return {
      ...block,
      options: {
        ...deepParseVariables(state.probotsQueue[0].probot.variables)(
          block.options
        ),
        min: parseDateLimit(
          block.options.min,
          block.options.hasTime,
          state.probotsQueue[0].probot.variables
        ),
        max: parseDateLimit(
          block.options.max,
          block.options.hasTime,
          state.probotsQueue[0].probot.variables
        ),
      },
      prefilledValue: getPrefilledInputValue(
        state.probotsQueue[0].probot.variables
      )(block),
    }
  }

const parseDateLimit = (
  limit: DateInputOptions['min'] | DateInputOptions['max'],
  hasTime: DateInputOptions['hasTime'],
  variables: Variable[]
) => {
  if (!limit) return
  const parsedLimit = parseVariables(variables)(limit)
  const dateIsoNoSecondsRegex = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d/
  const matchDateTime = parsedLimit.match(dateIsoNoSecondsRegex)
  if (matchDateTime)
    return hasTime ? matchDateTime[0] : matchDateTime[0].slice(0, 10)
  return parsedLimit
}
