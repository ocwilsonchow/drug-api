import { Resource } from "sst"
import { domain } from "./domain"

export function isProductionStage(stage = Resource.App.stage) {
  return stage === "production"
}

export function appOrigin(stage = Resource.App.stage) {
  return `https://${stage}.${domain}`
}

export function apiOrigin(stage = Resource.App.stage) {
  return `https://${stage}.api.${domain}`
}

export function trustedOrigins(stage = Resource.App.stage) {
  return [appOrigin(stage), apiOrigin(stage)]
}
