import type { RouteHandler } from "@hono/zod-openapi"
import { offsetFor, paginationMeta } from "@/lib/pagination"
import type { AppBindings } from "@/lib/types"
import {
  asc,
  count,
  db,
  drugClass,
  drugClassIndication,
  eq,
  inArray,
  indication,
} from "@repo/db"
import type { GetIndicationRoute, ListIndicationsRoute } from "./routes"

function toDrugClassRef(row: typeof drugClass.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
  }
}

function toIndication(
  row: typeof indication.$inferSelect,
  drugClasses: Array<typeof drugClass.$inferSelect>
) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    drugClasses: drugClasses.map(toDrugClassRef),
  }
}

async function drugClassesForIndications(indicationIds: number[]) {
  if (indicationIds.length === 0) {
    return new Map<number, Array<typeof drugClass.$inferSelect>>()
  }

  const rows = await db
    .select({
      indicationId: drugClassIndication.indicationId,
      drugClass,
    })
    .from(drugClassIndication)
    .innerJoin(
      drugClass,
      eq(drugClassIndication.drugClassId, drugClass.id)
    )
    .where(inArray(drugClassIndication.indicationId, indicationIds))
    .orderBy(asc(drugClass.id))

  const classesByIndicationId = new Map<
    number,
    Array<typeof drugClass.$inferSelect>
  >()

  for (const row of rows) {
    const existing = classesByIndicationId.get(row.indicationId)
    if (existing) {
      existing.push(row.drugClass)
    } else {
      classesByIndicationId.set(row.indicationId, [row.drugClass])
    }
  }

  return classesByIndicationId
}

export const listIndicationsHandler: RouteHandler<
  ListIndicationsRoute,
  AppBindings
> = async (c) => {
  const { page, pageSize } = c.req.valid("query")

  const [countRow] = await db.select({ total: count() }).from(indication)
  const total = countRow?.total ?? 0

  const rows = await db
    .select()
    .from(indication)
    .orderBy(asc(indication.id))
    .limit(pageSize)
    .offset(offsetFor(page, pageSize))

  const classesByIndicationId = await drugClassesForIndications(
    rows.map((row) => row.id)
  )

  return c.json(
    {
      data: rows.map((row) =>
        toIndication(row, classesByIndicationId.get(row.id) ?? [])
      ),
      pagination: paginationMeta(page, pageSize, total),
    },
    200
  )
}

export const getIndicationHandler: RouteHandler<
  GetIndicationRoute,
  AppBindings
> = async (c) => {
  const { slug } = c.req.valid("param")

  const [row] = await db
    .select()
    .from(indication)
    .where(eq(indication.slug, slug))
    .limit(1)

  if (!row) {
    return c.json(
      {
        ok: false as const,
        errors: [
          {
            message: "Indication not found",
            source: "not_found" as const,
          },
        ],
      },
      404
    )
  }

  const classesByIndicationId = await drugClassesForIndications([row.id])

  return c.json(
    toIndication(row, classesByIndicationId.get(row.id) ?? []),
    200
  )
}
