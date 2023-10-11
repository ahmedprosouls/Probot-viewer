import prisma from '@typebot.io/lib/prisma'
import {
  ChatReply,
  ComparisonOperators,
  LogicalOperator,
  PublicProbot,
  SessionState,
  Settings,
  Probot,
} from '@typebot.io/schemas'
import {
  WhatsAppCredentials,
  defaultSessionExpiryTimeout,
} from '@typebot.io/schemas/features/whatsapp'
import { isInputBlock, isNotDefined } from '@typebot.io/lib/utils'
import { startSession } from '../startSession'
import { getNextGroup } from '../getNextGroup'
import { continueBotFlow } from '../continueBotFlow'
import { upsertResult } from '../queries/upsertResult'

type Props = {
  incomingMessage?: string
  sessionId: string
  workspaceId?: string
  credentials: WhatsAppCredentials['data'] & Pick<WhatsAppCredentials, 'id'>
  contact: NonNullable<SessionState['whatsApp']>['contact']
}

export const startWhatsAppSession = async ({
  incomingMessage,
  workspaceId,
  credentials,
  contact,
}: Props): Promise<
  | (ChatReply & {
      newSessionState: SessionState
    })
  | undefined
> => {
  const publicProbotsWithWhatsAppEnabled =
    (await prisma.publicProbot.findMany({
      where: {
        probot: { workspaceId, whatsAppCredentialsId: credentials.id },
      },
      select: {
        settings: true,
        probot: {
          select: {
            publicId: true,
          },
        },
      },
    })) as (Pick<PublicProbot, 'settings'> & {
      probot: Pick<Probot, 'publicId'>
    })[]

  const botsWithWhatsAppEnabled = publicProbotsWithWhatsAppEnabled.filter(
    (publicProbot) =>
      publicProbot.probot.publicId &&
      publicProbot.settings.whatsApp?.isEnabled
  )

  const publicProbot =
    botsWithWhatsAppEnabled.find(
      (publicProbot) =>
        publicProbot.settings.whatsApp?.startCondition &&
        messageMatchStartCondition(
          incomingMessage ?? '',
          publicProbot.settings.whatsApp?.startCondition
        )
    ) ?? botsWithWhatsAppEnabled[0]

  if (isNotDefined(publicProbot)) return

  const sessionExpiryTimeoutHours =
    publicProbot.settings.whatsApp?.sessionExpiryTimeout ??
    defaultSessionExpiryTimeout

  const session = await startSession({
    startParams: {
      probot: publicProbot.probot.publicId as string,
    },
    userId: undefined,
    initialSessionState: {
      whatsApp: {
        contact,
      },
      expiryTimeout: sessionExpiryTimeoutHours * 60 * 60 * 1000,
    },
  })

  let newSessionState: SessionState = session.newSessionState

  // If first block is an input block, we can directly continue the bot flow
  const firstEdgeId =
    newSessionState.probotsQueue[0].probot.groups[0].blocks[0].outgoingEdgeId
  const nextGroup = await getNextGroup(newSessionState)(firstEdgeId)
  const firstBlock = nextGroup.group?.blocks.at(0)
  if (firstBlock && isInputBlock(firstBlock)) {
    const resultId = newSessionState.probotsQueue[0].resultId
    if (resultId)
      await upsertResult({
        hasStarted: true,
        isCompleted: false,
        resultId,
        probot: newSessionState.probotsQueue[0].probot,
      })
    newSessionState = (
      await continueBotFlow({
        ...newSessionState,
        currentBlock: { groupId: firstBlock.groupId, blockId: firstBlock.id },
      })(incomingMessage)
    ).newSessionState
  }

  return {
    ...session,
    newSessionState,
  }
}

export const messageMatchStartCondition = (
  message: string,
  startCondition: NonNullable<Settings['whatsApp']>['startCondition']
) => {
  if (!startCondition) return true
  return startCondition.logicalOperator === LogicalOperator.AND
    ? startCondition.comparisons.every((comparison) =>
        matchComparison(
          message,
          comparison.comparisonOperator,
          comparison.value
        )
      )
    : startCondition.comparisons.some((comparison) =>
        matchComparison(
          message,
          comparison.comparisonOperator,
          comparison.value
        )
      )
}

const matchComparison = (
  inputValue: string,
  comparisonOperator?: ComparisonOperators,
  value?: string
): boolean | undefined => {
  if (!comparisonOperator) return false
  switch (comparisonOperator) {
    case ComparisonOperators.CONTAINS: {
      if (!value) return false
      return inputValue
        .trim()
        .toLowerCase()
        .includes(value.trim().toLowerCase())
    }
    case ComparisonOperators.EQUAL: {
      return inputValue === value
    }
    case ComparisonOperators.NOT_EQUAL: {
      return inputValue !== value
    }
    case ComparisonOperators.GREATER: {
      if (!value) return false
      return parseFloat(inputValue) > parseFloat(value)
    }
    case ComparisonOperators.LESS: {
      if (!value) return false
      return parseFloat(inputValue) < parseFloat(value)
    }
    case ComparisonOperators.IS_SET: {
      return inputValue.length > 0
    }
    case ComparisonOperators.IS_EMPTY: {
      return inputValue.length === 0
    }
    case ComparisonOperators.STARTS_WITH: {
      if (!value) return false
      return inputValue.toLowerCase().startsWith(value.toLowerCase())
    }
    case ComparisonOperators.ENDS_WITH: {
      if (!value) return false
      return inputValue.toLowerCase().endsWith(value.toLowerCase())
    }
    case ComparisonOperators.NOT_CONTAINS: {
      if (!value) return false
      return !inputValue
        .trim()
        .toLowerCase()
        .includes(value.trim().toLowerCase())
    }
  }
}
