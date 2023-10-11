import { authenticateUser } from '@/helpers/authenticateUser'
import prisma from '@typebot.io/lib/prisma'
import { ResultWithAnswers } from '@typebot.io/schemas'
import { NextApiRequest, NextApiResponse } from 'next'
import { methodNotAllowed } from '@typebot.io/lib/api'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    const user = await authenticateUser(req)
    if (!user) return res.status(401).json({ message: 'Not authenticated' })
    const probotId = req.query.probotId as string
    const limit = Number(req.query.limit)
    const results = (await prisma.result.findMany({
      where: {
        probot: {
          id: probotId,
          workspace: { members: { some: { userId: user.id } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { answers: true },
    })) as unknown as ResultWithAnswers[]
    return res.send({ results })
  }
  if (req.method === 'POST') {
    const probotId = req.query.probotId as string
    const probot = await prisma.probot.findFirst({
      where: { id: probotId },
      select: { workspace: { select: { isQuarantined: true } } },
    })
    if (probot?.workspace.isQuarantined)
      return res.send({ result: null, hasReachedLimit: true })
    const result = await prisma.result.create({
      data: {
        probotId,
        isCompleted: false,
        variables: [],
      },
    })
    res.send({ result })
    return
  }
  methodNotAllowed(res)
}

export default handler
