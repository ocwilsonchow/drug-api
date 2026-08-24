import { sql } from "drizzle-orm";
import { db } from "../index.ts";
import { drug } from "../schema/drug.ts";
import { drugClass } from "../schema/drug-class.ts";

type DrugSeed = {
  id: number;
  name: string;
  slug: string;
  classSlug: string;
};

function isDrugSeed(row: unknown): row is DrugSeed {
  if (typeof row !== "object" || row === null) {
    return false;
  }

  const candidate = row as Record<string, unknown>;
  return (
    typeof candidate.id === "number" &&
    typeof candidate.name === "string" &&
    typeof candidate.slug === "string" &&
    typeof candidate.classSlug === "string"
  );
}

function parseDrugSeeds(value: unknown): DrugSeed[] {
  if (!Array.isArray(value)) {
    throw new Error("drugs.json must be an array");
  }

  return value.map((row, index) => {
    if (!isDrugSeed(row)) {
      throw new Error(`Invalid drug at index ${index}`);
    }

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      classSlug: row.classSlug,
    };
  });
}

export async function seedDrugs() {
  const path = new URL("../../../data/drugs.json", import.meta.url);
  const rows = parseDrugSeeds(await Bun.file(path).json());

  const classes = await db.select({ id: drugClass.id, slug: drugClass.slug }).from(drugClass);
  const classIdBySlug = new Map(classes.map((row) => [row.slug, row.id]));

  const values = rows.map((row) => {
    const drugClassId = classIdBySlug.get(row.classSlug);
    if (drugClassId === undefined) {
      throw new Error(`Unknown drug class slug: ${row.classSlug}`);
    }

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      drugClassId,
    };
  });

  await db
    .insert(drug)
    .values(values)
    .onConflictDoUpdate({
      target: drug.id,
      set: {
        name: sql`excluded.name`,
        slug: sql`excluded.slug`,
        drugClassId: sql`excluded.drug_class_id`,
        updatedAt: sql`now()`,
      },
    });

  await db.execute(sql`
    SELECT setval(
      pg_get_serial_sequence('drug', 'id'),
      COALESCE((SELECT MAX(id) FROM drug), 1),
      (SELECT EXISTS (SELECT 1 FROM drug))
    )
  `);

  return values.length;
}
