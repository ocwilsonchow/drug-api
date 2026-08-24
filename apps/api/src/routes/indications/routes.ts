import { createRoute, z } from "@hono/zod-openapi"
import { ErrorResponseSchema, unauthorizedResponse } from "@/lib/errors"
import {
  PaginationQuerySchema,
  paginatedResponseSchema,
} from "@/lib/pagination"

export const DrugClassRefSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  slug: z.string(),
})

export const IndicationSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  slug: z.string(),
  drugClasses: z.array(DrugClassRefSchema),
})

export const ListIndicationsQuerySchema = PaginationQuerySchema

export const ListIndicationsResponseSchema =
  paginatedResponseSchema(IndicationSchema)

export const GetIndicationParamsSchema = z.object({
  slug: z.string().min(1),
})

export const listIndicationsRoute = createRoute({
  tags: ["Indications"],
  method: "get",
  path: "/indications",
  summary: "List indications",
  description: "List indications with offset pagination",
  request: {
    query: ListIndicationsQuerySchema,
  },
  responses: {
    200: {
      description: "Paginated indications",
      content: {
        "application/json": {
          schema: ListIndicationsResponseSchema,
        },
      },
    },
    401: unauthorizedResponse,
  },
})

export const getIndicationRoute = createRoute({
  tags: ["Indications"],
  method: "get",
  path: "/indications/{slug}",
  summary: "Get indication",
  description: "Get an indication by slug",
  request: {
    params: GetIndicationParamsSchema,
  },
  responses: {
    200: {
      description: "Indication",
      content: {
        "application/json": {
          schema: IndicationSchema,
        },
      },
    },
    401: unauthorizedResponse,
    404: {
      description: "Indication not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
})

export type ListIndicationsRoute = typeof listIndicationsRoute
export type GetIndicationRoute = typeof getIndicationRoute
