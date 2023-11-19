import { Badge, Group, ScrollArea, Space, Table, Title } from '@mantine/core';

import type { Transaction } from '@prisma/client';

import UseItems from '../../lib/hooks/useItems';
import UseInvoices from '../../lib/hooks/useInvoices';

export default function InventoryStock() {
  const { items } = UseItems('all');
  const { invoices } = UseInvoices();

  const itemSoldMap: Record<number, number> = items?.reduce((acc, item) => {
    acc[item.id] = invoices?.reduce((acc, invoice) => {
      const transaction: Transaction | undefined = invoice.Transactions.find(t => t.itemId === item.id);
      return acc + (transaction?.itemQuantity ?? 0);
    }, 0) ?? 0;

    return acc;
  }, {} as Record<number, number>) ?? {};

  return (
    <>
      <Title order={3}>Inventory Stock</Title>

      <Space h="md" />

      <ScrollArea type="auto">
        <Table>
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Name</th>
              <th>Sold</th>
              <th>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {
              items && invoices &&
              items.map(item => (
                <tr key={item.id}>
                  <td>{ item.Vendor.firstName }</td>
                  <td>
                    <Group spacing="xs">
                      <span style={
                        (item.stock - (itemSoldMap[item.id] ?? 0) <= 0)
                          ? { textDecoration: 'line-through', color: '#fa5252' }
                          : {}
                      }>
                        {item.name}
                      </span>
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
                  <td>{itemSoldMap[item.id] ?? ''}</td>
                  <td>{item.stock - (itemSoldMap[item.id] ?? 0)}/{item.stock}</td>
                </tr>
              ))
            }
          </tbody>
        </Table>
      </ScrollArea>
    </>
  );
}

