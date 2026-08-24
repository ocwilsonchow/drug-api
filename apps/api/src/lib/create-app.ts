import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { requestId } from "hono/request-id"
import { HTTPException } from "hono/http-exception"
import { createRouter } from "@/lib/create-router"
import { isProductionStage, trustedOrigins } from "@repo/infra/origins"

export async function createApp() {
  const app = createRouter()

  app.use(
    cors({
      origin: trustedOrigins(),
      credentials: true,
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "Cookie",
        "x-luthen-audience",
        "x-luthen-locale",
      ],
    })
  )
  app.use(async (c, next) => {
    await next()
    c.header("Cache-Control", "no-store")
  })
  app.use(requestId())
  app.use(logger())
  app.notFound((c) => {
    return c.json(
      {
        ok: false,
        errors: [
          {
            message: "Not Found",
            source: "not_found",
          },
        ],
      },
      404
    )
  })
  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json(
        {
          ok: false,
          errors: [
            {
              message: err.message,
              source: err.status === 401 ? "unauthorized" : "server",
            },
          ],
        },
        err.status
      )
    }

    console.error(err)
    return c.json(
      {
        ok: false,
        errors: [
          {
            message: isProductionStage()
              ? "Internal Server Error"
              : err.message,
            source: "server",
          },
        ],
      },
      500
    )
  })

  return app
}
