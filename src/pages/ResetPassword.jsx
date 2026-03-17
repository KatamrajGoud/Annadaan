import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Save, Loader2 } from 'lucide-react'

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
          style={{ width: `${(metCount / requirements.length) * 100}%`, transition: 'all 0.3s ease' }} 
        />
      </div>
    </div>
  )
}

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    
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
      await updatePassword(form.password)
      setSuccess('Your password has been successfully reset.')
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try the reset link again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🔐</div>
          <h1 className="auth-title">Create New Password</h1>
          <p className="auth-subtitle">
            {success ? 'Password updated successfully' : 'Enter your new password below'}
          </p>
        </div>

        <Alert type="error">{error}</Alert>
        {success && <Alert type="success">{success}</Alert>}

        {!success ? (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="input-wrap">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPw ? 'text' : 'password'}
                  className="form-input with-icon with-icon-right"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  disabled={loading}
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
              <label className="form-label">Confirm New Password</label>
              <div className="input-wrap">
                <Lock size={16} className="input-icon" />
                <input
                  type="password"
                  className="form-input with-icon"
                  placeholder="Repeat new password"
                  value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading || !form.password || !form.confirmPassword}
              style={{ marginTop: '1.5rem' }}
            >
              {loading
                ? <><Loader2 size={18} className="spin-icon" /> Saving password…</>
                : <><Save size={17} /> Save New Password</>}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to="/login" className="btn btn-primary btn-lg">
              Return to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
