import { allocate, Dinero, dinero, toFormat } from 'dinero.js';
import { USD } from '@dinero.js/currencies';

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


