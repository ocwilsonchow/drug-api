import { createApp } from "@/lib/create-app"

import { configureOpenAPI } from "@/lib/configure-openapi"
import { configureBetterAuth } from "@/lib/configure-better-auth"

import health from "@/routes/health"
import drugClasses from "@/routes/drug-classes"
import drugs from "@/routes/drugs"

const baseApp = await createApp()

const app = baseApp
  .route("/api", health)
  .route("/api", drugClasses)
  .route("/api", drugs)

configureBetterAuth(app)
configureOpenAPI(app)

type AppType = typeof app

export { app, type AppType }
