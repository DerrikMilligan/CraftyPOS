import { useMemo, useState } from 'react';
import type { NextPage } from 'next'
import produce from "immer"

import { CurrencyDollar, Search, X } from 'tabler-icons-react';
import {
  ActionIcon,
  Autocomplete,
  AutocompleteItem as AutocompleteItemMantine,
  Badge,
  Button,
  Card, Container,
  Group, Kbd,
  Loader,
  Modal,
  NativeSelect,
  NumberInput,
  ScrollArea,
  Space,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useModals } from '@mantine/modals';

import {
  Customer,
  Invoice as pInvoice,
  Item as pItem,
  Tag,
  Transaction as pTransaction,
  Vendor,
} from '@prisma/client';

import { USD } from '@dinero.js/currencies';
import { dinero, add, multiply, subtract, toFormat, Dinero } from 'dinero.js';

import Scanner from 'components/Scanner';
import { AutocompleteItem, AutocompleteItemProps } from 'components/AutocompleteItem';
import { filterItems } from 'lib/filterItems';
import useItems from '../lib/hooks/useItems';
import usePaymentMethods from '../lib/hooks/usePaymentMethods';
import useConfig from '../lib/hooks/useConfig';

type Item        = pItem        & { Tags: Tag[], Vendor: Vendor };
type Transaction = pTransaction & { Item: Item };
type Invoice     = pInvoice     & { Customer: Customer, Transactions: Transaction[] };

const $ = (amount: number) => dinero({ amount: amount * 100, currency: USD });
const formatMoney = (d: Dinero<number>) => toFormat(d, ({ amount }) => amount.toFixed(2));

