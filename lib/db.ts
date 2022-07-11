import {
  Invoice as pInvoice,
  Item as pItem,
  PrismaClient,
  Tag,
  Transaction as pTransaction,
  Vendor,
} from '@prisma/client';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: [ 'query' ], 
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;


export type Item        = pItem        & { Tags: Tag[], Vendor: Vendor };
export type Transaction = pTransaction & { Item: Item };
export type Invoice     = pInvoice     & { Transactions: Transaction[] };
