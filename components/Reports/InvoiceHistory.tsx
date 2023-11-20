import React from 'react';

import { Badge, Button, Group, Loader, ScrollArea, Space, Table, Text, Title, useMantineColorScheme, useMantineTheme } from '@mantine/core';
import { useModals } from '@mantine/modals';
import { CurrencyDollar } from 'tabler-icons-react';

import UseItems from '../../lib/hooks/useItems';
import UseInvoices from '../../lib/hooks/useInvoices';
import ErrorMessage from 'components/ErrorMessage';

export default function InventoryStock() {
  const { items, isLoading: itemsLoading, isError: itemsError } = UseItems('all');
  const { invoices, deleteInvoice, isLoading: invoicesLoading, isError: invoicesError } = UseInvoices();

  const { colorScheme } = useMantineColorScheme();
  const theme           = useMantineTheme();

  const modals = useModals();

  if (itemsError || invoicesError) return (
    <ErrorMessage message={itemsError || invoicesError}></ErrorMessage>
  );

  // Handle the loading and error states
  if (itemsLoading || invoicesLoading) return (
    <Group position="center" mt={75}>
      <Loader color="green" size="lg" />
    </Group>
  );

  const alternateRowColor = colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[3];

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
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {transaction.itemQuantity}
                        &nbsp;x
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
                      <td style={{ whiteSpace: 'nowrap' }}>
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
                  <td style={{ whiteSpace: 'nowrap' }}>
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
