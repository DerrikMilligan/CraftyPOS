import React from 'react';
import { useMemo } from 'react';

import { Group, Loader, ScrollArea, Space, Table, Title } from '@mantine/core';
import { CurrencyDollar } from 'tabler-icons-react';

import { add } from 'dinero.js';

import { $, formatMoney, percentage } from 'lib/dineroHelpers';

import UseInvoices from '../../lib/hooks/useInvoices';
import UsePaymentMethods from '../../lib/hooks/usePaymentMethods';
import ErrorMessage from 'components/ErrorMessage';
import usePaymentTotals from 'lib/hooks/usePaymentTotals';

export default function PaymentTotals() {
  const { invoices, isLoading: invoicesLoading, isError: invoicesError } = UseInvoices();
  const { paymentMethods, isLoading: paymentsLoading, isError: paymentsError } = UsePaymentMethods();

  const paymentTotals = usePaymentTotals(invoices, paymentMethods);

  const totalTotals = useMemo(() => paymentTotals.reduce((acc, totalInfo) => {
    acc.total    = add(acc.total,    totalInfo.total);
    acc.subTotal = add(acc.subTotal, totalInfo.subTotal);
    acc.fees     = add(acc.fees,     totalInfo.fees);
    acc.taxes    = add(acc.taxes,    totalInfo.taxes);

    return acc;
  }, { total: $(0), subTotal: $(0), fees: $(0), taxes: $(0) }), [paymentTotals]);

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
              <th>Sub-Total</th>
              <th>Fees</th>
              <th>Taxes</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {
              paymentTotals &&
              paymentTotals.map((totalInfo) => (
                <tr key={totalInfo.paymentMethodName}>
                  <td align="right">{totalInfo.paymentMethodName}:</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <CurrencyDollar size={12} color="lime" />
                    {formatMoney(totalInfo.subTotal)}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <CurrencyDollar size={12} color="lime" />
                    {formatMoney(totalInfo.fees)}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <CurrencyDollar size={12} color="lime" />
                    {formatMoney(totalInfo.taxes)}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <CurrencyDollar size={12} color="lime" />
                    {formatMoney(totalInfo.total)}
                  </td>
                </tr>
              ))
            }
            <tr>
              <td align="right">Grand Totals:</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <CurrencyDollar size={12} color="lime" />
                {formatMoney(totalTotals.subTotal)}
              </td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <CurrencyDollar size={12} color="lime" />
                {formatMoney(totalTotals.fees)}
              </td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <CurrencyDollar size={12} color="lime" />
                {formatMoney(totalTotals.taxes)}
              </td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <CurrencyDollar size={12} color="lime" />
                {formatMoney(totalTotals.total)}
              </td>
            </tr>
            <tr>
              <td colSpan={3} align="right">(10%) Tax for the state:</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <CurrencyDollar size={12} color="lime" />
                {formatMoney(percentage(totalTotals.taxes, 10))}
              </td>
              <td></td>
            </tr>
          </tbody>
        </Table>
      </ScrollArea>
    </>
  );
}

