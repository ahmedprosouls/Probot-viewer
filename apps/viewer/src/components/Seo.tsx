import { gtmHeadSnippet } from '@/lib/google-tag-manager'
import { Metadata } from '@typebot.io/schemas'
import Head from 'next/head'
import Script from 'next/script'
import React from 'react'
import { isNotEmpty } from '@typebot.io/lib'

type SEOProps = {
  url: string
  probotName: string
  metadata: Metadata
}

export const SEO = ({
  url,
  probotName,
  metadata: { title, description, favIconUrl, imageUrl, googleTagManagerId },
}: SEOProps) => (
  <>
    <Head key="seo">
      <title>{title ?? probotName}</title>
      <meta name="robots" content="noindex" />
      <link
        rel="icon"
        type="image/png"
        href={favIconUrl ?? 'https://viewer.probot.io/favicon.png'}
      />
      <meta name="title" content={title ?? probotName} />
      <meta
        name="description"
        content={
          description ??
          'Build beautiful conversational forms and embed them directly in your applications without a line of code. Triple your response rate and collect answers that has more value compared to a traditional form.'
        }
      />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={url ?? 'https://bot.probot.io'} />
      <meta property="og:title" content={title ?? probotName} />
      <meta property="og:site_name" content={title ?? probotName} />
      <meta
        property="og:description"
        content={
          description ??
          'Build beautiful conversational forms and embed them directly in your applications without a line of code. Triple your response rate and collect answers that has more value compared to a traditional form.'
        }
      />
      <meta
        property="og:image"
        itemProp="image"
        content={imageUrl ?? 'https://bot.probot.io/site-preview.png'}
      />

      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url ?? 'https://bot.probot.io'} />
      <meta property="twitter:title" content={title ?? probotName} />
      <meta
        property="twitter:description"
        content={
          description ??
          'Build beautiful conversational forms and embed them directly in your applications without a line of code. Triple your response rate and collect answers that has more value compared to a traditional form.'
        }
      />
      <meta
        property="twitter:image"
        content={imageUrl ?? 'https://bot.probot.io/site-preview.png'}
      />
    </Head>
    {isNotEmpty(googleTagManagerId) && (
      <Script id="google-tag-manager">
        {gtmHeadSnippet(googleTagManagerId)}
      </Script>
    )}
  </>
)
