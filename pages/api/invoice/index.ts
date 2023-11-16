import type { NextApiRequest, NextApiResponse } from 'next'

import { prisma } from '../../../lib/db';

import { Transaction, Invoice, Item } from '@prisma/client';
import {
  $,
  calculateProcessingFees,
  calculateSalesTax,
  calculateSubTotal, calculateTotal,
  moneyToNumber,
} from '../../../lib/dineroHelpers';
import { getToken } from 'next-auth/jwt';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Array<Invoice & { Transactions: Transaction[] }> | Invoice & { Transactions: Transaction[] } | GenericResponse<null>>
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (token === null)
    return res.status(500).json({ success: false, message: 'Not authorized to make this request!' });

  if (req.method === 'GET') {
    const invoices = await prisma.invoice.findMany({
      include: { Transactions: true },
      orderBy: { timestamp: 'desc' },
      where  : { archived: false },
    });

    return res.status(200).json(invoices);
  }

  // Make sure we're posting
  if (req.method === 'POST') {
    const {
      Transactions,
      checkNumber,
      paymentMethodId,
      processingFees,
      salesTax,
      subTotal,
      total,
    } = req.body as Invoice & { Transactions: Array<Transaction & { Item: Item }> };

    if (Transactions === undefined || paymentMethodId === undefined)
      return res.status(500).json({ success: false, message: 'Missing required data' });

    if (Array.isArray(Transactions) === false || Transactions.length <= 0)
      return res.status(500).json({ success: false, message: 'Needs at least one transaction' });

    const paymentMethod = await prisma.paymentMethod.findFirst({ where: { id: paymentMethodId } });
    if (paymentMethod === null)
      return res.status(500).json({ success: false, message: 'Invalid payment method' });

    const items = await prisma.item.findMany({ where: { id: { in: Transactions.map(t => t.Item.id) } }, include: { Transactions: true } });
    if (items === null || items.length !== Transactions.length)
      return res.status(500).json({ success: false, message: 'Invalid transaction items' });

    const transactions = [] as Transaction[];

    for (const t of Transactions) {
      const item = items.find(i => i.id === t.itemId);

      if (item === undefined)
        return res.status(500).json({ success: false, message: `The item id: ${t.itemId} didn't match up with an item in the database` });

      const previouslySold = item.Transactions.reduce((total, i) => total + i.itemQuantity, 0);

      if (item.stock < previouslySold + t.itemQuantity)
        return res.status(500).json({ success: false, message: `There isn't enough stock remaining to sell ${t.itemQuantity} of ${item.name}` });

      // Create the new item that we'll use that is clean with only the values we want
      transactions.push({
        itemId: item.id,
        itemQuantity: t.itemQuantity,
        // Just want to make sure we have valid money
        pricePer: moneyToNumber($(t.pricePer)),
      } as Transaction);
    }

    const globalConfig = await prisma.globalConfig.findFirst();
    if (globalConfig === null)
      return res.status(500).json({ success: false, message: `Couldn't get global config` });

    // Verify the prices
    const newSubTotal = calculateSubTotal(transactions);
    const newSalesTax = calculateSalesTax(newSubTotal, globalConfig);
    const newProcessingFees = calculateProcessingFees(newSubTotal, paymentMethod);
    const newTotal = calculateTotal(newSubTotal, newSalesTax, newProcessingFees, paymentMethod);

    if (moneyToNumber(newSubTotal) !== subTotal)
      return res.status(500).json({ success: false, message: `Sub-total verification failed!` });

    if (moneyToNumber(newSalesTax) !== salesTax)
      return res.status(500).json({ success: false, message: `Sales tax verification failed!` });

    if (moneyToNumber(newProcessingFees) !== processingFees)
      return res.status(500).json({ success: false, message: `Processing fees verification failed!` });

    if (moneyToNumber(newTotal) !== total)
      return res.status(500).json({ success: false, message: `Total verification failed!` });

    const invoice = await prisma.invoice.create({
      data: {
        checkNumber    : checkNumber,
        subTotal       : moneyToNumber(newSubTotal),
        salesTax       : moneyToNumber(newSalesTax),
        processingFees : moneyToNumber(newProcessingFees),
        total          : moneyToNumber(newTotal),
        paymentMethodId: paymentMethod.id,
        archived       : false,
        Transactions   : { createMany: { data: transactions } },
      },
      include: { Transactions: true },
    });

    if (invoice === null)
      return res.status(500).json({ success: false, message: `Failed to save invoice` });

    return res.status(200).json(invoice);
  }

  return res.status(500).json({ success: false, message: 'Invalid request' });
}
