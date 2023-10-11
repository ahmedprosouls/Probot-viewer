import { createId } from '@paralleldrive/cuid2'
import { TRPCError } from '@trpc/server'
import { isDefined, omit, isNotEmpty, isInputBlock } from '@typebot.io/lib'
import {
  Variable,
  VariableWithValue,
  Theme,
  IntegrationBlockType,
  GoogleAnalyticsBlock,
  PixelBlock,
  SessionState,
} from '@typebot.io/schemas'
import {
  ChatReply,
  StartParams,
  StartProbot,
  startProbotSchema,
} from '@typebot.io/schemas/features/chat/schema'
import parse, { NodeType } from 'node-html-parser'
import { env } from '@typebot.io/env'
import { parseDynamicTheme } from './parseDynamicTheme'
import { findProbot } from './queries/findProbot'
import { findPublicProbot } from './queries/findPublicProbot'
import { findResult } from './queries/findResult'
import { startBotFlow } from './startBotFlow'
import { prefillVariables } from './variables/prefillVariables'
import { deepParseVariables } from './variables/deepParseVariables'
import { injectVariablesFromExistingResult } from './variables/injectVariablesFromExistingResult'

type Props = {
  startParams: StartParams
  userId: string | undefined
  initialSessionState?: Pick<SessionState, 'whatsApp' | 'expiryTimeout'>
}

export const startSession = async ({
  startParams,
  userId,
  initialSessionState,
}: Props): Promise<ChatReply & { newSessionState: SessionState }> => {
  if (!startParams)
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'StartParams are missing',
    })

  const probot = await getProbot(startParams, userId)

  const prefilledVariables = startParams.prefilledVariables
    ? prefillVariables(probot.variables, startParams.prefilledVariables)
    : probot.variables

  const result = await getResult({
    ...startParams,
    isPreview: startParams.isPreview || typeof startParams.probot !== 'string',
    probotId: probot.id,
    prefilledVariables,
    isRememberUserEnabled:
      probot.settings.general.rememberUser?.isEnabled ??
      (isDefined(probot.settings.general.isNewResultOnRefreshEnabled)
        ? !probot.settings.general.isNewResultOnRefreshEnabled
        : false),
  })

  const startVariables =
    result && result.variables.length > 0
      ? injectVariablesFromExistingResult(prefilledVariables, result.variables)
      : prefilledVariables

  const initialState: SessionState = {
    version: '2',
    probotsQueue: [
      {
        resultId: result?.id,
        probot: {
          version: probot.version,
          id: probot.id,
          groups: probot.groups,
          edges: probot.edges,
          variables: startVariables,
        },
        answers: result
          ? result.answers.map((answer) => {
              const block = probot.groups
                .flatMap((group) => group.blocks)
                .find((block) => block.id === answer.blockId)
              if (!block || !isInputBlock(block))
                return {
                  key: 'unknown',
                  value: answer.content,
                }
              const key =
                (block.options.variableId
                  ? startVariables.find(
                      (variable) => variable.id === block.options.variableId
                    )?.name
                  : probot.groups.find((group) =>
                      group.blocks.find(
                        (blockInGroup) => blockInGroup.id === block.id
                      )
                    )?.title) ?? 'unknown'
              return {
                key,
                value: answer.content,
              }
            })
          : [],
      },
    ],
    dynamicTheme: parseDynamicThemeInState(probot.theme),
    isStreamEnabled: startParams.isStreamEnabled,
    typingEmulation: probot.settings.typingEmulation,
    ...initialSessionState,
  }

  if (startParams.isOnlyRegistering) {
    return {
      newSessionState: initialState,
      probot: {
        id: probot.id,
        settings: deepParseVariables(
          initialState.probotsQueue[0].probot.variables
        )(probot.settings),
        theme: deepParseVariables(
          initialState.probotsQueue[0].probot.variables
        )(probot.theme),
      },
      dynamicTheme: parseDynamicTheme(initialState),
      messages: [],
    }
  }

  const {
    messages,
    input,
    clientSideActions: startFlowClientActions,
    newSessionState,
    logs,
  } = await startBotFlow(initialState, startParams.startGroupId)

  const clientSideActions = startFlowClientActions ?? []

  const startClientSideAction = parseStartClientSideAction(probot)

  const startLogs = logs ?? []

  if (isDefined(startClientSideAction)) {
    if (!result) {
      if ('startPropsToInject' in startClientSideAction) {
        const { customHeadCode, googleAnalyticsId, pixelId, gtmId } =
          startClientSideAction.startPropsToInject
        let toolsList = ''
        if (customHeadCode) toolsList += 'Custom head code, '
        if (googleAnalyticsId) toolsList += 'Google Analytics, '
        if (pixelId) toolsList += 'Pixel, '
        if (gtmId) toolsList += 'Google Tag Manager, '
        toolsList = toolsList.slice(0, -2)
        startLogs.push({
          description: `${toolsList} ${
            toolsList.includes(',') ? 'are not' : 'is not'
          } enabled in Preview mode`,
          status: 'info',
        })
      }
    } else {
      clientSideActions.unshift(startClientSideAction)
    }
  }

  const clientSideActionsNeedSessionId = clientSideActions?.some(
    (action) => action.expectsDedicatedReply
  )

  if (!input && !clientSideActionsNeedSessionId)
    return {
      newSessionState,
      messages,
      clientSideActions:
        clientSideActions.length > 0 ? clientSideActions : undefined,
      probot: {
        id: probot.id,
        settings: deepParseVariables(
          newSessionState.probotsQueue[0].probot.variables
        )(probot.settings),
        theme: deepParseVariables(
          newSessionState.probotsQueue[0].probot.variables
        )(probot.theme),
      },
      dynamicTheme: parseDynamicTheme(newSessionState),
      logs: startLogs.length > 0 ? startLogs : undefined,
    }

  return {
    newSessionState,
    resultId: result?.id,
    probot: {
      id: probot.id,
      settings: deepParseVariables(
        newSessionState.probotsQueue[0].probot.variables
      )(probot.settings),
      theme: deepParseVariables(
        newSessionState.probotsQueue[0].probot.variables
      )(probot.theme),
    },
    messages,
    input,
    clientSideActions:
      clientSideActions.length > 0 ? clientSideActions : undefined,
    dynamicTheme: parseDynamicTheme(newSessionState),
    logs: startLogs.length > 0 ? startLogs : undefined,
  }
}

