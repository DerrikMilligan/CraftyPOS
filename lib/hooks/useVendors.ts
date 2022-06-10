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
  } = useSWR<Vendor[]>(endpoint, getFetcher())
  
  const addVendor = async (vendor: Vendor) => {
    if (vendors === undefined)
      throw new Error('Attempting to add vendor before vendors resolved');
    
    await mutate(
      async () => {
        try {
          const newVendor = await jsonPost(endpoint, vendor);
          showNotification({ color: 'green', title: 'Awesome!', message: 'Vendor added successfully' });
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
  };
  
  const updateVendor = async (vendor: Vendor) => {
    if (vendors === undefined)
      throw new Error('Attempting to update vendor before vendors resolved');

    await mutate(
      async () => {
        try {
          const updatedVendor = await jsonPut(`${endpoint}/${vendor.id}`, vendor);
          showNotification({ color: 'green', title: 'Awesome!', message: 'Vendor updated successfully' });
          return [ updatedVendor, ...vendors ];
        } catch (e) {
          showNotification({ color: 'red', title: 'Uh oh!', message: 'Something went wrong when saving the vendor! Try again later.' });
        }

        return vendors;
      },
      {
        optimisticData: [ vendor, ...vendors ],
      },
    );
  };
  
  const deleteVendor = async (vendor: Vendor) => {
    if (vendors === undefined)
      throw new Error('Attempting to delete vendor before vendors resolved');
    
    const updatedVendors = vendors.filter((v) => v.id !== vendor.id);

    await mutate(
      async () => {
        try {
          await jsonDelete(`${endpoint}/${vendor.id}`, vendor);
          showNotification({ color: 'green', title: 'Awesome!', message: 'Vendor removed successfully' });
          return updatedVendors;
        } catch (e) {
          showNotification({ color: 'red', title: 'Uh oh!', message: 'Something went wrong with removing the vendor! Try again later.' });
          console.error(e);
        }

        return vendors;
      },
      {
        optimisticData: updatedVendors,
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
