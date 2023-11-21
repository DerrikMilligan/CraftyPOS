import useSWR from 'swr';
import { Vendor } from '@prisma/client';

import { getFetcher, jsonDelete, jsonPost, jsonPut } from '../fetching';
import { showNotification } from '@mantine/notifications';

const endpoint = '/api/vendor';

export const useVendors = () => {
  const {
    error,
    mutate,
    data: vendors,
  } = useSWR<Vendor[]>(endpoint, getFetcher());

  const addVendor = async (vendor: Vendor) => {
    if (vendors === undefined)
      throw new Error('Attempting to add vendor before vendors resolved');

    let newVendor = null;

    await mutate(
      async () => {
        try {
          newVendor = await jsonPost(endpoint, vendor);
          showNotification({ color: 'green', title: 'Created!', message: 'Vendor added successfully' });
          return [ newVendor, ...vendors ];
        } catch (e) {
          showNotification({ color: 'red', title: 'Uh oh!', message: 'Something went wrong when saving the vendor! Try again later.' });
        }

        return vendors;
      },
      {
        optimisticData: [ vendor, ...vendors ],
      },
    );

    return newVendor;
  };

  const updateVendor = async (vendor: Vendor) => {
    if (vendors === undefined)
      throw new Error('Attempting to update vendor before vendors resolved');

    const otherVendors = vendors.filter((v) => v.id !== vendor.id);

    await mutate(
      async () => {
        try {
          const updatedVendor = await jsonPut(`${endpoint}/${vendor.id}`, vendor);
          showNotification({ color: 'green', title: 'Updated!', message: 'Vendor updated successfully' });
          return [ updatedVendor, ...otherVendors ];
        } catch (e) {
          showNotification({ color: 'red', title: 'Uh oh!', message: 'Something went wrong when saving the vendor! Try again later.' });
        }

        return vendors;
      },
      {
        optimisticData: [ vendor, ...otherVendors ],
      },
    );
  };

  const deleteVendor = async (vendor: Vendor) => {
    if (vendors === undefined)
      throw new Error('Attempting to delete vendor before vendors resolved');

    const remainingVendors = vendors.filter((v) => v.id !== vendor.id);

    await mutate(
      async () => {
        try {
          const response = await jsonDelete(`${endpoint}/${vendor.id}`, vendor);

          if (response.success === false)
            throw new Error('Bubble up the error');

          showNotification({ color: 'green', title: 'Removed!', message: 'Vendor removed successfully' });
          return remainingVendors;
        } catch (e) {
          showNotification({ color: 'red', title: 'Uh oh!', message: 'Something went wrong with removing the vendor! Try again later.' });
          console.error(e);
        }

        return vendors;
      },
      {
        optimisticData: remainingVendors,
      },
    );
  }

  return {
    addVendor,
    updateVendor,
    deleteVendor,
    vendors, 
    isLoading: !error && vendors === undefined,
    isError  : error,
  };
}

export default useVendors;
