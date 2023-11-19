import React from 'react';
import type { NextPage } from 'next'
import { signIn, useSession } from 'next-auth/react';

import { Role } from '@prisma/client';

import { Button, Card, Container, Group, Loader, Space, Tabs, Title } from '@mantine/core';
import { User as UserIcon } from 'tabler-icons-react';

import UseItems from '../lib/hooks/useItems';
import UseInvoices from '../lib/hooks/useInvoices';
import UseVendors from '../lib/hooks/useVendors';

import ErrorMessage from 'components/ErrorMessage';
import InventoryStock from 'components/Reports/InventoryStock';
import InvoiceHistory from 'components/Reports/InvoiceHistory';
import VendorTotals from 'components/Reports/VendorTotals';

const Reports: NextPage = () => {
  const { data: sessionData, status: authStatus } = useSession();

  const { isLoading: itemsLoading,    isError: itemsError    } = UseItems('all');
  const { isLoading: invoicesLoading, isError: invoicesError } = UseInvoices();
  const { isLoading: vendorsLoading,  isError: vendorsError  } = UseVendors();

  if (itemsError || invoicesError || vendorsError) return (
    <ErrorMessage message={itemsError || invoicesError || vendorsError}></ErrorMessage>
  );

  // Handle the loading and error states
  if (authStatus === 'loading' || itemsLoading || invoicesLoading || vendorsLoading) return (
    <Group position="center" mt={75}>
      <Loader color="green" size="lg" />
    </Group>
  );

  if (authStatus === 'unauthenticated') return (
    <ErrorMessage message="You are not authorized to view this page!">
      <Button onClick={() => signIn()}>Click here to sign in</Button>
    </ErrorMessage>
  );

  const userIsAdmin = sessionData?.role === Role.ADMIN;

  return (
    <Container p={0}>
      <Card p="xl">
        <Title order={1}>Reporting</Title>

        <Space h="md" />

        <Tabs variant="outline" tabPadding="md">
          <Tabs.Tab label="Inventory Stock" icon={<UserIcon size={14} />}>
            <InventoryStock></InventoryStock>
          </Tabs.Tab>

          <Tabs.Tab label="Invoice History" icon={<UserIcon size={14} />}>
            <InvoiceHistory></InvoiceHistory>
          </Tabs.Tab>

          { userIsAdmin && (
            <Tabs.Tab label="Vendor Totals" icon={<UserIcon size={14} />}>
              <VendorTotals></VendorTotals>
            </Tabs.Tab>
          ) }

        </Tabs>
      </Card>
    </Container>
  );
};

export default Reports;

