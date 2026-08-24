import { getIndicationRoute, listIndicationsRoute } from "./routes"
import { getIndicationHandler, listIndicationsHandler } from "./handlers"
import { createRouter } from "@/lib/create-router"

const router = createRouter()
  .openapi(listIndicationsRoute, listIndicationsHandler)
  .openapi(getIndicationRoute, getIndicationHandler)

export default router
