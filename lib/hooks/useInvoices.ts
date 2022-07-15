// import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';
import { Invoice, Transaction } from '@prisma/client';

import { getFetcher } from '../fetching';

const endpoint = '/api/invoice';

export const useInvoices = () => {
  const {
    error,
    data: invoices,
  } = useSWRImmutable<Array<Invoice & { Transactions: Transaction[] }>>(endpoint, getFetcher());

  return {
    invoices,
    isLoading: !error && invoices === undefined,
    isError  : error,
  };
}

export default useInvoices;
