import { Space, Table, Title } from '@mantine/core';
import { CurrencyDollar } from 'tabler-icons-react';

import UseItems from '../../lib/hooks/useItems';
import UseInvoices from '../../lib/hooks/useInvoices';
import UseVendors from '../../lib/hooks/useVendors';

export default function VendorTotals() {
  const { items } = UseItems('all');
  const { invoices } = UseInvoices();
  const { vendors } = UseVendors();

  return (
    <>
      <Title order={3}>Vendor Totals</Title>

      <Space h="md" />

      <Table>
        <thead>
        <tr>
          <th>id</th>
          <th>Name</th>
          <th>Earnings</th>
        </tr>
        </thead>
        <tbody>
          {
            vendors &&
            vendors.map(vendor => (
              <tr key={vendor.id}>
                <td>{vendor.id}</td>
                <td>{vendor.firstName} {vendor.lastName}</td>
                <td>
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

