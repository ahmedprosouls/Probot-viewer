import {
  defaultWebhookAttributes,
  KeyValue,
  PublicProbot,
  ResultValues,
  Probot,
  Variable,
  Webhook,
  WebhookOptions,
  WebhookResponse,
  WebhookBlock,
} from '@typebot.io/schemas'
import { NextApiRequest, NextApiResponse } from 'next'
import got, { Method, Headers, HTTPError } from 'got'
import { byId, omit } from '@typebot.io/lib'
import { parseAnswers } from '@typebot.io/lib/results'
import { initMiddleware, methodNotAllowed, notFound } from '@typebot.io/lib/api'
import { stringify } from 'qs'
import Cors from 'cors'
import prisma from '@typebot.io/lib/prisma'
import { HttpMethod } from '@typebot.io/schemas/features/blocks/integrations/webhook/enums'
import { fetchLinkedProbots } from '@typebot.io/bot-engine/blocks/logic/probotLink/fetchLinkedProbots'
import { getPreviouslyLinkedProbots } from '@typebot.io/bot-engine/blocks/logic/probotLink/getPreviouslyLinkedProbots'
import { parseVariables } from '@typebot.io/bot-engine/variables/parseVariables'
import { saveErrorLog } from '@typebot.io/bot-engine/logs/saveErrorLog'
import { saveSuccessLog } from '@typebot.io/bot-engine/logs/saveSuccessLog'
import { parseSampleResult } from '@typebot.io/bot-engine/blocks/integrations/webhook/parseSampleResult'

const cors = initMiddleware(Cors())

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await cors(req, res)
  if (req.method === 'POST') {
    const probotId = req.query.probotId as string
    const blockId = req.query.blockId as string
    const resultId = req.query.resultId as string | undefined
    const { resultValues, variables, parentProbotIds } = (
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    ) as {
      resultValues: ResultValues | undefined
      variables: Variable[]
      parentProbotIds: string[]
    }
    const probot = (await prisma.probot.findUnique({
      where: { id: probotId },
      include: { webhooks: true },
    })) as unknown as (Probot & { webhooks: Webhook[] }) | null
    if (!probot) return notFound(res)
    const block = probot.groups
      .flatMap((g) => g.blocks)
      .find(byId(blockId)) as WebhookBlock
    const webhook =
      block.options.webhook ?? probot.webhooks.find(byId(block.webhookId))
    if (!webhook)
      return res
        .status(404)
        .send({ statusCode: 404, data: { message: `Couldn't find webhook` } })
    const preparedWebhook = prepareWebhookAttributes(webhook, block.options)
    const result = await executeWebhook(probot)({
      webhook: preparedWebhook,
      variables,
      groupId: block.groupId,
      resultValues,
      resultId,
      parentProbotIds,
    })
    return res.status(200).send(result)
  }
  return methodNotAllowed(res)
}

const prepareWebhookAttributes = (
  webhook: Webhook,
  options: WebhookOptions
): Webhook => {
  if (options.isAdvancedConfig === false) {
    return { ...webhook, body: '{{state}}', ...defaultWebhookAttributes }
  } else if (options.isCustomBody === false) {
    return { ...webhook, body: '{{state}}' }
  }
  return webhook
}

const checkIfBodyIsAVariable = (body: string) => /^{{.+}}$/.test(body)

