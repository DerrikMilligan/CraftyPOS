import React from 'react';
import type { NextPage } from 'next'
import { signIn, useSession } from 'next-auth/react';

import { Role } from '@prisma/client';

import { Button, Container, Group, Loader, Space, Tabs, Title } from '@mantine/core';
import { User as UserIcon } from 'tabler-icons-react';

import ErrorMessage from 'components/ErrorMessage';
import InventoryStock from 'components/Reports/InventoryStock';
import InvoiceHistory from 'components/Reports/InvoiceHistory';
import VendorTotals from 'components/Reports/VendorTotals';
import PaymentTotals from 'components/Reports/PaymentTotals';
import DivvyingTool from 'components/Reports/DivvyingTool';

const Reports: NextPage = () => {
  const { data: sessionData, status: authStatus } = useSession();

  if (authStatus === 'unauthenticated') return (
    <ErrorMessage message="You are not authorized to view this page!">
      <Button onClick={() => signIn()}>Click here to sign in</Button>
    </ErrorMessage>
  );

  const userIsAdmin = sessionData?.role === Role.ADMIN;

  return (
    <Container p={0}>
      <Title order={1}>Reporting</Title>

      <Space h="md" />

      <Tabs tabPadding="md">
        <Tabs.Tab label="Inventory Stock" icon={<UserIcon size={14} />}>
          <InventoryStock></InventoryStock>
        </Tabs.Tab>

        <Tabs.Tab label="Invoice History" icon={<UserIcon size={14} />}>
          <InvoiceHistory></InvoiceHistory>
        </Tabs.Tab>

        {userIsAdmin && (
          <Tabs.Tab label="Vendor Totals" icon={<UserIcon size={14} />}>
            <VendorTotals></VendorTotals>
          </Tabs.Tab>
        )}

        {userIsAdmin && (
          <Tabs.Tab label="Payment Totals" icon={<UserIcon size={14} />}>
            <PaymentTotals></PaymentTotals>
          </Tabs.Tab>
        )}

        {userIsAdmin && (
          <Tabs.Tab label="Divvying Tool" icon={<UserIcon size={14} />}>
            <DivvyingTool></DivvyingTool>
          </Tabs.Tab>
        )}

      </Tabs>
    </Container>
  );
};

export default Reports;

