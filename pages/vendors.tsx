import { useState } from 'react';
import type { NextPage } from 'next'

import {
  ActionIcon,
  Box,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  Kbd, 
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { Mail, Pencil, X } from 'tabler-icons-react';
import { useForm } from '@mantine/form';
import { useModals } from '@mantine/modals';

import { Vendor } from '@prisma/client';

import { useVendors } from '../lib/hooks';

const Vendors: NextPage = () => {
  const [ modalOpened, setModalOpened ] = useState(false);
  const { isLoading, isError, vendors, deleteVendor, addVendor, updateVendor } = useVendors();
  
  const modals = useModals();

  const form = useForm({
    initialValues: {
      id: 0,
      firstName: '',
      lastName: '',
      email: '',
    },

    validate: {
      email: (value) => (value.length === 0 || /^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  const submitVendor = form.onSubmit(async (values) => {
    setModalOpened(false);
    
    const isNewVendor = values.id === 0;
    
    if (isNewVendor)
      await addVendor(values);
    else
      await updateVendor(values);
  });

  const openModal = (vendor: Vendor|null = null) => {
    form.reset();

    if (vendor !== null)
      form.setValues(vendor);

    setModalOpened(true);
  };
  
  // Handle the loading and error states
  if (isLoading) return (
    <Group position="center" mt={75}>
      <Loader color="green" size="lg" />
    </Group>
  );
  if (isError) return <div>Error! {isError}...</div>

  return (
    <>
      <Modal
        centered
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={form.values.id === 0 ? 'Add New Vendor' : 'Update Vendor'}
        size="lg"
      >
        <Box>
          <form onSubmit={submitVendor}>
            <input type="hidden" {...form.getInputProps('id')} />
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
            </tr>
          </thead>
          <tbody>
            {
              vendors !== undefined &&
              vendors.map((vendor) => (
                <tr key={ vendor.id }>
                  <td width="50" style={{ padding: 0 }}>
                    <div style={{ display: 'flex'}}>
                      <ActionIcon
                        color="red"
                        onClick={() => modals.openConfirmModal({
                          title: 'Remove Vendor',
                          centered: true,
                          children: (
                            <Text size="sm">
                              Are you sure you want to delete <Kbd>{vendor.firstName} {vendor.lastName}</Kbd>?
                            </Text>
                          ),
                          labels: { confirm: 'Remove Vendor', cancel: 'Cancel' },
                          confirmProps: { color: 'red' },
                          onConfirm: () => deleteVendor(vendor),
                        })}
                      >
                        <X size="20"/>
                      </ActionIcon>
                      <ActionIcon
                        color="yellow"
                        onClick={() => openModal(vendor)}
                      >
                        <Pencil size="20"/>
                      </ActionIcon>
                    </div>
                  </td>
                  <td>{ vendor.id }</td>
                  <td>{ vendor.firstName }</td>
                  <td>{ vendor.lastName }</td>
                </tr>
              ))
            }
          </tbody>
        </Table>
      </Card>
    </>
  );
};

export default Vendors;
