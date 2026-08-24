import { getDrugClassRoute, listDrugClassesRoute } from "./routes"
import { getDrugClassHandler, listDrugClassesHandler } from "./handlers"
import { createRouter } from "@/lib/create-router"

const router = createRouter()
  .openapi(listDrugClassesRoute, listDrugClassesHandler)
  .openapi(getDrugClassRoute, getDrugClassHandler)

export default router
