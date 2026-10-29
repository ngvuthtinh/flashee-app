import { useEffect, useState } from 'react'
import { api, type User } from './api'
import LoginPage from './LoginPage'
import HomePage from './HomePage'

type Session = { status: 'loading' } | { status: 'out' } | { status: 'in'; user: User }

// After a failed Google login the backend redirects to /login?error=<reason>.
// Read it once at module load (not inside a component, so StrictMode can't read it twice).
const OAUTH_ERRORS: Record<string, string> = {
  google_denied: 'Google sign-in was cancelled.',
  invalid_state: 'Google sign-in could not be verified. Please try again.',
}

function readOAuthError(): string | null {
  const code = new URLSearchParams(window.location.search).get('error')
  if (!code) return null
  window.history.replaceState(null, '', '/')
  return OAUTH_ERRORS[code] ?? code
}

const initialOAuthError = readOAuthError()

export default function App() {
  const [session, setSession] = useState<Session>({ status: 'loading' })

  // Restore the session on page load: the access token is memory-only, so ask /refresh for a new one
  // (it works from the localStorage token or the httpOnly cookie), then load the user.
  useEffect(() => {
    let cancelled = false
    api
      .refresh()
      .then(() => api.me())
      .then((result) => {
        if (!cancelled) setSession({ status: 'in', user: result.body.data.user })
      })
      .catch(() => {
        if (!cancelled) setSession({ status: 'out' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (session.status === 'loading') {
    return <div className="grid min-h-svh place-items-center text-muted">Loading…</div>
  }

  if (session.status === 'out') {
    return (
      <LoginPage
        initialError={initialOAuthError}
        onAuthenticated={(user) => setSession({ status: 'in', user })}
      />
    )
  }

  return (
    <HomePage
      user={session.user}
      onUserChange={(user) => setSession({ status: 'in', user })}
      onLoggedOut={() => setSession({ status: 'out' })}
    />
  )
}
