import type { NextApiRequest, NextApiResponse } from 'next'

import { User } from '@prisma/client';

import { prisma } from '../../lib/db';

type OS = 'android' | 'ios';

interface SquareParameterKeys {
  clientTransactionId: string;
  transactionId      : string;
  errorField         : string;
}

const keys = {
  'android': {
    clientTransactionId: 'com.squareup.pos.CLIENT_TRANSACTION_ID',
    transactionId      : 'com.squareup.pos.SERVER_TRANSACTION_ID',
    errorField         : 'com.squareup.pos.ERROR_CODE',
  } as SquareParameterKeys,
  'ios': {
    clientTransactionId: 'client_transaction_id',
    transactionId      : 'transaction_id',
    errorField         : 'error_code',
  } as SquareParameterKeys,
} as Record<OS, SquareParameterKeys>;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenericResponse<null>>
) {
  const os: OS = Object.hasOwn(req.query, 'data') ? 'ios' : 'android';

  let data: SquareParameterKeys = {
    clientTransactionId: '',
    transactionId      : '',
    errorField         : '',
  };

  if (os === 'android') {
    data = {
      clientTransactionId: req.query[keys[os].clientTransactionId] as string || '',
      transactionId      : req.query[keys[os].transactionId      ] as string || '',
      errorField         : req.query[keys[os].errorField         ] as string || '',
    };
  } else {
    const body = JSON.parse(req.query['data'] as string);

    data = {
      clientTransactionId: body[keys[os].clientTransactionId] as string || '',
      transactionId      : body[keys[os].transactionId      ] as string || '',
      errorField         : body[keys[os].errorField         ] as string || '',
    };
  }

  const user = await prisma.user.findFirst({ where: { username: 'derrik' } });

  const userId = user === null ? 1 : user.id;

  await prisma.log.create({
    data: {
      userId   : userId,
      message  : JSON.stringify(data, null, 2),
      timestamp: new Date(Date.now()),
    },
  });

  res.status(200).json({ success: true });
}
