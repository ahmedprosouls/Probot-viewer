import { User } from '@typebot.io/prisma'
import {
  LogicBlockType,
  PublicProbot,
  Probot,
  ProbotLinkBlock,
} from '@typebot.io/schemas'
import { isDefined } from '@typebot.io/lib'
import { fetchLinkedProbots } from './fetchLinkedProbots'

type Props = {
  probots: Pick<PublicProbot, 'groups'>[]
  user?: User
  isPreview?: boolean
}

export const getPreviouslyLinkedProbots =
  ({ probots, user, isPreview }: Props) =>
  async (
    capturedLinkedBots: (Probot | PublicProbot)[]
  ): Promise<(Probot | PublicProbot)[]> => {
    const linkedProbotIds = probots
      .flatMap((probot) =>
        (
          probot.groups
            .flatMap((group) => group.blocks)
            .filter(
              (block) =>
                block.type === LogicBlockType.PROBOT_LINK &&
                isDefined(block.options.probotId) &&
                !capturedLinkedBots.some(
                  (bot) =>
                    ('probotId' in bot ? bot.probotId : bot.id) ===
                    block.options.probotId
                )
            ) as ProbotLinkBlock[]
        ).map((s) => s.options.probotId)
      )
      .filter(isDefined)
    if (linkedProbotIds.length === 0) return capturedLinkedBots
    const linkedProbots = (await fetchLinkedProbots({
      user,
      probotIds: linkedProbotIds,
      isPreview,
    })) as (Probot | PublicProbot)[]
    return getPreviouslyLinkedProbots({
      probots: linkedProbots,
      user,
      isPreview,
    })([...capturedLinkedBots, ...linkedProbots])
  }
