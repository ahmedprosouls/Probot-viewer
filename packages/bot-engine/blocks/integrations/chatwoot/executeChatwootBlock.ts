import { ExecuteIntegrationResponse } from '../../../types'
import { env } from '@typebot.io/env'
import { isDefined } from '@typebot.io/lib'
import {
  ChatwootBlock,
  ChatwootOptions,
  SessionState,
} from '@typebot.io/schemas'
import { extractVariablesFromText } from '../../../variables/extractVariablesFromText'
import { parseGuessedValueType } from '../../../variables/parseGuessedValueType'
import { parseVariables } from '../../../variables/parseVariables'

const parseSetUserCode = (user: ChatwootOptions['user'], resultId: string) =>
  user?.email || user?.id
    ? `
window.$chatwoot.setUser(${user?.id ?? `"${resultId}"`}, {
  email: ${user?.email ? user.email : 'undefined'},
  name: ${user?.name ? user.name : 'undefined'},
  avatar_url: ${user?.avatarUrl ? user.avatarUrl : 'undefined'},
  phone_number: ${user?.phoneNumber ? user.phoneNumber : 'undefined'},
});`
    : ''

const parseChatwootOpenCode = ({
  baseUrl,
  websiteToken,
  user,
  resultId,
  probotId,
}: ChatwootOptions & { probotId: string; resultId: string }) => {
  const openChatwoot = `${parseSetUserCode(user, resultId)}
  window.$chatwoot.setCustomAttributes({
    probot_result_url: "${
      env.NEXTAUTH_URL
    }/probots/${probotId}/results?id=${resultId}",
  });
  window.$chatwoot.toggle("open");
  `

  return `
  window.addEventListener("chatwoot:error", function (error) {
    console.log(error);
  });

  if (window.$chatwoot) {${openChatwoot}}
  else {
  (function (d, t) {
    var BASE_URL = "${baseUrl}";
    var g = d.createElement(t),
      s = d.getElementsByTagName(t)[0];
    g.src = BASE_URL + "/packs/js/sdk.js";
    g.defer = true;
    g.async = true;
    s.parentNode.insertBefore(g, s);
    g.onload = function () {
      window.chatwootSDK.run({
        websiteToken: "${websiteToken}",
        baseUrl: BASE_URL,
      });
      window.addEventListener("chatwoot:ready", function () {${openChatwoot}});
    };
  })(document, "script");
}`
}

const chatwootCloseCode = `
if (window.$chatwoot) {
  window.$chatwoot.toggle("close");
  window.$chatwoot.toggleBubbleVisibility("hide");
}
`

export const executeChatwootBlock = (
  state: SessionState,
  block: ChatwootBlock
): ExecuteIntegrationResponse => {
  if (state.whatsApp) return { outgoingEdgeId: block.outgoingEdgeId }
  const { probot, resultId } = state.probotsQueue[0]
  const chatwootCode =
    block.options.task === 'Close widget'
      ? chatwootCloseCode
      : isDefined(resultId)
      ? parseChatwootOpenCode({
          ...block.options,
          probotId: probot.id,
          resultId,
        })
      : ''
  return {
    outgoingEdgeId: block.outgoingEdgeId,
    clientSideActions: [
      {
        chatwoot: {
          scriptToExecute: {
            content: parseVariables(probot.variables, { fieldToParse: 'id' })(
              chatwootCode
            ),
            args: extractVariablesFromText(probot.variables)(chatwootCode).map(
              (variable) => ({
                id: variable.id,
                value: parseGuessedValueType(variable.value),
              })
            ),
          },
        },
      },
    ],
    logs:
      chatwootCode === ''
        ? [
            {
              status: 'info',
              description: 'Chatwoot block is not supported in preview',
              details: null,
            },
          ]
        : undefined,
  }
}
