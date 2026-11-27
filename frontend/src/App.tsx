import { useEffect, useState } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router'
import { api, type User } from './api'
import LoginPage from './LoginPage'
import HomePage from './HomePage'
import ProductList from './ProductList'
import ProductView from './ProductView'
import StoreHeader from './StoreHeader'

type Session = { status: 'loading' } | { status: 'out' } | { status: 'in'; user: User }

// After a failed Google login the backend redirects to /login?error=<reason>.
// Read it once at module load (not inside a component, so StrictMode can't read it twice).
const GENERIC_OAUTH_ERROR = 'Google sign-in failed. Please try again.'

const OAUTH_ERRORS: Record<string, string> = {
  google_denied: 'Google sign-in was cancelled.',
  invalid_state: 'Google sign-in could not be verified. Please try again.',
  email_taken: 'This email is already registered with a password. Please sign in with your password.',
  email_not_verified: 'Your Google email is not verified.',
  google_failed: GENERIC_OAUTH_ERROR,
}

function readOAuthError(): string | null {
  const code = new URLSearchParams(window.location.search).get('error')
  if (!code) return null
  // The error is shown on the sign-in screen, which lives at /account while logged out.
  window.history.replaceState(null, '', '/account')
  return OAUTH_ERRORS[code] ?? GENERIC_OAUTH_ERROR
}

const initialOAuthError = readOAuthError()

// Returning from "Connect Google" lands on /?linked=google (or ?link_error=...): move it to the account page,
// which reads and clears those query params itself. Runs before the router mounts, so the router starts there.
{
  const params = new URLSearchParams(window.location.search)
  if (params.has('linked') || params.has('link_error')) {
    window.history.replaceState(null, '', `/account${window.location.search}`)
  }
}

// Shared frame of the public storefront: header on top, the matched child route below.
function StoreLayout({ user }: { user: User | null | undefined }) {
  return (
    <div className="flex min-h-svh flex-col">
      <StoreHeader user={user} />
      <Outlet />
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState<Session>({ status: 'loading' })
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // Restore the session on page load: the access token is memory-only, so ask /refresh for a new one
  // (it uses the httpOnly refresh cookie), then load the user.
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

  // The storefront is public: it renders right away, without waiting for the session check.
  const headerUser = session.status === 'loading' ? undefined : session.status === 'in' ? session.user : null

  let account
  if (session.status === 'loading') {
    account = <div className="grid min-h-svh place-items-center text-muted">Loading…</div>
  } else if (session.status === 'out') {
    account = (
      <LoginPage
        initialError={initialOAuthError}
        onAuthenticated={(user) => {
          setSession({ status: 'in', user })
          navigate('/')
        }}
      />
    )
  } else {
    account = (
      <HomePage
        user={session.user}
        onUserChange={(user) => setSession({ status: 'in', user })}
        onLoggedOut={() => {
          setSession({ status: 'out' })
          navigate('/')
        }}
      />
    )
  }

  return (
    <Routes>
      <Route element={<StoreLayout user={headerUser} />}>
        <Route index element={<ProductList />} />
        <Route path="product/:id" element={<ProductView />} />
      </Route>
      <Route path="account" element={account} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
