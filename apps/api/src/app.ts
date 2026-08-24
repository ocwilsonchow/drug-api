import { createApp } from "@/lib/create-app"

import { configureOpenAPI } from "@/lib/configure-openapi"
import { configureBetterAuth } from "@/lib/configure-better-auth"

import health from "@/routes/health"
import drugClasses from "@/routes/drug-classes"
import drugs from "@/routes/drugs"
import indications from "@/routes/indications"

const baseApp = await createApp()

configureBetterAuth(baseApp)

const app = baseApp
  .route("/api", health)
  .route("/api", drugClasses)
  .route("/api", drugs)
  .route("/api", indications)

configureOpenAPI(app)

type AppType = typeof app

export { app, type AppType }
