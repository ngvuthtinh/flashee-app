import { useState, type FormEvent } from 'react'
import { api, ApiError, describeError, type User } from './api'

type Mode = 'login' | 'signup'

interface FieldProps {
  id: string
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  hint?: string
  error?: string
}

function Field({ id, label, type = 'text', value, onChange, placeholder, autoComplete, hint, error }: FieldProps) {
  const noteId = `${id}-note`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? noteId : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-xl border border-line bg-white px-3.5 text-base outline-none placeholder:text-muted focus:border-brand focus:ring-4 focus:ring-brand/20 aria-invalid:border-danger"
      />
      {(error || hint) && (
        <span id={noteId} className={`text-[13px] ${error ? 'text-danger' : 'text-muted'}`}>
          {error ?? hint}
        </span>
      )}
    </div>
  )
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  )
}

interface LoginPageProps {
  initialError: string | null
  onAuthenticated: (user: User) => void
}

export default function LoginPage({ initialError, onAuthenticated }: LoginPageProps) {
  const [mode, setMode] = useState<Mode>('login')
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(initialError)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const isSignup = mode === 'signup'

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setFieldErrors({})
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setFieldErrors({})
    try {
      const result = isSignup
        ? await api.register({ user_name: userName, email_address: email, phone_number: phone, password })
        : await api.login({ email_address: email, password })
      onAuthenticated(result.body.data.user)
    } catch (err) {
      setError(describeError(err))
      if (err instanceof ApiError) setFieldErrors(err.fieldErrors)
    } finally {
      setSubmitting(false)
    }
  }

  const tab = (active: boolean) =>
    `h-10 flex-1 cursor-pointer rounded-lg text-sm font-semibold ${
      active ? 'bg-white text-ink shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'text-muted'
    }`

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-13 items-center justify-between border-b border-[#e5e5ea] bg-white/70 px-8">
        <span className="text-[19px] font-semibold tracking-tight">flashee</span>
        <span className="text-sm text-muted">Store</span>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="flex w-full max-w-[420px] flex-col gap-6 rounded-[22px] bg-white p-10 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.07)]">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-[32px] leading-[1.12] font-semibold tracking-[-0.025em]">
              {isSignup ? 'Create your account' : 'Sign in to flashee'}
            </h1>
            <p className="text-[15px] leading-snug text-muted">
              {isSignup ? 'One account for the whole store.' : 'Welcome back. Enter your details to continue.'}
            </p>
          </div>

          <div className="flex rounded-[11px] bg-[#ededf0] p-[3px]">
            <button type="button" className={tab(!isSignup)} onClick={() => switchMode('login')}>
              Sign in
            </button>
            <button type="button" className={tab(isSignup)} onClick={() => switchMode('signup')}>
              Create account
            </button>
          </div>

          {error && (
            <div role="alert" className="rounded-xl bg-[#fff2f2] px-3.5 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {isSignup && (
              <Field id="user_name" label="Full name" value={userName} onChange={setUserName}
                placeholder="Your name" autoComplete="name" error={fieldErrors['user_name']} />
            )}
            <Field id="email_address" label="Email" type="email" value={email} onChange={setEmail}
              placeholder="name@example.com" autoComplete="email" error={fieldErrors['email_address']} />
            {isSignup && (
              <Field id="phone_number" label="Phone number" type="tel" value={phone} onChange={setPhone}
                placeholder="0901 234 567" autoComplete="tel" error={fieldErrors['phone_number']} />
            )}
            <Field id="password" label="Password" type="password" value={password} onChange={setPassword}
              placeholder="Password" autoComplete={isSignup ? 'new-password' : 'current-password'}
              hint={isSignup ? 'At least 8 characters.' : undefined} error={fieldErrors['password']} />

            <div className="mt-2 flex flex-col gap-2.5">
              <button
                type="submit"
                disabled={submitting}
                className="h-12 cursor-pointer rounded-xl bg-brand text-base font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
              </button>
              <span className="text-center font-mono text-xs text-muted">
                {isSignup ? 'POST /api/auth/register' : 'POST /api/auth/login'}
              </span>
            </div>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#e5e5ea]" />
            <span className="text-[13px] text-muted">or</span>
            <div className="h-px flex-1 bg-[#e5e5ea]" />
          </div>

          <button
            type="button"
            onClick={() => api.startGoogleLogin()}
            className="flex h-12 cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-line bg-white text-base font-medium hover:bg-[#fafafc]"
          >
            <GoogleMark />
            Continue with Google
          </button>
        </div>
      </main>
    </div>
  )
}
