import { db } from "../index.ts";
import { seedDrugClasses } from "./drug-class.ts";
import { seedDrugs } from "./drug.ts";
import { seedIndications } from "./indication.ts";
import { seedDrugClassIndications } from "./drug-class-indication.ts";

async function main() {
  const classCount = await seedDrugClasses();
  const drugCount = await seedDrugs();
  const indicationCount = await seedIndications();
  const linkCount = await seedDrugClassIndications();
  console.log(
    `Seeded ${classCount} drug classes, ${drugCount} drugs, ${indicationCount} indications, and ${linkCount} drug-class/indication links`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$client.end();
  });
