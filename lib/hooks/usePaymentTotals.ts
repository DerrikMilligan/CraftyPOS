import { useMemo } from 'react';

import type { PaymentMethod } from '@prisma/client';
import type { HookInvoice } from 'lib/hooks/useInvoices';
import { Dinero, greaterThan } from 'dinero.js';
import { add } from 'dinero.js';

import { $ } from 'lib/dineroHelpers';

export interface ITotals {
  paymentMethodId  : number;
  paymentMethodName: string;
  total            : Dinero<number>;
  subTotal         : Dinero<number>;
  fees             : Dinero<number>;
  taxes            : Dinero<number>;
}

/**
 * Calculates the total amount of money received through each payment method.
 *
 * @param {Array<PaymentMethod> | undefined} paymentMethods
 * @param {Array<HookInvoice> | undefined} invoices
 *
 * @returns {Array<ITotals>}
 */
export default function usePaymentTotals(
  invoices      : Array<HookInvoice>   | undefined,
  paymentMethods: Array<PaymentMethod> | undefined,
): Array<ITotals> {
  return useMemo(() => (paymentMethods && paymentMethods
    .reduce((acc, paymentMethod) => {
      if (acc[paymentMethod.id] === undefined) {
        acc[paymentMethod.id] = {
          paymentMethodId  : paymentMethod.id,
          paymentMethodName: paymentMethod.name,
          total            : $(0),
          subTotal         : $(0),
          fees             : $(0),
          taxes            : $(0),
        };
      }

      if (invoices === undefined)
        return acc;

      const relevantInvoices = invoices.filter(invoice => invoice.archived === false && invoice.paymentMethodId === paymentMethod.id);

      const invoiceSubTotal = $(relevantInvoices.reduce((acc, invoice) => acc + invoice.subTotal, 0));
      const invoiceTotal    = $(relevantInvoices.reduce((acc, invoice) => acc + invoice.total, 0));
      const invoiceFees     = $(relevantInvoices.reduce((acc, invoice) => acc + invoice.processingFees, 0));
      const invoiceTaxes    = $(relevantInvoices.reduce((acc, invoice) => acc + invoice.salesTax, 0));

      acc[paymentMethod.id].total    = add(acc[paymentMethod.id].total,    invoiceTotal);
      acc[paymentMethod.id].subTotal = add(acc[paymentMethod.id].subTotal, invoiceSubTotal);
      acc[paymentMethod.id].fees     = add(acc[paymentMethod.id].fees,     invoiceFees);
      acc[paymentMethod.id].taxes    = add(acc[paymentMethod.id].taxes,    invoiceTaxes);

      return acc;
    },
    [] as Array<ITotals>)
    .filter(total => greaterThan(total.total, $(0)))) || [],
    [invoices, paymentMethods]
  );
}

