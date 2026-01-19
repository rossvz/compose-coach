import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { getSupabase } from '../lib/supabaseClient'
import '../App.css'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const supabase = getSupabase()
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })
      if (updateError) throw updateError
      setMessage('Password updated. Redirecting...')
      setTimeout(() => {
        navigate({ to: '/' })
      }, 1200)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Reset failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-panel">
      <h2>Reset password</h2>
      <p className="review-meta">Enter a new password for your account.</p>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          New password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            name="new-password"
            id="new-password"
            autoComplete="new-password"
            autoCapitalize="none"
            autoCorrect="off"
            minLength={6}
            required
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            placeholder="Re-enter password"
            name="confirm-password"
            id="confirm-password"
            autoComplete="new-password"
            autoCapitalize="none"
            autoCorrect="off"
            minLength={6}
            required
          />
        </label>
        <button className="new-review" type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      {message && <div className="status-pill">{message}</div>}
    </div>
  )
}
