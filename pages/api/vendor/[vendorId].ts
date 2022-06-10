import type { NextApiRequest, NextApiResponse } from 'next'

import { PrismaClient, Vendor } from '.prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Vendor|GenericResponse<null>>
) {
  // Make sure we're posting
  if (req.method === 'PUT') {
    const { id, firstName, lastName, email } = req.body;

    if (id === undefined || id <= 0 || firstName === undefined || lastName === undefined)
      return res.status(500).json({ success: false, message: 'Missing required data' });

    const vendor = await prisma.vendor.update({
      data: {
        firstName,
        lastName,
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
