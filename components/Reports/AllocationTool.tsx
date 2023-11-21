import React from 'react';
import { useMemo } from 'react';
import { type Dinero, add } from 'dinero.js';

import { Button, Container, Group, Loader, NativeSelect, NumberInput, ScrollArea, Space, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { CurrencyDollar } from 'tabler-icons-react';

import { titleCase } from 'lib/textHelpers';

import { $, formatMoney, percentage } from 'lib/dineroHelpers';

import type { IAssignedMoney, ISharedExpense, ShareType } from 'lib/hooks/useAllocations';

import UseInvoices from '../../lib/hooks/useInvoices';
import UsePaymentMethods from '../../lib/hooks/usePaymentMethods';
import UseVendors from '../../lib/hooks/useVendors';
import usePaymentTotals from 'lib/hooks/usePaymentTotals';

import ErrorMessage from 'components/ErrorMessage';

export interface IAllocationsForm {
  seedMoney?                   : number;
  assignedMoneyVendorId?       : number;
  assignedMoneyAmount?         : number;
  assignedMoneyPaymentMethodId?: number;
  assignedMoney                : Array<IAssignedMoney>;
  sharedExpenseName            : string;
  sharedExpenseVendorId?       : number;
  sharedExpenseAmount?         : number;
  sharedExpenseShareType?      : ShareType;
  sharedExpenses               : Array<ISharedExpense>;
  includeFeesInAllocations     : boolean;
  includeTaxesInAllocations    : boolean;
}

export default function DivvyingTool() {
  const { invoices, isLoading: invoicesLoading, isError: invoicesError } = UseInvoices();
  const { paymentMethods, isLoading: paymentsLoading, isError: paymentsError } = UsePaymentMethods();
  const { vendors, isLoading: vendorsLoading, isError: vendorsError } = UseVendors();

  const paymentTotals = usePaymentTotals(invoices, paymentMethods);

  const form = useForm<IAllocationsForm>({
    initialValues: {
      sharedExpenseName           : '',
      sharedExpenseVendorId       : 2,
      sharedExpenseShareType      : 'equal',
      assignedMoneyVendorId       : 2,
      assignedMoneyPaymentMethodId: 1,
      assignedMoney               : [],
      sharedExpenses              : [],
      includeFeesInAllocations    : false,
      includeTaxesInAllocations   : false,
    },
  });

  const totalCash = useMemo(() => {
    const cashInfo = paymentTotals.find(total => total && total.name === 'Cash');
    if (cashInfo === undefined) return $(0);
    return add(cashInfo.total, $(form.values.seedMoney ?? 0));
  }, [form, paymentTotals]);

  const allocations = useAllocations();

  if (invoicesError || paymentsError || vendorsError) return (
    <ErrorMessage message={invoicesError || paymentsError || vendorsError}></ErrorMessage>
  );

  // Handle the loading and error states
  if (invoicesLoading || paymentsLoading || vendorsLoading) return (
    <Group position="center" mt={75}>
      <Loader color="green" size="lg" />
    </Group>
  );

  const vendorSelectItems = vendors?.map(vendor => ({ value: vendor.id.toString(), label: vendor.firstName + ' ' + vendor.lastName })) ?? [];
  const paymentMethodSelectItems = paymentMethods?.map(paymentMethod => ({ value: paymentMethod.id.toString(), label: paymentMethod.name })) ?? [];

  function addExpense() {
    if (
      form.values.sharedExpenseName === undefined ||
      form.values.sharedExpenseAmount === undefined ||
      form.values.sharedExpenseVendorId === undefined ||
      form.values.sharedExpenseShareType === undefined
    ) {
      showNotification({ color: 'red', message: 'Please enter an expense name and amount' });
      return;
    }

    const matchingVendor = vendors?.find(vendor => vendor.id === parseInt(form.values.sharedExpenseVendor ?? ''));
    if (matchingVendor === undefined) {
      showNotification({ color: 'red', message: 'Please select a vendor... Sorry if this is weird' });
      return;
    }

    const newExpense = {
      name     : form.values.sharedExpenseName,
      vendorId : form.values.sharedExpenseVendorId,
      amount   : form.values.sharedExpenseAmount,
      shareType: form.values.sharedExpenseShareType,
    };

    form.setValues({
      ...form.values,
      // Add the new item
      sharedExpenses     : [ ...form.values.sharedExpenses, newExpense ],
      // Wipe out the form fields
      sharedExpenseName  : '',
      sharedExpenseAmount: undefined,
    });
  }

  function assignMoney() {
    if (
      form.values.assignedMoneyAmount === undefined ||
      form.values.assignedMoneyVendorId === undefined ||
      form.values.assignedMoneyPaymentMethodId === undefined
    ) {
      showNotification({ color: 'red', message: 'Please set an amount, select a vendor, and a payment method' });
      return;
    }

    const matchingVendor = vendors?.find(vendor => vendor.id === form.values.assignedMoneyVendorId);
    if (matchingVendor === undefined) {
      showNotification({ color: 'red', message: 'Please select a vendor... Sorry if this is weird' });
      return;
    }

    const matchingPaymentMethod = paymentMethods?.find(method => method.id === form.values.assignedMoneyPaymentMethodId);
    if (matchingPaymentMethod === undefined) {
      showNotification({ color: 'red', message: 'Please select a payment method... Sorry if this is weird' });
      return;
    }

    const newAssignedMoney = {
      amount         : form.values.assignedMoneyAmount ?? 0,
      vendorId       : form.values.assignedMoneyVendorId ?? 0,
      paymentMethodId: form.values.assignedMoneyPaymentMethodId ?? 0,
    };

    form.setValues({
      ...form.values,
      // Add the new item
      assignedMoney      : [ ...form.values.assignedMoney, newAssignedMoney ],
      // Wipe out the form fields
      assignedMoneyAmount: 0,
    });

  }

  return (
    <ScrollArea type="auto">
      <Container>
        <Title order={3}>Total Cash</Title>
        <Space h="md" />
        <Group>
          <NumberInput
            label="Seed Money"
            icon={<CurrencyDollar size={18} color="lime" />}
            placeholder="0.00"
            precision={2}
            step={0.05}
            inputMode="decimal"
            min={0}
            {...form.getInputProps('seedMoney')}
          />

          <TextInput label="Total Cash" disabled value={formatMoney(totalCash)} />
        </Group>
      </Container>

      <Space h="xl" />

      <Container>
        <Title order={3}>Shared Expenses</Title>
        <Space h="md" />
        <Stack spacing="xs">
          <Table>
            <thead>
              <tr>
                <th>Expense</th>
                <th>Amount</th>
                <th>Vendor</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {form.values.sharedExpenses && form.values.sharedExpenses.map((expense) => (
                <tr key={expense.name}>
                  <td>{expense.name}</td>
                  <td>
                    <CurrencyDollar size={18} color="lime" />
                    {expense.amount.toFixed(2)}
                  </td>
                  <td>
                    {(vendors && vendors.find((vendor) => vendor.id === expense.vendorId)?.firstName) ?? ''} &nbsp;
                    {(vendors && vendors.find((vendor) => vendor.id === expense.vendorId)?.lastName) ?? ''}
                  </td>
                  <td>{titleCase(expense.shareType)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <TextInput
            label="Expense"
            placeholder="Dinner after..."
            {...form.getInputProps('sharedExpenseName')}
          />
          <NumberInput
            label="Amount"
            icon={<CurrencyDollar size={18} color="lime" />}
            placeholder="0.00"
            precision={2}
            step={0.05}
            inputMode="decimal"
            min={0}
            {...form.getInputProps('sharedExpenseAmount')}
          />
          <NativeSelect
            label="Vendor That Paid"
            data={vendorSelectItems}
            {...form.getInputProps('sharedExpenseVendorId')}
          />
          <NativeSelect
            label="Reimbursement Type"
            data={[{ value: 'equal', label: 'Equal Split' }, { value: 'earnings', label: 'Earnings Split' }]}
            {...form.getInputProps('sharedExpenseShareType')}
          />
          <Button onClick={() => addExpense()}>Add Expense</Button>
        </Stack>
      </Container>

      <Space h="xl" />

      <Container>
        <Title order={3}>Manually Assigned Funds</Title>
        <Space h="md" />
        <Stack spacing="xs">
          <Table>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Money Pool</th>
              </tr>
            </thead>
            <tbody>
              {form.values.assignedMoney && form.values.assignedMoney.map((money, index) => (
                <tr key={index}>
                  <td>
                    {(vendors && vendors.find((vendor) => vendor.id === money.vendorId)?.firstName) ?? ''} &nbsp;
                    {(vendors && vendors.find((vendor) => vendor.id === money.vendorId)?.lastName) ?? ''}
                  </td>
                  <td>
                    <CurrencyDollar size={18} color="lime" />
                    {money.amount}
                  </td>
                  <td>
                    {paymentMethods && paymentMethods.find((method) => method.id === money.paymentMethodId)?.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <NumberInput
            label="Amount"
            icon={<CurrencyDollar size={18} color="lime" />}
            placeholder="0.00"
            precision={2}
            step={0.05}
            inputMode="decimal"
            min={0}
            {...form.getInputProps('assignedMoneyAmount')}
          />
          <NativeSelect
            label="Vendor"
            data={vendorSelectItems}
            {...form.getInputProps('assignedMoneyVendorId')}
          />
          <NativeSelect
            label="Money Pool"
            data={paymentMethodSelectItems}
            {...form.getInputProps('assignedMoneyPaymentMethodId')}
          />
          <Button onClick={() => assignMoney()}>Assign Money</Button>
        </Stack>
      </Container>

      <Space h="xl" />

      <Container>
        <Title order={3}>Payout Plan</Title>
        <Space h="md" />
        <Table>
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Payment Method</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {vendors && vendors.map(vendor => (
              <tr key={vendor.id}>
                <td>{vendor.firstName} {vendor.lastName}</td>
                <td></td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Stack spacing="xs">
          {vendors && vendors.map(vendor => (
            <NumberInput
              key={vendor.id}
              label={`${vendor.firstName} ${vendor.lastName}`}
              icon={<CurrencyDollar size={18} color="lime" />}
              placeholder="0.00"
              precision={2}
              step={0.05}
              inputMode="decimal"
              min={0}
            />
          ))}
        </Stack>
      </Container>
    </ScrollArea>
  );
}


