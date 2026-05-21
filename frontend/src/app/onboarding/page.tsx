'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/api'
import { useLVStore } from '@/lib/store'
import toast from 'react-hot-toast'

const STEPS = ['Account', 'Company', 'Brand', 'Launch']

const SERVICES = [
  { key: 'anthropic_api_key',    label: 'Claude API',      placeholder: 'sk-ant-api03-...', required: true },
  { key: 'resend_api_key',       label: 'Resend (email)',   placeholder: 're_...', required: false },
  { key: 'razorpay_key_id',      label: 'Razorpay Key ID', placeholder: 'rzp_test_...', required: false },
  { key: 'razorpay_key_secret',  label: 'Razorpay Secret', placeholder: 'your secret', required: false },
  { key: 'elevenlabs_api_key',   label: 'ElevenLabs',      placeholder: 'your key', required: false },
  { key: 'meta_access_token',    label: 'Meta Graph API',  placeholder: 'your token', required: false },
  { key: 'youtube_api_key',      label: 'YouTube API',     placeholder: 'AIza...', required: false },
  { key: 'runway_api_key',       label: 'Runway ML',       placeholder: 'your key', required: false },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { setUser, setToken } = useLVStore()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [account, setAccount] = useState({ email: '', password: '', full_name: '' })
  const [company, setCompany] = useState({
    company_name: '', company_niche: '', company_description: '',
    target_market: '', primary_language: 'English',
  })
  const [brand, setBrand] = useState({
    brand_name: '', brand_tagline: 'An army of intelligence',
    brand_voice: 'Professional, confident', brand_tone: 'Direct, authoritative',
    post_frequency: 'Daily',
  })
  const [creds, setCreds] = useState<Record<string,string>>({})

  const next = () => setStep(s => Math.min(s + 1, 3))
  const back = () => setStep(s => Math.max(s - 1, 0))

  const handleSignUp = async () => {
    if (!account.email || !account.password || !account.full_name) {
      toast.error('Fill in all fields'); return
    }
    setLoading(true)
    try {
      const res = await auth.signUp(account.email, account.password, account.full_name)
      // Auto sign-in
      const signin = await auth.signIn(account.email, account.password)
      setToken(signin.data.access_token)
      next()
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Sign up failed')
    } finally { setLoading(false) }
  }

  const handleLaunch = async () => {
    setLoading(true)
    try {
      await auth.setup({ ...company, ...brand })
      const me = await auth.me()
      setUser(me.data)
      toast.success('Legion Vittor is live!')
      router.push('/dashboard')
    } catch (e: any) {
      toast.error('Setup failed — check your details')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-lv-bg flex items-center justify-center p-6">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="lv-logo-box">LV</div>
          <div>
            <div className="font-display font-bold text-lv-navy text-sm">Legion Vittor</div>
            <div className="text-[9px] text-gray-400 tracking-widest uppercase">Setup wizard</div>
          </div>
          <div className="ml-auto text-xs text-gray-400">Step {step + 1} of {STEPS.length}</div>
        </div>

        {/* Step tabs */}
        <div className="flex mb-6 rounded-lg overflow-hidden border border-gray-200 bg-white">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex-1 py-2.5 text-center text-xs font-medium border-r last:border-r-0 border-gray-200 transition-colors ${
              i === step ? 'bg-lv-navy text-white' : i < step ? 'bg-green-50 text-green-700' : 'text-gray-400'
            }`}>
              {i < step ? '✓ ' : ''}{s}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="lv-card p-7 shadow-lv">

          {/* Step 0 — Account */}
          {step === 0 && (
            <div>
              <h2 className="font-display text-xl font-bold text-lv-navy mb-1">Create your account</h2>
              <p className="text-sm text-gray-400 mb-6">Your virtual office will be ready in 4 steps.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Full name</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lv-navy" placeholder="Your name" value={account.full_name} onChange={e => setAccount(a => ({...a, full_name: e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Email</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lv-navy" type="email" placeholder="you@company.com" value={account.email} onChange={e => setAccount(a => ({...a, email: e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Password</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lv-navy" type="password" placeholder="Min 8 characters" value={account.password} onChange={e => setAccount(a => ({...a, password: e.target.value}))} />
                </div>
              </div>
              <button onClick={handleSignUp} disabled={loading} className="btn-primary w-full mt-6 py-2.5">{loading ? 'Creating account...' : 'Create account →'}</button>
            </div>
          )}

          {/* Step 1 — Company */}
          {step === 1 && (
            <div>
              <h2 className="font-display text-xl font-bold text-lv-navy mb-1">Your company</h2>
              <p className="text-sm text-gray-400 mb-6">All agents use this to personalise their work.</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Company name</label>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lv-navy" placeholder="Legion Vittor Pvt Ltd" value={company.company_name} onChange={e => setCompany(c => ({...c, company_name: e.target.value}))} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Industry / niche</label>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lv-navy" placeholder="e.g. SaaS, E-commerce" value={company.company_niche} onChange={e => setCompany(c => ({...c, company_niche: e.target.value}))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">What does your company do?</label>
                  <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lv-navy resize-none" rows={3} placeholder="Describe your product or service..." value={company.company_description} onChange={e => setCompany(c => ({...c, company_description: e.target.value}))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Target market</label>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lv-navy" placeholder="e.g. SMBs in India" value={company.target_market} onChange={e => setCompany(c => ({...c, target_market: e.target.value}))} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Language</label>
                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lv-navy bg-white" value={company.primary_language} onChange={e => setCompany(c => ({...c, primary_language: e.target.value}))}>
                      <option>English</option><option>Hindi</option><option>Telugu</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={back} className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-500 hover:border-gray-400">← Back</button>
                <button onClick={next} className="btn-primary flex-1 py-2.5">Next — API credentials →</button>
              </div>
            </div>
          )}

          {/* Step 2 — Brand + Credentials */}
          {step === 2 && (
            <div>
              <h2 className="font-display text-xl font-bold text-lv-navy mb-1">Brand & API keys</h2>
              <p className="text-sm text-gray-400 mb-5">Add your credentials — only Claude API is required for the prototype.</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Brand name</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lv-navy" value={brand.brand_name} onChange={e => setBrand(b => ({...b, brand_name: e.target.value}))} placeholder="Your brand" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tagline</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lv-navy" value={brand.brand_tagline} onChange={e => setBrand(b => ({...b, brand_tagline: e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Brand voice</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lv-navy" value={brand.brand_voice} onChange={e => setBrand(b => ({...b, brand_voice: e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Post frequency</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:border-lv-navy" value={brand.post_frequency} onChange={e => setBrand(b => ({...b, post_frequency: e.target.value}))}>
                    <option>Daily</option><option>Twice daily</option><option>Weekly</option>
                  </select>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5"><span>🔑</span> API credentials (stored encrypted)</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {SERVICES.map(svc => (
                    <div key={svc.key} className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${creds[svc.key] ? 'bg-green-600' : svc.required ? 'bg-amber-500' : 'bg-gray-300'}`} />
                        <span className="text-[10px] text-gray-500">{svc.label}{svc.required ? ' *' : ''}</span>
                      </div>
                      <input
                        type="password"
                        className="w-full bg-transparent text-[11px] font-mono outline-none text-gray-600 placeholder:text-gray-300"
                        placeholder={svc.placeholder}
                        value={creds[svc.key] || ''}
                        onChange={e => setCreds(c => ({...c, [svc.key]: e.target.value}))}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={back} className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-500">← Back</button>
                <button onClick={next} className="btn-primary flex-1 py-2.5">Next — launch →</button>
              </div>
            </div>
          )}

          {/* Step 3 — Launch */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-lv-navy rounded-2xl flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">🚀</span>
              </div>
              <h2 className="font-display text-xl font-bold text-lv-navy mb-2">Ready to launch</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Your virtual office is configured.<br/>44 agents are ready to run your company autonomously.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-6 text-left">
                {[
                  ['✅', 'Account created'],
                  ['✅', 'Company info saved'],
                  ['✅', 'Brand configured'],
                  [creds.anthropic_api_key ? '✅' : '⚠️', creds.anthropic_api_key ? 'Claude API connected' : 'Claude API missing'],
                ].map(([icon, label], i) => (
                  <div key={i} className="bg-gray-50 rounded-lg px-3 py-2.5 text-xs flex items-center gap-2 border border-gray-200">
                    <span>{icon}</span><span className="text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={back} className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-500">← Back</button>
                <button onClick={handleLaunch} disabled={loading} className="btn-primary flex-1 py-3 text-base">
                  {loading ? 'Launching...' : '🏢 Launch Legion Vittor'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
