import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  User, AlertCircle, ArrowRight, Loader2
} from 'lucide-react'

function Alert({ type, children }) {
  if (!children) return null
  const isError = type === 'error'
  return (
    <div className={`auth-alert auth-alert--${type}`} role={isError ? 'alert' : 'status'}>
      {isError && <AlertCircle size={16} />}
      <span>{children}</span>
    </div>
  )
}

export default function Login() {
  const { dummyLogin } = useAuth()
  const navigate = useNavigate()
  
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState(false)

  const handleChange = (e) => {
    setIdentifier(e.target.value)
    if (fieldError) setFieldError(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setFieldError(false)
    
    const val = identifier.trim()

    if (!val) {
      setError('Please enter Mobile Number or Gmail ID.')
      setFieldError(true)
      return
    }

    const isMobile = /^[6-9]\d{9}$/.test(val)
    const isGmail = val.toLowerCase().endsWith('@gmail.com')

    if (!isMobile && !isGmail) {
      setError('Please enter a valid 10-digit Indian mobile number OR a valid Gmail ID ending with @gmail.com.')
      setFieldError(true)
      return
    }

    setLoading(true)
    try {
      await dummyLogin(val)
      navigate('/feed', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        
        <div className="auth-header">
          <div className="auth-logo">🍱</div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your Annadaan account</p>
        </div>

        <Alert type="error">{error}</Alert>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Mobile Number OR Gmail ID</label>
            <div className="input-wrap" style={{ border: fieldError ? '1px solid var(--color-error)' : undefined, borderRadius: '8px' }}>
              <User size={16} className="input-icon" />
              <input
                type="text"
                name="identifier"
                className="form-input with-icon"
                placeholder="Mobile OR Gmail..."
                value={identifier}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: '1.5rem' }}
          >
            {loading
              ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Signing in…</>
              : <><ArrowRight size={17} /> Login</>}
          </button>
        </form>

        <p className="auth-footer-text" style={{ marginTop: '1.5rem' }}>
          Don't have an account?{' '}
          <Link to="/register" className="link-btn link-btn--accent">Create one free</Link>
        </p>

        <p className="auth-terms">
          By signing in you agree to our{' '}
          <a href="#" className="link-btn">Terms of Service</a> and{' '}
          <a href="#" className="link-btn">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}
