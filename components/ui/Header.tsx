import Link from 'next/link'
import type { ReactNode } from 'react'

const NAV_ITEMS = [
  { key: 'garden', label: '내 정원', href: '/' },
  { key: 'search', label: '책 검색', href: '/search' },
  { key: 'library', label: '완독 서재', href: '/library' },
]

interface HeaderProps {
  activeKey?: 'garden' | 'search' | 'library'
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

        {actions}
      </div>
    </header>
  )
}
