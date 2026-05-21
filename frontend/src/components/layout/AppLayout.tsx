'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useLVStore } from '@/lib/store'
import { useEffect } from 'react'
import Script from 'next/script'

const NAV = [
  { href: '/dashboard',             label: 'Dashboard',   icon: '▦' },
  { href: '/dashboard/agents',      label: 'Agents',      icon: '◈' },
  { href: '/dashboard/live-office', label: 'Live Office', icon: '◉' },
  { href: '/dashboard/wow',         label: 'Demo',        icon: '✦' },
  { href: '/dashboard/analytics',   label: 'Analytics',   icon: '◎' },
  { href: '/dashboard/settings',    label: 'Settings',    icon: '⚙' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useLVStore()

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('lv_token') : null
    if (!t) router.push('/signin')
  }, [])

  return (
    <div className="min-h-screen bg-lv-bg flex flex-col">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <header className="flex items-center border-b border-gray-200 bg-white sticky top-0 z-50 h-12">
        <div className="flex items-center gap-2.5 px-4 border-r border-gray-200 h-full flex-shrink-0">
          <div className="lv-logo-box w-7 h-7 text-xs">LV</div>
          <div>
            <div className="font-display font-bold text-lv-navy text-xs leading-none">Legion Vittor</div>
            <div className="text-[8px] text-gray-400 tracking-widest uppercase leading-none mt-0.5">Virtual Office</div>
          </div>
        </div>

        <nav className="flex h-full overflow-x-auto">
          {NAV.map(n => (
            <button key={n.href} onClick={() => router.push(n.href)}
              className={`nav-item h-full flex items-center gap-1.5 flex-shrink-0 ${pathname === n.href ? 'active' : ''}`}>
              <span className="text-xs">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 px-4 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600 pulse-dot" />
            5 agents live
          </div>
          <button onClick={() => { logout(); router.push('/') }} className="text-xs text-gray-400 hover:text-gray-600">
            Sign out
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
