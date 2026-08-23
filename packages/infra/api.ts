import { betterAuthSecret, databaseUrl } from "./secrets"

const hono = new sst.aws.Function("Hono", {
  handler: "apps/api/src/lambda.handler",
  link: [databaseUrl, betterAuthSecret],
})

export const api = new sst.aws.ApiGatewayV2("Api", {
  // Hono already sets CORS; gateway CORS would duplicate headers.
  cors: false,
})

api.route("$default", hono.arn)
