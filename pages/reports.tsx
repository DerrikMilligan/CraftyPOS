import type { NextPage } from 'next'
import { signIn, useSession } from 'next-auth/react';

import { Role, Transaction } from '@prisma/client';

import { Badge, Button, Card, Container, Group, Loader, Space, Stack, Table, Tabs, Text, Title } from '@mantine/core';
import { CurrencyDollar, User as UserIcon } from 'tabler-icons-react';

import UseItems from '../lib/hooks/useItems';
import UseInvoices from '../lib/hooks/useInvoices';
import UseVendors from '../lib/hooks/useVendors';

const Reports: NextPage = () => {
  const { data: sessionData, status: authStatus } = useSession();

  const { items, isLoading: itemsLoading, isError: itemsError } = UseItems('all');
  const { invoices, isLoading: invoicesLoading, isError: invoicesError } = UseInvoices();
  const { vendors, isLoading: vendorsLoading, isError: vendorsError } = UseVendors();

  if (itemsError || invoicesError || vendorsError) return (
    <Container p={0}>
      <Card p="lg">
        <Stack align="center">
          <Text align="center">{itemsError || invoicesError || vendorsError}</Text>
        </Stack>
      </Card>
    </Container>
  );

  // Handle the loading and error states
  if (authStatus === 'loading' || itemsLoading || invoicesLoading || vendorsLoading) return (
    <Group position="center" mt={75}>
      <Loader color="green" size="lg" />
    </Group>
  );

  // @ts-ignore
  if (authStatus === 'unauthenticated' || sessionData?.role !== Role.ADMIN) return (
    <Container p={0}>
      <Card p="lg">
        <Stack align="center">
          <Text align="center">You are not authorized to view this page!</Text>
          <Button onClick={() => signIn()}>Click here to sign in</Button>
        </Stack>
      </Card>
    </Container>
  );
  
  const itemSoldMap: Record<number, number> = items?.reduce((acc, item) => {
    acc[item.id] = invoices?.reduce((acc, invoice) => {
      const transaction: Transaction | undefined = invoice.Transactions.find(t => t.itemId === item.id);

      if (transaction === undefined)
        return acc;

      return acc + transaction.itemQuantity;
    }, 0) ?? 0;
    
    return acc;
  }, {} as Record<number, number>) ?? {};
  
  const formatDate = (d: Date) => d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes();

  return (
    <Container p={0}>
      <Card p="xl">
        <Title order={1}>Reporting</Title>

        <Space h="md" />
        
        <Tabs variant="outline" tabPadding="md">
          <Tabs.Tab label="Inventory Stock" icon={<UserIcon size={14} />}>
            <Title order={3}>Inventory Stock</Title>
            
            <Space h="md" />
            
            <Table>
              <thead>
                <tr>
                  <th>id</th>
                  <th>Name</th>
                  <th>Tags</th>
                  <th>Inventory</th>
                  <th>Sold</th>
                  <th>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {
                  items && invoices &&
                  items.map(item => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td style={
                        (item.stock - (itemSoldMap[item.id] ?? 0) <= 0)
                          ? { textDecoration: 'line-through', color: '#fa5252' }
                          : {}
                      }>
                        {item.name}
                      </td>
                      <td>
                        <Group spacing="xs">
                          {
                            item.Tags &&
                            item.Tags.map(tag => (
                              <Badge color="green" key={tag.id} size="xs">
                                {tag.name}
                              </Badge>
                            ))
                          }
                        </Group>
                      </td>
                      <td>{item.stock}</td>
                      <td>{itemSoldMap[item.id] ?? ''}</td>
                      <td>{item.stock - (itemSoldMap[item.id] ?? 0)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </Table>
            
          </Tabs.Tab>

          <Tabs.Tab label="Vendor Totals" icon={<UserIcon size={14} />}>
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
          </Tabs.Tab>


          <Tabs.Tab label="Invoice History" icon={<UserIcon size={14} />}>
            <Title order={3}>Invoice History</Title>

            <Space h="md" />

            <Table>
              <thead>
              <tr>
                <th>Invoice Id</th>
                <th>Item Id</th>
                <th>Item Name</th>
                <th>Earnings</th>
              </tr>
              </thead>
              <tbody>
              {
                invoices &&
                invoices.map(invoice => (
                  <>
                    <tr key={invoice.id}>
                      <td colSpan={4}>{invoice.id} - {formatDate(new Date(invoice.timestamp))}</td>
                    </tr>
                    {
                      invoice.Transactions &&
                      invoice.Transactions.map(transaction => (
                        <tr key={transaction.id}>
                          <td></td>
                          <td>{transaction.itemQuantity}</td>
                          <td>{items && items.find(item => item.id === transaction.itemId)?.name}</td>
                          <td>
                            <CurrencyDollar size={12} color="lime" />
                            {(transaction.itemQuantity * transaction.pricePer).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    }
                    <tr>
                      <td colSpan={3} align='right'>
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
                    <tr style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', lineHeight: 1 }}>
                      <td>&nbsp;</td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  </>
                ))
              }
              </tbody>
            </Table>
          </Tabs.Tab>
          
        </Tabs>
      </Card>
    </Container>
  );
};

export default Reports;
