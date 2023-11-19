import React from 'react';

import { Badge, Button, Group, Space, Table, Text, Title } from '@mantine/core';
import { useModals } from '@mantine/modals';
import { CurrencyDollar } from 'tabler-icons-react';

import UseItems from '../../lib/hooks/useItems';
import UseInvoices from '../../lib/hooks/useInvoices';

export default function InventoryStock() {
  const { items } = UseItems('all');
  const { invoices, deleteInvoice } = UseInvoices();

  const modals = useModals();

  const formatDate = (d: Date) => d.toLocaleDateString() + ' ' + d.toLocaleTimeString('en-US', { timeStyle: 'short' });

  return (
    <>
      <Title order={3}>Invoice History</Title>

      <Space h="md" />

      <Table>
        <thead>
        <tr>
          <th>Sold At</th>
          <th>Number Sold</th>
          <th>Item Name</th>
          <th>Earnings</th>
        </tr>
        </thead>
        <tbody>
        {
          invoices &&
          invoices.map(invoice => (
            <React.Fragment key={invoice.id}>
              <tr>
                <td colSpan={4}>{formatDate(new Date(invoice.timestamp))}</td>
              </tr>
              {
                invoice.Transactions &&
                invoice.Transactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td></td>
                    <td>
                      {transaction.itemQuantity}
                      &nbsp;x <CurrencyDollar size={12} color="lime" />
                      {transaction.pricePer.toFixed(2)}
                    </td>
                    <td>
                      <Group spacing="xs">
                        <div>{items && items.find(item => item.id === transaction.itemId)?.name}</div>
                        {

                          items &&
                          [ ...(items.find(item => item.id === transaction.itemId)?.Tags ?? []) ]
                            .sort((a, b) => {
                              if (a.name < b.name) return -1;
                              if (a.name > b.name) return 1;
                              return 0;
                            })
                            .map((tag) => {
                              return (
                                <div key={tag.id}>
                                  <Badge color="green" size="xs">
                                    {tag.name}
                                  </Badge>
                                </div>
                              )
                            })
                        }
                      </Group>
                    </td>
                    <td>
                      <CurrencyDollar size={12} color="lime" />
                      {(transaction.itemQuantity * transaction.pricePer).toFixed(2)}
                    </td>
                  </tr>
                ))
              }
              <tr>
                <td>
                  <Button
                    color="red"
                    variant="outline"
                    size="xs"
                    onClick={() => modals.openConfirmModal({
                      title: 'Remove Item',
                      centered: true,
                      children: (
                        <Text size="sm">Are you sure you want to delete this invoice?</Text>
                      ),
                      labels: { confirm: 'Remove Invoice', cancel: 'Cancel' },
                      confirmProps: { color: 'red' },
                      onConfirm: () => deleteInvoice(invoice),
                    })}
                  >
                    Delete Transaction
                  </Button>
                </td>
                <td colSpan={2} align='right'>
                  <div>Taxes:</div>
                  <div>Fees:</div>
                  <div>Total:</div>
                </td>
                <td>
                  <div>
                    <CurrencyDollar size={12} color="lime" />
                    {invoice.salesTax.toFixed(2)}
                  </div>
                  <div>
                    <CurrencyDollar size={12} color="lime" />
                    {invoice.processingFees.toFixed(2)}
                  </div>
                  <div>
                    <CurrencyDollar size={12} color="lime" />
                    {invoice.total.toFixed(2)}
                  </div>
                </td>
              </tr>
              <tr style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', lineHeight: 2 }}>
                <td>&nbsp;</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </React.Fragment>
          ))
        }
        </tbody>
      </Table>
    </>
  );
}
