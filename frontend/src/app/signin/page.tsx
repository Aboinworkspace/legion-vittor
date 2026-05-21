'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/api'
import { useLVStore } from '@/lib/store'
import toast from 'react-hot-toast'

export default function SignInPage() {
  const router = useRouter()
  const { setToken, setUser } = useLVStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await auth.signIn(email, password)
      setToken(res.data.access_token)
      const me = await auth.me()
      setUser(me.data)
      if (!me.data.setup_complete) router.push('/onboarding')
      else router.push('/dashboard')
    } catch {
      toast.error('Invalid email or password')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-lv-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="lv-logo-box">LV</div>
          <div>
            <div className="font-display font-bold text-lv-navy text-sm">Legion Vittor</div>
            <div className="text-[9px] text-gray-400 tracking-widest uppercase">Virtual Office</div>
          </div>
        </div>
        <div className="lv-card p-7 shadow-lv">
          <h2 className="font-display text-xl font-bold text-lv-navy mb-1">Welcome back</h2>
          <p className="text-sm text-gray-400 mb-6">Sign in to your virtual office</p>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <input type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lv-navy" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Password</label>
              <input type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lv-navy" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2 disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>
          <p className="text-xs text-center text-gray-400 mt-4">
            No account? <button onClick={() => router.push('/onboarding')} className="text-lv-navy hover:underline">Get started</button>
          </p>
        </div>
      </div>
    </div>
  )
}
