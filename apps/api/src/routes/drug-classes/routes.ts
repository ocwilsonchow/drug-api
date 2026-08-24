import { createRoute, z } from "@hono/zod-openapi"
import {
  PaginationQuerySchema,
  paginatedResponseSchema,
} from "@/lib/pagination"

export const DrugRefSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  slug: z.string(),
})

export const DrugClassSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  slug: z.string(),
  drugs: z.array(DrugRefSchema),
})

export const ListDrugClassesQuerySchema = PaginationQuerySchema

export const ListDrugClassesResponseSchema =
  paginatedResponseSchema(DrugClassSchema)

export const GetDrugClassParamsSchema = z.object({
  slug: z.string().min(1),
})

export const ErrorResponseSchema = z.object({
  ok: z.literal(false),
  errors: z.array(
    z.object({
      message: z.string(),
      source: z.enum(["validation", "not_found", "server"]),
    })
  ),
})

export const listDrugClassesRoute = createRoute({
  tags: ["Drug classes"],
  method: "get",
  path: "/drug-classes",
  summary: "List drug classes",
  description: "List drug classes with offset pagination",
  request: {
    query: ListDrugClassesQuerySchema,
  },
  responses: {
    200: {
      description: "Paginated drug classes",
      content: {
        "application/json": {
          schema: ListDrugClassesResponseSchema,
        },
      },
    },
  },
})

export const getDrugClassRoute = createRoute({
  tags: ["Drug classes"],
  method: "get",
  path: "/drug-classes/{slug}",
  summary: "Get drug class",
  description: "Get a drug class by slug",
  request: {
    params: GetDrugClassParamsSchema,
  },
  responses: {
    200: {
      description: "Drug class",
      content: {
        "application/json": {
          schema: DrugClassSchema,
        },
      },
    },
    404: {
      description: "Drug class not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
})

export type ListDrugClassesRoute = typeof listDrugClassesRoute
export type GetDrugClassRoute = typeof getDrugClassRoute
