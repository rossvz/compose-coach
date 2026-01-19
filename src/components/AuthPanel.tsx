import { useState } from 'react'
import { getSupabase } from '../lib/supabaseClient'

export default function AuthPanel() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

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
