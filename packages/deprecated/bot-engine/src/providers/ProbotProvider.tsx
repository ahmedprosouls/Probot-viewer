import { ProbotViewerProps } from '@/components/ProbotViewer'
import { safeStringify } from '@/features/variables'
import { sendEventToParent } from '@/utils/chat'
import { Log } from '@typebot.io/prisma'
import { Edge, PublicProbot, Probot, Variable } from '@typebot.io/schemas'
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import { isDefined } from '@typebot.io/lib'

export type LinkedProbot = Pick<
  PublicProbot | Probot,
  'id' | 'groups' | 'variables' | 'edges'
>

export type LinkedProbotQueue = {
  probotId: string
  edgeId: string
}[]

const probotContext = createContext<{
  currentProbotId: string
  probot: ProbotViewerProps['probot']
  linkedProbots: LinkedProbot[]
  apiHost: string
  isPreview: boolean
  linkedBotQueue: LinkedProbotQueue
  isLoading: boolean
  parentProbotIds: string[]
  setCurrentProbotId: (id: string) => void
  updateVariableValue: (variableId: string, value: unknown) => void
  createEdge: (edge: Edge) => void
  injectLinkedProbot: (probot: Probot | PublicProbot) => LinkedProbot
  pushParentProbotId: (probotId: string) => void
  popEdgeIdFromLinkedProbotQueue: () => void
  pushEdgeIdInLinkedProbotQueue: (bot: {
    probotId: string
    edgeId: string
  }) => void
  onNewLog: (log: Omit<Log, 'id' | 'createdAt' | 'resultId'>) => void
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
}>({})

export const ProbotProvider = ({
  children,
  probot,
  apiHost,
  isPreview,
  isLoading,
  onNewLog,
}: {
  children: ReactNode
  probot: ProbotViewerProps['probot']
  apiHost: string
  isLoading: boolean
  isPreview: boolean
  onNewLog: (log: Omit<Log, 'id' | 'createdAt' | 'resultId'>) => void
}) => {
  const [localProbot, setLocalProbot] =
    useState<ProbotViewerProps['probot']>(probot)
  const [linkedProbots, setLinkedProbots] = useState<LinkedProbot[]>([])
  const [currentProbotId, setCurrentProbotId] = useState(probot.probotId)
  const [linkedBotQueue, setLinkedBotQueue] = useState<LinkedProbotQueue>([])
  const [parentProbotIds, setParentProbotIds] = useState<string[]>([])

  useEffect(() => {
    setLocalProbot((localProbot) => ({
      ...localProbot,
      theme: probot.theme,
      settings: probot.settings,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [probot.theme, probot.settings])

  const updateVariableValue = (variableId: string, value: unknown) => {
    const formattedValue = safeStringify(value)

    sendEventToParent({
      newVariableValue: {
        name:
          localProbot.variables.find((variable) => variable.id === variableId)
            ?.name ?? '',
        value: formattedValue ?? '',
      },
    })

    const variable = localProbot.variables.find((v) => v.id === variableId)
    const otherVariablesWithSameName = localProbot.variables.filter(
      (v) => v.name === variable?.name && v.id !== variableId
    )
    const variablesToUpdate = [variable, ...otherVariablesWithSameName].filter(
      isDefined
    )

    setLocalProbot((probot) => ({
      ...probot,
      variables: probot.variables.map((variable) =>
        variablesToUpdate.some(
          (variableToUpdate) => variableToUpdate.id === variable.id
        )
          ? { ...variable, value: formattedValue }
          : variable
      ),
    }))
  }

  const createEdge = (edge: Edge) => {
    setLocalProbot((probot) => ({
      ...probot,
      edges: [...probot.edges, edge],
    }))
  }

  const injectLinkedProbot = (probot: Probot | PublicProbot) => {
    const newVariables = fillVariablesWithExistingValues(
      probot.variables,
      localProbot.variables
    )
    const probotToInject = {
      id: 'probotId' in probot ? probot.probotId : probot.id,
      groups: probot.groups,
      edges: probot.edges,
      variables: newVariables,
    }
    setLinkedProbots((probots) => [...probots, probotToInject])
    const updatedProbot = {
      ...localProbot,
      groups: [...localProbot.groups, ...probotToInject.groups],
      variables: [...localProbot.variables, ...probotToInject.variables],
      edges: [...localProbot.edges, ...probotToInject.edges],
    }
    setLocalProbot(updatedProbot)
    return probotToInject
  }

  const fillVariablesWithExistingValues = (
    variables: Variable[],
    variablesWithValues: Variable[]
  ): Variable[] =>
    variables.map((variable) => {
      const matchedVariable = variablesWithValues.find(
        (variableWithValue) => variableWithValue.name === variable.name
      )

      return {
        ...variable,
        value: matchedVariable?.value ?? variable.value,
      }
    })

  const pushParentProbotId = (probotId: string) => {
    setParentProbotIds((ids) => [...ids, probotId])
  }

  const pushEdgeIdInLinkedProbotQueue = (bot: {
    probotId: string
    edgeId: string
  }) => setLinkedBotQueue((queue) => [...queue, bot])

  const popEdgeIdFromLinkedProbotQueue = () => {
    setLinkedBotQueue((queue) => queue.slice(1))
    setParentProbotIds((ids) => ids.slice(1))
    setCurrentProbotId(linkedBotQueue[0].probotId)
  }

  return (
    <probotContext.Provider
      value={{
        probot: localProbot,
        linkedProbots,
        apiHost,
        isPreview,
        updateVariableValue,
        createEdge,
        injectLinkedProbot,
        onNewLog,
        linkedBotQueue,
        isLoading,
        parentProbotIds,
        pushParentProbotId,
        pushEdgeIdInLinkedProbotQueue,
        popEdgeIdFromLinkedProbotQueue,
        currentProbotId,
        setCurrentProbotId,
      }}
    >
      {children}
    </probotContext.Provider>
  )
}

export const useProbot = () => useContext(probotContext)
