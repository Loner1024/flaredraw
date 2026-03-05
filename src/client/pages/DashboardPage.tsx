import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type Drawing } from '@/client/lib/api-client'
import { signOut } from '@/client/lib/auth'
import { useThemeContext } from '@/client/components/ThemeProvider'

const themeIcons: Record<string, string> = {
  light: '\u2600\uFE0F',  // sun
  dark: '\uD83C\uDF19',    // moon
  system: '\uD83D\uDCBB',  // laptop
}

export function DashboardPage() {
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { theme, cycleTheme } = useThemeContext()

  useEffect(() => {
    api.drawings.list().then((data) => {
      setDrawings(data.drawings)
      setLoading(false)
    })
  }, [])

  async function handleNew() {
    const { id } = await api.drawings.create()
    navigate(`/draw/${id}`)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this drawing?')) return
    await api.drawings.delete(id)
    setDrawings((prev) => prev.filter((d) => d.id !== id))
  }

  function handleLogout() {
    signOut().then(() => {
      window.location.href = '/login'
    })
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">FlareDraw</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleNew}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              New Drawing
            </button>
            <button
              onClick={cycleTheme}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              title={`Theme: ${theme}`}
            >
              {themeIcons[theme]}
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              title="Settings"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        {loading ? (
          <div className="text-center text-sm text-zinc-500">Loading drawings...</div>
        ) : drawings.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-zinc-500 dark:text-zinc-400">No drawings yet</p>
            <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
              Click "New Drawing" to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {drawings.map((drawing) => (
              <div
                key={drawing.id}
                className="group cursor-pointer rounded-lg border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                onClick={() => navigate(`/draw/${drawing.id}`)}
              >
                {/* Placeholder for thumbnail */}
                <div className="mb-3 flex h-32 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <span className="text-3xl text-zinc-300 dark:text-zinc-600">
                    {drawing.elementCount ?? 0} elements
                  </span>
                </div>
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                      {drawing.title || 'Untitled'}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(drawing.lastModified)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(drawing.id)
                    }}
                    className="ml-2 rounded p-1 text-zinc-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                    title="Delete drawing"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
