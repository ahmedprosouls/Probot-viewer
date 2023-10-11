import { PrismaClient } from '@typebot.io/prisma'
import { promptAndSetEnvironment } from './utils'
import { groupSchema } from '@typebot.io/schemas'
import { readFileSync, writeFileSync } from 'fs'
import { exit } from 'process'

const executePlayground = async () => {
  await promptAndSetEnvironment()
  const prisma = new PrismaClient({
    log: [{ emit: 'event', level: 'query' }, 'info', 'warn', 'error'],
  })

  prisma.$on('query', (e) => {
    console.log(e.query)
    console.log(e.params)
    console.log(e.duration, 'ms')
  })

  const probots = JSON.parse(readFileSync('probots.json', 'utf-8')) as any[]

  for (const probot of probots) {
    for (const group of probot.groups) {
      const parser = groupSchema.safeParse(group)
      if ('error' in parser) {
        console.log(
          group.id,
          parser.error.issues.map((issue) =>
            JSON.stringify({
              message: issue.message,
              path: issue.path,
            })
          )
        )
        writeFileSync('failedProbot.json', JSON.stringify(probot))
        exit()
      }
    }
  }
}

executePlayground()
