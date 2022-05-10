
export const paymentMethods = [
  {
    name          : 'Cash',
    roundToQuarter: true,
  },
  {
    name      : 'Card',
    flatFee   : 0.5,
    percentFee: 3.5,
  },
  { name: 'Venmo' },
  { name: 'Check' },
];

export const globalConfig = {
  // Idaho Sales tax rate
  salesTaxRate: 6.0
};
