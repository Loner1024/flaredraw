import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createAuth } from './modules/auth'

type Bindings = {
  DB: D1Database
  STORAGE: R2Bucket
  AI: Ai
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
}

type Variables = {
  user: { id: string; name: string; email: string } | null
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// CORS for auth endpoints
app.use('/api/*', cors({
  origin: (origin) => origin || '',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Auth routes — better-auth handles /api/auth/*
app.all('/api/auth/*', async (c) => {
  const auth = createAuth(c)
  return auth.handler(c.req.raw)
})

// Auth middleware for protected routes
app.use('/api/drawings/*', async (c, next) => {
  const auth = createAuth(c)
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session?.user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  c.set('user', session.user as Variables['user'])
  await next()
})

// Drawing routes placeholder (Step 5)
app.get('/api/drawings', (c) => {
  const user = c.get('user')
  return c.json({ drawings: [], user: user?.email })
})

export default app
