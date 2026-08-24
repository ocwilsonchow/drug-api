import { createMiddleware } from "hono/factory"
import { HTTPException } from "hono/http-exception"
import { auth } from "@repo/auth/server"
import type { AppBindings } from "@/lib/types"

function isPublicPath(path: string) {
  if (!path.startsWith("/api/")) {
    return true
  }

  return path === "/api/health" || path.startsWith("/api/auth/")
}

/** Require a Better Auth session for all API routes except public ones. */
export const requireAuth = createMiddleware<AppBindings>(async (c, next) => {
  if (isPublicPath(c.req.path)) {
    await next()
    return
  }

  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  if (!session) {
    throw new HTTPException(401, { message: "Unauthorized" })
  }

  c.set("user", session.user)
  c.set("session", session.session)
  await next()
})
