import { CSSProperties, useMemo } from 'react'
import { ProbotProvider } from '../providers/ProbotProvider'
import styles from '../assets/style.css'
import importantStyles from '../assets/importantStyles.css'
import phoneSyle from '../assets/phone.css'
import { ConversationContainer } from './ConversationContainer'
import { AnswersProvider } from '../providers/AnswersProvider'
import {
  AnswerInput,
  BackgroundType,
  Edge,
  PublicProbot,
  VariableWithValue,
} from '@typebot.io/schemas'
import { Log } from '@typebot.io/prisma'
import { LiteBadge } from './LiteBadge'
import { isNotEmpty } from '@typebot.io/lib'
import { getViewerUrl } from '@typebot.io/lib/getViewerUrl'

export type ProbotViewerProps = {
  probot: Omit<PublicProbot, 'updatedAt' | 'createdAt'>
  isPreview?: boolean
  apiHost?: string
  predefinedVariables?: { [key: string]: string | undefined }
  resultId?: string
  startGroupId?: string
  isLoading?: boolean
  onNewGroupVisible?: (edge: Edge) => void
  onNewAnswer?: (
    answer: AnswerInput & { uploadedFiles: boolean }
  ) => Promise<void>
  onNewLog?: (log: Omit<Log, 'id' | 'createdAt' | 'resultId'>) => void
  onCompleted?: () => void
  onVariablesUpdated?: (variables: VariableWithValue[]) => void
}

export const ProbotViewer = ({
  probot,
  apiHost = getViewerUrl(),
  isPreview = false,
  isLoading = false,
  resultId,
  startGroupId,
  predefinedVariables,
  onNewLog,
  onNewGroupVisible,
  onNewAnswer,
  onCompleted,
  onVariablesUpdated,
}: ProbotViewerProps) => {
  const containerBgColor = useMemo(
    () =>
      probot?.theme?.general?.background?.type === BackgroundType.COLOR
        ? probot.theme.general.background.content
        : 'transparent',
    [probot?.theme?.general?.background]
  )
  const handleNewGroupVisible = (edge: Edge) =>
    onNewGroupVisible && onNewGroupVisible(edge)

  const handleNewAnswer = (answer: AnswerInput & { uploadedFiles: boolean }) =>
    onNewAnswer && onNewAnswer(answer)

  const handleNewLog = (log: Omit<Log, 'id' | 'createdAt' | 'resultId'>) =>
    onNewLog && onNewLog(log)

  const handleCompleted = () => onCompleted && onCompleted()

  return (
    <>
      <style>
        {phoneSyle}
        {styles}
      </style>
      <style>{probot.theme?.customCss}</style>
      <style>{importantStyles}</style>
      {isNotEmpty(probot?.theme?.general?.font) && (
        <style
          dangerouslySetInnerHTML={{
            __html: `@import url('https://fonts.googleapis.com/css2?family=${
              probot.theme.general.font ?? 'Open Sans'
            }:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&display=swap');`,
          }}
        />
      )}
      <ProbotProvider
        probot={probot}
        apiHost={apiHost}
        isPreview={isPreview}
        onNewLog={handleNewLog}
        isLoading={isLoading}
      >
        <AnswersProvider
          resultId={resultId}
          onNewAnswer={handleNewAnswer}
          onVariablesUpdated={onVariablesUpdated}
        >
          <div
            className="flex text-base overflow-hidden bg-cover h-screen w-screen flex-col items-center probot-container"
            style={{
              // We set this as inline style to avoid color flash for SSR
              backgroundColor: containerBgColor ?? 'transparent',
            }}
            data-testid="container"
          >
            <div className="flex w-full h-full justify-center">
              <ConversationContainer
                theme={probot.theme}
                onNewGroupVisible={handleNewGroupVisible}
                onCompleted={handleCompleted}
                predefinedVariables={predefinedVariables}
                startGroupId={startGroupId}
              />
            </div>
            {probot.settings.general.isBrandingEnabled && <LiteBadge />}
          </div>
        </AnswersProvider>
      </ProbotProvider>
    </>
  )
}
