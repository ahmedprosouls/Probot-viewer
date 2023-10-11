import { createId } from '@paralleldrive/cuid2'
import {
  Block,
  defaultChoiceInputOptions,
  defaultSettings,
  defaultTheme,
  InputBlockType,
  ItemType,
  PublicProbot,
  Probot,
} from '@typebot.io/schemas'
import { isDefined } from '../utils'
import { proWorkspaceId } from './databaseSetup'

export const parseTestProbot = (
  partialProbot: Partial<Probot>
): Probot => ({
  id: createId(),
  version: '3',
  workspaceId: proWorkspaceId,
  folderId: null,
  name: 'My probot',
  theme: defaultTheme,
  settings: defaultSettings({ isBrandingEnabled: true }),
  publicId: null,
  updatedAt: new Date(),
  createdAt: new Date(),
  customDomain: null,
  icon: null,
  selectedThemeTemplateId: null,
  isArchived: false,
  isClosed: false,
  resultsTablePreferences: null,
  whatsAppCredentialsId: null,
  variables: [{ id: 'var1', name: 'var1' }],
  ...partialProbot,
  edges: [
    {
      id: 'edge1',
      from: { groupId: 'group0', blockId: 'block0' },
      to: { groupId: 'group1' },
    },
  ],
  groups: [
    {
      id: 'group0',
      title: 'Group #0',
      blocks: [
        {
          id: 'block0',
          type: 'start',
          groupId: 'group0',
          label: 'Start',
          outgoingEdgeId: 'edge1',
        },
      ],
      graphCoordinates: { x: 0, y: 0 },
    },
    ...(partialProbot.groups ?? []),
  ],
})

export const parseProbotToPublicProbot = (
  id: string,
  probot: Probot
): Omit<PublicProbot, 'createdAt' | 'updatedAt'> => ({
  id,
  version: probot.version,
  groups: probot.groups,
  probotId: probot.id,
  theme: probot.theme,
  settings: probot.settings,
  variables: probot.variables,
  edges: probot.edges,
})

type Options = {
  withGoButton?: boolean
}

export const parseDefaultGroupWithBlock = (
  block: Partial<Block>,
  options?: Options
): Pick<Probot, 'groups'> => ({
  groups: [
    {
      graphCoordinates: { x: 200, y: 200 },
      id: 'group1',
      blocks: [
        options?.withGoButton
          ? {
              id: 'block1',
              groupId: 'group1',
              type: InputBlockType.CHOICE,
              items: [
                {
                  id: 'item1',
                  blockId: 'block1',
                  type: ItemType.BUTTON,
                  content: 'Go',
                },
              ],
              options: defaultChoiceInputOptions,
            }
          : undefined,
        {
          id: 'block2',
          groupId: 'group1',
          ...block,
        } as Block,
      ].filter(isDefined) as Block[],
      title: 'Group #1',
    },
  ],
})
