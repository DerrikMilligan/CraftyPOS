import { useState } from 'react';
import type { GetServerSideProps, NextPage } from 'next'

import { Mail, Pencil, X } from 'tabler-icons-react';
import { ActionIcon, Box, Button, Card, Group, Modal, Table, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';

import { PrismaClient, Vendor } from '.prisma/client';


const prisma = new PrismaClient();

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const vendors = await prisma.vendor.findMany();

  return {
    props: {
      vendors,
    },
  };
};

interface VendorProps {
  vendors: Array<Vendor>;
}

const Vendors: NextPage<VendorProps> = ({ vendors }) => {
  const [ modalOpened, setModalOpened ] = useState(false);

  const form = useForm({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
    },

    validate: {
      email: (value) => (value.length === 0 || /^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  const submitNewVendor = form.onSubmit(async (values) => {
    console.log(values);

    const response = await fetch('/api/vendor/', {
      method: 'POST',
      headers: {
        'Accept'      : 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });

    const data = await response.json();
    console.log(data);

    setModalOpened(false);
  });

  const openModal = (vendor: Vendor|null = null) => {
    form.reset();

    if (vendor !== null)
      form.setValues({
        firstName: vendor.firstName,
        lastName : vendor.lastName,
        email    : vendor.email,
      });

    setModalOpened(true);
  };

  const rows = vendors.map((vendor) => (
    <tr key={ vendor.id }>
      <td width="25" style={{ padding: 0 }}>
        <ActionIcon
          color="yellow"
          onClick={() => openModal(vendor)}
        >
          <Pencil size="20"/>
        </ActionIcon>
      </td>
      <td>{ vendor.id }</td>
      <td>{ vendor.firstName }</td>
      <td>{ vendor.lastName }</td>
      <td width="25" style={{ padding: 0 }}>
        <ActionIcon
          color="red"
        >
          <X size="20"/>
        </ActionIcon>
      </td>
    </tr>
  ));

  return (
    <>
      <Modal
        centered
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title="Add New Vendor"
        size="lg"
      >
        <Box>
          <form onSubmit={submitNewVendor}>
            <TextInput
              label="First Name"
              required
              {...form.getInputProps('firstName')}
            />
            <TextInput
              label="Last Name"
              required
              {...form.getInputProps('lastName')}
            />
            <TextInput
              label="Email"
              icon={<Mail size="14"/>}
              {...form.getInputProps('email')}
            />
            <Group position="right" mt="lg">
              <Button color="green" type="submit">Save</Button>
              <Button color="red" onClick={() => setModalOpened(false)}>Cancel</Button>
            </Group>
          </form>
        </Box>
      </Modal>

      <Card p="lg">
        <Group position="right">
          <Button onClick={() => openModal()}>Add New Vendor</Button>
        </Group>

        <Table>
          <thead>
            <tr>
              <th></th>
              <th>ID</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </Table>
      </Card>
    </>
  );
};

export default Vendors;
