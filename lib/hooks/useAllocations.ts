import { useMemo } from 'react';

import { Dinero, equal, greaterThan, lessThanOrEqual, subtract} from 'dinero.js';
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
  initialExpectedSubTotal: Dinero<number>;
  expectedSubTotal       : Dinero<number>;
  allocationTotal        : Dinero<number>;
  allocations            : Array<IAllocation>;
}

export interface IUseAllocationsResult {
  payoutPlan    : Record<number, IVendorAllocations>;
  reimbursements: Record<number, Array<IAllocation>>;
  paymentPools  : Array<ITotals>
}

export default function useAllocations(allocationsForm: IAllocationsForm | undefined) {
  const { invoices }       = useInvoices();
  const { paymentMethods } = usePaymentMethods();
  const { items }          = useItems('all');
  const { vendors }        = useVendors();

  const paymentTotals = usePaymentTotals(invoices, paymentMethods);

  return useMemo(() => {
    const result = {
      payoutPlan    : {},
      reimbursements: {},
      paymentPools  : []
    } as IUseAllocationsResult;

    // const vendorAllocations: Record<number, IVendorAllocations> = {};

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

      result.reimbursements[vendor.id] = [];

      result.payoutPlan[vendor.id] = {
        initialExpectedSubTotal: vendorSubTotal,
        expectedSubTotal       : vendorSubTotal,
        allocationTotal        : $(0),
        allocations            : [],
      };
    }

    console.debug('[useAllocations] Calculating payment pools...', paymentTotals);

    result.paymentPools = paymentTotals.filter(pool => pool !== null && pool !== undefined);

    if (result.paymentPools.length <= 0) {
      console.error('[useAllocations] No payment pools available!')
      return false;
    }

    const totalPool = result.paymentPools.reduce((total, pool) => add(total, pool.subTotal), $(0));

    function payVendor(
      vendorId       : number,
      amount         : Dinero<number>,
      allocationType : AllocationType,
      paymentMethodId: number = -1,
      description    : string | undefined = undefined
    ): boolean {
      console.debug(`[useAllocations][payVendor] Paying vendor ${vendorId} ${formatMoney(amount)} from ${paymentMethodId > -1 ? paymentMethods?.find(method => method.id === paymentMethodId)?.name : 'any pool'}`);

      if (result.paymentPools.length <= 0) {
        console.error('[useAllocations][payVendor] No payment pools available!');
        return false;
      }

      // Get the pool we're paying from. If no specific payment method is
      // specified, then use the first available pool.
      const poolIndex = paymentMethodId > -1
        ? result.paymentPools.findIndex(pool => pool && pool.paymentMethodId === paymentMethodId)
        : result.paymentPools.findIndex(pool => pool && greaterThan(pool.subTotal, $(0)));

      // If we're using a specific pool and failed to find it, that's a problem
      if (poolIndex === -1) {
        console.error(`[useAllocations][payVendor] Unable to find payment pool for paymentMethodId: ${paymentMethodId}`);
        return false;
      }

      if (result.paymentPools[poolIndex] === undefined) {
        console.error(`[useAllocations][payVendor] No pool found at that index`);
        return false;
      }

      // If we're using a specific pool and we don't have that much money in the pool... that's a problem.
      if (paymentMethodId > -1 && lessThan(result.paymentPools[poolIndex].subTotal, amount)) {
        console.error(`[useAllocations][payVendor] Attempted to assign more money than available in a payment pool. Pool: ${result.paymentPools[poolIndex].paymentMethodName}`);
        return false;
      }

      console.debug(`[useAllocations][payVendor] Getting minimum of ${formatMoney(result.paymentPools[poolIndex].subTotal)} and ${formatMoney(amount)}`);

      // Get how much we can actually pay. If there's less money in a pool than the amount
      // we will make up for it in the next pool
      const poolPayment = minimum([result.paymentPools[poolIndex].subTotal, amount]);

      if (equal(poolPayment, $(0))) {
        console.error(`[useAllocations][payVendor] Tried to make a payment of 0`);
        return false;
      }

      console.debug(`[useAllocations][payVendor] Paying ${formatMoney(poolPayment)} to vendor ${vendorId} from ${result.paymentPools[poolIndex].paymentMethodName}`);

      // Deduct the payment from the pool
      result.paymentPools[poolIndex].subTotal = subtract(result.paymentPools[poolIndex].subTotal, poolPayment);
      console.debug(`[useAllocations][payVendor] ${result.paymentPools[poolIndex].paymentMethodName} has ${formatMoney(result.paymentPools[poolIndex].subTotal)} remaining`);

      result.payoutPlan[vendorId].allocations.push({
        description,
        paymentMethodId: result.paymentPools[poolIndex].paymentMethodId,
        amount         : poolPayment,
        type           : allocationType,
      });

      result.payoutPlan[vendorId].allocationTotal = add(result.payoutPlan[vendorId].allocationTotal, poolPayment);

      // If a pool is empty, we want to remove it from the remaining pools
      // and check to see if there's more to pay off
      if (lessThanOrEqual(result.paymentPools[poolIndex].subTotal, $(0))) {
        // console.debug(`[useAllocations][payVendor] ${result.paymentPools[poolIndex].paymentMethodName} is empty. Removing from pool list.`);
        // result.paymentPools.shift();

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

    function reimburseVendor(vendorId: number, amount: Dinero<number>, description: string) {
      result.payoutPlan[vendorId].expectedSubTotal = add(result.payoutPlan[vendorId].expectedSubTotal, amount);
      console.debug(`[useAllocations] Adjusting vendor ${vendorId}'s expeded total by ${formatMoney(amount)}`);

      // Store the re-imburesement to display it but it won't be part of the payout plan. Adjusting the vendors expected sub-total is all that's needed
      result.reimbursements[vendorId].push({
        description: description,
        amount     : amount,
        type       : 'expense',
      });
      console.debug(`[useAllocations] Reimbursing ${formatMoney(amount)} to vendor ${vendorId} for ${description}`);
    }

    const equalSplitRatio = Math.floor((1 / (vendors ?? [1]).length) * 100);

    for (const expenseInfo of allocationsForm.sharedExpenses) {
      if (expenseInfo.shareType === 'equal') {
        for (const vendor of vendors ?? []) {
          const paymentAmount = vendor.id === expenseInfo.vendorId
            ? multiply(percentage($(expenseInfo.amount), equalSplitRatio), vendors.length - 1)
            : percentage($(-expenseInfo.amount), equalSplitRatio);

          reimburseVendor(vendor.id, paymentAmount, expenseInfo.name);
        }
      } else {
        let reimbursementTotal = $(0);

        for (const vendor of vendors ?? []) {
          const vendorRatio = Math.floor((moneyToNumber(result.payoutPlan[vendor.id].expectedSubTotal) / moneyToNumber(totalPool)) * 100);

          if (vendor.id === expenseInfo.vendorId) {
            continue;
          }

          let reimbursementAmount = percentage($(expenseInfo.amount), vendorRatio);
          reimbursementTotal = add(reimbursementTotal, reimbursementAmount);
          reimbursementAmount = multiply(reimbursementAmount, -1);

          reimburseVendor(vendor.id, reimbursementAmount, expenseInfo.name);
        }

        console.debug(`[useAllocations] Reimbursing ${formatMoney(reimbursementTotal)} to vendor ${expenseInfo.vendorId}`);
        reimburseVendor(expenseInfo.vendorId, reimbursementTotal, expenseInfo.name);
      }
    }

    // Pay any of the manually assigned funds
    for (const assignmentInfo of allocationsForm.assignedMoney) {
      console.debug(`[useAllocations] Manually assigning ${assignmentInfo.amount} to vendor ${assignmentInfo.vendorId} from ${paymentMethods?.find(method => method.id === assignmentInfo.paymentMethodId)?.name}`);
      payVendor(assignmentInfo.vendorId, $(assignmentInfo.amount), 'manual', assignmentInfo.paymentMethodId);
    }

    // Pay out the remaining totals
    for(const vendor of vendors) {
      const unpaidTotal = subtract(result.payoutPlan[vendor.id].expectedSubTotal, result.payoutPlan[vendor.id].allocationTotal);
      console.debug(`[useAllocations] Paying ${formatMoney(unpaidTotal)} to vendor ${vendor.id}`);

      if (lessThanOrEqual(unpaidTotal, $(0))) {
        console.debug(`[useAllocations] Vendor ${vendor.id} has already been paid in full.`);
        continue;
      }

      payVendor(vendor.id, unpaidTotal, 'auto');
    }

    return result;
  }, [allocationsForm, invoices, items, paymentMethods, paymentTotals, vendors]);
}


