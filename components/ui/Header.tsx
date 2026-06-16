'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { key: 'home', label: '🏠 홈', icon: '🏠', short: '홈', href: '/' },
  { key: 'garden', label: '🌱 정원', icon: '🌱', short: '정원', href: '/garden' },
  { key: 'shelf', label: '📚 책장', icon: '📚', short: '책장', href: '/shelf' },
  { key: 'quotes', label: '📇 문장', icon: '📇', short: '문장', href: '/quotes' },
  { key: 'dogan', label: '🌿 도감', icon: '🌿', short: '도감', href: '/dogan' },
] as const

type NavKey = (typeof NAV_ITEMS)[number]['key']

interface HeaderProps {
  activeKey?: NavKey
  actions?: ReactNode
}

export function Header({ activeKey, actions }: HeaderProps) {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-stone-200/70 bg-[#fdf6ee]/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4 sm:gap-8">
            <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold text-stone-800">
              <span className="text-2xl">🌱</span>
              <span className="hidden min-[380px]:inline">문장정원</span>
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

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {actions}
            <UserMenu />
          </div>
        </div>
      </header>

      <BottomTabBar activeKey={activeKey} />
    </>
  )
}

function BottomTabBar({ activeKey }: { activeKey?: NavKey }) {
  return (
    <nav
      aria-label="모바일 내비게이션"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200/70 bg-[#fdf6ee]/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {NAV_ITEMS.map((item) => {
          const active = item.key === activeKey
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2 text-[11px] transition ${
                active ? 'text-emerald-700' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <span className="text-xl leading-none" aria-hidden>
                {item.icon}
              </span>
              <span className={active ? 'font-semibold' : ''}>{item.short}</span>
            </Link>
          )
        })}
      </div>
    </nav>
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
