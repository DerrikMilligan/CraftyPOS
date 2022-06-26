import type { NextApiRequest, NextApiResponse } from 'next'

import { Tag } from '.prisma/client';

import { prisma } from '../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Tag|Tag[]|GenericResponse<null>>
) {
  // Make sure we're posting
  if (req.method === 'POST') {
    const { name } = req.body;

    if (name === undefined)
      return res.status(500).json({ success: false, message: 'Missing required data' });
    
    const tag = await prisma.tag.create({ data: { name } });

    return res.status(200).json(tag);
  }

  if (req.method === 'GET') {
    const tags = await prisma.tag.findMany({ orderBy: { name: 'desc' } });

    return res.status(200).json(tags);
  }

  return res.status(500).json({ success: false, message: 'Invalid request' });
}
