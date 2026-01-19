import { useState } from 'react'
import { getSupabase } from '../lib/supabaseClient'

export default function AuthPanel() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    setResetSent(false)

    try {
      const supabase = getSupabase()
      if (mode === 'sign-in') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError
        setMessage('Account created. You can now sign in.')
        setMode('sign-in')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Auth failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!email) {
      setError('Enter your email to reset your password.')
      return
    }
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const supabase = getSupabase()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) throw resetError
      setResetSent(true)
      setMessage('Password reset email sent. Check your inbox.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Reset failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-panel">
      <h2>{mode === 'sign-in' ? 'Sign in' : 'Create account'}</h2>
      <p className="review-meta">
        {mode === 'sign-in'
          ? 'Sign in to keep your reviews.'
          : 'Create an account to save reviews and uploads.'}
      </p>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            name="email"
            id="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            name={mode === 'sign-in' ? 'current-password' : 'new-password'}
            id="password"
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            autoCapitalize="none"
            autoCorrect="off"
            minLength={6}
            required
          />
        </label>
        <button className="new-review" type="submit" disabled={loading}>
          {loading
            ? 'Working...'
            : mode === 'sign-in'
              ? 'Sign in'
              : 'Create account'}
        </button>
      </form>
      {mode === 'sign-in' && (
        <button
          type="button"
          className="link-button"
          onClick={handleReset}
          disabled={loading}
        >
          {resetSent ? 'Reset email sent' : 'Forgot password?'}
        </button>
      )}
      {error && <div className="error">{error}</div>}
      {message && <div className="status-pill">{message}</div>}
      <button
        type="button"
        className="link-button"
        onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
      >
        {mode === 'sign-in'
          ? 'Need an account? Create one.'
          : 'Already have an account? Sign in.'}
      </button>
    </div>
  )
}
