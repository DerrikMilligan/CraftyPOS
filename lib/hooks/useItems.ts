import useSWR from 'swr';
import { Item, Tag, Vendor } from '@prisma/client';

import { getFetcher, jsonDelete, jsonPost, jsonPut } from '../fetching';
import { showNotification } from '@mantine/notifications';

const endpoint = '/api/item';

// Dummy vendor for optimistic data until things are saved and reloaded
const loadingVendor = {
  firstName: '',
  lastName: '',
} as Vendor;

// There's a special way of calling this where we pass in 'all' which will return all the objects
export const useItems = (initialPage: number | 'all') => {
  const page = typeof initialPage === 'number' ? initialPage : 1;
  
  const {
    error,
    mutate,
    data,
  } = useSWR<Pagination<Array<Item & { Vendor: Vendor, Tags: Tag[] }>>>(
    initialPage !== 'all'
      ? `${endpoint}?page=${page}` 
      : `${endpoint}`,
    getFetcher()
  );
  
  const items = data?.data;
  
  const addItem = async (item: Item) => {
    if (items === undefined || data?.totalPages === undefined)
      throw new Error('Attempting to add item before items resolved');

    let newItem = null;
    await mutate(
      async () => {
        try {
          newItem = await jsonPost(endpoint, item);
          showNotification({ color: 'green', title: 'Created!', message: 'Item added successfully' });
          return { data: [ newItem, ...items ], page, totalPages: data?.totalPages };
        } catch (e) {
          showNotification({ color: 'red', title: 'Uh oh!', message: 'Something went wrong when saving the item! Try again later.' });
        }

        return { data: items, page, totalPages: data?.totalPages };
      },
      {
        optimisticData: {
          data: [ { ...item, Vendor: loadingVendor }, ...items ] as Array<Item & { Vendor: Vendor, Tags: Tag[] }>,
          page,
          totalPages: data?.totalPages
        },
      },
    );
    
    return newItem;
  };

  const updateItem = async (item: Item) => {
    if (items === undefined || data?.totalPages === undefined)
      throw new Error('Attempting to update item before items resolved');

    const otherItems = items.filter((i) => i.id !== item.id);
    
    await mutate(
      async () => {
        try {
          const updatedItem = await jsonPut(`${endpoint}/${item.id}`, item);
          showNotification({ color: 'green', title: 'Updated!', message: 'Item updated successfully' });
          return { data: [ updatedItem, ...otherItems ], page, totalPages: data?.totalPages };
        } catch (e) {
          showNotification({ color: 'red', title: 'Uh oh!', message: 'Something went wrong when saving the item! Try again later.' });
        }

        return { data: items, page, totalPages: data?.totalPages };
      },
      {
        optimisticData: {
          data: [ { ...item, Vendor: loadingVendor }, ...otherItems ] as Array<Item & { Vendor: Vendor, Tags: Tag[] }>,
          page,
          totalPages: data?.totalPages
        },
      },
    );
  };

  const deleteItem = async (item: Item) => {
    if (items === undefined || data?.totalPages === undefined)
      throw new Error('Attempting to delete item before items resolved');

    const remainingItems = items.filter((v) => v.id !== item.id);

    await mutate(
      async () => {
        try {
          const response = await jsonDelete(`${endpoint}/${item.id}`, item);

          if (response.success === false)
            throw new Error('Bubble up the error');
          
          showNotification({ color: 'green', title: 'Removed!', message: 'Item removed successfully' });
          return { data: remainingItems, page, totalPages: data?.totalPages };
        } catch (e) {
          showNotification({ color: 'red', title: 'Uh oh!', message: 'Something went wrong with removing the item! Try again later.' });
          console.error(e);
        }

        return { data: items, page, totalPages: data?.totalPages };
      },
      {
        optimisticData: { data: remainingItems, page, totalPages: data?.totalPages },
      },
    );
  }

  return {
    addItem,
    updateItem,
    deleteItem,
    items,
    page,
    totalPages: data?.totalPages,
    isLoading : !error && items === undefined,
    isError   : error,
  };
};

export default useItems;
