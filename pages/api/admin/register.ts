import type { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt';
import { Role } from '@prisma/client';

import { prisma } from '../../../lib/db';

import { credentialsAreValid, createUser } from 'lib/User';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenericResponse>
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (token === null)
    return res.status(200).json({ success: false, message: 'Not authorized to make this request!' });

  // @ts-ignore
  const actingUser = await prisma.user.findFirst({ where: { id: parseInt(token.id) } });
  if (actingUser === null)
    return res.status(200).json({ success: false, message: 'You\'re not a real person!' });

  if (actingUser.role !== Role.ADMIN)
    return res.status(200).json({ success: false, message: 'Not authorized to make this request!' });

  // Make sure we're posting
  if (req.method !== 'POST')
    return res.status(200).json({ success: false, message: 'Must be post request' });

  const { email, username, password, role } = req.body;

  // Make sure we have valid data
  if (email === undefined || username === undefined || password === undefined || role === undefined)
    return res.status(200).json({ success: false, message: 'bad data' });

  // See if a user already exists
  const userLookup = await credentialsAreValid({ email, username, password });

  if (userLookup.success === true)
    return res.status(200).json({ success: false, message: 'username taken' });

  if (role !== Role.ADMIN && role !== Role.USER)
    return res.status(200).json({ success: false, message: 'bad role' });

  // Create the user
  const userCreation = await createUser({ username, password, email, role });

  if (userCreation.success === false)
    return res.status(200).json({ success: userCreation.success, message: userCreation.message });

  return res.status(200).json({ success: true });
}

