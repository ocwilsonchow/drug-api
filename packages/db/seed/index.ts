import { db } from "../index.ts";
import { seedDrugClasses } from "./drug-class.ts";
import { seedDrugs } from "./drug.ts";

async function main() {
  const classCount = await seedDrugClasses();
  const drugCount = await seedDrugs();
  console.log(`Seeded ${classCount} drug classes and ${drugCount} drugs`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$client.end();
  });
