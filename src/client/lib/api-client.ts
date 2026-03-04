const API_BASE = '/api'

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((error as { error: string }).error || res.statusText)
  }

  return res.json()
}

export const api = {
  drawings: {
    list: () => fetchAPI<{ drawings: Drawing[] }>('/drawings'),
    create: () => fetchAPI<{ id: string }>('/drawings', { method: 'POST' }),
    get: (id: string) => fetchAPI<{ drawing: Drawing }>(`/drawings/${id}`),
    getContent: (id: string) => fetchAPI<DrawingContent>(`/drawings/${id}/content`),
    saveContent: (id: string, content: DrawingContent) =>
      fetchAPI<{ saved: boolean }>(`/drawings/${id}/content`, {
        method: 'PUT',
        body: JSON.stringify(content),
      }),
    updateTitle: (id: string, title: string) =>
      fetchAPI<{ updated: boolean }>(`/drawings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      }),
    delete: (id: string) =>
      fetchAPI<{ deleted: boolean }>(`/drawings/${id}`, { method: 'DELETE' }),
  },
}

export type Drawing = {
  id: string
  userId: string
  title: string | null
  r2Key: string
  thumbnailKey: string | null
  isPublic: boolean | null
  shareId: string | null
  elementCount: number | null
  lastModified: string | null
  createdAt: string
}

export type DrawingContent = {
  type: string
  version: number
  source: string
  elements: unknown[]
  appState: Record<string, unknown>
  files: Record<string, unknown>
}
