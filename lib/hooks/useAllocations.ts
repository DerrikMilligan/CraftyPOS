import { useMemo } from 'react';

import { Dinero, greaterThan, lessThanOrEqual, subtract} from 'dinero.js';
import { add, lessThan, minimum, multiply } from 'dinero.js';

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
  vendorId       : number;
  paymentMethodId: number;
  amount         : number;
}

export interface ISharedExpense {
  name     : string;
  vendorId : number;
  amount   : number;
  shareType: ShareType;
}

export interface IAllocation {
  paymentTypeId: number;
  amount       : Dinero<number>;
  type         : AllocationType;
}

export interface IVendorAllocations {
  expectedSubTotal: Dinero<number>;
  allocationTotal : Dinero<number>;
  allocations     : Array<IAllocation>;
}

export default function useAllocations(allocationsForm: IAllocationsForm) {
  const { invoices } = useInvoices();
  const { paymentMethods } = usePaymentMethods();
  const { items } = useItems('all');
  const { vendors } = useVendors();

  const paymentTotals = usePaymentTotals(invoices, paymentMethods);

  return useMemo(() => {
    const errors = [];
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
        expectedSubTotal: vendorSubTotal,
        allocationTotal : $(0),
        allocations     : [],
      };
    }

    const paymentPools = paymentTotals.map((paymentInfo) => {
      let pool = paymentInfo.subTotal;
      if (allocationsForm.includeFeesInAllocations) pool = add(pool, paymentInfo.fees);
      if (allocationsForm.includeTaxesInAllocations) pool = add(pool, paymentInfo.taxes);
      return {
        id    : paymentInfo.paymentMethodId,
        name  : paymentInfo.paymentMethodName,
        amount: pool,
      };
    });

    // const equalSplitRatio = (1 / (vendors ?? [1]).length) * 100;
    //
    // for (const expenseInfo of allocationsForm.sharedExpenses) {
    //   if (expenseInfo.shareType === 'equal') {
    //     for (const vendor of vendors ?? []) {
    //       if (vendor.id === expenseInfo.vendorId) {
    //         vendorAllocations[vendor.id].allocations.push({
    //           paymentTypeId: expenseInfo.,
    //           amount       : $(expenseInfo.amount * equalSplitRatio),
    //           type         : 'expense',
    //         });
    //       }
    //     }
    //   }
    // }

    function payVendor(vendorId: number, amount: Dinero<number>, paymentMethodId: number = -1): boolean {
      if (paymentPools.length <= 0) {
        errors.push('[payVendor] No payment pools available!');
        return false;
      }

      // Get the pool we're paying from. If no specific payment method is
      // specified, then use the first available pool.
      const poolIndex = paymentMethodId > -1
        ? paymentPools.findIndex(pool => pool.id === paymentMethodId)
        : 0;

      // If we're using a specific pool and failed to find it, that's a problem
      if (poolIndex === -1) {
        errors.push(`[payVendor] Unable to find payment pool for paymentMethodId: ${paymentMethodId}`);
        return false;
      }

      // If we're using a specific pool and we don't have that much money in the pool... that's a problem.
      if (paymentMethodId > -1 && lessThan(paymentPools[poolIndex].amount, amount)) {
        errors.push(`[payVendor] Attempted to assign more money than available in a payment pool. Pool: ${paymentPools[poolIndex].name}`);
        return false;
      }

      // Get how much we can actually pay. If there's less money in a pool than the amount
      // we will make up for it in the next pool
      const poolPayment = minimum([paymentPools[poolIndex].amount, amount]);

      // Deduct the payment from the pool
      paymentPools[poolIndex].amount = subtract(paymentPools[poolIndex].amount, poolPayment);

      vendorAllocations[vendorId].allocationTotal = add(vendorAllocations[vendorId].allocationTotal, poolPayment);
      vendorAllocations[vendorId].allocations.push({
        paymentTypeId: paymentPools[poolIndex].id,
        amount       : poolPayment,
        type         : 'manual',
      });

      // If a pool is empty, we want to remove it from the remaining pools
      // and check to see if there's more to pay off
      if (lessThanOrEqual(paymentPools[poolIndex].amount, $(0))) {
        paymentPools.shift();

        // Attempt to pay from the next pool. This should only ever occur when we are
        // not atempting to pay from a specific pool as we will have verified that above
        // in that scenario
        if (greaterThan(amount, poolPayment)) {
          return payVendor(vendorId, subtract(amount, poolPayment));
        }
      }

      return true;
    }

    for (const assignmentInfo of allocationsForm.assignedMoney) {
      const pool = paymentPools.find(pool => pool.id === assignmentInfo.paymentMethodId);
      if (!pool) continue;
      pool.amount = subtract(pool.amount, $(assignmentInfo.amount));
    }

    return vendorAllocations;
  }, [allocationsForm, invoices, items, paymentTotals, vendors]);
}