export const executeWebhook =
  (probot: Probot) =>
  async ({
    webhook,
    variables,
    groupId,
    resultValues,
    resultId,
    parentProbotIds = [],
  }: {
    webhook: Webhook
    variables: Variable[]
    groupId: string
    resultValues?: ResultValues
    resultId?: string
    parentProbotIds: string[]
  }): Promise<WebhookResponse> => {
    if (!webhook.url || !webhook.method)
      return {
        statusCode: 400,
        data: { message: `Webhook doesn't have url or method` },
      }
    const basicAuth: { username?: string; password?: string } = {}
    const basicAuthHeaderIdx = webhook.headers.findIndex(
      (h) =>
        h.key?.toLowerCase() === 'authorization' &&
        h.value?.toLowerCase()?.includes('basic')
    )
    const isUsernamePasswordBasicAuth =
      basicAuthHeaderIdx !== -1 &&
      webhook.headers[basicAuthHeaderIdx].value?.includes(':')
    if (isUsernamePasswordBasicAuth) {
      const [username, password] =
        webhook.headers[basicAuthHeaderIdx].value?.slice(6).split(':') ?? []
      basicAuth.username = username
      basicAuth.password = password
      webhook.headers.splice(basicAuthHeaderIdx, 1)
    }
    const headers = convertKeyValueTableToObject(webhook.headers, variables) as
      | Headers
      | undefined
    const queryParams = stringify(
      convertKeyValueTableToObject(webhook.queryParams, variables)
    )
    const contentType = headers ? headers['Content-Type'] : undefined
    const linkedProbotsParents = (await fetchLinkedProbots({
      isPreview: !('probotId' in probot),
      probotIds: parentProbotIds,
    })) as (Probot | PublicProbot)[]
    const linkedProbotsChildren = await getPreviouslyLinkedProbots({
      isPreview: !('probotId' in probot),
      probots: [probot],
    })([])
    const bodyContent = await getBodyContent(probot, [
      ...linkedProbotsParents,
      ...linkedProbotsChildren,
    ])({
      body: webhook.body,
      resultValues,
      groupId,
      variables,
    })
    const { data: body, isJson } =
      bodyContent && webhook.method !== HttpMethod.GET
        ? safeJsonParse(
            parseVariables(variables, {
              isInsideJson: !checkIfBodyIsAVariable(bodyContent),
            })(bodyContent)
          )
        : { data: undefined, isJson: false }

    const request = {
      url: parseVariables(variables)(
        webhook.url + (queryParams !== '' ? `?${queryParams}` : '')
      ),
      method: webhook.method as Method,
      headers,
      ...basicAuth,
      json:
        !contentType?.includes('x-www-form-urlencoded') && body && isJson
          ? body
          : undefined,
      form:
        contentType?.includes('x-www-form-urlencoded') && body
          ? body
          : undefined,
      body: body && !isJson ? body : undefined,
    }
    try {
      const response = await got(request.url, omit(request, 'url'))
      await saveSuccessLog({
        resultId,
        message: 'Webhook successfuly executed.',
        details: {
          statusCode: response.statusCode,
          request,
          response: safeJsonParse(response.body).data,
        },
      })
      return {
        statusCode: response.statusCode,
        data: safeJsonParse(response.body).data,
      }
    } catch (error) {
      if (error instanceof HTTPError) {
        const response = {
          statusCode: error.response.statusCode,
          data: safeJsonParse(error.response.body as string).data,
        }
        await saveErrorLog({
          resultId,
          message: 'Webhook returned an error',
          details: {
            request,
            response,
          },
        })
        return response
      }
      const response = {
        statusCode: 500,
        data: { message: `Error from Probot server: ${error}` },
      }
      console.error(error)
      await saveErrorLog({
        resultId,
        message: 'Webhook failed to execute',
        details: {
          request,
          response,
        },
      })
      return response
    }
  }

const getBodyContent =
  (
    probot: Pick<Probot | PublicProbot, 'groups' | 'variables' | 'edges'>,
    linkedProbots: (Probot | PublicProbot)[]
  ) =>
  async ({
    body,
    resultValues,
    groupId,
    variables,
  }: {
    body?: string | null
    resultValues?: ResultValues
    groupId: string
    variables: Variable[]
  }): Promise<string | undefined> => {
    if (!body) return
    return body === '{{state}}'
      ? JSON.stringify(
          resultValues
            ? parseAnswers({
                answers: resultValues.answers.map((answer) => ({
                  key:
                    (answer.variableId
                      ? probot.variables.find(
                          (variable) => variable.id === answer.variableId
                        )?.name
                      : probot.groups.find((group) =>
                          group.blocks.find(
                            (block) => block.id === answer.blockId
                          )
                        )?.title) ?? '',
                  value: answer.content,
                })),
                variables: resultValues.variables,
              })
            : await parseSampleResult(probot, linkedProbots)(
                groupId,
                variables
              )
        )
      : body
  }

const convertKeyValueTableToObject = (
  keyValues: KeyValue[] | undefined,
  variables: Variable[]
) => {
  if (!keyValues) return
  return keyValues.reduce((object, item) => {
    if (!item.key) return {}
    return {
      ...object,
      [item.key]: parseVariables(variables)(item.value ?? ''),
    }
  }, {})
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const safeJsonParse = (json: string): { data: any; isJson: boolean } => {
  try {
    return { data: JSON.parse(json), isJson: true }
  } catch (err) {
    return { data: json, isJson: false }
  }
}

export default handler
