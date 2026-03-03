import '@excalidraw/excalidraw/index.css'
import { Excalidraw } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { useRef, useCallback } from 'react'

export function DrawingCanvas() {
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null)

  const handleExcalidrawAPI = useCallback((api: ExcalidrawImperativeAPI) => {
    excalidrawAPIRef.current = api
  }, [])

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Excalidraw
        excalidrawAPI={handleExcalidrawAPI}
        theme={
          window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
        }
      />
    </div>
  )
}
