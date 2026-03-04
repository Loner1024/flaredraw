import { Routes, Route, Navigate } from 'react-router-dom'
import { useSession } from '@/client/lib/auth'
import { DrawingPage } from './pages/DrawingPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { SharedDrawingPage } from './pages/SharedDrawingPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-zinc-500">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/s/:shareId" element={<SharedDrawingPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/draw/:id"
        element={
          <ProtectedRoute>
            <DrawingPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
