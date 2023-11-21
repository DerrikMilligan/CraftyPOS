import { Group, Loader, Space, Table, Text, Title } from '@mantine/core';
import { CurrencyDollar } from 'tabler-icons-react';

import UseItems from '../../lib/hooks/useItems';
import UseInvoices from '../../lib/hooks/useInvoices';
import UseVendors from '../../lib/hooks/useVendors';
import ErrorMessage from 'components/ErrorMessage';

export default function VendorTotals() {
  const { items, isLoading: itemsLoading, isError: itemsError } = UseItems('all');
  const { invoices, isLoading: invoicesLoading, isError: invoicesError } = UseInvoices();
  const { vendors, isLoading: vendorsLoading, isError: vendorsError } = UseVendors();

  if (itemsError || invoicesError || vendorsError) return (
    <ErrorMessage message={itemsError || invoicesError || vendorsError}></ErrorMessage>
  );

  // Handle the loading and error states
  if (itemsLoading || invoicesLoading || vendorsLoading) return (
    <Group position="center" mt={75}>
      <Loader color="green" size="lg" />
    </Group>
  );

  return (
    <>
      <Title order={3}>Vendor Totals</Title>

      <Text size="xs"><i>These totals don&apos;t include tax and fees!</i></Text>

      <Space h="md" />

      <Table striped>
        <tbody>
          {
            vendors &&
            vendors.map(vendor => (
              <tr key={vendor.id}>
                <td>{vendor.firstName} {vendor.lastName}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <CurrencyDollar size={12} color="lime" />
                  {
                    (
                      invoices?.reduce((acc, invoice) => {
                        // TODO Need to have more logic here to handle fees/taxes splitting on a per transaction basis
                        invoice.Transactions.forEach(transaction => {
                          const item = items?.find(i => i.id === transaction.itemId) || undefined;

                          if (item && item.vendorId === vendor.id)
                            acc += transaction.pricePer * transaction.itemQuantity
                        });

                        return acc;
                      }, 0) ?? 0
                    ).toFixed(2)
                  }
                </td>
              </tr>
            ))
          }
        </tbody>
      </Table>
    </>
  );
}

