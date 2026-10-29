import { useState, type ReactNode } from 'react'
import { api, ApiError, type ApiResult, type User } from './api'

interface HomePageProps {
  user: User
  onUserChange: (user: User) => void
  onLoggedOut: () => void
}

interface LastResponse {
  status: number
  body: unknown
}

const card = 'flex min-w-0 flex-col gap-5 rounded-[22px] bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.05)]'
const secondaryButton =
  'flex h-12 cursor-pointer items-center justify-center rounded-xl bg-canvas text-base font-medium hover:bg-[#ededf0] disabled:cursor-not-allowed disabled:opacity-60'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-[17px] font-medium break-words">{children}</span>
    </div>
  )
}

export default function HomePage({ user, onUserChange, onLoggedOut }: HomePageProps) {
  const [last, setLast] = useState<LastResponse | null>(null)
  const [busy, setBusy] = useState(false)

  // Run one API call and show whatever the server answered (success or error) in the "Last response" box.
  async function run(call: () => Promise<ApiResult<unknown>>) {
    setBusy(true)
    try {
      const result = await call()
      setLast({ status: result.status, body: result.body })
      return result
    } catch (err) {
      if (err instanceof ApiError) setLast({ status: err.status, body: err.body })
      else setLast({ status: 0, body: { message: 'Cannot reach the server. Is the backend running?' } })
    } finally {
      setBusy(false)
    }
  }

  async function reloadAccount() {
    const result = await run(() => api.me())
    const fresh = (result?.body.data as { user?: User } | undefined)?.user
    if (fresh) onUserChange(fresh)
  }

  async function logout() {
    setBusy(true)
    try {
      await api.logout()
    } catch {
      // The local session is cleared either way; nothing more the user can do about a failed revoke.
    }
    onLoggedOut()
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex min-h-13 flex-wrap items-center justify-between gap-2 border-b border-[#e5e5ea] bg-white/70 px-8">
        <span className="text-[19px] font-semibold tracking-tight">flashee</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted">Signed in as {user.email_address}</span>
          <button
            type="button"
            onClick={logout}
            disabled={busy}
            className="h-9 cursor-pointer rounded-full bg-canvas px-4 text-sm font-medium hover:bg-[#ededf0] disabled:opacity-60"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-3 px-8 pt-[72px] pb-6">
        <span className="text-sm font-semibold text-brand">You are signed in</span>
        <h1 className="text-5xl leading-[1.07] font-semibold tracking-[-0.03em] sm:text-[56px]">Welcome back.</h1>
        <p className="max-w-[560px] text-xl leading-snug text-muted">
          Use the cards below to test the session: read your account, rotate the refresh token, or log out.
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-stretch gap-5 px-8 pt-6 pb-[72px]">
        <section className={`${card} flex-[1_1_300px]`}>
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold tracking-tight">Your account</h2>
            <span className="font-mono text-[13px] text-muted">GET /api/auth/me</span>
          </div>
          <div className="flex flex-col gap-3.5">
            <Row label="Name">{user.user_name}</Row>
            <Row label="Email">{user.email_address}</Row>
            <Row label="Role">{user.role}</Row>
          </div>
          <button type="button" onClick={reloadAccount} disabled={busy} className={`${secondaryButton} mt-auto h-11 text-[15px]`}>
            Reload account
          </button>
        </section>

        <section className={`${card} flex-[1_1_300px]`}>
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold tracking-tight">Session</h2>
            <span className="text-[13px] text-muted">
              Access token lasts about 15 minutes. Refresh token lives in an httpOnly cookie or local storage.
            </span>
          </div>
          <div className="mt-auto flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => run(() => api.refresh())}
              disabled={busy}
              className="h-12 cursor-pointer rounded-xl bg-brand text-base font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              Refresh token
            </button>
            <span className="text-center font-mono text-xs text-muted">POST /api/auth/refresh</span>
            <button type="button" onClick={logout} disabled={busy} className={secondaryButton}>
              Log out
            </button>
            <span className="text-center font-mono text-xs text-muted">POST /api/auth/logout</span>
          </div>
        </section>

        <section className={`${card} flex-[1.4_1_340px] bg-ink text-canvas shadow-[0_8px_30px_rgba(0,0,0,0.12)]`}>
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold tracking-tight">Last response</h2>
            <span className="text-[13px] text-[#a1a1a6]">The real JSON from each call appears in this box.</span>
          </div>
          <pre className="m-0 overflow-x-auto font-mono text-[13px] leading-relaxed">
            {last
              ? `${last.status === 0 ? 'Network error' : `HTTP ${last.status}`}\n${JSON.stringify(last.body, null, 2)}`
              : 'Press a button to see the response.'}
          </pre>
        </section>
      </div>
    </div>
  )
}
