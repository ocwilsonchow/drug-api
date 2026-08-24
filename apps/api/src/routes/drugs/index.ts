import { getDrugRoute, listDrugsRoute } from "./routes"
import { getDrugHandler, listDrugsHandler } from "./handlers"
import { createRouter } from "@/lib/create-router"

const router = createRouter()
  .openapi(listDrugsRoute, listDrugsHandler)
  .openapi(getDrugRoute, getDrugHandler)

export default router