const getProbot = async (
  { probot, isPreview }: Pick<StartParams, 'probot' | 'isPreview'>,
  userId?: string
): Promise<StartProbot> => {
  if (typeof probot !== 'string') return probot
  if (isPreview && !userId && !env.NEXT_PUBLIC_E2E_TEST)
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message:
        'You need to authenticate the request to start a bot in preview mode.',
    })
  const probotQuery = isPreview
    ? await findProbot({ id: probot, userId })
    : await findPublicProbot({ publicId: probot })

  const parsedProbot =
    probotQuery && 'probot' in probotQuery
      ? {
          id: probotQuery.probotId,
          ...omit(probotQuery.probot, 'workspace'),
          ...omit(probotQuery, 'probot', 'probotId'),
        }
      : probotQuery

  if (!parsedProbot || parsedProbot.isArchived)
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Probot not found',
    })

  const isQuarantinedOrSuspended =
    probotQuery &&
    'probot' in probotQuery &&
    (probotQuery.probot.workspace.isQuarantined ||
      probotQuery.probot.workspace.isSuspended)

  if (
    ('isClosed' in parsedProbot && parsedProbot.isClosed) ||
    isQuarantinedOrSuspended
  )
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Probot is closed',
    })

  return startProbotSchema.parse(parsedProbot)
}

