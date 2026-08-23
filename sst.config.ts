/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "drug-api",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          profile: "drug-api",
          region: "ap-southeast-1",
        },
      },
    }
  },
  async run() {
    await import("./packages/infra/secrets")
    await import("./packages/infra/api")
  },
})
