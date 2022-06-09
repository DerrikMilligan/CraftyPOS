import type { NextApiRequest, NextApiResponse } from 'next'

import { PrismaClient, Vendor } from '.prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenericResponse<Vendor|Vendor[]>>
) {
  // Make sure we're posting
  if (req.method === 'POST') {
    const { firstName, lastName, email } = req.body;

    if (firstName === undefined || lastName === undefined)
      return res.status(200).json({ success: false, message: 'Missing required data' });

    const vendor = await prisma.vendor.create({
      data: {
        firstName,
        lastName,
        email: email || '',
      }
    });

    return res.status(200).json({ success: true, data: vendor });
  }

  if (req.method === 'GET') {
    const vendors = await prisma.vendor.findMany({ orderBy: { firstName: 'desc' } });

    return res.status(200).json({ success: true, data: vendors });
  }

  return res.status(200).json({ success: false, message: 'Invalid request' });
}
