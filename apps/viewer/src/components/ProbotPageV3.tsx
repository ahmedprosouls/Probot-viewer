import { Standard } from '@typebot.io/nextjs'
import { useRouter } from 'next/router'
import { SEO } from './Seo'
import { Probot } from '@typebot.io/schemas/features/probot/probot'
import { BackgroundType } from '@typebot.io/schemas/features/probot/theme/enums'

export type ProbotV3PageProps = {
  url: string
  name: string
  publicId: string | null
  isHideQueryParamsEnabled: boolean | null
  background: Probot['theme']['general']['background']
  metadata: Probot['settings']['metadata']
}

export const ProbotPageV3 = ({
  publicId,
  name,
  url,
  isHideQueryParamsEnabled,
  metadata,
  background,
}: ProbotV3PageProps) => {
  const { asPath, push } = useRouter()

  const clearQueryParamsIfNecessary = () => {
    const hasQueryParams = asPath.includes('?')
    if (!hasQueryParams || !(isHideQueryParamsEnabled ?? true)) return
    push(asPath.split('?')[0], undefined, { shallow: true })
  }

  return (
    <div
      style={{
        height: '100vh',
        // Set background color to avoid SSR flash
        backgroundColor:
          background?.type === BackgroundType.COLOR
            ? background?.content
            : background?.type === BackgroundType.NONE
            ? undefined
            : '#fff',
      }}
    >
      <SEO url={url} probotName={name} metadata={metadata} />
      <Standard probot={publicId} onInit={clearQueryParamsIfNecessary} />
    </div>
  )
}
