import type { NextApiRequest, NextApiResponse } from 'next'

import { Vendor } from '@prisma/client';

import { prisma } from '../../../lib/db';
import { getToken } from 'next-auth/jwt';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Vendor|GenericResponse<null>>
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (token === null)
    return res.status(500).json({ success: false, message: 'Not authorized to make this request!' });

  // Make sure we're posting
  if (req.method === 'PUT') {
    const { id, firstName, lastName, email, color } = req.body;

    if (id === undefined || id <= 0 || firstName === undefined || lastName === undefined)
      return res.status(500).json({ success: false, message: 'Missing required data' });

    const vendor = await prisma.vendor.update({
      data: {
        firstName,
        lastName,
        color,
        email: email || '',
      },
      where: { id },
    });

    return res.status(200).json(vendor);
  }
  
  if (req.method === 'DELETE') {
    const vendorId = req.query.vendorId as string;

    try {
      const id = Number.parseInt(vendorId);
      await prisma.vendor.delete({ where: { id } });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Failed to delete vendor!' });
    }
    
    return res.status(200).json({ success: true, message: 'Successfully deleted vendor' });
  }

  return res.status(500).json({ success: false, message: 'Invalid request' });
}
