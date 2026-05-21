'use client'
import { useRouter } from 'next/navigation'

const STATS = [
  { n: '44', label: 'AI agents' },
  { n: '10', label: 'Departments' },
  { n: '0',  label: 'Human input needed' },
  { n: '∞',  label: 'Scalability' },
]

const FEATURES = [
  { icon: '⚙️', title: 'Engineering dept',   desc: 'Writes, reviews, tests & deploys code autonomously' },
  { icon: '📣', title: 'Marketing dept',     desc: 'Creates campaigns, posts, and content — daily' },
  { icon: '🎬', title: 'Video & Reels',      desc: 'Scripts → voice → edit → publish on YouTube & Instagram' },
  { icon: '🎯', title: 'Leads pipeline',     desc: 'Scrapes, qualifies, and reaches out to prospects 24/7' },
  { icon: '💳', title: 'Payments',           desc: 'Invoices, Razorpay checkout, subscriptions — automated' },
  { icon: '🧪', title: 'R&D dept',           desc: 'Scans competitors and evolves the company skills' },
]

export default function LandingPage() {
  const router = useRouter()
  return (
    <main className="min-h-screen bg-lv-bg">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="lv-logo-box">LV</div>
          <div>
            <div className="font-display font-bold text-lv-navy text-sm tracking-wide">Legion Vittor</div>
            <div className="text-[9px] text-gray-400 tracking-widest uppercase">Private Limited</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/signin')} className="text-sm text-gray-500 hover:text-lv-navy px-4 py-2">Sign in</button>
          <button onClick={() => router.push('/onboarding')} className="btn-primary">Get started</button>
        </div>
      </nav>
      <section className="px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-500 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-green-600 pulse-dot" />
          Prototype v0.1 — 5 agents active
        </div>
        <h1 className="font-display text-5xl md:text-6xl font-bold text-lv-navy leading-tight mb-6 max-w-3xl mx-auto">
          Your entire company,<br />
          <span className="text-lv-gold">running on autopilot</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Legion Vittor is an autonomous AI virtual office. Engineering, marketing, sales,
          support, payments — all running 24/7 without you lifting a finger.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => router.push('/onboarding')} className="btn-primary text-base px-8 py-3">Launch your virtual office →</button>
          <button onClick={() => router.push('/signin')} className="text-sm text-gray-500 border border-gray-200 px-6 py-3 rounded-lg hover:border-gray-400 bg-white">Sign in</button>
        </div>
      </section>
      <section className="px-8 pb-14">
        <div className="max-w-2xl mx-auto grid grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="lv-card p-5 text-center">
              <div className="font-display text-3xl font-bold text-lv-navy">{s.n}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="px-8 pb-20 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl font-bold text-lv-navy mb-2">Every department. Fully autonomous.</h2>
          <p className="text-gray-400 text-sm">One-time setup. Then your virtual office runs itself.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="lv-card p-5 hover:shadow-lv-lg transition-shadow">
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="font-medium text-lv-navy text-sm mb-1">{f.title}</div>
              <div className="text-xs text-gray-400 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
      <footer className="border-t border-gray-200 px-8 py-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="lv-logo-box w-7 h-7 text-xs">LV</div>
          <span className="font-display font-bold text-lv-navy text-sm">Legion Vittor Private Limited</span>
        </div>
        <p className="text-xs text-gray-400">An army of intelligence · Virtual Office prototype</p>
      </footer>
    </main>
  )
}
