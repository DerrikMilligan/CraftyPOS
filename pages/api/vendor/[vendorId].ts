import type { NextApiRequest, NextApiResponse } from 'next'

import { PrismaClient, Vendor } from '.prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenericResponse<Vendor[]>>
) {
  // Make sure we're posting
  if (req.method === 'POST') {
    console.log(req.body);
    // const data = JSON.parse(req.body);

    return res.status(200).json({ success: false, message: 'Must be post request' });
  }

  return res.status(200).json({ success: false, message: 'Invalid request' });
}
