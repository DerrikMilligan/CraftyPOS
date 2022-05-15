import type { NextApiRequest, NextApiResponse } from 'next'

import { credentialsAreValid, createUser } from 'lib/User';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenericResponse<null>>
) {
  // Make sure we're posting
  if (req.method !== 'POST') {
    return res.status(200).json({ success: false, message: 'Must be post request' });
  }

  const { email, username, password } = req.body;

  // Make sure we have valid data
  if (email === undefined || username === undefined || password === undefined) {
    return res.status(200).json({ success: false, message: 'bad data' });
  }

  // See if a user already exists
  const userLookup = await credentialsAreValid({ email, username, password });

  if (userLookup.success === true || userLookup.message !== 'bad username') {
    return res.status(200).json({ success: false, message: 'username taken' });
  }

  // Create the user
  const userCreation = await createUser({ username, password, email });

  if (userCreation.success === false) {
    return res.status(200).json({ success: userCreation.success, message: userCreation.message });
  }

  return res.status(200).json({ success: true });
}
