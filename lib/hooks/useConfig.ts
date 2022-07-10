// import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';
import { GlobalConfig } from '@prisma/client';

import { getFetcher } from '../fetching';
// import { showNotification } from '@mantine/notifications';

const endpoint = '/api/config';

export const useConfig = () => {
  const {
    error,
    // mutate,
    data: config,
  } = useSWRImmutable<GlobalConfig>(endpoint, getFetcher());

  // const updateConfig = async (vendor: Vendor) => {
  //   if (config === undefined)
  //     throw new Error('Attempting to update vendor before config resolved');
  //
  //   await mutate(
  //     async () => {
  //       try {
  //         const updatedVendor = await jsonPut(`${endpoint}/${vendor.id}`, vendor);
  //         showNotification({ color: 'green', title: 'Updated!', message: 'Vendor updated successfully' });
  //         return [ updatedVendor, ...otherVendors ];
  //       } catch (e) {
  //         showNotification({ color: 'red', title: 'Uh oh!', message: 'Something went wrong when saving the vendor! Try again later.' });
  //       }
  //
  //       return config;
  //     },
  //     {
  //       optimisticData: [ vendor, ...otherVendors ],
  //     },
  //   );
  // };

  return {
    // updateConfig,
    config,
    isLoading: !error && config === undefined,
    isError  : error,
  };
}

export default useConfig;
