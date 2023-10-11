import prisma from '@typebot.io/lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'
import Cors from 'cors'
import { initMiddleware, methodNotAllowed, notFound } from '@typebot.io/lib/api'

const cors = initMiddleware(Cors())

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await cors(req, res)
  if (req.method === 'GET') {
    const probotId = req.query.probotId as string
    const probot = await prisma.publicProbot.findUnique({
      where: { probotId },
    })
    if (!probot) return notFound(res)
    return res.send({ probot })
  }
  methodNotAllowed(res)
}

export default handler
