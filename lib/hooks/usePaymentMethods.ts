import useSWRImmutable from 'swr/immutable';
import { PaymentMethod } from '@prisma/client';

import { getFetcher } from '../fetching';

const endpoint = '/api/paymentMethods';

export const usePaymentMethods = () => {
  const {
    error,
    data: paymentMethods,
  } = useSWRImmutable<Array<PaymentMethod>>(endpoint, getFetcher());

  return {
    paymentMethods,
    isLoading: !error && paymentMethods === undefined,
    isError  : error,
  };
}

export default usePaymentMethods;
