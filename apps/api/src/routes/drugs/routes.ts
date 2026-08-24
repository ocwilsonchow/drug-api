import { createRoute, z } from "@hono/zod-openapi"
import {
  PaginationQuerySchema,
  paginatedResponseSchema,
} from "@/lib/pagination"

export const DrugClassRefSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  slug: z.string(),
})

export const DrugSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  slug: z.string(),
  drugClass: DrugClassRefSchema,
})

export const ListDrugsQuerySchema = PaginationQuerySchema

export const ListDrugsResponseSchema = paginatedResponseSchema(DrugSchema)

export const GetDrugParamsSchema = z.object({
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

export const listDrugsRoute = createRoute({
  tags: ["Drugs"],
  method: "get",
  path: "/drugs",
  summary: "List drugs",
  description: "List drugs with offset pagination",
  request: {
    query: ListDrugsQuerySchema,
  },
  responses: {
    200: {
      description: "Paginated drugs",
      content: {
        "application/json": {
          schema: ListDrugsResponseSchema,
        },
      },
    },
  },
})

export const getDrugRoute = createRoute({
  tags: ["Drugs"],
  method: "get",
  path: "/drugs/{slug}",
  summary: "Get drug",
  description: "Get a drug by slug",
  request: {
    params: GetDrugParamsSchema,
  },
  responses: {
    200: {
      description: "Drug",
      content: {
        "application/json": {
          schema: DrugSchema,
        },
      },
    },
    404: {
      description: "Drug not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
})

export type ListDrugsRoute = typeof listDrugsRoute
export type GetDrugRoute = typeof getDrugRoute
