// One-off script to create (or reset) the single admin account NextAuth's
// credentials provider authenticates against — see SPEC.md §8 ("no
// failed-login lockout or self-service password reset... reset via direct
// DB access/reseed").
//
// Usage: tsx scripts/create-admin.ts <email> <password>

import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error("Usage: tsx scripts/create-admin.ts <email> <password>");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  console.log(`Admin user ready: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
