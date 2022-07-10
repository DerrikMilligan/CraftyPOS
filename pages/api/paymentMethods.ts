import type { NextApiRequest, NextApiResponse } from 'next'

import { PaymentMethod } from '.prisma/client';

import { prisma } from '../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PaymentMethod[]|GenericResponse<null>>
) {
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
