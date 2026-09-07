import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

import Landing    from './pages/Landing'
import Login      from './pages/Login'
import Register   from './pages/Register'
import Dashboard  from './pages/Dashboard'
import NewPet     from './pages/NewPet'
import LiveScan   from './pages/LiveScan'
import UploadScan from './pages/UploadScan'
import Results    from './pages/Results'
import History    from './pages/History'
import Privacy    from './pages/Privacy'
import Terms      from './pages/Terms'
import Navbar     from './components/Navbar'
import PageBackground from './components/PageBackground'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-base">
      <div className="w-8 h-8 border-2 border-accent rounded-full border-t-transparent animate-spin" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

import { GoogleOAuthProvider } from '@react-oauth/google'

export default function App() {
  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <AuthProvider>
        <BrowserRouter>
          <PageBackground />
          <Navbar />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1E2430',
                color: '#EDF0F4',
                border: '1px solid #2A3140',
                borderRadius: '10px',
                fontFamily: 'Inter, sans-serif',
              },
              success: { iconTheme: { primary: '#52B788', secondary: '#0E1217' } },
              error:   { iconTheme: { primary: '#E07A7A', secondary: '#0E1217' } },
            }}
          />

          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms"   element={<Terms />} />

            {/* Auth (redirect if logged in) */}
            <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* Protected */}
            <Route path="/dashboard"         element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/pets/new"          element={<PrivateRoute><NewPet /></PrivateRoute>} />
            <Route path="/scan/live"         element={<PrivateRoute><LiveScan /></PrivateRoute>} />
            <Route path="/scan/upload"       element={<PrivateRoute><UploadScan /></PrivateRoute>} />
            <Route path="/results/:scanId"   element={<PrivateRoute><Results /></PrivateRoute>} />
            <Route path="/pets/:petId/history" element={<PrivateRoute><History /></PrivateRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}
