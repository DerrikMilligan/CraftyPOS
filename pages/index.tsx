import { useMemo, useState } from 'react';
import type { NextPage } from 'next'
import { signIn, useSession } from 'next-auth/react';
import produce from 'immer';

import { CurrencyDollar, Search, X } from 'tabler-icons-react';
import {
  ActionIcon,
  Autocomplete,
  AutocompleteItem as AutocompleteItemMantine,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Kbd,
  Loader,
  Modal,
  NativeSelect,
  NumberInput,
  ScrollArea,
  Space,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useModals } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';

import {
  $,
  calculateProcessingFees,
  calculateSalesTax,
  calculateSubTotal,
  calculateTotal,
  formatMoney,
  moneyToNumber,
  numberHasDecimal,
  subtract
} from '../lib/dineroHelpers';

import Scanner from 'components/Scanner';
import { AutocompleteItem, AutocompleteItemProps } from 'components/AutocompleteItem';
import ErrorMessage from 'components/ErrorMessage';
import { filterItems } from 'lib/filterItems';
import useItems from '../lib/hooks/useItems';
import usePaymentMethods from '../lib/hooks/usePaymentMethods';
import useConfig from '../lib/hooks/useConfig';

import type { Transaction, Invoice } from '../lib/db';

const Checkout: NextPage = () => {
  const modals = useModals();

  const { data: authData, status: authStatus } = useSession();

  // @ts-ignore This is an extra property that DOES exist
  const isAdmin = authData?.user?.role === 'ADMIN';

  // Register the various states we have
  const [ itemFilter, setItemFilter ] = useState('');
  const [ scanning, setScanning ] = useState(false);
  const [ transactions, setTransactions ] = useState([] as Transaction[]);
  const [ paymentMethodName, setPaymentMethodName ] = useState('Card');
  const [ cashAmount, setCashAmount ] = useState(0);
  const [ checkNumber, setCheckNumber ] = useState('');

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
        key  : item.id,
        item
      } as AutocompleteItemProps;
    }) || [], [ items, transactions ]);

  const paymentMethod = useMemo(() => (Array.isArray(paymentMethods) ? paymentMethods : []).find(method => method.name === paymentMethodName), [ paymentMethods, paymentMethodName ]);

  const subTotal = useMemo(() => calculateSubTotal(transactions), [ transactions ]);
  const salesTax = useMemo(() => calculateSalesTax(subTotal, config), [ subTotal, config ]);
  const processingFees = useMemo(() => calculateProcessingFees(subTotal, paymentMethod), [ subTotal, paymentMethod ])
  const total = useMemo(() => calculateTotal(subTotal, salesTax, processingFees, paymentMethod), [  subTotal, salesTax, processingFees, paymentMethod  ]);

  // Handle the loading and error states
  if (authStatus === 'unauthenticated') return (
    <ErrorMessage message="You are not authorized to view this page!">
      <Button onClick={() => signIn()}>Click here to sign in</Button>
    </ErrorMessage>
  );

  if (isError || paymentIsError || configIsError) return (
    <ErrorMessage message={`Error! ${(isError || paymentIsError || configIsError || { message: 'Unknown Error'})?.info?.message}`} />
  )

  if (authStatus === 'loading' || isLoading || paymentIsLoading || configIsLoading) return (
    <Group position="center" mt={75}>
      <Loader color="green" size="lg" />
    </Group>
  );

  /**
   * Add an item from the autocomplete component to the invoice transactions
   *
   * @param autoCompleteItem
   */
  const addItemToInvoice = (autoCompleteItem: AutocompleteItemProps) => {
    // Wipe out the search filter
    setItemFilter('');

    // Add
    setTransactions(
      produce(draft => {
        draft.push({
          id          : 0,
          invoiceId   : 0,
          itemQuantity: 1,
          itemId      : autoCompleteItem.item.id,
          pricePer    : autoCompleteItem.item.price,
          Item        : autoCompleteItem.item,
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

  /**
   * Reset the invoice to the default values
   */
  const resetInvoice = () => {
    setTransactions([]);
    setCashAmount(0);
    setCheckNumber('');
    setPaymentMethodName('Card');
  };

  /**
   * Save an invoice with the current items
   */
  const saveInvoice = async () => {
    if (paymentMethod === undefined)
      return console.error('No payment method for some reason');

    const invoice = {
      checkNumber    : checkNumber,
      paymentMethodId: paymentMethod.id,
      subTotal       : moneyToNumber(subTotal),
      salesTax       : moneyToNumber(salesTax),
      processingFees : moneyToNumber(processingFees),
      total          : moneyToNumber(total),
      Transactions   : transactions,
    } as Invoice;

    const response = await fetch('/api/invoice', {
      method : 'POST',
      body   : JSON.stringify(invoice),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    const body = await response.json();

    if (body?.success === false) {
      showNotification({
        title  : 'Uh Oh!',
        color  : 'red',
        message: body?.message || '',
      });
    } else {
      showNotification({
        title  : 'Awesome!',
        color  : 'green',
        message: 'Invoice saved successfully!',
      });
      resetInvoice();
    }
  };

  /**
   * Take some scanned data and try and parse out an item
   * @param value
   * @returns AutocompleteItemProps if we parse it correctly in the GenericResponse
   */
  const getAutocompleteItemFromScannedData = (value: string): GenericResponse<AutocompleteItemProps> => {
    try {
      const body = JSON.parse(value);

      if (body.i === undefined) {
        console.error("Scanned data didn't contain they key 'i'. Data: ", body);
        return { success: false, message: "Scanned data didn't contain they key 'i'" };
      }

      const id = parseInt(body.i, 10);

      if (Number.isNaN(id)) {
        console.error("The id wasn't able to be parsed into a number. id: ", body.i);
        return { success: false, message: "The id wasn't able to be parsed into a number" };
      }

      const item = items?.find(i => i.id === id) ?? undefined;

      if (item === undefined) {
        console.error("Couldn't find an item with the id: ", id);
        return { success: false, message: `Couldn't find an item with the id: ${id}` };
      }

      const autocompleteItem = autocompleteItems?.find(i => i.item.id === id) ?? undefined;

      if (autocompleteItem === undefined) {
        console.error("Couldn't find an item with the id: ", id);
        return { success: false, message: 'Item already added to the invoice' };
      }

      return { success: true, data: autocompleteItem };
    } catch (e) {
      console.error(`Failed to parse barcode data: ${value}`);
      return { success: false, message: `Failed to parse barcode data: ${value}` };
    }
  };

  /**
   * Callback for when the barcode scans something
   * @param value
   */
  const barcodeScanned = (value: string) => {
    setScanning(false);

    const itemResponse = getAutocompleteItemFromScannedData(value);

    if (itemResponse.success === false) {
      if (itemResponse.message !== 'Item already added to the invoice')
        return showNotification({
          title: 'Whoops!',
          color: 'yellow',
          message:
            'Failed to parse barcode data! Try again'
            + (isAdmin ? `\n${itemResponse.message}` : '')
          ,
        });
      else
        return showNotification({
          title: 'Hey now!',
          color: 'green',
          message: 'Item has already been added to the invoice! Try increasing the quantity if you need to sell more.',
        });
    }

    addItemToInvoice(itemResponse.data);
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
        <Scanner
          scanning={scanning}
          onScanned={barcodeScanned}
        />
      </Modal>

      <Container p={0}>
        <Group>
          <Title>Create Invoice</Title>
        </Group>

        <Space h="md" />

        <Group position="left">
          <Button onClick={() => setScanning(true)}>Scan Item</Button>
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
            limit={100}
            styles={{
              dropdown: {
                maxHeight: '400px',
              },
            }}
            // initiallyOpened
          />
        </Group>

        <Space h="md" />

        <ScrollArea type="auto">
          <Table fontSize="xs" horizontalSpacing="xs" verticalSpacing="xs" striped={true} highlightOnHover>
            <thead>
              <tr>
                <th style={{ width: '10px' }}></th>
                <th style={{ width: '30px' }}>Quant</th>
                <th style={{ width: '100px', minWidth: '90px' }}>Price</th>
                <th style={{ minWidth: '100px'}}>Item</th>
                <th align="right" style={{ width: '100px', minWidth: '100px' }}>Total</th>
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
                      precision={numberHasDecimal(transaction.pricePer) ? 2 : 0}
                      min={0}
                      inputMode="decimal"
                      // styles={{ input: { padding: 2 } }}
                    />
                  </td>

                  <td style={{ minWidth: 100 }}>
                    { transaction.Item.name }
                    <Group spacing={2}>
                      {
                        transaction.Item.Tags &&
                        Array.isArray(transaction.Item.Tags) &&
                        transaction.Item.Tags.length > 0 &&
                        // Create a new array of the tags that's sortable because it's readonly
                        [ ...transaction.Item.Tags ]
                          .sort((a, b) => {
                            if (a.name < b.name) return -1;
                            if (a.name > b.name) return 1;
                            return 0;
                          })
                          .map((tag) => (
                            <Badge key={tag.id} size="xs" color="green">{tag.name}</Badge>
                          ))
                      }
                    </Group>
                  </td>

                  <td>
                    <CurrencyDollar size={12} color="lime" />
                    {formatMoney($(transaction.pricePer * transaction.itemQuantity), true)}
                  </td>
                </tr>
              ))
              ||
              <tr>
                <td colSpan={5}>
                  Search for an item to add above
                </td>
              </tr>
            }

              <tr style={{ lineHeight: 0.2 }}>
                <td colSpan={2}>&nbsp;</td>
              </tr>
            </tbody>
          </Table>
        </ScrollArea>

        <Group>
          <Title order={3}>Totals</Title>
        </Group>

        <Table fontSize="xs" horizontalSpacing="xs" verticalSpacing="xs" striped={true} highlightOnHover>
          <thead>
            <tr>
              <th style={{ minWidth: '150px'}}></th>
              <th align="right" style={{ width: '100px', minWidth: '100px' }}></th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ lineHeight: 0.2 }}>
              <td colSpan={2}>&nbsp;</td>
            </tr>
            <tr style={{ lineHeight: 0.5 }}>
              <td align="right">Sub Total:</td>
              <td>
                <CurrencyDollar size={12} color="lime" />
                {formatMoney(subTotal, true)}
              </td>
            </tr>
            <tr style={{ lineHeight: 0.5 }}>
              <td align="right">Tax:</td>
              <td>
                <CurrencyDollar size={12} color="lime" />
                {formatMoney(salesTax, true)}
              </td>
            </tr>
            <tr style={{ lineHeight: 0.5 }}>
              <td align="right">Fees:</td>
              <td>
                <CurrencyDollar size={12} color="lime" />
                {formatMoney(processingFees, true)}
              </td>
            </tr>
            <tr style={{ lineHeight: 0.5 }}>
              <td align="right">Total:</td>
              <td>
                <CurrencyDollar size={12} color="lime" />
                {formatMoney(total, true)}
              </td>
            </tr>
          </tbody>
        </Table>

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
                value={cashAmount || undefined}
                onChange={val => setCashAmount(val || 0)}
                inputMode="decimal"
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

        {
          paymentMethodName === 'Check' &&
          (
            <TextInput
              label="Check Number"
              size="xs"
              value={checkNumber}
              onChange={event => setCheckNumber(event.target.value)}
            ></TextInput>
          )
        }

        </Group>

        <Space h="md" />

        <Group position="right">
          <Button
            color="red"
            onClick={() => modals.openConfirmModal({
              title: 'Clear Invoice',
              centered: true,
              children: (
                <Text size="sm" color="red">Are you sure you want to clear this invoice?</Text>
              ),
              labels: { confirm: 'Clear Invoice', cancel: 'Cancel' },
              confirmProps: { color: 'red' },
              onConfirm: resetInvoice,
            })}
          >
            Clear Invoice
          </Button>
          <Button
            onClick={() => modals.openConfirmModal({
              title: 'Save Invoice',
              centered: true,
              children: (
                <Text size="sm">Are you sure you want to save this invoice?</Text>
              ),
              labels: { confirm: 'Save Invoice', cancel: 'Cancel' },
              confirmProps: { color: 'green' },
              onConfirm: saveInvoice,
            })}
          >
            Submit Invoice
          </Button>
        </Group>
      </Container>
    </>
  );
}

export default Checkout;
