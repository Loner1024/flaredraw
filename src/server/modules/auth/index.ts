import { betterAuth } from 'better-auth'
import type { Context } from 'hono'

type Env = {
  Bindings: {
    DB: D1Database
    BETTER_AUTH_SECRET: string
    BETTER_AUTH_URL: string
  }
}

export function createAuth(c: Context<Env>) {
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
