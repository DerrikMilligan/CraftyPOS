import type { NextApiRequest, NextApiResponse } from 'next'

import { PrismaClient, Inventory, Tag, Vendor } from '.prisma/client';

const prisma = new PrismaClient();

const defaultRowsPerPage = 20;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Inventory|Inventory[]|GenericResponse<null>>
) {
  // Make sure we're posting
  if (req.method === 'POST') {
    const { vendorId, price, stock, name, tags } = req.body;

    if (vendorId === undefined || price === undefined || stock === undefined || name === undefined)
      return res.status(500).json({ success: false, message: 'Missing required data' });

    const vendor = await prisma.vendor.findFirst({ where: { id: vendorId } });

    if (vendor === null)
      return res.status(500).json({ success: false, message: 'Invalid vendor' });

    // let tags: Tag[] = [];
    // if (tagsRaw !== undefined && Array.isArray(tagsRaw)) {
    //   for (const tagName of tagsRaw) {
    //     let tag = await prisma.tag.findFirst({ where: { name: tagName } });
    //
    //     if (tag === null)
    //       tag = await prisma.tag.create({ data: { name: tagName } });
    //
    //     tags.push(tag);
    //   }
    // }
    
    const item = await prisma.inventory.create({
      data: {
        name,
        price,
        stock,
        // tags: { connect: tags },
        // tags: { connectOrCreate: tags.map((name: string) => ({ name })) },
        vendorId: vendor.id,
      },
    });

    return res.status(200).json(item);
  }

  if (req.method === 'GET') {
    if (Array.isArray(req.query?.page)) req.query.page = req.query.page[0];
    if (Array.isArray(req.query?.count)) req.query.count = req.query.count[0];

    const page = req.query?.page && (Number.parseInt(req.query.page) - 1) || 0;
    const resultsPerPage = req.query?.count && Number.parseInt(req.query.count) || defaultRowsPerPage;

    const items = await prisma.inventory.findMany({
      take: resultsPerPage,
      skip: page * resultsPerPage,
      orderBy: { displayName: 'desc' },
      include: { vendor: true, tags: true },
    });

    return res.status(200).json(items);
  }

  return res.status(500).json({ success: false, message: 'Invalid request' });
}
