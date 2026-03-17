import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck,
  Loader2, ChevronLeft, AlertCircle, CheckCircle2
} from 'lucide-react'

// ─── Google SVG ───────────────────────────────────────────────────────────────
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

// ─── 6-box OTP Input ──────────────────────────────────────────────────────────
function OtpInput({ value, onChange, disabled }) {
  const inputs = useRef([])
  const digits = value.split('')

  function handleKey(e, idx) {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits]; next[idx] = ''; onChange(next.join(''))
      } else if (idx > 0) {
        const next = [...digits]; next[idx - 1] = ''; onChange(next.join(''))
        inputs.current[idx - 1]?.focus()
      }
      e.preventDefault()
    } else if (e.key === 'ArrowLeft' && idx > 0) inputs.current[idx - 1]?.focus()
    else if (e.key === 'ArrowRight' && idx < 5) inputs.current[idx + 1]?.focus()
  }

  function handleInput(e, idx) {
    const char = e.target.value.replace(/\D/g, '').slice(-1)
    if (!char) return
    const next = [...digits]; next[idx] = char; onChange(next.join(''))
    if (idx < 5) inputs.current[idx + 1]?.focus()
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted.padEnd(6, '').slice(0, 6))
    inputs.current[Math.min(pasted.length, 5)]?.focus()
  }

  useEffect(() => {
    const firstEmpty = digits.findIndex(d => !d)
    inputs.current[firstEmpty === -1 ? 5 : firstEmpty]?.focus()
  }, []) // eslint-disable-line

  return (
    <div className="otp-grid">
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={el => (inputs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[idx] || ''}
          onKeyDown={e => handleKey(e, idx)}
          onInput={e => handleInput(e, idx)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`OTP digit ${idx + 1}`}
          className={`otp-box${digits[idx] ? ' filled' : ''}`}
        />
      ))}
    </div>
  )
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────
function Alert({ type, children }) {
  if (!children) return null
  const isError = type === 'error'
  return (
    <div className={`auth-alert auth-alert--${type}`} role={isError ? 'alert' : 'status'}>
      {isError
        ? <AlertCircle size={16} style={{ flexShrink: 0 }} />
        : <CheckCircle2 size={16} style={{ flexShrink: 0 }} />}
      <span>{children}</span>
    </div>
  )
}

