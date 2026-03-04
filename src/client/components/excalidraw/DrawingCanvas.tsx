import '@excalidraw/excalidraw/index.css'
import { Excalidraw } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { useRef, useCallback } from 'react'
import { useAutoSave, type SaveStatus } from '@/client/hooks/useAutoSave'
import type { DrawingContent } from '@/client/lib/api-client'

function SaveIndicator({ status }: { status: SaveStatus }) {
  const colors: Record<SaveStatus, string> = {
    saved: 'bg-green-500',
    saving: 'bg-yellow-500',
    unsaved: 'bg-zinc-400',
    error: 'bg-red-500',
  }
  const labels: Record<SaveStatus, string> = {
    saved: 'Saved',
    saving: 'Saving...',
    unsaved: 'Unsaved',
    error: 'Save failed',
  }

  return (
    <div className="flex items-center gap-1.5 rounded-md bg-white/80 px-2 py-1 text-xs backdrop-blur dark:bg-zinc-900/80">
      <div className={`h-2 w-2 rounded-full ${colors[status]}`} />
      <span className="text-zinc-600 dark:text-zinc-400">{labels[status]}</span>
    </div>
  )
}

type DrawingCanvasProps = {
  drawingId: string | null
  initialData?: DrawingContent | null
}

export function DrawingCanvas({ drawingId, initialData }: DrawingCanvasProps) {
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const { handleChange, saveStatus } = useAutoSave(drawingId)

  const handleExcalidrawAPI = useCallback((api: ExcalidrawImperativeAPI) => {
    excalidrawAPIRef.current = api
  }, [])

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Excalidraw
        excalidrawAPI={handleExcalidrawAPI}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialData={initialData ? {
          elements: initialData.elements,
          appState: initialData.appState,
          files: initialData.files,
          scrollToContent: true,
        } as any : undefined}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onChange={handleChange as any}
        theme={
          window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
        }
        renderTopRightUI={() =>
          drawingId ? <SaveIndicator status={saveStatus} /> : null
        }
      />
    </div>
  )
}
