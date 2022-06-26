import type { NextApiRequest, NextApiResponse } from 'next'

import { Tag } from '.prisma/client';

import { prisma } from '../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Tag|GenericResponse<null>>
) {
  if (req.method === 'DELETE') {
    const tagId = req.query.tagId as string;
    
    try {
      const id = Number.parseInt(tagId);
      await prisma.tag.delete({ where: { id } });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Failed to delete tag!' });
    }
    
    return res.status(200).json({ success: true, message: 'Successfully deleted tag' });
  }

  return res.status(500).json({ success: false, message: 'Invalid request' });
}
