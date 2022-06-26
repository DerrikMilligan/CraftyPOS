import type { NextApiRequest, NextApiResponse } from 'next'

import { Item, Tag, Vendor } from '@prisma/client';

import { prisma } from '../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Item & { Vendor: Vendor, Tags: Tag[] }|GenericResponse<null>>
) {
  // Make sure we're posting
  if (req.method === 'PUT') {
    const { id, name, price, stock, vendorId, Tags } = req.body;

    if (id === undefined || Number.parseInt(id) <= 0 || name === undefined || price === undefined || stock === undefined || vendorId === undefined)
      return res.status(500).json({ success: false, message: 'Missing required data' });

    const vendor = await prisma.vendor.findFirst({ where: { id: vendorId } });

    if (vendor === null)
      return res.status(500).json({ success: false, message: 'Invalid vendor' });
    
    try {
      const item = await prisma.item.update({
        data: {
          name,
          price,
          stock,
          vendorId,
          Tags: { set: Tags.map((t: Tag) => ({ id: t.id })) },
        },
        where: { id },
        include: { Vendor: true, Tags: true },
      });

      return res.status(200).json(item);
    } catch (e) {
      return res.status(500).json({ success: false, message: `Failed to update: ${(e as Error).message}` });
    }
  }
  
  if (req.method === 'DELETE') {
    const itemId = req.query.itemId as string;
    
    try {
      const id = Number.parseInt(itemId);
      await prisma.item.delete({ where: { id } });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Failed to delete item!' });
    }
    
    return res.status(200).json({ success: true, message: 'Successfully deleted item' });
  }

  return res.status(500).json({ success: false, message: 'Invalid request' });
}
