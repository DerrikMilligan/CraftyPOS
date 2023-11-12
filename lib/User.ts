import { User } from '@prisma/client';
import bcrypt from 'bcrypt';

import { prisma } from './db';

const saltRounds = 10;

export enum Role {
  USER  = 'USER',
  ADMIN = 'ADMIN',
}

interface UserCredentials {
  email  ?: string;
  username: string;
  password: string;
  role   ?: Role;
}

/**
 * Verify credentials
 *
 * @param {UserCredentials} { username, password }
 * @returns {Promise<GenericResponse>}
 */
const credentialsAreValid = async ({ email, username, password }: UserCredentials): Promise<GenericResponse<User>> => {
  // Try and find the user with a username or email
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: username || '' },
        // { email   : email    || '' },
      ],
    },
  });

  // If there's not even a user then bounce
  if (user === null) {
    return { success: false, message: 'bad username' };
  }

  // Check the password if there is
  if (!password || await bcrypt.compare(password, user.hashedPassword) === false) {
    return { success: false, message: 'bad password' };
  }

  return { success: true, data: user };
};


/**
 * Create a user in the database
 *
 * @async
 * @param {UserCredentials} { email, username, password, role = Role.USER }
 * @returns {Promise<GenericResponse>}
 */
const createUser = async ({ username, password, email, role = Role.USER }: UserCredentials): Promise<GenericResponse<User>> => {
  // Verify the only non-required piece of data
  if (email === undefined)
    return { success: false, message: 'email required' };

  // See if the user exists
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        ...(email !== '' ? [{ email }] : []),
      ],
    },
  });

  // If so then let the admin know
  if (user !== null)
    return { success: false, message: 'username/email already registered' };

  // Hash the pass
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create the user
  user = await prisma.user.create({ data: { username, hashedPassword, email, role } });

  // If there was a problem, let someone know
  if (user === null)
    return { success: false, message: 'failed to create user' };

  return { success: true, data: user };
};

export {
  credentialsAreValid,
  createUser,
};