// ─── Main Login Component ─────────────────────────────────────────────────────
export default function Login() {
  const { signInWithPassword, sendOtp, verifyOtp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState('password')        // 'password' | 'otp'
  const [otpStep, setOtpStep] = useState('email')   // 'email' | 'code'

  // Password tab state
  const [pwForm, setPwForm] = useState({ email: '', password: '', remember: false })
  const [showPw, setShowPw] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')

  // OTP tab state
  const [otpEmail, setOtpEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [otpInfo, setOtpInfo] = useState('')

  // Google
  const [googleLoading, setGoogleLoading] = useState(false)

  // ── Password Login ──────────────────────────────────────────────────────────
  async function handlePasswordLogin(e) {
    e.preventDefault()
    setPwError('')
    const { email, password } = pwForm
    if (!email.trim() || !password) { setPwError('Please enter your email and password.'); return }
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRx.test(email.trim())) { setPwError('Please enter a valid email address.'); return }
    setPwLoading(true)
    try {
      await signInWithPassword(email.trim(), password)
      navigate('/feed', { replace: true })
    } catch (err) {
      const msg = err.message || ''
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
        setPwError('Incorrect email or password. Please try again.')
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        setPwError('Please verify your email address before signing in. Check your inbox.')
      } else {
        setPwError(msg || 'Login failed. Please try again.')
      }
    } finally {
      setPwLoading(false)
    }
  }

  // ── OTP Send ────────────────────────────────────────────────────────────────
  async function handleSendOtp(e) {
    e.preventDefault()
    setOtpError(''); setOtpLoading(true)
    try {
      await sendOtp(otpEmail.trim())
      setOtpInfo(`We sent a 6-digit code to ${otpEmail.trim()}. Check your inbox and spam folder.`)
      setOtp(''); setOtpStep('code')
    } catch (err) {
      setOtpError(err.message || 'Failed to send OTP. Please try again.')
    } finally { setOtpLoading(false) }
  }

  // ── OTP Verify ──────────────────────────────────────────────────────────────
  async function handleVerifyOtp(e) {
    e.preventDefault()
    if (otp.length !== 6) { setOtpError('Please enter the complete 6-digit code.'); return }
    setOtpError(''); setOtpLoading(true)
    try {
      await verifyOtp(otpEmail.trim(), otp)
      navigate('/feed', { replace: true })
    } catch (err) {
      setOtpError(err.message || 'Invalid or expired code. Please try again.')
    } finally { setOtpLoading(false) }
  }

  // ── OTP Resend ──────────────────────────────────────────────────────────────
  async function handleResend() {
    setOtpError(''); setOtpInfo(''); setOtp(''); setOtpLoading(true)
    try {
      await sendOtp(otpEmail.trim())
      setOtpInfo('A new code was sent to your email.')
    } catch (err) {
      setOtpError(err.message || 'Failed to resend code.')
    } finally { setOtpLoading(false) }
  }

  // ── Google ──────────────────────────────────────────────────────────────────
  async function handleGoogle() {
    setPwError(''); setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setPwError(err.message || 'Google sign-in failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* ── Header ── */}
        <div className="auth-header">
          <div className="auth-logo">🍱</div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your Annadaan account</p>
        </div>

        {/* ── Google Button ── */}
        <button
          id="btn-google-signin"
          className="btn-google"
          onClick={handleGoogle}
          disabled={googleLoading || pwLoading || otpLoading}
          type="button"
        >
          {googleLoading
            ? <Loader2 size={18} className="spin-icon" />
            : <GoogleIcon />}
          {googleLoading ? 'Connecting to Google…' : 'Continue with Google'}
        </button>

        <div className="auth-divider"><span>or sign in with email</span></div>

        {/* ── Tabs ── */}
        <div className="auth-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'password'}
            className={`auth-tab${tab === 'password' ? ' active' : ''}`}
            onClick={() => { setTab('password'); setPwError('') }}
          >🔑 Password</button>
          <button
            role="tab"
            aria-selected={tab === 'otp'}
            className={`auth-tab${tab === 'otp' ? ' active' : ''}`}
            onClick={() => { setTab('otp'); setOtpError(''); setOtpInfo(''); setOtpStep('email') }}
          >📧 Email OTP</button>
        </div>

        {/* ════════════ TAB: Password ════════════ */}
        {tab === 'password' && (
          <form onSubmit={handlePasswordLogin} noValidate>
            <Alert type="error">{pwError}</Alert>

            <div className="form-group">
              <label htmlFor="login-email" className="form-label">Email address</label>
              <div className="input-wrap">
                <Mail size={16} className="input-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="form-input with-icon"
                  placeholder="you@example.com"
                  value={pwForm.email}
                  onChange={e => { setPwForm(f => ({ ...f, email: e.target.value })); setPwError('') }}
                  autoComplete="email"
                  disabled={pwLoading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="login-password" className="form-label">Password</label>
                <Link to="/forgot-password" className="form-label-link">Forgot password?</Link>
              </div>
              <div className="input-wrap">
                <Lock size={16} className="input-icon" />
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  className="form-input with-icon with-icon-right"
                  placeholder="Your password"
                  value={pwForm.password}
                  onChange={e => { setPwForm(f => ({ ...f, password: e.target.value })); setPwError('') }}
                  autoComplete="current-password"
                  disabled={pwLoading}
                  required
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <label className="remember-me">
              <input
                type="checkbox"
                className="remember-checkbox"
                checked={pwForm.remember}
                onChange={e => setPwForm(f => ({ ...f, remember: e.target.checked }))}
              />
              <span>Remember me for 30 days</span>
            </label>

            <button
              id="btn-password-login"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={pwLoading}
            >
              {pwLoading
                ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Signing in…</>
                : <><ArrowRight size={17} /> Sign In</>}
            </button>
          </form>
        )}

        {/* ════════════ TAB: OTP Step 1 — Email ════════════ */}
        {tab === 'otp' && otpStep === 'email' && (
          <form onSubmit={handleSendOtp} noValidate>
            <Alert type="error">{otpError}</Alert>
            <div className="form-group">
              <label htmlFor="otp-email" className="form-label">Email address</label>
              <div className="input-wrap">
                <Mail size={16} className="input-icon" />
                <input
                  id="otp-email"
                  type="email"
                  className="form-input with-icon"
                  placeholder="you@example.com"
                  value={otpEmail}
                  onChange={e => { setOtpEmail(e.target.value); setOtpError('') }}
                  autoComplete="email"
                  disabled={otpLoading}
                  required
                />
              </div>
            </div>
            <button
              id="btn-send-otp"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={otpLoading || !otpEmail.trim()}
            >
              {otpLoading
                ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Sending…</>
                : <><ArrowRight size={17} /> Send 6-digit Code</>}
            </button>
          </form>
        )}

        {/* ════════════ TAB: OTP Step 2 — Code ════════════ */}
        {tab === 'otp' && otpStep === 'code' && (
          <>
            <button
              type="button"
              className="btn-back"
              onClick={() => { setOtpStep('email'); setOtpError(''); setOtpInfo(''); setOtp('') }}
            >
              <ChevronLeft size={15} /> Back
            </button>

            <Alert type="success">{otpInfo}</Alert>
            <Alert type="error">{otpError}</Alert>

            <p className="otp-sent-to">
              Code sent to <strong>{otpEmail}</strong>
            </p>

            <OtpInput value={otp} onChange={setOtp} disabled={otpLoading} />

            <form onSubmit={handleVerifyOtp} noValidate>
              <button
                id="btn-verify-otp"
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={otpLoading || otp.length !== 6}
              >
                {otpLoading
                  ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Verifying…</>
                  : <><ShieldCheck size={17} /> Verify &amp; Sign In</>}
              </button>
            </form>

            <p className="resend-row">
              Didn't get it?{' '}
              <button type="button" className="link-btn" onClick={handleResend} disabled={otpLoading}>
                Resend code
              </button>
            </p>
          </>
        )}

        {/* ── Footer ── */}
        <p className="auth-footer-text">
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
