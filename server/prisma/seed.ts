import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const personal = await prisma.account.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Personal Account',
      description: 'Main personal trading account',
      initialCapital: 25000,
    },
  });

  const prop = await prisma.account.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Prop Firm Account',
      description: 'Prop firm evaluation account',
      initialCapital: 50000,
    },
  });

  const broker = await prisma.account.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Broker Account',
      description: 'Broker trading account',
      initialCapital: 10000,
    },
  });

  console.log('Seeded accounts:', { personal: personal.id, prop: prop.id, broker: broker.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
