import { IncomingMessage } from 'http'
import { ErrorPage } from '@/components/ErrorPage'
import { NotFoundPage } from '@/components/NotFoundPage'
import { GetServerSideProps, GetServerSidePropsContext } from 'next'
import { isNotDefined } from '@typebot.io/lib'
import { ProbotPageProps, ProbotPageV2 } from '@/components/ProbotPageV2'
import { ProbotPageV3, ProbotV3PageProps } from '@/components/ProbotPageV3'
import { env } from '@typebot.io/env'
import prisma from '@typebot.io/lib/prisma'

// Browsers that doesn't support ES modules and/or web components
const incompatibleBrowsers = [
  {
    name: 'UC Browser',
    regex: /ucbrowser/i,
  },
  {
    name: 'Internet Explorer',
    regex: /msie|trident/i,
  },
  {
    name: 'Opera Mini',
    regex: /opera mini/i,
  },
]

const log = (message: string) => {
  if (!env.DEBUG) return
  console.log(`[DEBUG] ${message}`)
}

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const incompatibleBrowser =
    incompatibleBrowsers.find((browser) =>
      browser.regex.test(context.req.headers['user-agent'] ?? '')
    )?.name ?? null
  const pathname = context.resolvedUrl.split('?')[0]
  const { host, forwardedHost } = getHost(context.req)
  log(`host: ${host}`)
  log(`forwardedHost: ${forwardedHost}`)
  try {
    if (!host) return { props: {} }
    const viewerUrls = env.NEXT_PUBLIC_VIEWER_URL
    log(`viewerUrls: ${viewerUrls}`)
    const isMatchingViewerUrl = env.NEXT_PUBLIC_E2E_TEST
      ? true
      : viewerUrls.some(
          (url) =>
            host.split(':')[0].includes(url.split('//')[1].split(':')[0]) ||
            (forwardedHost &&
              forwardedHost
                .split(':')[0]
                .includes(url.split('//')[1].split(':')[0]))
        )
    log(`isMatchingViewerUrl: ${isMatchingViewerUrl}`)
    const customDomain = `${forwardedHost ?? host}${
      pathname === '/' ? '' : pathname
    }`
    const publishedProbot = isMatchingViewerUrl
      ? await getProbotFromPublicId(context.query.publicId?.toString())
      : await getProbotFromCustomDomain(customDomain)
    return {
      props: {
        publishedProbot,
        incompatibleBrowser,
        url: `https://${forwardedHost ?? host}${pathname}`,
      },
    }
  } catch (err) {
    console.error(err)
  }
  return {
    props: {
      incompatibleBrowser,
      url: `https://${forwardedHost ?? host}${pathname}`,
    },
  }
}

const getProbotFromPublicId = async (publicId?: string) => {
  const publishedProbot = (await prisma.publicProbot.findFirst({
    where: { probot: { publicId: publicId ?? '' } },
    select: {
      variables: true,
      settings: true,
      theme: true,
      version: true,
      groups: true,
      edges: true,
      probotId: true,
      id: true,
      probot: {
        select: {
          name: true,
          isClosed: true,
          isArchived: true,
          publicId: true,
        },
      },
    },
  })) as ProbotPageProps['publishedprobot'] | null
  if (isNotDefined(publishedProbot)) return null
  return publishedProbot.version
    ? ({
        name: publishedProbot.probot.name,
        publicId: publishedProbot.probot.publicId ?? null,
        background: publishedProbot.theme.general.background,
        isHideQueryParamsEnabled:
          publishedProbot.settings.general.isHideQueryParamsEnabled ?? null,
        metadata: publishedProbot.settings.metadata,
      } as Pick<
        ProbotV3PageProps,
        | 'name'
        | 'publicId'
        | 'background'
        | 'isHideQueryParamsEnabled'
        | 'metadata'
      >)
    : publishedProbot
}

const getProbotFromCustomDomain = async (customDomain: string) => {
  const publishedProbot = (await prisma.publicProbot.findFirst({
    where: { probot: { customDomain } },
    select: {
      variables: true,
      settings: true,
      theme: true,
      version: true,
      groups: true,
      edges: true,
      probotId: true,
      id: true,
      probot: {
        select: {
          name: true,
          isClosed: true,
          isArchived: true,
          publicId: true,
        },
      },
    },
  })) as ProbotPageProps['publishedprobot'] | null
  if (isNotDefined(publishedProbot)) return null
  return publishedProbot.version
    ? ({
        name: publishedProbot.probot.name,
        publicId: publishedProbot.probot.publicId ?? null,
        background: publishedProbot.theme.general.background,
        isHideQueryParamsEnabled:
          publishedProbot.settings.general.isHideQueryParamsEnabled ?? null,
        metadata: publishedProbot.settings.metadata,
      } as Pick<
        ProbotV3PageProps,
        | 'name'
        | 'publicId'
        | 'background'
        | 'isHideQueryParamsEnabled'
        | 'metadata'
      >)
    : publishedProbot
}

const getHost = (
  req?: IncomingMessage
): { host?: string; forwardedHost?: string } => ({
  host: req?.headers ? req.headers.host : window.location.host,
  forwardedHost: req?.headers['x-forwarded-host'] as string | undefined,
})

const App = ({
  publishedProbot,
  incompatibleBrowser,
  ...props
}: {
  isIE: boolean
  customHeadCode: string | null
  url: string
  publishedProbot:
    | ProbotPageProps['publishedprobot']
    | Pick<
        ProbotV3PageProps,
        | 'name'
        | 'publicId'
        | 'background'
        | 'isHideQueryParamsEnabled'
        | 'metadata'
      >
  incompatibleBrowser: string | null
}) => {
  if (incompatibleBrowser)
    return (
      <ErrorPage
        error={
          new Error(
            `Your web browser: ${incompatibleBrowser}, is not supported.`
          )
        }
      />
    )
  if (
    !publishedProbot ||
    ('probot' in publishedProbot && publishedProbot.probot.isArchived)
  )
    return <NotFoundPage />
  if ('probot' in publishedProbot && publishedProbot.probot.isClosed)
    return <ErrorPage error={new Error('This bot is now closed')} />
  return 'probot' in publishedProbot ? (
    <ProbotPageV2 publishedprobot={publishedProbot} {...props} />
  ) : (
    <ProbotPageV3
      url={props.url}
      name={publishedProbot.name}
      publicId={publishedProbot.publicId}
      isHideQueryParamsEnabled={publishedProbot.isHideQueryParamsEnabled}
      background={publishedProbot.background}
      metadata={publishedProbot.metadata}
    />
  )
}

export default App
