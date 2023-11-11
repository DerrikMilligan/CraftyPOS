import dinero from 'dinero.js';
import type { Dinero } from 'dinero.js';

import { GlobalConfig, PaymentMethod, Transaction as pTransaction } from '@prisma/client';

// Re-export dinero along with our helper methods
export { default as dinero } from 'dinero.js';

export const $ = (amount: number) => dinero({ amount: Math.floor(amount * 100), currency: 'USD' });

export const numberHasDecimal = (num: number) => num % 1 != 0;

export const formatMoney = (d: Dinero, forceDecimal = false): string => {
  const format = forceDecimal || numberHasDecimal(d.getAmount())
    ? '$0,0.00'
    : '$0,0';

  return d.toFormat(format);
}

export const moneyToNumber = (d: Dinero): number => parseFloat(formatMoney(d));

export const toNearestQuarter = (d: Dinero): Dinero => $(Math.round(moneyToNumber(d) * 4) / 4);

// A custom precentage opration - https://v2.dinerojs.com/docs/faq/how-do-i-calculate-a-percentage
export const percentage = (d: Dinero, share: number, scale = 0) => {
  const power = scale + 1;
  const rest = 100 ** power - share;
  const [ chunk ] = d.allocate([ share, rest ]);
  return chunk;
};

export const calculateSubTotal = (transactions: pTransaction[]): Dinero => {
  return transactions.reduce((money, transaction) => $(transaction.pricePer).multiply(transaction.itemQuantity).add(money), $(0));
};

export const calculateSalesTax = (subTotal: Dinero, config: GlobalConfig | undefined): Dinero => {
  return percentage(subTotal, config?.salesTaxRate ?? 0);
};

export const calculateProcessingFees = (subTotal: Dinero, paymentMethod: PaymentMethod | undefined): Dinero => {
  return $(paymentMethod?.flatFee ?? 0).add(percentage(subTotal, paymentMethod?.percentFee ?? 0));
};

export const calculateTotal = (
  subTotal: Dinero,
  salesTax: Dinero,
  processingFees: Dinero,
  paymentMethod: PaymentMethod | undefined
): Dinero => {
  const sum = salesTax.add(processingFees).add(subTotal);

  return paymentMethod?.name === 'Cash'
    ? toNearestQuarter(sum)
    : sum;
};

