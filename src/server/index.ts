import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createAuth } from './modules/auth'
import { drawingRoutes } from './modules/drawings/routes'
import { shareRoutes } from './modules/shares/routes'

type Bindings = {
  DB: D1Database
  STORAGE: R2Bucket
  AI: Ai
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}

type Variables = {
  user: { id: string; name: string; email: string } | null
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// CORS
app.use('/api/*', cors({
  origin: (origin) => origin || '',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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

// Also protect the base /api/drawings route (no trailing wildcard)
app.use('/api/drawings', async (c, next) => {
  const auth = createAuth(c)
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session?.user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  c.set('user', session.user as Variables['user'])
  await next()
})

// Auth middleware for share creation/refresh (POST and PUT need auth)
app.use('/api/shares', async (c, next) => {
  if (c.req.method === 'GET') return next() // Public GET handled by route
  const auth = createAuth(c)
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session?.user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  c.set('user', session.user as Variables['user'])
  await next()
})
app.use('/api/shares/*', async (c, next) => {
  if (c.req.method === 'GET') return next() // Public GET handled by route
  const auth = createAuth(c)
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session?.user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  c.set('user', session.user as Variables['user'])
  await next()
})

// Drawing routes
app.route('/api/drawings', drawingRoutes)

// Share routes
app.route('/api/shares', shareRoutes)

export default app
