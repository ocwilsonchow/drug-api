import { z } from "@hono/zod-openapi"

export const ErrorResponseSchema = z.object({
  ok: z.literal(false),
  errors: z.array(
    z.object({
      message: z.string(),
      source: z.enum(["validation", "not_found", "unauthorized", "server"]),
    })
  ),
})

export const unauthorizedResponse = {
  description: "Authentication required",
  content: {
    "application/json": {
      schema: ErrorResponseSchema,
    },
  },
} as const
