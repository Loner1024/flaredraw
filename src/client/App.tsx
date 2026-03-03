import { Routes, Route } from 'react-router-dom'
import { DrawingPage } from './pages/DrawingPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<DrawingPage />} />
    </Routes>
  )
}
