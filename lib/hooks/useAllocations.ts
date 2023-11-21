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

import { $, formatMoney, moneyToNumber, percentage } from 'lib/dineroHelpers';
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
  paymentMethodId?: number;
  amount          : Dinero<number>;
  type            : AllocationType;
  description?    : string;
}

export interface IVendorAllocations {
  expectedSubTotal: Dinero<number>;
  allocationTotal : Dinero<number>;
  allocations     : Array<IAllocation>;
}

export default function useAllocations(allocationsForm: IAllocationsForm | undefined) {
  const { invoices }       = useInvoices();
  const { paymentMethods } = usePaymentMethods();
  const { items }          = useItems('all');
  const { vendors }        = useVendors();

  const paymentTotals = usePaymentTotals(invoices, paymentMethods);

  return useMemo(() => {
    const vendorAllocations: Record<number, IVendorAllocations> = {};

    if (vendors === undefined || invoices === undefined || items === undefined || paymentTotals === undefined || allocationsForm === undefined) {
      return undefined;
    }

    for(const vendor of vendors) {
      let vendorSubTotal = $(0);

      // Calculate the vendor sub-total from the invoice transactions
      for (const invoice of invoices) {
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

    console.debug('[useAllocations] Calculating payment pools...', paymentTotals);

    const paymentPools = paymentTotals.map((paymentInfo) => {
      let pool = paymentInfo.subTotal;
      // pool = add(pool, paymentInfo.fees);
      // pool = add(pool, paymentInfo.taxes);
      // if (allocationsForm.includeFeesInAllocations) pool = add(pool, paymentInfo.fees);
      // if (allocationsForm.includeTaxesInAllocations) pool = add(pool, paymentInfo.taxes);
      return {
        id    : paymentInfo.paymentMethodId,
        name  : paymentInfo.paymentMethodName,
        amount: pool,
      };
    }).filter(pool => pool !== null && pool !== undefined);

    if (paymentPools.length <= 0) {
      console.error('[useAllocations] No payment pools available!')
      return false;
    }

    const totalPool = paymentPools.reduce((total, pool) => add(total, pool.amount), $(0));

    function payVendor(
      vendorId       : number,
      amount         : Dinero<number>,
      allocationType : AllocationType,
      paymentMethodId: number = -1,
      description    : string | undefined = undefined
    ): boolean {
      console.debug(`[useAllocations][payVendor] Paying vendor ${vendorId} ${formatMoney(amount)} from ${paymentMethodId > -1 ? paymentMethods?.find(method => method.id === paymentMethodId)?.name : 'any pool'}`);

      if (paymentPools.length <= 0) {
        console.error('[useAllocations][payVendor] No payment pools available!');
        return false;
      }

      // Get the pool we're paying from. If no specific payment method is
      // specified, then use the first available pool.
      const poolIndex = paymentMethodId > -1
        ? paymentPools.findIndex(pool => pool && pool.id === paymentMethodId)
        : 0;

      // If we're using a specific pool and failed to find it, that's a problem
      if (poolIndex === -1) {
        console.error(`[useAllocations][payVendor] Unable to find payment pool for paymentMethodId: ${paymentMethodId}`);
        return false;
      }

      if (paymentPools[poolIndex] === undefined) {
        console.error(`[useAllocations][payVendor] No pool found at that index`);
        return false;
      }

      // If we're using a specific pool and we don't have that much money in the pool... that's a problem.
      if (paymentMethodId > -1 && lessThan(paymentPools[poolIndex].amount, amount)) {
        console.error(`[useAllocations][payVendor] Attempted to assign more money than available in a payment pool. Pool: ${paymentPools[poolIndex].name}`);
        return false;
      }

      console.debug(`[useAllocations][payVendor] Getting minimum of ${formatMoney(paymentPools[poolIndex].amount)} and ${formatMoney(amount)}`);

      // Get how much we can actually pay. If there's less money in a pool than the amount
      // we will make up for it in the next pool
      const poolPayment = minimum([paymentPools[poolIndex].amount, amount]);

      console.debug(`[useAllocations][payVendor] Paying ${formatMoney(poolPayment)} to vendor ${vendorId} from ${paymentPools[poolIndex].name}`);

      vendorAllocations[vendorId].allocations.push({
        description,
        paymentMethodId: paymentPools[poolIndex].id,
        amount         : poolPayment,
        type           : allocationType,
      });

      const poolAdjustment = greaterThan(poolPayment, $(0))
        ? poolPayment
        : $(0);

      // Deduct the payment from the pool
      paymentPools[poolIndex].amount = subtract(paymentPools[poolIndex].amount, poolAdjustment);
      console.debug(`[useAllocations][payVendor] ${paymentPools[poolIndex].name} has ${formatMoney(paymentPools[poolIndex].amount)} remaining`);

      if (allocationType === 'expense') {
        console.debug(`[useAllocations][payVendor] Adjusting vendor ${vendorId}'s expeded total by ${formatMoney(poolPayment)}`);

        vendorAllocations[vendorId].expectedSubTotal = add(vendorAllocations[vendorId].expectedSubTotal, poolPayment);

        if (greaterThan(poolPayment, $(0))) {
          vendorAllocations[vendorId].allocationTotal = add(vendorAllocations[vendorId].allocationTotal, poolPayment);
        }
      } else {
        vendorAllocations[vendorId].allocationTotal = add(vendorAllocations[vendorId].allocationTotal, poolPayment);
      }

      // If a pool is empty, we want to remove it from the remaining pools
      // and check to see if there's more to pay off
      if (lessThanOrEqual(paymentPools[poolIndex].amount, $(0))) {
        console.debug(`[useAllocations][payVendor] ${paymentPools[poolIndex].name} is empty. Removing from pool list.`);

        paymentPools.shift();

        // Attempt to pay from the next pool. This should only ever occur when we are
        // not atempting to pay from a specific pool as we will have verified that above
        // in that scenario
        if (greaterThan(amount, poolPayment)) {
          console.debug(`[useAllocations][payVendor] Attempting to pay ${formatMoney(subtract(amount, poolPayment))} from the next pool`);
          return payVendor(vendorId, subtract(amount, poolPayment), allocationType);
        }
      }

      return true;
    }

    const equalSplitRatio = Math.floor((1 / (vendors ?? [1]).length) * 100);

    for (const expenseInfo of allocationsForm.sharedExpenses) {
      if (expenseInfo.shareType === 'equal') {
        for (const vendor of vendors ?? []) {
          const paymentAmount = vendor.id === expenseInfo.vendorId
            ? multiply(percentage($(expenseInfo.amount), equalSplitRatio), vendors.length - 1)
            : percentage($(-expenseInfo.amount), equalSplitRatio);

          payVendor(vendor.id, paymentAmount, 'expense', -1, expenseInfo.name);
        }
      } else {
        let reimbursementTotal = $(0);

        for (const vendor of vendors ?? []) {
          const vendorRatio = Math.floor((moneyToNumber(vendorAllocations[vendor.id].expectedSubTotal) / moneyToNumber(totalPool)) * 100);

          if (vendor.id === expenseInfo.vendorId) {
            continue;
          }

          const reimbursementAmount = percentage($(expenseInfo.amount), vendorRatio);
          reimbursementTotal = add(reimbursementTotal, reimbursementAmount);

          console.debug(`[useAllocations] Taking ${formatMoney(reimbursementAmount)} from vendor ${vendor.id} to pay ${expenseInfo.vendorId}`);

          payVendor(vendor.id, multiply(reimbursementAmount, -1), 'expense', -1, expenseInfo.name);
        }

        console.debug(`[useAllocations] Reimbursing ${formatMoney(reimbursementTotal)} to vendor ${expenseInfo.vendorId}`);

        payVendor(expenseInfo.vendorId, reimbursementTotal, 'expense', -1, expenseInfo.name);
      }
    }

    // Pay any of the manually assigned funds
    for (const assignmentInfo of allocationsForm.assignedMoney) {
      console.debug(`[useAllocations] Manually assigning ${assignmentInfo.amount} to vendor ${assignmentInfo.vendorId} from ${paymentMethods?.find(method => method.id === assignmentInfo.paymentMethodId)?.name}`);
      payVendor(assignmentInfo.vendorId, $(assignmentInfo.amount), 'manual', assignmentInfo.paymentMethodId);
    }

    // Pay out the remaining totals
    for(const vendor of vendors) {
      const unpaidTotal = subtract(vendorAllocations[vendor.id].expectedSubTotal, vendorAllocations[vendor.id].allocationTotal);
      console.debug(`[useAllocations] Paying ${formatMoney(unpaidTotal)} to vendor ${vendor.id}`);

      if (lessThanOrEqual(unpaidTotal, $(0))) {
        console.debug(`[useAllocations] Vendor ${vendor.id} has already been paid in full.`);
        continue;
      }

      payVendor(vendor.id, unpaidTotal, 'auto');
    }

    return vendorAllocations;
  }, [allocationsForm, invoices, items, paymentMethods, paymentTotals, vendors]);
}


