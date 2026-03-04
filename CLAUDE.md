# FlareDraw — CLAUDE.md

Excalidraw on Cloudflare. Uses `@excalidraw/excalidraw` npm package (not a full fork).

## Commands

```bash
pnpm dev              # Start dev server (Vite + Cloudflare plugin)
pnpm build            # Production build
pnpm deploy           # Build + wrangler deploy
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate:local # Apply migrations locally
pnpm db:migrate:remote # Apply migrations to production D1
```

## Architecture

- **Frontend**: React 19 + Excalidraw npm package + React Router + Tailwind v4 + shadcn/ui
- **Backend**: Hono on Cloudflare Workers
- **Database**: D1 (metadata via Drizzle) + R2 (drawing content)
- **Auth**: better-auth with Google OAuth (D1 binding, NOT drizzleAdapter). No email/password.
- **Domain**: draw.flared.au

## Key Patterns

- Excalidraw needs `build.target: 'es2022'` in Vite config
- Import Excalidraw CSS before Tailwind to avoid style conflicts
- `window.EXCALIDRAW_ASSET_PATH = '/fonts/'` must be set before component mounts (in index.html)
- Use `getSceneVersion()` to debounce onChange (fires on every cursor move)
- Store `serializeAsJSON()` output directly in R2 — standard .excalidraw format
- Login redirect: `window.location.href`, not `navigate()` (SPA race condition)

## Project Structure

```
src/
  client/          # React SPA
    components/    # UI components
    hooks/         # Custom hooks (useAutoSave, useDrawing)
    pages/         # Route pages
    layouts/       # Dashboard + Editor layouts
    lib/           # API client, auth client, utils
  server/          # Hono Worker
    modules/       # Feature modules (auth, drawings, shares)
    db/            # Drizzle schema
    middleware/    # Auth, security
```

## Build Journal

Documenting the build experience at `.claude/artifacts/build-journal.md` for future blog/newsletter.
Screenshots go to `.claude/screenshots/`.
