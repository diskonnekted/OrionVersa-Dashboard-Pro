import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
  console.log("Cleaning old users...");
  await prisma.user.deleteMany({});

  const users = [
    { username: "admin", password: "admin123", name: "Administrator Utama", role: "ADMIN" },
    { username: "kepala", password: "kepala123", name: "Kepala Pelaksana BPBD", role: "KEPALA" },
    { username: "bpbd", password: "bpbd123", name: "Aktivis Lapangan BPBD", role: "USER" }
  ];

  for (const u of users) {
    await prisma.user.create({ data: u });
  }

  console.log("Auth Seed Complete. 3 Roles are ready.");
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
