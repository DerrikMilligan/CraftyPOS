import type { NextApiRequest, NextApiResponse } from 'next'

import { Item, Tag, Vendor } from '.prisma/client';

import { prisma } from '../../../lib/db';

const defaultRowsPerPage = 20;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Item & { Vendor: Vendor, Tags: Tag[] }|Pagination<Array<Item & { Vendor: Vendor, Tags: Tag[] }>>|GenericResponse<null>>
) {
  // Make sure we're posting
  if (req.method === 'POST') {
    const { vendorId, price, stock, name, Tags } = req.body;

    if (vendorId === undefined || price === undefined || stock === undefined || name === undefined)
      return res.status(500).json({ success: false, message: 'Missing required data' });

    const vendor = await prisma.vendor.findFirst({ where: { id: vendorId } });

    if (vendor === null)
      return res.status(500).json({ success: false, message: 'Invalid vendor' });

    const item = await prisma.item.create({
      data: {
        name,
        price,
        stock,
        vendorId: vendor.id,
        Tags: { connect: (Tags as Tag[]).map((t) => ({ id: t.id })) },
      },
      include: { Vendor: true, Tags: true },
    });

    return res.status(200).json(item);
  }

  if (req.method === 'GET') {
    if (Array.isArray(req.query?.page)) req.query.page = req.query.page[0];
    if (Array.isArray(req.query?.count)) req.query.count = req.query.count[0];

    const page = req.query?.page && (Number.parseInt(req.query.page) - 1) || 0;
    const resultsPerPage = req.query?.count && Number.parseInt(req.query.count) || defaultRowsPerPage;

    const items = await prisma.item.findMany({
      take: resultsPerPage,
      skip: page * resultsPerPage,
      orderBy: { name: 'desc' },
      include: { Vendor: true, Tags: true },
    });
    
    const totalItems = await prisma.item.count();

    return res.status(200).json({
      page,
      totalPages: Math.ceil(totalItems / resultsPerPage),
      data: items,
    });
  }

  return res.status(500).json({ success: false, message: 'Invalid request' });
}
