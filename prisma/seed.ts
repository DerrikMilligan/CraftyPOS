import { PrismaClient, Prisma } from '@prisma/client';

import { globalConfig, paymentMethods } from './data';

const prisma = new PrismaClient();

const main = async () => {
  console.log('Beginning seeding...');

  console.log('Deleting payment methods');
  // Truncate the table and reset the AUTO_INCREMENTS. We need CASCADE for the foreign key constraints
  await prisma.$queryRaw`TRUNCATE TABLE "PaymentMethod" RESTART IDENTITY CASCADE;`;
  console.log('Seeding payment methods');
  await prisma.paymentMethod.createMany({ data: paymentMethods });
  console.log('done...');

  console.log('Deleting global config');
  await prisma.$queryRaw`TRUNCATE TABLE "GlobalConfig" RESTART IDENTITY CASCADE;`;
  console.log('Seeding global config');
  await prisma.globalConfig.create({ data: globalConfig });
  console.log('done...');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
