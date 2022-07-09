import { useState } from 'react';
import type { NextPage } from 'next'

import { CurrencyDollar, Search, X } from 'tabler-icons-react';
import {
  ActionIcon,
  Autocomplete,
  AutocompleteItem as AutocompleteItemMantine, Badge,
  Button,
  Card, Container,
  Group, Kbd,
  Loader,
  Modal, NumberInput, ScrollArea, Space,
  Table, Text,
  Title,
} from '@mantine/core';
import { useModals } from '@mantine/modals';

import Scanner from 'components/Scanner';
import { AutocompleteItem, AutocompleteItemProps } from 'components/AutocompleteItem';
import {
  Customer,
  Invoice as pInvoice,
  Item as pItem,
  Tag,
  Transaction as pTransaction,
  Vendor,
} from '@prisma/client';

import useItems from '../lib/hooks/useItems';
import { filterItems } from 'lib/filterItems';

type Item        = pItem        & { Tags: Tag[], Vendor: Vendor };
type Transaction = pTransaction & { Item: Item };
type Invoice     = pInvoice     & { Customer: Customer, Transactions: Transaction[] };

const Checkout: NextPage = () => {
  const [ itemFilter, setItemFilter ] = useState('');
  const [ scanning, setScanning ] = useState(false);
  const [ scannedData, setScannedData ] = useState('');
  const [ transactions, setTransactions ] = useState([] as Transaction[]);
  
  const modals = useModals();

  // Get the items
  const { items, isLoading, isError } = useItems('all');
  
  // const invoice = {
  //   Transactions: [] as Transaction[],
  // } as Invoice;

  // Handle the loading and error states
  if (isLoading) return (
    <Group position="center" mt={75}>
      <Loader color="green" size="lg" />
    </Group>
  );
  if (isError) return <div>Error! {isError}...</div>

  // Make the list of items for the autocomplete to use
  const autocompleteItems = items
    // Make sure any items we've added aren't part of the search list anymore
    ?.filter(item => transactions.find(t => t.itemId === item.id) === undefined)
    // Map them to the autocomplete type
    ?.map(item => {
      return {
        value: item.name,
        key: item.id,
        item
      } as AutocompleteItemProps;
    }) || [];
  
  const addItemToInvoice = (autocompleteItem: AutocompleteItemProps) => {
    setItemFilter('');
    
    setTransactions([
      ...transactions,
      {
        id: 0,
        invoiceId: 0,
        itemId: autocompleteItem.item.id,
        itemQuantity: 1,
        pricePer: autocompleteItem.item.price,
        Item: autocompleteItem.item,
      }
    ]);
    
    console.log(transactions);
  };
  
  return (
    <>
      <Modal
        opened={scanning}
        onClose={() => setScanning(false)}
        title="Scanning Barcode"
        centered
        size="xl"
      >
        <Scanner scanning={scanning} onScanned={(text) => { setScannedData(text); setScanning(false); }}></Scanner>
      </Modal>

      <Container p={0}>
        <Card p="lg">
          <Group>
            <Title>Create Invoice</Title>
          </Group>
          
          <Space h="md" />
          
          <Group position="apart">
            <Button onClick={() => setScanning(true)}>Scan Item</Button>
            <div>Scanned Data: { scannedData }</div>
          </Group>
          
          <Space h="md" />
          
          <Group grow>
            <Autocomplete
              // List of items
              data={autocompleteItems as AutocompleteItemMantine[]}
              // Maintain our own state because we need to be able to reset it when we want
              value={itemFilter}
              onChange={(value) => setItemFilter(value)}
              // @ts-ignore Don't worry about the type mismatch here. It's actually correct
              onItemSubmit={addItemToInvoice}
              // @ts-ignore Don't worry about the type mismatch here. It's actually correct
              filter={filterItems}
              itemComponent={AutocompleteItem}
              placeholder="Search for items..."
              icon={<Search size={16} />}
              limit={10}
              initiallyOpened
            />
          </Group>
          
          <Space h="md" />

          <ScrollArea type="auto">
            <Table fontSize="xs" horizontalSpacing="xs" verticalSpacing="xs" striped={true} highlightOnHover>
              <thead>
              <tr>
                <th style={{ width: '10px' }}></th>
                <th style={{ width: '50px' }}>Quant</th>
                <th style={{ minWidth: '100px' }}>Price</th>
                <th style={{ width: '300px;'}}>Item</th>
                <th align="right" style={{ minWidth: '100px' }}>Total</th>
              </tr>
              </thead>
              <tbody>
              {
                transactions &&
                transactions.length > 0 &&
                transactions.map((transaction) => (
                  <tr key={transaction.Item.id}>
                    <td style={{ padding: 0 }}>
                      <ActionIcon
                        size={14}
                        color="red"
                        onClick={() => modals.openConfirmModal({
                          title: 'Remove Item',
                          centered: true,
                          children: (
                            <Text size="sm">
                              Are you sure you want to remove <Kbd>{transaction.Item.name}</Kbd> from the invoice?
                            </Text>
                          ),
                          labels: { confirm: 'Remove Item', cancel: 'Cancel' },
                          confirmProps: { color: 'red' },
                          onConfirm: () => setTransactions([ ...transactions.filter(t => t.itemId !== transaction.itemId) ]),
                        })}
                      >
                        <X size="20"/>
                      </ActionIcon>
                    </td>

                    <td>
                      <Group spacing={1} position="center">
                        <NumberInput
                          hideControls
                          size="xs"
                          value={transaction.itemQuantity}
                          onChange={(val) => setTransactions([ ...transactions.filter(t => t.itemId !== transaction.itemId), { ...transaction, itemQuantity: val || 0 }])}
                          min={0}
                          styles={{ input: { textAlign: 'center' } }}
                          // styles={{ input: { width: '30px', padding: 0, textAlign: 'center' } }}
                        />
                      </Group>
                    </td>

                    <td>
                      <NumberInput
                        hideControls
                        value={transaction.pricePer}
                        onChange={(val) => setTransactions([ ...transactions.filter(t => t.itemId !== transaction.itemId), { ...transaction, pricePer: val || 0 }])}
                        size="xs"
                        iconWidth={20}
                        icon={<CurrencyDollar size={12} color="lime" />}
                        precision={2}
                        min={0}
                        styles={{ input: { padding: 2 } }}
                      />
                    </td>
                    
                    <td style={{ minWidth: 100 }}>
                      { transaction.Item.name }
                      <Group spacing={2}>
                        {
                          transaction.Item.Tags &&
                          transaction.Item.Tags.length > 0 &&
                          transaction.Item.Tags.map((tag) => (
                            <Badge size="xs" color="green">{tag.name}</Badge>
                          ))
                        }
                      </Group>
                    </td>

                    <td>
                      <CurrencyDollar size={12} color="lime" />
                      {(Math.round(transaction.pricePer * transaction.itemQuantity * 100) / 100).toFixed(2)}
                    </td>
                  </tr>
                ))
              }

              <tr style={{ lineHeight: 0.2 }}>
                <td colSpan={5}>&nbsp;</td>
              </tr>
              <tr style={{ lineHeight: 0.5 }}>
                <td colSpan={4} align="right">Sub Total:</td>
                <td>
                  <CurrencyDollar size={12} color="lime" />
                  {
                    transactions.reduce((total, transaction) => {
                      return total + (Math.round(transaction.pricePer * transaction.itemQuantity * 100) / 100);
                    }, 0)
                  }
                </td>
              </tr>
              <tr style={{ lineHeight: 0.5 }}>
                <td colSpan={4} align="right">Tax:</td>
                <td>
                  <CurrencyDollar size={12} color="lime" />
                  1230.00
                </td>
              </tr>
              <tr style={{ lineHeight: 0.5 }}>
                <td colSpan={4} align="right">Fees:</td>
                <td>
                  <CurrencyDollar size={12} color="lime" />
                  1230.00
                </td>
              </tr>
              <tr style={{ lineHeight: 0.5 }}>
                <td colSpan={4} align="right">Total:</td>
                <td>
                  <CurrencyDollar size={12} color="lime" />
                  1230.00
                </td>
              </tr>
              </tbody>
            </Table>
          </ScrollArea>

          <Space h="md" />

          <Group position="right">
            <Button color="red">Clear Invoice</Button>
            <Button>Submit Invoice</Button>
          </Group>
        </Card>
      </Container>
    </>
  );
}

export default Checkout;
