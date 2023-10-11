import { IncomingMessage } from 'http'
import { ErrorPage } from '@/components/ErrorPage'
import { NotFoundPage } from '@/components/NotFoundPage'
import { GetServerSideProps, GetServerSidePropsContext } from 'next'
import { isDefined, isNotDefined, omit } from '@typebot.io/lib'
import { ProbotPageProps, ProbotPageV2 } from '@/components/ProbotPageV2'
import prisma from '@typebot.io/lib/prisma'

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const pathname = context.resolvedUrl.split('?')[0]
  const { host, forwardedHost } = getHost(context.req)
  try {
    if (!host) return { props: {} }
    const publishedProbot = await getProbotFromPublicId(
      context.query.publicId?.toString()
    )
    const headCode = publishedProbot?.settings.metadata.customHeadCode
    return {
      props: {
        publishedProbot,
        url: `https://${forwardedHost ?? host}${pathname}`,
        customHeadCode:
          isDefined(headCode) && headCode !== '' ? headCode : null,
      },
    }
  } catch (err) {
    console.error(err)
  }
  return {
    props: {
      url: `https://${forwardedHost ?? host}${pathname}`,
    },
  }
}

const getProbotFromPublicId = async (
  publicId?: string
): Promise<ProbotPageProps['publishedprobot'] | null> => {
  const publishedProbot = await prisma.publicProbot.findFirst({
    where: { probot: { publicId: publicId ?? '' } },
    include: {
      probot: { select: { name: true, isClosed: true, isArchived: true } },
    },
  })
  if (isNotDefined(publishedProbot)) return null
  return omit(
    publishedProbot,
    'createdAt',
    'updatedAt'
  ) as ProbotPageProps['publishedprobot']
}

const getHost = (
  req?: IncomingMessage
): { host?: string; forwardedHost?: string } => ({
  host: req?.headers ? req.headers.host : window.location.host,
  forwardedHost: req?.headers['x-forwarded-host'] as string | undefined,
})

const App = ({ publishedprobot, ...props }: ProbotPageProps) => {
  if (!publishedprobot || publishedprobot.probot.isArchived)
    return <NotFoundPage />
  if (publishedprobot.probot.isClosed)
    return <ErrorPage error={new Error('This bot is now closed')} />
  return <ProbotPageV2 publishedprobot={publishedprobot} {...props} />
}

export default App
