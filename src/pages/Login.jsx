import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mail, ArrowRight, ShieldCheck, Loader2, ChevronLeft } from 'lucide-react'

// ─── Google SVG ──────────────────────────────────────────────────────────────
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

// ─── OTP Input: 6 individual digit boxes ──────────────────────────────────────
function OtpInput({ value, onChange, disabled }) {
  const inputs = useRef([])
  const digits = value.split('')

  function handleKey(e, idx) {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        // clear current box
        const next = digits.slice()
        next[idx] = ''
        onChange(next.join(''))
      } else if (idx > 0) {
        // move to previous box and clear it
        const next = digits.slice()
        next[idx - 1] = ''
        onChange(next.join(''))
        inputs.current[idx - 1]?.focus()
      }
      e.preventDefault()
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputs.current[idx - 1]?.focus()
    } else if (e.key === 'ArrowRight' && idx < 5) {
      inputs.current[idx + 1]?.focus()
    }
  }

  function handleInput(e, idx) {
    const char = e.target.value.replace(/\D/g, '').slice(-1)
    if (!char) return
    const next = digits.slice()
    next[idx] = char
    onChange(next.join(''))
    if (idx < 5) inputs.current[idx + 1]?.focus()
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted.padEnd(6, '').slice(0, 6))
    const focusIdx = Math.min(pasted.length, 5)
    inputs.current[focusIdx]?.focus()
  }

  // auto-focus first empty box
  useEffect(() => {
    const firstEmpty = digits.findIndex(d => !d)
    const focusIdx = firstEmpty === -1 ? 5 : firstEmpty
    inputs.current[focusIdx]?.focus()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', margin: '1.5rem 0' }}>
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
          style={{
            width: '3rem',
            height: '3.5rem',
            textAlign: 'center',
            fontSize: '1.5rem',
            fontWeight: 700,
            borderRadius: '0.75rem',
            border: '2px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            outline: 'none',
            transition: 'border-color 0.2s',
            caretColor: 'transparent',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
          onBlur={e => (e.target.style.borderColor = digits[idx] ? 'var(--color-primary)' : 'var(--color-border)')}
        />
      ))}
    </div>
  )
}

// ─── Main Login Component ─────────────────────────────────────────────────────
export default function Login() {
  const { sendOtp, verifyOtp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState('email') // 'email' | 'otp'
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  // ── Send OTP ────────────────────────────────────────────────────────────────
  async function handleSendOtp(e) {
    e.preventDefault()
    if (!email.trim()) return
    setError('')
    setLoading(true)
    try {
      await sendOtp(email.trim())
      setInfo(`We sent a 6-digit code to ${email.trim()}. Check your inbox (and spam folder).`)
      setOtp('')
      setStep('otp')
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Verify OTP ──────────────────────────────────────────────────────────────
  async function handleVerifyOtp(e) {
    e.preventDefault()
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit code.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await verifyOtp(email.trim(), otp)
      navigate('/feed', { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Google Sign-In ──────────────────────────────────────────────────────────
  async function handleGoogle() {
    setError('')
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
      // page will redirect — no need to setLoading(false)
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  async function handleResend() {
    setError('')
    setInfo('')
    setOtp('')
    setLoading(true)
    try {
      await sendOtp(email.trim())
      setInfo('A new code was sent to your email.')
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* ── Header ── */}
        <div className="auth-header">
          <div className="auth-logo">🍱</div>
          {step === 'email' ? (
            <>
              <h1 className="auth-title">Welcome to Annadaan</h1>
              <p className="auth-subtitle">Sign in or create an account to start sharing food</p>
            </>
          ) : (
            <>
              <h1 className="auth-title">Check your email</h1>
              <p className="auth-subtitle">Enter the 6-digit code we sent you</p>
            </>
          )}
        </div>

        {/* ── Alert ── */}
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}
        {info && !error && (
          <div className="alert alert-success" role="status" style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)',
            color: '#059669',
            borderRadius: '0.75rem',
            padding: '0.875rem 1rem',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
          }}>
            {info}
          </div>
        )}

        {/* ════════════════════ STEP 1: Email Entry ════════════════════ */}
        {step === 'email' && (
          <>
            {/* Google Sign-In */}
            <button
              id="btn-google-signin"
              className="btn-google"
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              type="button"
            >
              {googleLoading
                ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                : <GoogleIcon />
              }
              {googleLoading ? 'Connecting to Google…' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className="divider">OR</div>

            {/* Email OTP Form */}
            <form onSubmit={handleSendOtp} noValidate>
              <div className="form-group">
                <label htmlFor="login-email" className="form-label">
                  Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    style={{
                      position: 'absolute', left: '1rem', top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-muted)', pointerEvents: 'none',
                    }}
                  />
                  <input
                    id="login-email"
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: '2.75rem' }}
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    required
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                id="btn-send-otp"
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading || !email.trim()}
              >
                {loading
                  ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Sending code…</>
                  : <><ArrowRight size={17} /> Send OTP to Email</>
                }
              </button>
            </form>
          </>
        )}

        {/* ════════════════════ STEP 2: OTP Verification ════════════════════ */}
        {step === 'otp' && (
          <>
            {/* Back button */}
            <button
              type="button"
              onClick={() => { setStep('email'); setError(''); setInfo(''); setOtp('') }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                background: 'none', border: 'none', color: 'var(--color-text-secondary)',
                fontSize: '0.875rem', cursor: 'pointer', padding: '0 0 0.5rem 0',
                marginBottom: '0.5rem',
              }}
            >
              <ChevronLeft size={15} /> Back
            </button>

            {/* Sent-to label */}
            <p style={{
              textAlign: 'center', fontSize: '0.9rem',
              color: 'var(--color-text-secondary)', marginBottom: '0.25rem',
            }}>
              Code sent to <strong style={{ color: 'var(--color-text)' }}>{email}</strong>
            </p>

            {/* 6-box OTP input */}
            <OtpInput value={otp} onChange={setOtp} disabled={loading} />

            <form onSubmit={handleVerifyOtp} noValidate>
              <button
                id="btn-verify-otp"
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading || otp.length !== 6}
              >
                {loading
                  ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Verifying…</>
                  : <><ShieldCheck size={17} /> Verify &amp; Sign In</>
                }
              </button>
            </form>

            {/* Resend */}
            <p style={{
              textAlign: 'center', marginTop: '1.25rem',
              fontSize: '0.875rem', color: 'var(--color-text-secondary)',
            }}>
              Didn't get it?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--color-primary)', fontWeight: 600,
                  cursor: 'pointer', padding: 0, fontSize: 'inherit',
                }}
              >
                Resend code
              </button>
            </p>
          </>
        )}

        {/* Footer note */}
        <p style={{
          textAlign: 'center', marginTop: '1.75rem',
          fontSize: '0.8rem', color: 'var(--color-text-muted)',
        }}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
