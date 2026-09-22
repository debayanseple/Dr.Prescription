import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) setError(error.message)
    setBusy(false)
  }

  return (
    <div className="login-wrap">
      <div className="login-card" role="dialog" aria-labelledby="login-title">
        <div className="login-brand">
          <div className="login-avatar" aria-hidden="true">SR</div>
          <div>
            <h2 id="login-title">Dr. Suranjana Roy</h2>
            <p>Oral &amp; Maxillofacial Surgery · Prescription Desk</p>
          </div>
        </div>

        <ul className="login-points" aria-label="App highlights">
          <li>⎙ Exact-A4 print-ready PDFs</li>
          <li>☰ Patient history, searchable by name</li>
          <li>🔒 Private to this clinic — secured sign-in</li>
        </ul>

        <form className="form-grid" onSubmit={submit} autoComplete="on">
          <div className="field">
            <label htmlFor="login-email">Work email</label>
            <input
              id="login-email"
              type="email"
              inputMode="email"
              autoComplete="username"
              placeholder="doctor@clinic.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <div className="password-wrap">
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                aria-pressed={showPw}
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          {error && (
            <p className="form-error" role="alert">
              ⚠ {error}
            </p>
          )}
          <button className="btn btn-primary login-submit" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in securely →'}
          </button>
        </form>

        <p className="login-foot">
          PDFs generate on-device. Only saved history touches the server.
        </p>
      </div>
    </div>
  )
}
