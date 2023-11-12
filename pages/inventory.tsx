import { useState } from 'react';
import type { NextPage } from 'next'

import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Modal,
  Table,
  Pagination,
  Loader,
  TextInput,
  NativeSelect,
  NumberInput, SelectItem, MultiSelect, ActionIcon, Text, Kbd, ScrollArea, Container, Stack,
} from '@mantine/core';
import { useModals } from '@mantine/modals';
import { useForm } from '@mantine/form';
import { CurrencyDollar, Pencil, X } from 'tabler-icons-react';
import { useLocalStorage } from '@mantine/hooks';

import { Item, Tag, Vendor } from '@prisma/client';

import { useVendors } from '../lib/hooks';
import useItems from '../lib/hooks/useItems';
import useTags from '../lib/hooks/useTags';
import { signIn, useSession } from 'next-auth/react';
import { $, formatMoney } from 'lib/dineroHelpers';

const vendorToSelectItem = (v: Vendor): SelectItem => {
  return {
    value: v.id.toString(),
    label: `${v.firstName} ${v.lastName}`,
  };
}

const Inventory: NextPage = () => {
  const [ modalOpened, setModalOpened ] = useState(false);
  const [ page, setPage ] = useState(1);
  const { items, totalPages, addItem, deleteItem, updateItem, isError, isLoading } = useItems(page);
  const { vendors } = useVendors();
  const { tags, addTag } = useTags();

  const [ lastUsedVendor, setLastUsedVendor ] = useLocalStorage({
    key: 'last-used-vendor',
    defaultValue: vendors?.[0]?.id || 1,
  });

  const { status: authStatus } = useSession();
  const modals = useModals();

  const form = useForm({
    initialValues: {
      id      : 0,
      name    : '',
      stock   : undefined,
      price   : undefined,
      vendorId: vendors?.[0]?.id || 0,
      Tags    : [] as Tag[],
    } as Partial<Item & { Vendor: Vendor, Tags: Tag[] }>,

    // validate: {
    // },
  });

  // Handle the loading and error states
  if (authStatus === 'unauthenticated') return (
    <Container p={0}>
      <Card p="lg">
        <Stack align="center">
          <Text align="center">You are not authorized to view this page!</Text>
          <Button onClick={() => signIn()}>Click here to sign in</Button>
        </Stack>
      </Card>
    </Container>
  );
  if (isError) return (
    <Container p={0}>
      <Card p="lg">
        <Stack align="center">
          <Text align="center">Error! {(isError || { message: 'Unknown Error'})?.info?.message}</Text>
        </Stack>
      </Card>
    </Container>
  )
  if (authStatus === 'loading' || isLoading) return (
    <Group position="center" mt={75}>
      <Loader color="green" size="lg" />
    </Group>
  );

  const openModal = (item: Item & { Vendor: Vendor, Tags: Tag[] } | null = null) => {
    form.reset();

    form.setFieldValue('vendorId', lastUsedVendor);

    if (item !== null)
      form.setValues(item);

    setModalOpened(true);
  };

  const submitItem = form.onSubmit(async (values) => {
    setModalOpened(false);

    const isNewItem = values.id === 0;

    if (isNewItem) {
      await addItem(values);
      setLastUsedVendor(values.vendorId ?? 0);
    } else {
      await updateItem(values);
    }
  });

  // Create a tag and wait for the response and add it to the form
  const createTag = async (tagName: string) => {
    const tag = await addTag({ name: tagName } as Tag);
    if (tag)
      form.setValues({ ...form.values, Tags: [ ...(form.values?.Tags ?? []), tag ] })
  };

  // When tags change we get a list of strings, and we can get a bogus one that hasn't finished
  // being created yet.
  const tagsChanged = async (tagNames: string[]) => {
    form.setValues({
      ...form.values,
      Tags: tagNames
        .map(n => tags?.find(t => t.name === n))
        // Remove any bogus tags that are just undefined from the find
        .filter(t => t !== undefined) as Tag[]
    });
  };

  // @ts-ignore
  return (
    <>
      <Modal
        centered
        opened={modalOpened}
        closeOnClickOutside={false}
        closeOnEscape={true}
        onClose={() => setModalOpened(false)}
        title={form.values.id === 0 ? 'Add New Item' : 'Update Item'}
        size="lg"
      >
       {/* Use the Box element to have media queries */}
        <Box>
          <form onSubmit={submitItem}>
            <input type="hidden" {...form.getInputProps('id')} />
            <TextInput
              label="Name"
              required
              {...form.getInputProps('name')}
            />
            <NumberInput
              label="Stock"
              required
              placeholder="0"
              min={0}
              {...form.getInputProps('stock')}
            />
            <NumberInput
              label="Price"
              required
              icon={<CurrencyDollar size={18} color="lime" />}
              placeholder="0.00"
              precision={2}
              min={0}
              {...form.getInputProps('price')}
            />
            <NativeSelect
              label="Vendor"
              data={vendors?.map(vendorToSelectItem) || []}
              value={form.values.vendorId}
              onChange={(event) => form.setValues({ ...form.values, vendorId: parseInt(event.target.value) })}
            />
            <MultiSelect
              label="Tags"
              searchable
              creatable
              data={tags?.map(tag => tag.name) || []}
              getCreateLabel={(tagName) => `+ Create ${tagName}`}
              onCreate={createTag}
              value={(form.values?.Tags ?? []).map(t => t?.name || '')}
              onChange={tagsChanged}
            />
            <Group position="right" mt="lg">
              <Button
                color="green"
                type="submit"
                // This will disable the submit button when we're saving tags...
                // Shouldn't be a problem often but this will ensure that when the time
                // comes that we save an item the tags will all exist in the database
                disabled={tags?.reduce((acc: boolean, tag) => (acc || tag.id === 0), false) || false}
              >
                Save
              </Button>
              <Button color="red" onClick={() => setModalOpened(false)}>Cancel</Button>
            </Group>
          </form>
        </Box>
      </Modal>

      <Card p="lg">
        <Group position="right">
          <Button onClick={() => openModal()}>Add New Item</Button>
        </Group>

        <ScrollArea type="auto">
          <Table fontSize="xs" horizontalSpacing="xs" verticalSpacing="xs">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Initial Stock</th>
                <th>Price</th>
                <th>Vendor</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              {
                items?.map((item) => (
                  <tr key={item.id}>
                    <td width="50" style={{ padding: 0 }}>
                      <div style={{ display: 'flex' }}>
                        <ActionIcon
                          color="red"
                          onClick={() => modals.openConfirmModal({
                            title: 'Remove Item',
                            centered: true,
                            children: (
                              <Text size="sm">
                                Are you sure you want to delete <Kbd>{item.name}</Kbd>? This will remove any transactions
                              </Text>
                            ),
                            labels: { confirm: 'Remove Item', cancel: 'Cancel' },
                            confirmProps: { color: 'red' },
                            onConfirm: () => deleteItem(item),
                          })}
                        >
                          <X size="20"/>
                        </ActionIcon>
                        <ActionIcon
                          color="yellow"
                          onClick={() => openModal(item)}
                        >
                          <Pencil size="20"/>
                        </ActionIcon>
                      </div>
                    </td>
                    <td>{item.name}</td>
                    <td>{item.stock}</td>
                    <td>${formatMoney($(item.price))}</td>
                    <td>{item?.Vendor?.firstName || ''}</td>
                    <td>
                      <Group spacing="xs">
                        {
                          item.Tags &&
                          item.Tags.map((tag) => (
                            <Badge color="green" key={tag.id} size="xs">
                              {tag.name}
                            </Badge>
                          ))
                        }
                      </Group>
                    </td>
                  </tr>
                ))
              }
              <tr>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </Table>
        </ScrollArea>
      </Card>

      {
        totalPages !== undefined &&
        totalPages > 1 &&
        (
          <Group position="center" mt="lg">
            <Pagination
              color="lime"
              page={page}
              total={totalPages}
              onChange={(page) => setPage(page)}
            ></Pagination>
          </Group>
        )
      }
    </>
  );
};

export default Inventory;

