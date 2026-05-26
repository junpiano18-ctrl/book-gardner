'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { key: 'garden', label: '🌱 내 정원', href: '/' },
  { key: 'shelf', label: '📚 책장', href: '/shelf' },
  { key: 'search', label: '🔍 책 검색', href: '/search' },
  { key: 'dogan', label: '🌿 도감', href: '/dogan' },
]

interface HeaderProps {
  activeKey?: 'garden' | 'shelf' | 'search' | 'dogan'
  actions?: ReactNode
}

export function Header({ activeKey, actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-stone-200/70 bg-[#fdf6ee]/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-stone-800">
            <span className="text-2xl">🌱</span>
            <span>북 가드너</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm text-stone-600 sm:flex">
            {NAV_ITEMS.map((item) => {
              const active = item.key === activeKey
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`rounded-md px-3 py-1.5 transition ${
                    active
                      ? 'bg-stone-200/80 text-stone-900'
                      : 'hover:bg-stone-200/60 hover:text-stone-900'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {actions}
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

function UserMenu() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  if (loading) {
    return <div className="h-8 w-20 animate-pulse rounded-full bg-stone-200/80" />
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-stone-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-stone-900"
      >
        로그인
      </Link>
    )
  }

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      router.replace('/login')
    } catch {
      setSigningOut(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-stone-600 sm:inline">
        🌿 <span className="font-medium text-stone-800">{user.nickname}</span>
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="rounded-full border border-stone-300 bg-white/70 px-3 py-1.5 text-sm text-stone-700 transition hover:bg-stone-100 disabled:cursor-wait disabled:opacity-60"
      >
        {signingOut ? '로그아웃 중...' : '로그아웃'}
      </button>
    </div>
  )
}
