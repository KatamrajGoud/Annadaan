import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Feed from './pages/Feed'
import CreatePost from './pages/CreatePost'
import MapView from './pages/MapView'
import Profile from './pages/Profile'
import Requests from './pages/Requests'
import PostDetail from './pages/PostDetail'

/**
 * AuthCallback — landing page after Google OAuth redirect.
 * Supabase processes the token in the URL hash and fires onAuthStateChange.
 * The AuthContext listener sets the user, then PublicRoute redirects to /feed.
 */
function AuthCallback() {
  return (
    <div className="loading-screen">
      <div className="spinner" />
      <span>Completing sign-in…</span>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <span>Loading...</span>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
    </div>
  )
  if (user) return <Navigate to="/feed" replace />
  return children
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={
            <PublicRoute><Login /></PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute><Register /></PublicRoute>
          } />
          {/* Google OAuth redirect lands here */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/feed" element={
            <ProtectedRoute><Feed /></ProtectedRoute>
          } />
          <Route path="/create-post" element={
            <ProtectedRoute><CreatePost /></ProtectedRoute>
          } />
          <Route path="/map" element={
            <ProtectedRoute><MapView /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/requests" element={
            <ProtectedRoute><Requests /></ProtectedRoute>
          } />
          <Route path="/post/:id" element={
            <ProtectedRoute><PostDetail /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
