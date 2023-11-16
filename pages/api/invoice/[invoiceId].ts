import type { NextApiRequest, NextApiResponse } from 'next'

import { Tag } from '@prisma/client';

import { prisma } from '../../../lib/db';
import { getToken } from 'next-auth/jwt';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Tag|GenericResponse<null>>
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (token === null)
    return res.status(500).json({ success: false, message: 'Not authorized to make this request!' });

  if (req.method === 'DELETE') {
    const invoiceId = req.query.invoiceId as string;

    try {
      const id = Number.parseInt(invoiceId);
      // Soft delete the invoice
      await prisma.invoice.update({ where: { id }, data: { archived: true } });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Failed to delete invoice!' });
    }

    return res.status(200).json({ success: true, message: 'Successfully deleted invoice' });
  }

  return res.status(500).json({ success: false, message: 'Invalid request' });
}
