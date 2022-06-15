import type { NextApiRequest, NextApiResponse } from 'next'

import { PrismaClient, Inventory } from '.prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Inventory|GenericResponse<null>>
) {
  // Make sure we're posting
  if (req.method === 'PUT') {
    const { id, name, price, stock, vendorId } = req.body;

    if (id === undefined || Number.parseInt(id) <= 0 || name === undefined || price === undefined || stock === undefined || vendorId === undefined)
      return res.status(500).json({ success: false, message: 'Missing required data' });

    const vendor = await prisma.vendor.findFirst({ where: { id: vendorId } });

    if (vendor === null)
      return res.status(500).json({ success: false, message: 'Invalid vendor' });

    try {
      const item = await prisma.inventory.update({
        data: {
          name,
          price,
          stock,
          vendorId,
        },
        where: { id },
      });

      return res.status(200).json(item);
    } catch (e) {
      return res.status(500).json({ success: false, message: `Failed to update: ${(e as Error).message}` });
    }
  }
  
  if (req.method === 'DELETE') {
    const inventoryId = req.query.inventoryId as string;
    
    try {
      const id = Number.parseInt(inventoryId);
      await prisma.inventory.delete({ where: { id } });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Failed to delete item!' });
    }
    
    return res.status(200).json({ success: true, message: 'Successfully deleted item' });
  }

  return res.status(500).json({ success: false, message: 'Invalid request' });
}
