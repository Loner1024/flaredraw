import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createAuth } from './modules/auth'
import { authMiddleware, sessionOnlyMiddleware } from './middleware/auth'
import { drawingRoutes } from './modules/drawings/routes'
import { shareRoutes } from './modules/shares/routes'
import { apiTokenRoutes } from './modules/api-tokens/routes'
import { diagramRoutes } from './modules/api/routes'
import { mcpRoutes } from './modules/mcp/routes'
import { oauthRoutes, wellKnownRoutes } from './modules/mcp/oauth-routes'

type Bindings = {
  DB: D1Database
  STORAGE: R2Bucket
  AI: Ai
  BROWSER: Fetcher
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}

type Variables = {
  user: { id: string; name: string; email: string } | null
  authMethod: 'session' | 'api-token'
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// .well-known OAuth discovery (must be at root, before CORS)
wellKnownRoutes(app as any)

// CORS
app.use('/api/*', cors({
  origin: (origin) => origin || '',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))
app.use('/oauth/*', cors({
  origin: (origin) => origin || '',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  credentials: true,
}))

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Auth routes — better-auth handles /api/auth/*
app.all('/api/auth/*', async (c) => {
  const auth = createAuth(c)
  return auth.handler(c.req.raw)
})

// Protected routes: dual auth (session + Bearer token)
app.use('/api/drawings/*', authMiddleware())
app.use('/api/drawings', authMiddleware())

// Share routes: GET is public, POST/PUT/DELETE need auth
app.use('/api/shares', async (c, next) => {
  if (c.req.method === 'GET') return next()
  return authMiddleware()(c, next)
})
app.use('/api/shares/*', async (c, next) => {
  if (c.req.method === 'GET') return next()
  return authMiddleware()(c, next)
})

// API token management: session-only (can't manage tokens via tokens)
app.use('/api/api-tokens', sessionOnlyMiddleware())
app.use('/api/api-tokens/*', sessionOnlyMiddleware())

// Diagram API: dual auth
app.use('/api/v1/*', authMiddleware())

// MCP routes: dual auth (info endpoint is public, message requires auth)
app.use('/api/mcp/message', authMiddleware())

// Mount routes
app.route('/api/drawings', drawingRoutes)
app.route('/api/shares', shareRoutes)
app.route('/api/api-tokens', apiTokenRoutes)
app.route('/api/v1', diagramRoutes)
app.route('/api/mcp', mcpRoutes)
app.route('/oauth', oauthRoutes)

export default app
