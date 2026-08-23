import { apiOrigin } from "@repo/infra/origins"
import { createAuthClient } from "better-auth/react"
import {
  adminClient,
  lastLoginMethodClient,
  magicLinkClient,
  oneTimeTokenClient,
  organizationClient,
  phoneNumberClient,
  twoFactorClient,
} from "better-auth/client/plugins"
import { apiKeyClient } from "@better-auth/api-key/client"

export const authReactClient = createAuthClient({
  baseURL: apiOrigin(),
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    adminClient(),
    organizationClient(),
    apiKeyClient(),
    magicLinkClient(),
    lastLoginMethodClient(),
    twoFactorClient(),
    phoneNumberClient(),
    oneTimeTokenClient(),
  ],
})
