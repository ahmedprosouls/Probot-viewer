import {
  Block,
  BubbleBlockType,
  SessionState,
  ProbotInSession,
} from '@typebot.io/schemas'
import {
  ChatCompletionOpenAIOptions,
  OpenAICredentials,
  chatCompletionMessageRoles,
} from '@typebot.io/schemas/features/blocks/integrations/openai'
import { byId, isEmpty } from '@typebot.io/lib'
import { decrypt, isCredentialsV2 } from '@typebot.io/lib/api/encryption'
import { resumeChatCompletion } from './resumeChatCompletion'
import { parseChatCompletionMessages } from './parseChatCompletionMessages'
import { executeChatCompletionOpenAIRequest } from './executeChatCompletionOpenAIRequest'
import { isPlaneteScale } from '@typebot.io/lib/isPlanetScale'
import prisma from '@typebot.io/lib/prisma'
import { ExecuteIntegrationResponse } from '../../../types'
import { parseVariableNumber } from '../../../variables/parseVariableNumber'
import { updateVariablesInSession } from '../../../variables/updateVariablesInSession'

export const createChatCompletionOpenAI = async (
  state: SessionState,
  {
    outgoingEdgeId,
    options,
    blockId,
  }: {
    outgoingEdgeId?: string
    options: ChatCompletionOpenAIOptions
    blockId: string
  }
): Promise<ExecuteIntegrationResponse> => {
  let newSessionState = state
  const noCredentialsError = {
    status: 'error',
    description: 'Make sure to select an OpenAI account',
  }
  if (!options.credentialsId) {
    return {
      outgoingEdgeId,
      logs: [noCredentialsError],
    }
  }
  const credentials = await prisma.credentials.findUnique({
    where: {
      id: options.credentialsId,
    },
  })
  if (!credentials) {
    console.error('Could not find credentials in database')
    return { outgoingEdgeId, logs: [noCredentialsError] }
  }
  const { apiKey } = (await decrypt(
    credentials.data,
    credentials.iv
  )) as OpenAICredentials['data']

  const { probot } = newSessionState.probotsQueue[0]

  const { variablesTransformedToList, messages } = parseChatCompletionMessages(
    probot.variables
  )(options.messages)
  if (variablesTransformedToList.length > 0)
    newSessionState = updateVariablesInSession(state)(
      variablesTransformedToList
    )

  const temperature = parseVariableNumber(probot.variables)(
    options.advancedSettings?.temperature
  )

  if (
    isPlaneteScale() &&
    isCredentialsV2(credentials) &&
    newSessionState.isStreamEnabled &&
    !newSessionState.whatsApp
  ) {
    const assistantMessageVariableName = probot.variables.find(
      (variable) =>
        options.responseMapping.find(
          (m) => m.valueToExtract === 'Message content'
        )?.variableId === variable.id
    )?.name

    return {
      clientSideActions: [
        {
          streamOpenAiChatCompletion: {
            messages: messages as {
              content?: string
              role: (typeof chatCompletionMessageRoles)[number]
            }[],
            displayStream: isNextBubbleMessageWithAssistantMessage(probot)(
              blockId,
              assistantMessageVariableName
            ),
          },
          expectsDedicatedReply: true,
        },
      ],
      outgoingEdgeId,
      newSessionState,
    }
  }

  const { response, logs } = await executeChatCompletionOpenAIRequest({
    apiKey,
    messages,
    model: options.model,
    temperature,
    baseUrl: options.baseUrl,
    apiVersion: options.apiVersion,
  })
  if (!response)
    return {
      outgoingEdgeId,
      logs,
    }
  const messageContent = response.choices.at(0)?.message?.content
  const totalTokens = response.usage?.total_tokens
  if (isEmpty(messageContent)) {
    console.error('OpenAI block returned empty message', response)
    return { outgoingEdgeId, newSessionState }
  }
  return resumeChatCompletion(newSessionState, {
    options,
    outgoingEdgeId,
    logs,
  })(messageContent, totalTokens)
}

const isNextBubbleMessageWithAssistantMessage =
  (probot: ProbotInSession) =>
  (blockId: string, assistantVariableName?: string): boolean => {
    if (!assistantVariableName) return false
    const nextBlock = getNextBlock(probot)(blockId)
    if (!nextBlock) return false
    return (
      nextBlock.type === BubbleBlockType.TEXT &&
      nextBlock.content.richText?.length > 0 &&
      nextBlock.content.richText?.at(0)?.children.at(0).text ===
        `{{${assistantVariableName}}}`
    )
  }

const getNextBlock =
  (probot: ProbotInSession) =>
  (blockId: string): Block | undefined => {
    const group = probot.groups.find((group) =>
      group.blocks.find(byId(blockId))
    )
    if (!group) return
    const blockIndex = group.blocks.findIndex(byId(blockId))
    const nextBlockInGroup = group.blocks.at(blockIndex + 1)
    if (nextBlockInGroup) return nextBlockInGroup
    const outgoingEdgeId = group.blocks.at(blockIndex)?.outgoingEdgeId
    if (!outgoingEdgeId) return
    const outgoingEdge = probot.edges.find(byId(outgoingEdgeId))
    if (!outgoingEdge) return
    const connectedGroup = probot.groups.find(byId(outgoingEdge?.to.groupId))
    if (!connectedGroup) return
    return outgoingEdge.to.blockId
      ? connectedGroup.blocks.find(
          (block) => block.id === outgoingEdge.to.blockId
        )
      : connectedGroup?.blocks.at(0)
  }
