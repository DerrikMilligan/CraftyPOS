import { useState } from 'react';
import { useRouter } from 'next/router';
import type { NextPage, GetServerSideProps } from 'next'

import { Box, Button, Card, Group, Modal, Table, Pagination } from '@mantine/core';
import { PrismaClient, Inventory, Vendor } from '.prisma/client';

const prisma = new PrismaClient();

const resultsPerPage = 10;

export const getServerSideProps: GetServerSideProps = async ({ query }) => {

  const currentPage = Number.parseInt(query?.page as string);

  const inventory = await prisma.inventory.findMany({
    take: resultsPerPage,
    skip: resultsPerPage * (currentPage - 1),
    // Load all the vendor info as well
    include: { vendor: true },
  });

  const inventoryCount = await prisma.inventory.count();

  const totalPages = Math.ceil(inventoryCount / resultsPerPage);

  return {
    props: {
      inventory,
      totalPages,
      currentPage,
    },
  };
};

interface InventoryProps {
  // This is how we say we're getting inventory items with vendor eagerly loaded
  inventory: Array<Inventory & { vendor: Vendor }>;
  totalPages: number;
  currentPage: number;
}

const Inventory: NextPage<InventoryProps> = ({ inventory, totalPages, currentPage }) => {
  const router = useRouter();
  const [ modalOpened, setModalOpened ] = useState(false);

  const rows = inventory.map((item) => (
    <tr key={ item.id }>
      <td>{ item.displayName }</td>
      <td>{ item.price }</td>
      <td>{ item.vendor.firstName }</td>
    </tr>
  ));

  return (
    <>
      <Modal
        centered
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        size="lg"
      >
        <Box>
          Hello
        </Box>
      </Modal>

      <Card p="lg">
        <Button onClick={() => setModalOpened(true)}>Add New</Button>

        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Vendor</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </Table>
      </Card>

      {
        totalPages > 1 &&
        (
          <Group position="center" mt="lg">
            <Pagination
              color="lime"
              page={currentPage}
              total={totalPages}
              onChange={(page) => router.replace(`/inventory/${page}`)}
            ></Pagination>
          </Group>
        )
      }
    </>
  );
};

export default Inventory;
