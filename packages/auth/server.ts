import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { db } from "@repo/db"
import { domain } from "@repo/infra/domain"
import { apiOrigin, trustedOrigins } from "@repo/infra/origins"
import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import {
  admin,
  lastLoginMethod,
  multiSession,
  openAPI,
  organization,
} from "better-auth/plugins"
import { Resource } from "sst"

export type AuthType = {
  user: typeof auth.$Infer.Session.user | null
  session: typeof auth.$Infer.Session.session | null
}

export const auth = betterAuth({
  baseURL: apiOrigin(),
  secret: Resource.BETTER_AUTH_SECRET.value,
  trustedOrigins: trustedOrigins(),
  session: { deferSessionRefresh: true },
  advanced: {
    cookiePrefix: `${domain}-${Resource.App.stage}`,
    // App host ({stage}.drug.slchow.com) shares these cookies; treat
    // every *.drug.slchow.com subdomain as in-scope.
    crossSubDomainCookies: {
      enabled: true,
      domain: "." + domain,
    },
    defaultCookieAttributes: {
      sameSite: "lax" as const,
      secure: true,
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  plugins: [
    admin(),
    organization(),
    openAPI(),
    lastLoginMethod(),
    multiSession(),
    nextCookies(),
  ],
})
