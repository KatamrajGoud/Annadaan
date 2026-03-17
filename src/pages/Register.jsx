import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Mail, Lock, User, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, Loader2
} from 'lucide-react'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function Alert({ type, children }) {
  if (!children) return null
  const isError = type === 'error'
  return (
    <div className={`auth-alert auth-alert--${type}`} role={isError ? 'alert' : 'status'}>
      {isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
      <span>{children}</span>
    </div>
  )
}

function PasswordStrengthIndicator({ password }) {
  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) }
  ]

  const metCount = requirements.filter(r => r.met).length
  
  let label = 'Weak'
  let colorClass = 'strength-weak'
  if (metCount === 3) { label = 'Good'; colorClass = 'strength-good' }
  else if (metCount === 4) { label = 'Strong'; colorClass = 'strength-strong' }

  return (
    <div className="password-strength">
      <div className="strength-header">
        <span className="strength-label">Password strength:</span>
        {password.length > 0 && <span className={`strength-val ${colorClass}`}>{label}</span>}
      </div>
      <div className="strength-bar">
        <div 
          className={`strength-fill ${colorClass}`} 
          style={{ width: `${(metCount / requirements.length) * 100}%`, transition: 'width 0.3s ease, background-color 0.3s ease' }} 
        />
      </div>
      <ul className="req-list">
        {requirements.map((req, i) => (
          <li key={i} className={`req-item ${req.met ? 'met' : ''}`}>
            {req.met ? <CheckCircle2 size={12} /> : <div className="req-dot" />}
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Register() {
  const { signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    
    // Basic validation
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Please fill in all fields.')
      return
    }
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRx.test(form.email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await signUp(form.email, form.password, form.name)
      setSuccess('Account created! Please check your email to verify your address.')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        
        <div className="auth-header">
          <div className="auth-logo">🍱</div>
          {success ? (
            <>
              <h1 className="auth-title">Check your email</h1>
              <p className="auth-subtitle">We've sent a verification link to your email address.</p>
            </>
          ) : (
            <>
              <h1 className="auth-title">Create an Account</h1>
              <p className="auth-subtitle">Join Annadaan to start sharing food</p>
            </>
          )}
        </div>

        <Alert type="error">{error}</Alert>
        {success && <Alert type="success">{success}</Alert>}

        {!success ? (
          <>
            <button
              className="btn-google"
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              type="button"
            >
              {googleLoading ? <Loader2 size={18} className="spin-icon" /> : <GoogleIcon />}
              {googleLoading ? 'Connecting to Google…' : 'Sign up with Google'}
            </button>

            <div className="auth-divider"><span>or register with email</span></div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-wrap">
                  <User size={16} className="input-icon" />
                  <input
                    type="text"
                    name="name"
                    className="form-input with-icon"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email address</label>
                <div className="input-wrap">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    className="form-input with-icon"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrap">
                  <Lock size={16} className="input-icon" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    name="password"
                    className="form-input with-icon with-icon-right"
                    placeholder="Min 8 characters"
                    value={form.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="input-icon-right"
                    onClick={() => setShowPw(v => !v)}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && <PasswordStrengthIndicator password={form.password} />}
              </div>

              <div className="form-group" style={{ marginTop: form.password ? '1rem' : '0' }}>
                <label className="form-label">Confirm Password</label>
                <div className="input-wrap">
                  <Lock size={16} className="input-icon" />
                  <input
                    type="password"
                    name="confirmPassword"
                    className="form-input with-icon"
                    placeholder="Repeat password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    autoComplete="new-password"
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
                  ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Creating account…</>
                  : <><ArrowRight size={17} /> Create Account</>}
              </button>
            </form>

            <p className="auth-footer-text" style={{ marginTop: '1.5rem' }}>
              Already have an account?{' '}
              <Link to="/login" className="link-btn link-btn--accent">Sign in here</Link>
            </p>
          </>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link to="/login" className="btn btn-primary btn-lg">
              Go to Login page
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
