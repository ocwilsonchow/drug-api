import type { RouteHandler } from "@hono/zod-openapi"
import { offsetFor, paginationMeta } from "@/lib/pagination"
import type { AppBindings } from "@/lib/types"
import { asc, count, db, drug, drugClass, eq } from "@repo/db"
import type { GetDrugRoute, ListDrugsRoute } from "./routes"

function toDrug(
  row: typeof drug.$inferSelect,
  classRow: typeof drugClass.$inferSelect
) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    drugClass: {
      id: classRow.id,
      name: classRow.name,
      slug: classRow.slug,
    },
  }
}

export const listDrugsHandler: RouteHandler<ListDrugsRoute, AppBindings> =
  async (c) => {
    const { page, pageSize } = c.req.valid("query")

    const [countRow] = await db.select({ total: count() }).from(drug)
    const total = countRow?.total ?? 0

    const rows = await db
      .select({
        drug,
        drugClass,
      })
      .from(drug)
      .innerJoin(drugClass, eq(drug.drugClassId, drugClass.id))
      .orderBy(asc(drug.id))
      .limit(pageSize)
      .offset(offsetFor(page, pageSize))

    return c.json(
      {
        data: rows.map((row) => toDrug(row.drug, row.drugClass)),
        pagination: paginationMeta(page, pageSize, total),
      },
      200
    )
  }

export const getDrugHandler: RouteHandler<GetDrugRoute, AppBindings> = async (
  c
) => {
  const { slug } = c.req.valid("param")

  const [row] = await db
    .select({
      drug,
      drugClass,
    })
    .from(drug)
    .innerJoin(drugClass, eq(drug.drugClassId, drugClass.id))
    .where(eq(drug.slug, slug))
    .limit(1)

  if (!row) {
    return c.json(
      {
        ok: false as const,
        errors: [
          {
            message: "Drug not found",
            source: "not_found" as const,
          },
        ],
      },
      404
    )
  }

  return c.json(toDrug(row.drug, row.drugClass), 200)
}
