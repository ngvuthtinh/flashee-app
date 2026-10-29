// Thin client for the backend auth API. All calls use relative `/api/...` URLs:
// in dev the Vite proxy forwards them to the backend, so the browser sees ONE origin
// (no CORS, and the httpOnly refresh cookie travels automatically).

const REFRESH_KEY = 'flashee.refreshToken'

export type UserRole = 'CUSTOMER' | 'ADMIN'

export interface User {
  id: string
  user_name: string
  email_address: string
  phone_number: string | null
  role: UserRole
  created_at: string
}

export interface RegisterInput {
  user_name: string
  email_address: string
  phone_number: string
  password: string
}

export interface LoginInput {
  email_address: string
  password: string
}

interface Envelope<T> {
  success: boolean
  message?: string
  data: T
  errors?: Record<string, string>
}

export interface ApiResult<T> {
  status: number
  body: Envelope<T>
}

interface AuthData {
  user: User
  accessToken: string
  refreshToken: string
}

// With a cookie-based refresh the backend returns only the access token.
interface RefreshData {
  accessToken: string
  refreshToken?: string
}

export class ApiError extends Error {
  status: number
  body: unknown
  fieldErrors: Record<string, string>

  constructor(message: string, status: number, body: unknown, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
    this.fieldErrors = fieldErrors
  }
}

// The access token lives in memory only: a page reload loses it and we re-obtain it via /refresh.
let accessToken: string | null = null

function saveSession(data: { accessToken: string; refreshToken?: string }) {
  accessToken = data.accessToken
  if (data.refreshToken) localStorage.setItem(REFRESH_KEY, data.refreshToken)
}

function clearSession() {
  accessToken = null
  localStorage.removeItem(REFRESH_KEY)
}

async function request<T>(
  method: string,
  path: string,
  opts: { body?: unknown; auth?: boolean } = {},
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {}
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts.auth && accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  const res = await fetch(path, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })

  const body = (await res.json().catch(() => ({ success: false, message: res.statusText }))) as Envelope<T>
  if (!res.ok) throw new ApiError(body.message ?? 'Request failed', res.status, body, body.errors)
  return { status: res.status, body }
}

// Refresh tokens are single-use (rotation), so two concurrent refreshes with the same token would
// trip reuse detection and revoke the whole session. Share one in-flight call between all callers
// (React StrictMode runs effects twice in dev, which would otherwise do exactly that).
let refreshing: Promise<ApiResult<RefreshData>> | null = null

async function doRefresh(): Promise<ApiResult<RefreshData>> {
  const stored = localStorage.getItem(REFRESH_KEY)
  try {
    // Body token wins over the cookie on the backend; with neither stored we rely on the cookie (Google login).
    const result = await request<RefreshData>('POST', '/api/auth/refresh', {
      body: stored ? { refreshToken: stored } : {},
    })
    saveSession(result.body.data)
    return result
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) clearSession()
    throw err
  }
}

function refresh(): Promise<ApiResult<RefreshData>> {
  refreshing ??= doRefresh().finally(() => {
    refreshing = null
  })
  return refreshing
}

// Call a protected endpoint; if the access token expired (401), refresh once and retry.
async function authed<T>(method: string, path: string): Promise<ApiResult<T>> {
  try {
    return await request<T>(method, path, { auth: true })
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      await refresh()
      return request<T>(method, path, { auth: true })
    }
    throw err
  }
}

export const api = {
  async register(input: RegisterInput) {
    const result = await request<AuthData>('POST', '/api/auth/register', { body: input })
    saveSession(result.body.data)
    return result
  },

  async login(input: LoginInput) {
    const result = await request<AuthData>('POST', '/api/auth/login', { body: input })
    saveSession(result.body.data)
    return result
  },

  refresh,

  me() {
    return authed<{ user: User }>('GET', '/api/auth/me')
  },

  async logout() {
    const stored = localStorage.getItem(REFRESH_KEY)
    try {
      return await request<null>('POST', '/api/auth/logout', { body: stored ? { refreshToken: stored } : {}, auth:true })
    } finally {
      clearSession()
    }
  },

  // Full-page navigation (not fetch): the browser must follow the redirect chain through Google.
  startGoogleLogin() {
    localStorage.removeItem(REFRESH_KEY) // a stale body token would take priority over the Google cookie
    window.location.assign('/api/auth/google')
  },
}

export function describeError(err: unknown): string {
  if (err instanceof ApiError) return err.message
  return 'Cannot reach the server. Is the backend running?'
}
