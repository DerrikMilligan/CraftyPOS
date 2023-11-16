// import useSWR from 'swr';
import useSWR from 'swr';
import { Invoice, Transaction } from '@prisma/client';

import { getFetcher, jsonDelete } from '../fetching';

const endpoint = '/api/invoice';

export const useInvoices = () => {
  const {
    error,
    mutate,
    data: invoices,
  } = useSWR<Array<Invoice & { Transactions: Transaction[] }>>(endpoint, getFetcher());

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

          return updatedInvoices;
        } catch (e) {
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
