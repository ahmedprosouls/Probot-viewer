import { Log } from '@typebot.io/prisma'
import {
  Edge,
  Group,
  PublicProbot,
  ResultValuesInput,
  Probot,
  Variable,
  VariableWithUnknowValue,
} from '@typebot.io/schemas'
import { ProbotViewerProps } from './components/ProbotViewer'
import { LinkedProbot } from './providers/ProbotProvider'

export type InputSubmitContent = {
  label?: string
  value: string
  itemId?: string
}

export type EdgeId = string

export type LogicState = {
  isPreview: boolean
  apiHost: string
  probot: ProbotViewerProps['probot']
  linkedProbots: LinkedProbot[]
  currentProbotId: string
  pushParentProbotId: (id: string) => void
  pushEdgeIdInLinkedProbotQueue: (bot: {
    edgeId: string
    probotId: string
  }) => void
  setCurrentProbotId: (id: string) => void
  updateVariableValue: (variableId: string, value: unknown) => void
  updateVariables: (variables: VariableWithUnknowValue[]) => void
  injectLinkedProbot: (probot: Probot | PublicProbot) => LinkedProbot
  onNewLog: (log: Omit<Log, 'id' | 'createdAt' | 'resultId'>) => void
  createEdge: (edge: Edge) => void
}

export type IntegrationState = {
  apiHost: string
  probotId: string
  groupId: string
  blockId: string
  isPreview: boolean
  variables: Variable[]
  resultValues: ResultValuesInput
  groups: Group[]
  resultId?: string
  parentProbotIds: string[]
  updateVariables: (variables: VariableWithUnknowValue[]) => void
  updateVariableValue: (variableId: string, value: unknown) => void
  onNewLog: (log: Omit<Log, 'id' | 'createdAt' | 'resultId'>) => void
}
