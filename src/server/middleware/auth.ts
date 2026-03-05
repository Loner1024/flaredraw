import type { Context, Next } from 'hono'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { createAuth } from '../modules/auth'
import { apiTokens, mcpOAuthTokens } from '../db/schema'
import { users } from '../db/schema'

export type AuthMethod = 'session' | 'api-token' | 'mcp-oauth'

/**
 * Hash a token string using SHA-256.
 * Used for both storing and looking up tokens.
 */
export async function hashToken(token: string): Promise<string> {
  const encoded = new TextEncoder().encode(token)
  const hash = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Generate a new API token with fd_ prefix.
 * Returns { raw, hash, prefix } — raw is shown once, hash is stored.
 */
export async function generateToken(): Promise<{ raw: string; hash: string; prefix: string }> {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const base64url = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  const raw = `fd_${base64url}`
  const hash = await hashToken(raw)
  const prefix = raw.slice(0, 12) + '...'
  return { raw, hash, prefix }
}

/**
 * Dual-auth middleware: supports Bearer token OR session cookie.
 * Sets c.var.user and c.var.authMethod on success.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function authMiddleware() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (c: Context<any>, next: Next) => {
    const authHeader = c.req.header('Authorization')

    // Try Bearer token first
    if (authHeader?.startsWith('Bearer ')) {
      const rawToken = authHeader.slice(7)
      const db = drizzle(c.env.DB)

      if (rawToken.startsWith('fd_')) {
        const hash = await hashToken(rawToken)

        const [tokenRecord] = await db
          .select()
          .from(apiTokens)
          .where(eq(apiTokens.token, hash))
          .limit(1)

        if (!tokenRecord) {
          return c.json({ error: 'Invalid API token' }, 401)
        }

        // Check expiry
        if (tokenRecord.expiresAt && new Date(tokenRecord.expiresAt) < new Date()) {
          return c.json({ error: 'API token expired' }, 401)
        }

        // Look up user
        const [user] = await db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, tokenRecord.userId))
          .limit(1)

        if (!user) {
          return c.json({ error: 'Token user not found' }, 401)
        }

        c.set('user', user)
        c.set('authMethod', 'api-token' as AuthMethod)

        // Fire-and-forget: update lastUsedAt
        c.executionCtx.waitUntil(
          db
            .update(apiTokens)
            .set({ lastUsedAt: new Date().toISOString() })
            .where(eq(apiTokens.id, tokenRecord.id))
        )

        return next()
      }

      // Non-fd_ Bearer token → check MCP OAuth tokens
      const tokenHash = await hashToken(rawToken)
      const [oauthToken] = await db
        .select()
        .from(mcpOAuthTokens)
        .where(eq(mcpOAuthTokens.token, tokenHash))
        .limit(1)

      if (oauthToken) {
        // Check expiry
        if (oauthToken.expiresAt < Math.floor(Date.now() / 1000)) {
          return c.json({ error: 'OAuth token expired' }, 401)
        }

        // Look up user
        const [user] = await db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, oauthToken.userId))
          .limit(1)

        if (!user) {
          return c.json({ error: 'Token user not found' }, 401)
        }

        c.set('user', user)
        c.set('authMethod', 'mcp-oauth' as AuthMethod)
        return next()
      }

      // Unknown Bearer token
      return c.json({ error: 'Invalid token' }, 401)
    }

    // Fall back to session cookie
    const auth = createAuth(c)
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session?.user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    c.set('user', session.user)
    c.set('authMethod', 'session' as AuthMethod)
    return next()
  }
}

/**
 * Session-only auth middleware — for routes that should not accept API tokens
 * (e.g., token management routes, to prevent token self-management).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sessionOnlyMiddleware() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (c: Context<any>, next: Next) => {
    const auth = createAuth(c)
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session?.user) {
      return c.json({ error: 'Unauthorized — session required' }, 401)
    }

    c.set('user', session.user)
    c.set('authMethod', 'session' as AuthMethod)
    return next()
  }
}
