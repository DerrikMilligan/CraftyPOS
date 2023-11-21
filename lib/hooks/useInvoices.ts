// import useSWR from 'swr';
import useSWR from 'swr';
import { Invoice, Transaction } from '@prisma/client';

import { getFetcher, jsonDelete } from '../fetching';
import { showNotification } from '@mantine/notifications';

const endpoint = '/api/invoice';

export type HookInvoice = Invoice & { Transactions: Transaction[] };

export const useInvoices = () => {
  const {
    error,
    mutate,
    data: invoices,
  } = useSWR<Array<HookInvoice>>(endpoint, getFetcher());

  const deleteInvoice = async (invoice: Invoice) => {
    if (invoices === undefined)
      throw new Error('Attempting to delete an invoice before they resolved');

    const updatedInvoices = invoices.filter((i) => i.id !== invoice.id);

    await mutate(
      async () => {
        try {
          const response = await jsonDelete(`${endpoint}/${invoice.id}`, invoice);

          if (response.success === false)
            throw new Error('Bubble up the error');

          showNotification({ color: 'green', title: 'Removed!', message: 'Invoice removed successfully' });
          return updatedInvoices;
        } catch (e) {
          showNotification({ color: 'red', title: 'Uh oh!', message: 'Something went wrong with removing the invoice! Try again later.' });
          console.error(e);
        }

        return invoices;
      },
      {
        optimisticData: updatedInvoices,
      },
    );
  }

  return {
    invoices,
    deleteInvoice,
    isLoading: !error && invoices === undefined,
    isError  : error,
  };
}

export default useInvoices;
