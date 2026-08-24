import type { RouteHandler } from "@hono/zod-openapi"
import { offsetFor, paginationMeta } from "@/lib/pagination"
import type { AppBindings } from "@/lib/types"
import { asc, count, db, drug, drugClass, eq, inArray } from "@repo/db"
import type { GetDrugClassRoute, ListDrugClassesRoute } from "./routes"

function toDrugRef(row: typeof drug.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
  }
}

function toDrugClass(
  row: typeof drugClass.$inferSelect,
  drugs: Array<typeof drug.$inferSelect>
) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    drugs: drugs.map(toDrugRef),
  }
}

async function drugsForClasses(classIds: number[]) {
  if (classIds.length === 0) {
    return new Map<number, Array<typeof drug.$inferSelect>>()
  }

  const rows = await db
    .select()
    .from(drug)
    .where(inArray(drug.drugClassId, classIds))
    .orderBy(asc(drug.id))

  const drugsByClassId = new Map<number, Array<typeof drug.$inferSelect>>()

  for (const row of rows) {
    const existing = drugsByClassId.get(row.drugClassId)
    if (existing) {
      existing.push(row)
    } else {
      drugsByClassId.set(row.drugClassId, [row])
    }
  }

  return drugsByClassId
}

export const listDrugClassesHandler: RouteHandler<
  ListDrugClassesRoute,
  AppBindings
> = async (c) => {
  const { page, pageSize } = c.req.valid("query")

  const [countRow] = await db.select({ total: count() }).from(drugClass)
  const total = countRow?.total ?? 0

  const rows = await db
    .select()
    .from(drugClass)
    .orderBy(asc(drugClass.id))
    .limit(pageSize)
    .offset(offsetFor(page, pageSize))

  const drugsByClassId = await drugsForClasses(rows.map((row) => row.id))

  return c.json(
    {
      data: rows.map((row) => toDrugClass(row, drugsByClassId.get(row.id) ?? [])),
      pagination: paginationMeta(page, pageSize, total),
    },
    200
  )
}

export const getDrugClassHandler: RouteHandler<
  GetDrugClassRoute,
  AppBindings
> = async (c) => {
  const { slug } = c.req.valid("param")

  const [row] = await db
    .select()
    .from(drugClass)
    .where(eq(drugClass.slug, slug))
    .limit(1)

  if (!row) {
    return c.json(
      {
        ok: false as const,
        errors: [
          {
            message: "Drug class not found",
            source: "not_found" as const,
          },
        ],
      },
      404
    )
  }

  const drugsByClassId = await drugsForClasses([row.id])

  return c.json(toDrugClass(row, drugsByClassId.get(row.id) ?? []), 200)
}
