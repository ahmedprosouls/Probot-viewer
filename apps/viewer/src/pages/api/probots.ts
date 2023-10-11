import { authenticateUser } from '@/helpers/authenticateUser'
import prisma from '@typebot.io/lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'
import { methodNotAllowed } from '@typebot.io/lib/api'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    const user = await authenticateUser(req)
    if (!user) return res.status(401).json({ message: 'Not authenticated' })
    const probots = await prisma.probot.findMany({
      where: { workspace: { members: { some: { userId: user.id } } } },
      select: {
        name: true,
        publishedProbot: { select: { id: true } },
        id: true,
      },
    })
    return res.send({
      probots: probots.map((probot) => ({
        id: probot.id,
        name: probot.name,
        publishedprobotId: probot.publishedProbot?.id,
      })),
    })
  }
  return methodNotAllowed(res)
}

export default handler
