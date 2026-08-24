import { sql } from "drizzle-orm";
import { db } from "../index.ts";
import { drugClass } from "../schema/drug-class.ts";

type DrugClassSeed = {
  id: number;
  name: string;
  slug: string;
};

function isDrugClassSeed(row: unknown): row is DrugClassSeed {
  if (typeof row !== "object" || row === null) {
    return false;
  }

  const candidate = row as Record<string, unknown>;
  return (
    typeof candidate.id === "number" &&
    typeof candidate.name === "string" &&
    typeof candidate.slug === "string"
  );
}

function parseDrugClassSeeds(value: unknown): DrugClassSeed[] {
  if (!Array.isArray(value)) {
    throw new Error("drug-classes.json must be an array");
  }

  return value.map((row, index) => {
    if (!isDrugClassSeed(row)) {
      throw new Error(`Invalid drug class at index ${index}`);
    }

    return { id: row.id, name: row.name, slug: row.slug };
  });
}

export async function seedDrugClasses() {
  const path = new URL("../../../data/drug-classes.json", import.meta.url);
  const rows = parseDrugClassSeeds(await Bun.file(path).json());

  await db
    .insert(drugClass)
    .values(rows)
    .onConflictDoUpdate({
      target: drugClass.id,
      set: {
        name: sql`excluded.name`,
        slug: sql`excluded.slug`,
        updatedAt: sql`now()`,
      },
    });

  await db.execute(sql`
    SELECT setval(
      pg_get_serial_sequence('drug_class', 'id'),
      COALESCE((SELECT MAX(id) FROM drug_class), 1),
      (SELECT EXISTS (SELECT 1 FROM drug_class))
    )
  `);

  return rows.length;
}
