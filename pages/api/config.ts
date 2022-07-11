import type { NextApiRequest, NextApiResponse } from 'next'

import { GlobalConfig } from '.prisma/client';

import { prisma } from '../../lib/db';
import { getToken } from 'next-auth/jwt';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GlobalConfig|GenericResponse<null>>
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (token === null)
    return res.status(500).json({ success: false, message: 'Not authorized to make this request!' });

  if (req.method !== 'GET') {
    return res.status(500).json({ success: false, message: 'Invalid request' });
  }
  
  const globalConfig = await prisma.globalConfig.findFirst();
  
  if (globalConfig === null) {
    console.error('No global config! Big problem!')
    return res.status(500).json({ success: false, message: 'No global config available!' });
  }

  return res.status(200).json(globalConfig);
}
