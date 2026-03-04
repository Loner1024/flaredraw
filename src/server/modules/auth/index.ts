import { betterAuth } from 'better-auth'
import type { Context } from 'hono'

// Accept any context that has at least the auth-related bindings
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAuth(c: Context<any>) {
  return betterAuth({
    database: c.env.DB,
    secret: c.env.BETTER_AUTH_SECRET,
    baseURL: c.env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
    },
    trustedOrigins: [
      c.env.BETTER_AUTH_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'https://draw.jezweb.ai',
    ],
  })
}
