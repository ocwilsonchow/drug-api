import { sql } from "drizzle-orm";
import { db } from "../index.ts";
import { indication } from "../schema/indication.ts";

type IndicationSeed = {
  id: number;
  name: string;
  slug: string;
};

function isIndicationSeed(row: unknown): row is IndicationSeed {
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

function parseIndicationSeeds(value: unknown): IndicationSeed[] {
  if (!Array.isArray(value)) {
    throw new Error("indications.json must be an array");
  }

  return value.map((row, index) => {
    if (!isIndicationSeed(row)) {
      throw new Error(`Invalid indication at index ${index}`);
    }

    return { id: row.id, name: row.name, slug: row.slug };
  });
}

export async function seedIndications() {
  const path = new URL("../../../data/indications.json", import.meta.url);
  const rows = parseIndicationSeeds(await Bun.file(path).json());

  await db
    .insert(indication)
    .values(rows)
    .onConflictDoUpdate({
      target: indication.id,
      set: {
        name: sql`excluded.name`,
        slug: sql`excluded.slug`,
        updatedAt: sql`now()`,
      },
    });

  await db.execute(sql`
    SELECT setval(
      pg_get_serial_sequence('indication', 'id'),
      COALESCE((SELECT MAX(id) FROM indication), 1),
      (SELECT EXISTS (SELECT 1 FROM indication))
    )
  `);

  return rows.length;
}
