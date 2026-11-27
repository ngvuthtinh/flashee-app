import { Link } from 'react-router'
import type { User } from './api'

interface StoreHeaderProps {
  // undefined while the session is still being restored
  user: User | null | undefined
}

export default function StoreHeader({ user }: StoreHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-line/60 bg-canvas">
      <div className="mx-auto flex h-12 w-full max-w-[1120px] items-center justify-between px-5 sm:px-8">
        <Link to="/" className="text-[19px] font-semibold tracking-tight">
          flashee
        </Link>
        {user !== undefined && (
          <Link to="/account" className="text-sm text-muted hover:text-ink">
            {user ? 'Account' : 'Sign in'}
          </Link>
        )}
      </div>
    </header>
  )
}
