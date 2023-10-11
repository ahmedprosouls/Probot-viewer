import { PrismaClient, Webhook as WebhookFromDb } from '@typebot.io/prisma'
import {
  Block,
  Probot,
  Webhook,
  defaultWebhookAttributes,
} from '@typebot.io/schemas'
import { isWebhookBlock } from '../utils'
import { HttpMethod } from '@typebot.io/schemas/features/blocks/integrations/webhook/enums'

export const migrateProbotFromV3ToV4 =
  (prisma: PrismaClient) =>
  async (
    probot: Probot
  ): Promise<Omit<Probot, 'version'> & { version: '4' }> => {
    if (probot.version === '4')
      return probot as Omit<Probot, 'version'> & { version: '4' }
    const webhookBlocks = probot.groups
      .flatMap((group) => group.blocks)
      .filter(isWebhookBlock)
    const webhooks = await prisma.webhook.findMany({
      where: {
        id: {
          in: webhookBlocks.map((block) => block.webhookId as string),
        },
      },
    })
    return {
      ...probot,
      version: '4',
      groups: probot.groups.map((group) => ({
        ...group,
        blocks: group.blocks.map(migrateWebhookBlock(webhooks)),
      })),
    }
  }

const migrateWebhookBlock =
  (webhooks: WebhookFromDb[]) =>
  (block: Block): Block => {
    if (!isWebhookBlock(block)) return block
    const webhook = webhooks.find((webhook) => webhook.id === block.webhookId)
    return {
      ...block,
      webhookId: undefined,
      options: {
        ...block.options,
        webhook: webhook
          ? {
              id: webhook.id,
              url: webhook.url ?? undefined,
              method: (webhook.method as Webhook['method']) ?? HttpMethod.POST,
              headers: (webhook.headers as Webhook['headers']) ?? [],
              queryParams: (webhook.queryParams as Webhook['headers']) ?? [],
              body: webhook.body ?? undefined,
            }
          : {
              ...defaultWebhookAttributes,
              id: block.webhookId ?? '',
            },
      },
    }
  }
