import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  STORAGE: R2Bucket
  AI: Ai
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

export default app
