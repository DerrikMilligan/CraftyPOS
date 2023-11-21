import React from 'react';
import { useMemo } from 'react';
import { type Dinero, add, greaterThan, multiply } from 'dinero.js';

import { ActionIcon, Button, Container, Group, Kbd, Loader, NativeSelect, NumberInput, ScrollArea, Space, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import { useModals } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { CurrencyDollar, X } from 'tabler-icons-react';

import { titleCase } from 'lib/textHelpers';

import { $, formatMoney, moneyToNumber, percentage } from 'lib/dineroHelpers';

import type { IAssignedMoney, ISharedExpense, ShareType } from 'lib/hooks/useAllocations';
import useAllocations from 'lib/hooks/useAllocations';
import useInvoices from '../../lib/hooks/useInvoices';
import usePaymentMethods from '../../lib/hooks/usePaymentMethods';
import useVendors from '../../lib/hooks/useVendors';
import usePaymentTotals from 'lib/hooks/usePaymentTotals';

import ErrorMessage from 'components/ErrorMessage';

export interface IAllocationsForm {
  seedMoney?                   : number;
  assignedMoneyVendorId?       : string;
  assignedMoneyAmount?         : number;
  assignedMoneyPaymentMethodId?: string;
  assignedMoney                : Array<IAssignedMoney>;
  sharedExpenseName            : string;
  sharedExpenseVendorId?       : string;
  sharedExpenseAmount?         : number;
  sharedExpenseShareType?      : ShareType;
  sharedExpenses               : Array<ISharedExpense>;
  includeFeesInAllocations     : boolean;
  includeTaxesInAllocations    : boolean;
}

export default function DivvyingTool() {
  const { invoices, isLoading: invoicesLoading, isError: invoicesError } = useInvoices();
  const { paymentMethods, isLoading: paymentsLoading, isError: paymentsError } = usePaymentMethods();
  const { vendors, isLoading: vendorsLoading, isError: vendorsError } = useVendors();

  const paymentTotals = usePaymentTotals(invoices, paymentMethods);

  const form = useForm<IAllocationsForm>({
    initialValues: {
      sharedExpenseName           : '',
      sharedExpenseVendorId       : '2',
      sharedExpenseShareType      : 'equal',
      assignedMoneyVendorId       : '2',
      assignedMoneyPaymentMethodId: '1',
      assignedMoney               : [],
      sharedExpenses              : [],
      includeFeesInAllocations    : false,
      includeTaxesInAllocations   : false,
    },
  });

  const totalCash = useMemo(() => {
    const cashInfo = paymentTotals.find(total => total && total.paymentMethodName === 'Cash');
    if (cashInfo === undefined) return $(0);
    return add(cashInfo.total, $(form.values.seedMoney ?? 0));
  }, [form, paymentTotals]);

  const allocations = useAllocations(form.values);

  const modals = useModals();

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

  function removeExpense(index: number) {
    form.setValues({
      ...form.values,
      sharedExpenses: form.values.sharedExpenses.filter((_, i) => i !== index),
    });
  }

  function removeAssignedMoney(index: number) {
    form.setValues({
      ...form.values,
      assignedMoney: form.values.assignedMoney.filter((_, i) => i !== index),
    });
  }

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

    const matchingVendor = vendors?.find(vendor => vendor.id === parseInt(form.values.sharedExpenseVendorId ?? ''));
    if (matchingVendor === undefined) {
      showNotification({ color: 'red', message: 'Please select a vendor... Sorry if this is weird' });
      return;
    }

    const newExpense = {
      name     : form.values.sharedExpenseName,
      vendorId : parseInt(form.values.sharedExpenseVendorId),
      amount   : form.values.sharedExpenseAmount,
      shareType: form.values.sharedExpenseShareType,
    } as ISharedExpense;

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

    const matchingVendor = vendors?.find(vendor => vendor.id === parseInt(form.values.assignedMoneyVendorId ?? ''));
    if (matchingVendor === undefined) {
      showNotification({ color: 'red', message: 'Please select a vendor... Sorry if this is weird' });
      return;
    }

    const matchingPaymentMethod = paymentMethods?.find(method => method.id === parseInt(form.values.assignedMoneyPaymentMethodId ?? ''));
    if (matchingPaymentMethod === undefined) {
      showNotification({ color: 'red', message: 'Please select a payment method... Sorry if this is weird' });
      return;
    }

    const newAssignedMoney = {
      amount         : form.values.assignedMoneyAmount ?? 0,
      vendorId       : parseInt(form.values.assignedMoneyVendorId),
      paymentMethodId: parseInt(form.values.assignedMoneyPaymentMethodId),
    } as IAssignedMoney;

    form.setValues({
      ...form.values,
      // Add the new item
      assignedMoney: [ ...form.values.assignedMoney, newAssignedMoney ],
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {form.values.sharedExpenses && form.values.sharedExpenses.map((expense, index) => (
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
                  <td>
                    <ActionIcon
                      color="red"
                      onClick={() => modals.openConfirmModal({
                        title: 'Remove Expense',
                        centered: true,
                        children: (<Text size="sm">Are you sure you want to remove <Kbd>{expense.name}</Kbd>?</Text>),
                        labels: { confirm: 'Remove Expense', cancel: 'Cancel' },
                        confirmProps: { color: 'red' },
                        onConfirm: () => removeExpense(index),
                      })}
                    >
                      <X size="20"/>
                    </ActionIcon>
                  </td>
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {form.values.assignedMoney && form.values.assignedMoney.map((money, index) => {
                const vendor = vendors?.find((vendor) => vendor.id === money.vendorId);
                if (vendor === undefined) return null;
                return (
                  <tr key={index}>
                    <td>{vendor.firstName} {vendor.lastName}</td>
                    <td>
                      <CurrencyDollar size={18} color="lime" />
                      {money.amount}
                    </td>
                    <td>
                      {paymentMethods && paymentMethods.find((method) => method.id === money.paymentMethodId)?.name}
                    </td>
                    <td>
                      <ActionIcon
                        color="red"
                        onClick={() => modals.openConfirmModal({
                          title: 'Remove Assigned Money',
                          centered: true,
                          children: (<Text size="sm">Are you sure you want to remove <Kbd>{money.amount}</Kbd> from <Kbd>{vendor.firstName} {vendor.lastName}</Kbd>?</Text>),
                          labels: { confirm: 'Remove Assignment', cancel: 'Cancel' },
                          confirmProps: { color: 'red' },
                          onConfirm: () => removeAssignedMoney(index),
                        })}
                      >
                        <X size="20"/>
                      </ActionIcon>
                    </td>
                  </tr>
                );
              })}
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
        <Title order={3}>Reimbursements</Title>
        <Space h="md" />
        <Table>
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Amount</th>
              <th>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            {allocations && Object.entries(allocations.reimbursements).map(([vendorId, reimbursements]) => {
              const vendor = vendors?.find(vendor => vendor.id === parseInt(vendorId));

              if (!vendor) return null;

              return (
                <React.Fragment key={vendorId}>
                  <tr>
                    <td colSpan={3}>{vendor.firstName} {vendor.lastName}</td>
                  </tr>
                  <tr>
                    <td></td>
                    <td>
                      <CurrencyDollar size={18} color="lime" />
                      {formatMoney(allocations.payoutPlan[parseInt(vendorId)].initialExpectedSubTotal, true)}
                    </td>
                    <td>Vendor Sub-total</td>
                  </tr>
                  {reimbursements.map((allocation, index) => {
                    return (
                      <tr key={index} style={{ color: greaterThan(allocation.amount, $(0)) ? 'lime' : 'red' }}>
                        <td></td>
                        <td>
                          <CurrencyDollar size={18} color="lime" />
                          {formatMoney(allocation.amount, true)}
                        </td>
                        {/* <td>{titleCase(allocation.type)}</td> */}
                        <td>
                          {greaterThan(allocation.amount, $(0)) && (paymentMethods?.find(method => method.id === allocation.paymentMethodId)?.name || '')}
                          {allocation.type === 'expense'
                            ? ` ${greaterThan(allocation.amount, $(0)) ? 'Reimbursement' : 'Reimbursing'} (${allocation.description ?? ''})`
                            : ''}
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td align="right">Totals:</td>
                    <td>
                      <CurrencyDollar size={18} color="lime" />
                      {formatMoney(add(
                        allocations.payoutPlan[parseInt(vendorId)].initialExpectedSubTotal,
                        reimbursements.reduce((acc, allocation) => { return add(acc, allocation.amount)}, $(0))
                      ), true)}
                    </td>
                    <td></td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </Table>
      </Container>

      <Space h="xl" />

      <Container>
        <Title order={3}>Payout Plan</Title>
        <Space h="md" />
        <Table>
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Amount</th>
              <th>Allocation Type</th>
              <th>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            {allocations && Object.entries(allocations.payoutPlan).map(([vendorId, allocationInfo]) => {
              const vendor = vendors?.find(vendor => vendor.id === parseInt(vendorId));

              if (!vendor) return null;

              return (
                <React.Fragment key={vendorId}>
                  <tr>
                    <td colSpan={4}>{vendor.firstName} {vendor.lastName}</td>
                  </tr>
                  {allocationInfo.allocations.map((allocation, index) => {
                    return (
                      <tr key={index} style={{ color: greaterThan(allocation.amount, $(0)) ? 'lime' : 'red' }}>
                        <td></td>
                        <td>
                          <CurrencyDollar size={18} color="lime" />
                          {formatMoney(allocation.amount, true)}
                        </td>
                        <td>{titleCase(allocation.type)}</td>
                        <td>
                          {greaterThan(allocation.amount, $(0)) && (paymentMethods?.find(method => method.id === allocation.paymentMethodId)?.name || '')}
                          {allocation.type === 'expense'
                            ? ` ${greaterThan(allocation.amount, $(0)) ? 'Reimbursement' : 'Reimbursing'} (${allocation.description ?? ''})`
                            : ''}
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td align="right">Totals:</td>
                    <td>
                      <CurrencyDollar size={18} color="lime" />
                      {allocationInfo.allocations.reduce((acc, allocation) => { return acc + moneyToNumber(allocation.amount)}, 0)}
                    </td>
                    <td></td>
                    <td></td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </Table>
      </Container>
    </ScrollArea>
  );
}


