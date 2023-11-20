import React from 'react';
import { useMemo } from 'react';

import { Group, Loader, ScrollArea, Space, Table, Title } from '@mantine/core';
import { CurrencyDollar } from 'tabler-icons-react';

import UseInvoices from '../../lib/hooks/useInvoices';
import UsePaymentMethods from '../../lib/hooks/usePaymentMethods';
import ErrorMessage from 'components/ErrorMessage';

export default function PaymentTotals() {
  const { invoices, isLoading: invoicesLoading, isError: invoicesError } = UseInvoices();
  const { paymentMethods, isLoading: paymentsLoading, isError: paymentsError } = UsePaymentMethods();

  const paymentTotals = useMemo(() => (paymentMethods && paymentMethods
    .reduce((acc, paymentMethod) => {
      if (acc[paymentMethod.name] === undefined)
        acc[paymentMethod.name] = { total: 0, fees: 0, tax: 0 };

      if (invoices === undefined)
        return acc;

      const relevantInvoices = invoices.filter(invoice => invoice.archived === false && invoice.paymentMethodId === paymentMethod.id);

      acc[paymentMethod.name].total += relevantInvoices.reduce((acc, invoice) => acc + invoice.total, 0);
      acc[paymentMethod.name].fees  += relevantInvoices.reduce((acc, invoice) => acc + invoice.processingFees, 0);
      acc[paymentMethod.name].tax   += relevantInvoices.reduce((acc, invoice) => acc + invoice.salesTax, 0);

      return acc;
    },
    {} as Record<string, { total: number, fees: number, tax: number }>)) || {},
    [invoices, paymentMethods]
  );

  const totalTotals = useMemo(() => Object.entries(paymentTotals).reduce((acc, [paymentMethod, values]) => {
    acc.total += values.total;
    acc.fees  += values.fees;
    acc.tax   += values.tax;
    return acc;
  }, { total: 0, fees: 0, tax: 0 }), [paymentTotals]);

  if (invoicesError || paymentsError) return (
    <ErrorMessage message={invoicesError || paymentsError}></ErrorMessage>
  );

  // Handle the loading and error states
  if (invoicesLoading || paymentsLoading) return (
    <Group position="center" mt={75}>
      <Loader color="green" size="lg" />
    </Group>
  );

  return (
    <>
      <Title order={3}>Payment Totals</Title>

      <Space h="md" />

      <ScrollArea type="auto">
        <Table striped>
          <thead>
            <tr>
              <th>Payment Method</th>
              <th>Total</th>
              <th>Fees</th>
              <th>Tax</th>
            </tr>
          </thead>
          <tbody>
            {
              paymentTotals &&
              Object.entries(paymentTotals).map(([paymentMethodName, values]) => (
                <tr key={paymentMethodName}>
                  <td>{paymentMethodName}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <CurrencyDollar size={12} color="lime" />
                    {values.total.toFixed(2)}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <CurrencyDollar size={12} color="lime" />
                    {values.fees.toFixed(2)}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <CurrencyDollar size={12} color="lime" />
                    {values.tax.toFixed(2)}
                  </td>
                </tr>
              ))
            }
            <tr>
              <td align="right">Grand Totals:</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <CurrencyDollar size={12} color="lime" />
                {totalTotals.total.toFixed(2)}
              </td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <CurrencyDollar size={12} color="lime" />
                {totalTotals.fees.toFixed(2)}
              </td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <CurrencyDollar size={12} color="lime" />
                {totalTotals.tax.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td colSpan={3} align="right">Tax for the state:</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <CurrencyDollar size={12} color="lime" />
                {(totalTotals.tax * 0.1).toFixed(2)} (10%)
              </td>
            </tr>
          </tbody>
        </Table>
      </ScrollArea>
    </>
  );
}

