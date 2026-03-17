import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mail, ArrowRight, Loader2, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react'

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

export default function ForgotPassword() {
  const { sendPasswordReset } = useAuth()
  
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    
    setLoading(true)
    try {
      await sendPasswordReset(email.trim())
      setSuccess(`A password reset link has been sent to ${email.trim()}.`)
      setEmail('')
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        
        <Link to="/login" className="btn-back" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
          <ChevronLeft size={15} /> Back to login
        </Link>
        
        <div className="auth-header">
          <div className="auth-logo">🔑</div>
          {success ? (
            <>
              <h1 className="auth-title">Email sent</h1>
              <p className="auth-subtitle">Check your inbox for the reset link</p>
            </>
          ) : (
            <>
              <h1 className="auth-title">Reset Password</h1>
              <p className="auth-subtitle">Enter your email and we'll send you a recovery link</p>
            </>
          )}
        </div>

        <Alert type="error">{error}</Alert>
        {success && <Alert type="success">{success}</Alert>}

        {!success && (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="reset-email" className="form-label">Email address</label>
              <div className="input-wrap">
                <Mail size={16} className="input-icon" />
                <input
                  id="reset-email"
                  type="email"
                  className="form-input with-icon"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  autoComplete="email"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading || !email.trim()}
              style={{ marginTop: '1.5rem' }}
            >
              {loading
                ? <><Loader2 size={18} className="spin-icon" /> Sending link…</>
                : <><ArrowRight size={17} /> Send Reset Link</>}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