const Checkout: NextPage = () => {
  const modals = useModals();
  
  // Register the various states we have
  const [ itemFilter, setItemFilter ] = useState('');
  const [ scanning, setScanning ] = useState(false);
  const [ scannedData, setScannedData ] = useState('');
  const [ transactions, setTransactions ] = useState([] as Transaction[]);
  const [ paymentMethodName, setPaymentMethodName ] = useState('Card');
  const [ cashAmount, setCashAmount ] = useState(0);
  
  // Get the config and payment methods
  // These should be cached indefinitely after the first time they're loaded
  const { paymentMethods, isError: paymentIsError, isLoading: paymentIsLoading } = usePaymentMethods();
  const { config, isError: configIsError, isLoading: configIsLoading } = useConfig();
  
  // Get the items
  const { items, isLoading, isError } = useItems('all');
  
  // Make the list of items for the autocomplete to use
  const autocompleteItems = useMemo(() => items
    // Make sure any items we've added aren't part of the search list anymore
    ?.filter(item => transactions.find(t => t.itemId === item.id) === undefined)
    // Map them to the autocomplete type
    ?.map(item => {
      return {
        value: item.name,
        key: item.id,
        item
      } as AutocompleteItemProps;
    }) || [], [ items, transactions ]);
  
  const paymentMethod = useMemo(() => paymentMethods?.find(method => method.name === paymentMethodName), [ paymentMethods, paymentMethodName ]);
  
  const subTotal = useMemo(() => {
    return transactions.reduce((money, transaction) => {
      return add(money, multiply($(transaction.pricePer), transaction.itemQuantity));
    }, $(0));
  }, [ transactions ]);
  
  const salesTax = useMemo(() => {
    // Weird way of doing percentages https://v2.dinerojs.com/docs/faq/how-do-i-calculate-a-percentage
    return multiply(subTotal, { amount: config?.salesTaxRate ?? 0, scale: 2 } );
  }, [ subTotal ]);
  
  const processingFees = useMemo(() => {
    // Again we have to scale by 100% for the correct number here
    const flatFee    = $(paymentMethod?.flatFee ?? 0);
    const percentFee = { amount: paymentMethod?.percentFee ?? 0, scale: 2 };
    
    return add(flatFee, multiply(subTotal, percentFee));
  }, [ subTotal, paymentMethod ]);
  
  const total = useMemo(() => {
    return add(subTotal, add(salesTax, processingFees));
  }, [ subTotal, salesTax, processingFees ]);
  
  
  // Handle the loading and error states
  if (isLoading || paymentIsLoading || configIsLoading) return (
    <Group position="center" mt={75}>
      <Loader color="green" size="lg" />
    </Group>
  );
  if (isError || paymentIsError || configIsError) return <div>Error! {isError}...</div>

  /**
   * Add an item from the autocomplete component to the invoice transactions
   * 
   * @param autocompleteItem
   */
  const addItemToInvoice = (autocompleteItem: AutocompleteItemProps) => {
    // Wipe out the search filter
    setItemFilter('');
    
    // Add 
    setTransactions(
      produce(draft => {
        draft.push({
          id: 0,
          invoiceId: 0,
          itemId: autocompleteItem.item.id,
          itemQuantity: 1,
          pricePer: autocompleteItem.item.price,
          Item: autocompleteItem.item,
        });
      })
    );
  };
  
  /**
   * Allows for updating a transaction field dynamically using the immer produce which
   * will modify the list in place
   * 
   * @param itemId
   * @param field
   * @param value
   */
  const updateTransaction = (itemId: number, field: keyof Transaction, value: any) => {
    setTransactions(
      produce(draft => {
        const transaction = draft.find(t => t.itemId === itemId);
        if (transaction !== undefined && value !== undefined)
          transaction[field] = value;
      })
    );
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
              // initiallyOpened
            />
          </Group>
          
          <Space h="md" />

          <ScrollArea type="auto">
            <Table fontSize="xs" horizontalSpacing="xs" verticalSpacing="xs" striped={true} highlightOnHover>
              <thead>
              <tr>
                <th style={{ width: '10px' }}></th>
                <th style={{ width: '50px' }}>Quant</th>
                <th style={{ width: '100px', minWidth: '90px' }}>Price</th>
                <th style={{ minWidth: '300px'}}>Item</th>
                <th align="right" style={{ width: '100px' }}>Total</th>
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
                        tabIndex={-1}
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
                          variant="filled"
                          hideControls
                          size="xs"
                          value={transaction.itemQuantity}
                          onChange={(val) => updateTransaction(transaction.Item.id, 'itemQuantity', val)}
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
                        onChange={(val) => updateTransaction(transaction.Item.id, 'pricePer', val)}
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
                            <Badge key={tag.id} size="xs" color="green">{tag.name}</Badge>
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
                  {formatMoney(subTotal)}
                </td>
              </tr>
              <tr style={{ lineHeight: 0.5 }}>
                <td colSpan={4} align="right">Tax:</td>
                <td>
                  <CurrencyDollar size={12} color="lime" />
                  {formatMoney(salesTax)}
                </td>
              </tr>
              <tr style={{ lineHeight: 0.5 }}>
                <td colSpan={4} align="right">Fees:</td>
                <td>
                  <CurrencyDollar size={12} color="lime" />
                  {formatMoney(processingFees)}
                </td>
              </tr>
              <tr style={{ lineHeight: 0.5 }}>
                <td colSpan={4} align="right">Total:</td>
                <td>
                  <CurrencyDollar size={12} color="lime" />
                  {formatMoney(total)}
                </td>
              </tr>
              </tbody>
            </Table>
          </ScrollArea>
          
          <Space h="md" />
          
          <Group position="right" align="center">
            <NativeSelect
              label="Payment Method"
              size="xs"
              data={paymentMethods?.map(method => method.name) || []}
              value={paymentMethodName}
              onChange={(event) => setPaymentMethodName(event.target.value)}
            ></NativeSelect>

          {
            paymentMethodName === 'Cash' &&
            (
              <>
                <NumberInput
                  label="Cash Given"
                  size="xs"
                  iconWidth={20}
                  icon={<CurrencyDollar size={12} color="lime" />}
                  min={0}
                  precision={2}
                  value={cashAmount}
                  onChange={val => setCashAmount(val || 0)}
                ></NumberInput>
                <Stack>
                  <Text size="xs">Change:</Text>
                  <Group>
                    <CurrencyDollar size={12} color="lime" />
                    <Text size="xs">{formatMoney(subtract($(cashAmount), total))}</Text>
                  </Group>
                </Stack>
              </>
            )
          }
          
          </Group>

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
