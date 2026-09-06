import "dotenv/config";
import { prisma } from "../lib/prisma";

// Full building content (historyFr/historyEn, styleTags, exact addresses)
// comes later — see SPEC.md §12 "Seed Data" for the source list of 8
// buildings. This stub only establishes the shape each entry will take.
//
// The single admin account is not seeded here — see
// scripts/create-admin.ts (run once, out of band, per SPEC.md §8).

type BuildingSeed = {
  slug: string;
  name: string;
  address: string;
  historyFr: string;
  historyEn: string;
  styleTags: string[];
};

const buildings: BuildingSeed[] = [
  // {
  //   slug: "eglise-notre-dame-du-travail",
  //   name: "Église Notre-Dame-du-Travail",
  //   address: "59 rue Vercingétorix, 75014 Paris",
  //   historyFr: "TODO",
  //   historyEn: "TODO",
  //   styleTags: [],
  // },
  // ...7 more — see SPEC.md §12
];

async function main() {
  for (const building of buildings) {
    await prisma.building.upsert({
      where: { slug: building.slug },
      update: {},
      create: building,
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
