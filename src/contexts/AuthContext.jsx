import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth state changes (handles OAuth + password recovery redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
      }
      setProfile(data ?? null)
    } catch (err) {
      console.error('Profile fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ── Email + Password Registration ───────────────────────────────────────────
  async function signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name },           // stored in auth.users metadata
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) throw error

    // Upsert profile row (id may not exist yet if email unconfirmed)
    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        name: name.trim(),
        email: email.trim(),
      })
    }
    return data
  }

  // ── Email + Password Login ──────────────────────────────────────────────────
  async function signInWithPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) throw error
    return data
  }

  // ── Send OTP (magic link / email OTP) ──────────────────────────────────────
  async function sendOtp(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    if (error) throw error
  }

  // ── Verify OTP ──────────────────────────────────────────────────────────────
  async function verifyOtp(email, token) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    if (error) throw error
    return data
  }

  // ── Google OAuth ─────────────────────────────────────────────────────────────
  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  // ── Forgot Password — sends reset email ────────────────────────────────────
  async function sendPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  // ── Reset Password — used on /reset-password page after token redirect ────
  async function updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    return data
  }

  // ── Sign Out ─────────────────────────────────────────────────────────────────
  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // ── Update Profile ───────────────────────────────────────────────────────────
  async function updateProfile(updates) {
    if (!user) throw new Error('Not authenticated')
    const { data, error } = await supabase
      .from('users')
      .upsert({ id: user.id, ...updates })
      .select()
      .single()
    if (error) throw error
    setProfile(data)
    return data
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signInWithPassword,
    sendOtp,
    verifyOtp,
    signInWithGoogle,
    signOut,
    sendPasswordReset,
    updatePassword,
    updateProfile,
    refreshProfile: () => user && fetchProfile(user.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
