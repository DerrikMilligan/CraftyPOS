import type { NextApiRequest, NextApiResponse } from 'next'

import { Vendor } from '.prisma/client';

import { prisma } from '../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Vendor|Vendor[]|GenericResponse<null>>
) {
  // Make sure we're posting
  if (req.method === 'POST') {
    const { firstName, lastName, email } = req.body;

    if (firstName === undefined || lastName === undefined)
      return res.status(500).json({ success: false, message: 'Missing required data' });
    
    const vendor = await prisma.vendor.create({
      data: {
        firstName,
        lastName,
        email: email || '',
      }
    });

    return res.status(200).json(vendor);
  }

  if (req.method === 'GET') {
    const vendors = await prisma.vendor.findMany({ orderBy: { firstName: 'desc' } });

    return res.status(200).json(vendors);
  }

  return res.status(500).json({ success: false, message: 'Invalid request' });
}
