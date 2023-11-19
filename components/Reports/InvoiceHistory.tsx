import React from 'react';

import { Badge, Button, Group, ScrollArea, Space, Table, Text, Title, useMantineColorScheme, useMantineTheme } from '@mantine/core';
import { useModals } from '@mantine/modals';
import { CurrencyDollar } from 'tabler-icons-react';

import UseItems from '../../lib/hooks/useItems';
import UseInvoices from '../../lib/hooks/useInvoices';
import { useMediaQuery } from '@mantine/hooks';

export default function InventoryStock() {
  const { items } = UseItems('all');
  const { invoices, deleteInvoice } = UseInvoices();
  const { colorScheme } = useMantineColorScheme();

  const isMobile = useMediaQuery('(max-width: 800px)');

  const theme = useMantineTheme();

  const alternateRowColor = colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[3];

  const modals = useModals();

  function formatDate(d: Date) {
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString('en-US', { timeStyle: 'short' })}`;
  };

  return (
    <>
      <Title order={3}>Invoice History</Title>

      <Space h="md" />

      <ScrollArea type="auto">
        <Table>
          <tbody>
          {
            invoices &&
            invoices.map((invoice, index) => (
              <React.Fragment key={invoice.id}>
                <tr style={{ backgroundColor: index % 2 === 0 ? alternateRowColor : '' }}>
                  <td colSpan={4}>{formatDate(new Date(invoice.timestamp))}</td>
                </tr>
                {
                  invoice.Transactions &&
                  invoice.Transactions.map(transaction => (
                    <tr key={transaction.id} style={{ backgroundColor: index % 2 === 0 ? alternateRowColor : '' }}>
                      <td>
                        {transaction.itemQuantity}
                        &nbsp;x
                        {isMobile ? <br /> : ' '}
                        <CurrencyDollar size={12} color="lime" />
                        {transaction.pricePer.toFixed(2)}
                      </td>
                      <td colSpan={2}>
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
                <tr style={{ backgroundColor: index % 2 === 0 ? alternateRowColor : '' }}>
                  <td colSpan={2}>
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
                      Delete
                    </Button>
                  </td>
                  <td align='right'>
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
              </React.Fragment>
            ))
          }
          </tbody>
        </Table>
      </ScrollArea>
    </>
  );
}
