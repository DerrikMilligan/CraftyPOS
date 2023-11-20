import React from 'react';
import { useMemo, useState } from 'react';
import { type Dinero, add } from 'dinero.js';

import { Button, Container, Group, Loader, NativeSelect, NumberInput, ScrollArea, Space, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { CurrencyDollar } from 'tabler-icons-react';

import { titleCase } from 'lib/textHelpers';

import { $, percentage } from 'lib/dineroHelpers';

import UseInvoices from '../../lib/hooks/useInvoices';
import UsePaymentMethods from '../../lib/hooks/usePaymentMethods';
import UseVendors from '../../lib/hooks/useVendors';

import ErrorMessage from 'components/ErrorMessage';

type ShareType = 'equal' | 'earnings';

interface IForm {
  seedMoney?                 : number;
  assignedMoneyVendor?       : string;
  assignedMoneyAmount?       : number;
  assignedMoneyPaymentMethod?: string;
  assignedMoney: Array<{
    vendor       : string;
    amount       : number;
    paymentMethod: string;
  }>;
  sharedExpenseName      : string;
  sharedExpenseVendor?   : string;
  sharedExpenseAmount?   : number;
  sharedExpenseShareType?: ShareType;
  sharedExpenses: Array<{
    name     : string;
    vendor   : number;
    amount   : number;
    shareType: ShareType;
  }>;
}

export default function DivvyingTool() {
  const { invoices, isLoading: invoicesLoading, isError: invoicesError } = UseInvoices();
  const { paymentMethods, isLoading: paymentsLoading, isError: paymentsError } = UsePaymentMethods();
  const { vendors, isLoading: vendorsLoading, isError: vendorsError } = UseVendors();

  const [ seedMoney, setSeedMoney ] = useState<number>();

  // NOTE: Some reimbursements are going to be based upon how much money each person mande
  //       and not percentage based just for each vendor because some vendors made a lot more
  //       money than others and we want to be fair to everyone.
  //
  // Equal Split
  // Earnings Split

  const paymentTotals = useMemo(() => (paymentMethods && paymentMethods
    .reduce((acc, paymentMethod) => {
      if (acc[paymentMethod.name] === undefined) acc[paymentMethod.name] = 0;
      acc[paymentMethod.name] += invoices?.reduce((acc, invoice) =>
        acc + (invoice.paymentMethodId === paymentMethod.id ? invoice.total : 0)
      , 0) ?? 0;

      return acc;
    },
    {} as Record<string, number>)) || {},
    [invoices, paymentMethods]
  );

  const totalCash = useMemo(() => (paymentTotals['Cash'] ?? 0) + (seedMoney ?? 0), [paymentTotals, seedMoney]);

  const form = useForm<IForm>({
    initialValues: {
      sharedExpenseName         : '',
      sharedExpenseVendor       : '2',
      sharedExpenseShareType    : 'equal',
      assignedMoneyVendor       : '2',
      assignedMoneyPaymentMethod: '1',
      assignedMoney             : [],
      sharedExpenses            : [],
    },
  });

  const expenseMap = useMemo(() => {
    return form.values.sharedExpenses.reduce((acc, expense) => {
      const expenseAmount = $(expense.amount);
      if (expense.shareType === 'equal') {
        const shareRatio = 1 / (vendors?.length ?? 0);
        vendors
          // Don't charge the vendor who paid initially
          ?.filter(vendor => vendor.id !== expense.vendor)
          .forEach(vendor => {
            if (acc[vendor.id] === undefined) acc[vendor.id] = $(0);
            acc[vendor.id] = add(acc[vendor.id], percentage(expenseAmount, shareRatio));
          });
      }
      if (acc[expense.vendor] === undefined)
        acc[expense.vendor] = 0;

      acc[expense.vendor] += expense.amount;

      return acc;
    }, {} as Record<number, Dinero<number>>);
  }, [form, vendors]);

  const divviedMoney = useMemo(() => {
    return '';
  }, [form]);

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
      form.values.sharedExpenseVendor === undefined ||
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
      vendor   : parseInt(form.values.sharedExpenseVendor),
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
      form.values.assignedMoneyVendor === undefined ||
      form.values.assignedMoneyPaymentMethod === undefined
    ) {
      showNotification({ color: 'red', message: 'Please set an amount, select a vendor, and a payment method' });
      return;
    }

    const matchingVendor = vendors?.find(vendor => vendor.id === parseInt(form.values.assignedMoneyVendor ?? ''));
    if (matchingVendor === undefined) {
      showNotification({ color: 'red', message: 'Please select a vendor... Sorry if this is weird' });
      return;
    }

    const matchingPaymentMethod = paymentMethods?.find(method => method.id === parseInt(form.values.assignedMoneyPaymentMethod ?? ''));
    if (matchingPaymentMethod === undefined) {
      showNotification({ color: 'red', message: 'Please select a payment method... Sorry if this is weird' });
      return;
    }

    const newAssignedMoney = {
      amount       : form.values.assignedMoneyAmount ?? 0,
      vendor       : form.values.assignedMoneyVendor ?? '0',
      paymentMethod: form.values.assignedMoneyPaymentMethod ?? '0',
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

          <NumberInput label="Total Cash" disabled value={totalCash} precision={2} />
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
                    {(vendors && vendors.find((vendor) => vendor.id === expense.vendor)?.firstName) ?? ''} &nbsp;
                    {(vendors && vendors.find((vendor) => vendor.id === expense.vendor)?.lastName) ?? ''}
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
            {...form.getInputProps('sharedExpenseVendor')}
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
                    {(vendors && vendors.find((vendor) => vendor.id === parseInt(money.vendor))?.firstName) ?? ''} &nbsp;
                    {(vendors && vendors.find((vendor) => vendor.id === parseInt(money.vendor))?.lastName) ?? ''}
                  </td>
                  <td>
                    <CurrencyDollar size={18} color="lime" />
                    {money.amount}
                  </td>
                  <td>
                    {paymentMethods && paymentMethods.find((method) => method.id === parseInt(money.paymentMethod))?.name}
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
            {...form.getInputProps('assignedMoneyVendor')}
          />
          <NativeSelect
            label="Money Pool"
            data={paymentMethodSelectItems}
            {...form.getInputProps('assignedMoneyPaymentMethod')}
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


