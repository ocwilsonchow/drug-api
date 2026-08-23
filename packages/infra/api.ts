/// <reference path="../../.sst/platform/config.d.ts" />

import { betterAuthSecret, databaseUrl } from "./secrets"
import { domain } from "./domain"

export const router = new sst.aws.Router("ApiRouter", {
  domain: `${$app.stage}.api.${domain}`,
  protection: "oac-with-edge-signing",
  waf: { rateLimitPerIp: 200 },
})

export const hono = new sst.aws.Function("Hono", {
  handler: "apps/api/src/lambda.handler",
  link: [databaseUrl, betterAuthSecret],
  url: {
    cors: false,
    router: {
      instance: router,
      readTimeout: "20 seconds",
    },
  },
})
