import type { NextApiRequest, NextApiResponse } from 'next'

import { PaymentMethod } from '@prisma/client';

import { prisma } from '../../lib/db';
import { getToken } from 'next-auth/jwt';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PaymentMethod[]|GenericResponse<null>>
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (token === null)
    return res.status(500).json({ success: false, message: 'Not authorized to make this request!' });

  if (req.method !== 'GET') {
    return res.status(500).json({ success: false, message: 'Invalid request' });
  }

  const paymentMethods = await prisma.paymentMethod.findMany({ where: { active: true } });

  if (paymentMethods === null) {
    console.error('No payment methods! Big problem!')
    return res.status(500).json({ success: false, message: 'No payment methods available!' });
  }

  return res.status(200).json(paymentMethods);
}
