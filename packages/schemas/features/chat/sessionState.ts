import { z } from 'zod'
import { answerSchema } from '../answer'
import { resultSchema } from '../result'
import { probotInSessionStateSchema, dynamicThemeSchema } from './shared'
import { settingsSchema } from '../probot/settings'

const answerInSessionStateSchema = answerSchema.pick({
  content: true,
  blockId: true,
  variableId: true,
})

const answerInSessionStateSchemaV2 = z.object({
  key: z.string(),
  value: z.string(),
})

export type AnswerInSessionState = z.infer<typeof answerInSessionStateSchemaV2>

const resultInSessionStateSchema = resultSchema
  .pick({
    variables: true,
  })
  .merge(
    z.object({
      answers: z.array(answerInSessionStateSchema),
      id: z.string().optional(),
    })
  )

const sessionStateSchemaV1 = z.object({
  probot: probotInSessionStateSchema,
  dynamicTheme: dynamicThemeSchema.optional(),
  linkedProbots: z.object({
    probots: z.array(probotInSessionStateSchema),
    queue: z.array(z.object({ edgeId: z.string(), probotId: z.string() })),
  }),
  currentProbotId: z.string(),
  result: resultInSessionStateSchema,
  currentBlock: z
    .object({
      blockId: z.string(),
      groupId: z.string(),
    })
    .optional(),
  isStreamEnabled: z.boolean().optional(),
})

const sessionStateSchemaV2 = z.object({
  version: z.literal('2'),
  probotsQueue: z.array(
    z.object({
      edgeIdToTriggerWhenDone: z.string().optional(),
      isMergingWithParent: z.boolean().optional(),
      resultId: z.string().optional(),
      answers: z.array(answerInSessionStateSchemaV2),
      probot: probotInSessionStateSchema,
    })
  ),
  dynamicTheme: dynamicThemeSchema.optional(),
  currentBlock: z
    .object({
      blockId: z.string(),
      groupId: z.string(),
    })
    .optional(),
  isStreamEnabled: z.boolean().optional(),
  whatsApp: z
    .object({
      contact: z.object({
        name: z.string(),
        phoneNumber: z.string(),
      }),
    })
    .optional(),
  expiryTimeout: z
    .number()
    .min(1)
    .optional()
    .describe('Expiry timeout in milliseconds'),
  typingEmulation: settingsSchema.shape.typingEmulation.optional(),
})

export type SessionState = z.infer<typeof sessionStateSchemaV2>

export const sessionStateSchema = sessionStateSchemaV1
  .or(sessionStateSchemaV2)
  .transform((state): SessionState => {
    if ('version' in state) return state
    return {
      version: '2',
      probotsQueue: [
        {
          probot: state.probot,
          resultId: state.result.id,
          answers: state.result.answers.map((answer) => ({
            key:
              (answer.variableId
                ? state.probot.variables.find(
                    (variable) => variable.id === answer.variableId
                  )?.name
                : state.probot.groups.find((group) =>
                    group.blocks.find((block) => block.id === answer.blockId)
                  )?.title) ?? '',
            value: answer.content,
          })),
          isMergingWithParent: true,
          edgeIdToTriggerWhenDone:
            state.linkedProbots.queue.length > 0
              ? state.linkedProbots.queue[0].edgeId
              : undefined,
        },
        ...state.linkedProbots.probots.map(
          (probot, index) =>
            ({
              probot,
              resultId: state.result.id,
              answers: state.result.answers.map((answer) => ({
                key:
                  (answer.variableId
                    ? state.probot.variables.find(
                        (variable) => variable.id === answer.variableId
                      )?.name
                    : state.probot.groups.find((group) =>
                        group.blocks.find(
                          (block) => block.id === answer.blockId
                        )
                      )?.title) ?? '',
                value: answer.content,
              })),
              edgeIdToTriggerWhenDone: state.linkedProbots.queue.at(index + 1)
                ?.edgeId,
            } satisfies SessionState['probotsQueue'][number])
        ),
      ],
      dynamicTheme: state.dynamicTheme,
      currentBlock: state.currentBlock,
      isStreamEnabled: state.isStreamEnabled,
    }
  })
