import { add, allocate, Dinero, dinero, multiply, toFormat } from 'dinero.js';
import { USD } from '@dinero.js/currencies';

import { Transaction } from './db';
import { GlobalConfig, PaymentMethod, Transaction as pTransaction } from '@prisma/client';

// Re-export all the initial methods along with our helper methods
export * from 'dinero.js';

export const $ = (amount: number) => dinero({ amount: Math.floor(amount * 100), currency: USD });

export const formatMoney = (d: Dinero<number>): string => toFormat(d, ({ amount }) => amount.toFixed(2));

export const moneyToNumber = (d: Dinero<number>): number => parseFloat(formatMoney(d));

export const toNearestQuarter = (d: Dinero<number>): Dinero<number> => $(Math.round(moneyToNumber(d) * 4) / 4);

// A custom precentage opration - https://v2.dinerojs.com/docs/faq/how-do-i-calculate-a-percentage
export const percentage = (d: Dinero<number>, share: number, scale = 0) => {
  const power = scale + 1;
  const rest = 100 ** power - share;
  const [chunk] = allocate(d, [ share, rest ]);

  return chunk;
};

export const calculateSubTotal = (transactions: pTransaction[]): Dinero<number> => {
  return transactions.reduce((money, transaction) => {
    return add(money, multiply($(transaction.pricePer), transaction.itemQuantity));
  }, $(0));
};

export const calculateSalesTax = (subTotal: Dinero<number>, config: GlobalConfig | undefined): Dinero<number> => {
  return percentage(subTotal, config?.salesTaxRate ?? 0);
};

export const calculateProcessingFees = (subTotal: Dinero<number>, paymentMethod: PaymentMethod | undefined): Dinero<number> => {
  return add($(paymentMethod?.flatFee ?? 0), percentage(subTotal, paymentMethod?.percentFee ?? 0));
};

export const calculateTotal = (
  subTotal: Dinero<number>,
  salesTax: Dinero<number>,
  processingFees: Dinero<number>,
  paymentMethod: PaymentMethod | undefined
): Dinero<number> => {
  const sum = add(subTotal, add(salesTax, processingFees));

  return paymentMethod?.name === 'Cash'
    ? toNearestQuarter(sum)
    : sum;
};