const getResult = async ({
  isPreview,
  resultId,
  prefilledVariables,
  isRememberUserEnabled,
}: Pick<StartParams, 'isPreview' | 'resultId'> & {
  probotId: string
  prefilledVariables: Variable[]
  isRememberUserEnabled: boolean
}) => {
  if (isPreview) return
  const existingResult =
    resultId && isRememberUserEnabled
      ? await findResult({ id: resultId })
      : undefined

  const prefilledVariableWithValue = prefilledVariables.filter(
    (prefilledVariable) => isDefined(prefilledVariable.value)
  )

  const updatedResult = {
    variables: prefilledVariableWithValue.concat(
      existingResult?.variables.filter(
        (resultVariable) =>
          isDefined(resultVariable.value) &&
          !prefilledVariableWithValue.some(
            (prefilledVariable) =>
              prefilledVariable.name === resultVariable.name
          )
      ) ?? []
    ) as VariableWithValue[],
  }
  return {
    id: existingResult?.id ?? createId(),
    variables: updatedResult.variables,
    answers: existingResult?.answers ?? [],
  }
}

const parseDynamicThemeInState = (theme: Theme) => {
  const hostAvatarUrl =
    theme.chat.hostAvatar?.isEnabled ?? true
      ? theme.chat.hostAvatar?.url
      : undefined
  const guestAvatarUrl =
    theme.chat.guestAvatar?.isEnabled ?? false
      ? theme.chat.guestAvatar?.url
      : undefined
  if (!hostAvatarUrl?.startsWith('{{') && !guestAvatarUrl?.startsWith('{{'))
    return
  return {
    hostAvatarUrl: hostAvatarUrl?.startsWith('{{') ? hostAvatarUrl : undefined,
    guestAvatarUrl: guestAvatarUrl?.startsWith('{{')
      ? guestAvatarUrl
      : undefined,
  }
}

const parseStartClientSideAction = (
  probot: StartProbot
): NonNullable<ChatReply['clientSideActions']>[number] | undefined => {
  const blocks = probot.groups.flatMap((group) => group.blocks)
  const startPropsToInject = {
    customHeadCode: isNotEmpty(probot.settings.metadata.customHeadCode)
      ? parseHeadCode(probot.settings.metadata.customHeadCode)
      : undefined,
    gtmId: probot.settings.metadata.googleTagManagerId,
    googleAnalyticsId: (
      blocks.find(
        (block) =>
          block.type === IntegrationBlockType.GOOGLE_ANALYTICS &&
          block.options.trackingId
      ) as GoogleAnalyticsBlock | undefined
    )?.options.trackingId,
    pixelIds: (
      blocks.filter(
        (block) =>
          block.type === IntegrationBlockType.PIXEL &&
          isNotEmpty(block.options.pixelId) &&
          block.options.isInitSkip !== true
      ) as PixelBlock[]
    ).map((pixelBlock) => pixelBlock.options.pixelId as string),
  }

  if (
    !startPropsToInject.customHeadCode &&
    !startPropsToInject.gtmId &&
    !startPropsToInject.googleAnalyticsId &&
    !startPropsToInject.pixelIds
  )
    return

  return {
    startPropsToInject,
  }
}

const parseHeadCode = (code: string) => {
  code = injectTryCatch(code)
  return parse(code)
    .childNodes.filter((child) => child.nodeType !== NodeType.TEXT_NODE)
    .join('\n')
}

const injectTryCatch = (headCode: string) => {
  const scriptTagRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
  const scriptTags = headCode.match(scriptTagRegex)
  if (scriptTags) {
    scriptTags.forEach(function (tag) {
      const wrappedTag = tag.replace(
        /(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi,
        function (_, openingTag, content, closingTag) {
          if (!isValidJsSyntax(content)) return ''
          return `${openingTag}
try {
  ${content}
} catch (e) {
  console.warn(e); 
}
${closingTag}`
        }
      )
      headCode = headCode.replace(tag, wrappedTag)
    })
  }
  return headCode
}

const isValidJsSyntax = (snippet: string): boolean => {
  try {
    new Function(snippet)
    return true
  } catch (err) {
    return false
  }
}
