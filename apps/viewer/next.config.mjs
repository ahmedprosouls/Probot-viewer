import { withSentryConfig } from '@sentry/nextjs'
import { join, dirname } from 'path'
import '@typebot.io/env/dist/env.mjs'
import { fileURLToPath } from 'url'
import { configureRuntimeEnv } from 'next-runtime-env/build/configure.js'

const __filename = fileURLToPath(import.meta.url)

const __dirname = dirname(__filename)

configureRuntimeEnv()

const landingPagePaths = [
  '/',
  '/pricing',
  '/privacy-policies',
  '/terms-of-service',
  '/about',
  '/oss-friends',
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@typebot.io/lib',
    '@typebot.io/schemas',
    '@typebot.io/emails',
  ],
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: join(__dirname, '../../'),
  },
  async rewrites() {
    return {
      beforeFiles: (process.env.LANDING_PAGE_URL
        ? landingPagePaths
            .map((path) => ({
              source: '/_next/static/:static*',
              destination: `${process.env.LANDING_PAGE_URL}/_next/static/:static*`,
              has: [
                {
                  type: 'header',
                  key: 'referer',
                  value: `https://probot.io${path}`,
                },
              ],
            }))
            .concat(
              landingPagePaths.map((path) => ({
                source: '/probots/:probot*',
                destination: `${process.env.LANDING_PAGE_URL}/probots/:probot*`,
                has: [
                  {
                    type: 'header',
                    key: 'referer',
                    value: `https://probot.io${path}`,
                  },
                ],
              }))
            )
            .concat(
              landingPagePaths.map((path) => ({
                source: '/styles/:style*',
                destination: `${process.env.LANDING_PAGE_URL}/styles/:style*`,
                has: [
                  {
                    type: 'header',
                    key: 'referer',
                    value: `https://probot.io${path}`,
                  },
                ],
              }))
            )
            .concat(
              landingPagePaths.map((path) => ({
                source: path,
                destination: `${process.env.LANDING_PAGE_URL}${path}`,
                has: [
                  {
                    type: 'host',
                    value: 'probot.io',
                  },
                ],
              }))
            )
        : []
      )
        .concat([
          {
            source:
              '/api/probots/:probotId/blocks/:blockId/storage/upload-url',
            destination:
              '/api/v1/probots/:probotId/blocks/:blockId/storage/upload-url',
          },
        ])
        .concat(
          process.env.NEXTAUTH_URL
            ? [
                {
                  source:
                    '/api/probots/:probotId/blocks/:blockId/steps/:stepId/sampleResult',
                  destination: `${process.env.NEXTAUTH_URL}/api/v1/probots/:probotId/webhookBlocks/:blockId/getResultExample`,
                },
                {
                  source:
                    '/api/probots/:probotId/blocks/:blockId/sampleResult',
                  destination: `${process.env.NEXTAUTH_URL}/api/v1/probots/:probotId/webhookBlocks/:blockId/getResultExample`,
                },
                {
                  source:
                    '/api/probots/:probotId/blocks/:blockId/steps/:stepId/unsubscribeWebhook',
                  destination: `${process.env.NEXTAUTH_URL}/api/v1/probots/:probotId/webhookBlocks/:blockId/unsubscribe`,
                },
                {
                  source:
                    '/api/probots/:probotId/blocks/:blockId/unsubscribeWebhook',
                  destination: `${process.env.NEXTAUTH_URL}/api/v1/probots/:probotId/webhookBlocks/:blockId/unsubscribe`,
                },
                {
                  source:
                    '/api/probots/:probotId/blocks/:blockId/steps/:stepId/subscribeWebhook',
                  destination: `${process.env.NEXTAUTH_URL}/api/v1/probots/:probotId/webhookBlocks/:blockId/subscribe`,
                },
                {
                  source:
                    '/api/probots/:probotId/blocks/:blockId/subscribeWebhook',
                  destination: `${process.env.NEXTAUTH_URL}/api/v1/probots/:probotId/webhookBlocks/:blockId/subscribe`,
                },
              ]
            : []
        ),
    }
  },
}

const sentryWebpackPluginOptions = {
  silent: true,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA + '-viewer',
}

export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(
      {
        ...nextConfig,
        sentry: {
          hideSourceMaps: true,
          widenClientFileUpload: true,
        },
      },
      sentryWebpackPluginOptions
    )
  : nextConfig
