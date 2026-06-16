'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

type Tab = 'signin' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading: authLoading, signIn, signUp } = useAuth()

  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && user) router.replace('/')
  }, [authLoading, user, router])

  function switchTab(next: Tab) {
    setTab(next)
    setError(null)
    setInfo(null)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)
    try {
      if (tab === 'signin') {
        await signIn(email, password)
        router.replace('/')
      } else {
        const u = await signUp(email, password, nickname)
        if (u) {
          router.replace('/')
        } else {
          setInfo('가입 확인 이메일을 보냈어요. 메일함을 확인해주세요.')
        }
      }
    } catch (e) {
      setError(translateAuthError((e as Error).message))
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || user) {
    return (
      <div
        className="flex min-h-screen flex-1 items-center justify-center text-stone-500"
        style={{ backgroundColor: '#fdf6ee' }}
      >
        불러오는 중...
      </div>
    )
  }

  return (
    <div
      className="flex min-h-screen flex-1 items-center justify-center px-4 py-10"
      style={{ backgroundColor: '#fdf6ee' }}
    >
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-xl font-bold text-stone-800">
          <span className="text-3xl">🌱</span>
          <span>문장정원</span>
        </Link>

        <div className="rounded-3xl bg-white/80 p-7 shadow-md ring-1 ring-amber-900/5 backdrop-blur">
          <div className="mb-6 inline-flex w-full rounded-full bg-stone-100 p-1 text-sm">
            <TabButton active={tab === 'signin'} onClick={() => switchTab('signin')}>
              로그인
            </TabButton>
            <TabButton active={tab === 'signup'} onClick={() => switchTab('signup')}>
              회원가입
            </TabButton>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <Field label="닉네임" htmlFor="nickname">
                <input
                  id="nickname"
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="정원에서 불릴 이름"
                  maxLength={20}
                  className={inputClass}
                />
              </Field>
            )}

            <Field label="이메일" htmlFor="email">
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </Field>

            <Field label="비밀번호" htmlFor="password">
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === 'signup' ? '6자 이상' : '비밀번호'}
                className={inputClass}
              />
            </Field>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800 ring-1 ring-emerald-200">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
            >
              {submitting
                ? tab === 'signin'
                  ? '로그인 중...'
                  : '가입 중...'
                : tab === 'signin'
                  ? '🌱 로그인'
                  : '🌿 가입하고 정원 시작하기'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-stone-500">
          {tab === 'signin' ? '아직 계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
          <button
            type="button"
            onClick={() => switchTab(tab === 'signin' ? 'signup' : 'signin')}
            className="font-medium text-emerald-700 underline-offset-2 hover:underline"
          >
            {tab === 'signin' ? '회원가입' : '로그인'}
          </button>
        </p>
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-stone-600">
        {label}
      </label>
      {children}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full px-4 py-2 font-medium transition ${
        active ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
      }`}
    >
      {children}
    </button>
  )
}

function translateAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않아요'
  if (m.includes('email not confirmed')) return '메일함에서 가입 확인 메일을 먼저 인증해주세요'
  if (m.includes('user already registered')) return '이미 가입된 이메일이에요. 로그인해주세요'
  if (m.includes('password') && m.includes('short')) return '비밀번호는 6자 이상이어야 해요'
  if (m.includes('rate limit')) return '잠시 후 다시 시도해주세요'
  return message || '문제가 생겼어요. 다시 시도해주세요'
}
