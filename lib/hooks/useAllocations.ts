import { useMemo } from 'react';

import type { Dinero} from 'dinero.js';
import { add, multiply } from 'dinero.js';

import type { IAllocationsForm } from 'components/Reports/AllocationTool';

import useInvoices       from './useInvoices';
import useVendors        from './useVendors';
import useItems          from './useItems';
import usePaymentMethods from './usePaymentMethods';
import type { ITotals }  from './usePaymentTotals';
import usePaymentTotals  from './usePaymentTotals';

import { $, formatMoney, percentage } from 'lib/dineroHelpers';
import { Vendor } from '@prisma/client';
import { HookInvoice } from './useInvoices';

export type ShareType = 'equal' | 'earnings';

export type AllocationType = 'manual' | 'expense' | 'auto';

export interface IAssignedMoney {
  vendor       : string;
  amount       : number;
  paymentMethod: string;
}

export interface ISharedExpense {
  name     : string;
  vendor   : number;
  amount   : number;
  shareType: ShareType;
}

export interface IAllocation {
  paymentTypeId: number;
  amount       : Dinero<number>;
  type         : AllocationType;
}

export interface IVendorAllocations {
  subTotal   : Dinero<number>;
  allocations: Array<IAllocation>;
}

export default function useAllocations(allocationsForm: IAllocationsForm) {
  const { invoices } = useInvoices();
  const { paymentMethods } = usePaymentMethods();
  const { items } = useItems('all');
  const { vendors } = useVendors();

  const paymentTotals = usePaymentTotals(invoices, paymentMethods);

  return useMemo(() => {
    const vendorAllocations: Record<number, IVendorAllocations> = {};

    for(const vendor of vendors ?? []) {
      let vendorSubTotal = $(0);

      // Calculate the vendor sub-total from the invoice transactions
      for (const invoice of invoices ?? []) {
        for (const transaction of invoice.Transactions) {
          const item = items?.find(item => item.id === transaction.itemId);

          if (!item || item.vendorId !== vendor.id)
            continue;

          vendorSubTotal = add(vendorSubTotal, multiply($(transaction.pricePer), transaction.itemQuantity));
        }
      }

      vendorAllocations[vendor.id] = {
        subTotal   : vendorSubTotal,
        allocations: [],
      };
    }

    for (const expenseInfo of allocationsForm.sharedExpenses) {
      if (expenseInfo.shareType === 'equal')
    }

    // Figure out the vendor totals from the transaction sub-totals

    return vendorAllocations;
  }, [allocationsForm, invoices, items, paymentTotals, vendors]);
}


