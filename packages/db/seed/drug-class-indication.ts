import { db } from "../index.ts";
import { drugClass } from "../schema/drug-class.ts";
import { drugClassIndication } from "../schema/drug-class-indication.ts";
import { indication } from "../schema/indication.ts";

type IndicationClassSeed = {
  slug: string;
  classSlugs: string[];
};

function isIndicationClassSeed(row: unknown): row is IndicationClassSeed {
  if (typeof row !== "object" || row === null) {
    return false;
  }

  const candidate = row as Record<string, unknown>;
  return (
    typeof candidate.slug === "string" &&
    Array.isArray(candidate.classSlugs) &&
    candidate.classSlugs.every((slug) => typeof slug === "string")
  );
}

function parseIndicationClassSeeds(value: unknown): IndicationClassSeed[] {
  if (!Array.isArray(value)) {
    throw new Error("indications.json must be an array");
  }

  return value.map((row, index) => {
    if (!isIndicationClassSeed(row)) {
      throw new Error(`Invalid indication class mapping at index ${index}`);
    }

    return { slug: row.slug, classSlugs: row.classSlugs };
  });
}

export async function seedDrugClassIndications() {
  const path = new URL("../../../data/indications.json", import.meta.url);
  const rows = parseIndicationClassSeeds(await Bun.file(path).json());

  const classes = await db
    .select({ id: drugClass.id, slug: drugClass.slug })
    .from(drugClass);
  const classIdBySlug = new Map(classes.map((row) => [row.slug, row.id]));

  const indications = await db
    .select({ id: indication.id, slug: indication.slug })
    .from(indication);
  const indicationIdBySlug = new Map(
    indications.map((row) => [row.slug, row.id]),
  );

  const values: Array<{ drugClassId: number; indicationId: number }> = [];

  for (const row of rows) {
    const indicationId = indicationIdBySlug.get(row.slug);
    if (indicationId === undefined) {
      throw new Error(`Unknown indication slug: ${row.slug}`);
    }

    for (const classSlug of row.classSlugs) {
      const drugClassId = classIdBySlug.get(classSlug);
      if (drugClassId === undefined) {
        throw new Error(`Unknown drug class slug: ${classSlug}`);
      }

      values.push({ drugClassId, indicationId });
    }
  }

  await db.delete(drugClassIndication);

  if (values.length > 0) {
    await db.insert(drugClassIndication).values(values);
  }

  return values.length;
}
