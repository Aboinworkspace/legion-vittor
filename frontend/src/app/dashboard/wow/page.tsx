'use client'
import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

type PipelineKey = 'instagram' | 'video' | 'payment' | 'leads'

interface PipelineState {
  running: boolean
  result: any
  error: string | null
}

const PIPELINES = [
  {
    key: 'instagram' as PipelineKey,
    icon: '📸',
    title: 'Instagram post',
    subtitle: 'GPT-4o writes caption → DALL-E 3 generates image → posts live',
    color: '#D4537E',
    bg: '#FBEAF0',
    border: '#993556',
    placeholder: 'e.g. How AI is transforming Indian startups',
    buttonLabel: 'Create & post',
    field: 'topic',
  },
  {
    key: 'video' as PipelineKey,
    icon: '🎬',
    title: 'YouTube reel',
    subtitle: 'GPT-4o writes script → OpenAI TTS voices it → DALL-E frames → FFmpeg → YouTube',
    color: '#D85A30',
    bg: '#FAECE7',
    border: '#993C1D',
    placeholder: 'e.g. The future of autonomous AI companies',
    buttonLabel: 'Create & upload',
    field: 'topic',
  },
  {
    key: 'payment' as PipelineKey,
    icon: '💳',
    title: 'Payment checkout',
    subtitle: 'Claude generates invoice → Razorpay test checkout → receipt email via Resend',
    color: '#1D9E75',
    bg: '#E1F5EE',
    border: '#0F6E56',
    placeholder: null,
    buttonLabel: 'Create order',
    field: 'multi',
  },
  {
    key: 'leads' as PipelineKey,
    icon: '🎯',
    title: 'Leads pipeline',
    subtitle: 'Gemini searches web for prospects → GPT-4o writes cold emails → Resend delivers',
    color: '#BA7517',
    bg: '#FAEEDA',
    border: '#854F0B',
    placeholder: 'e.g. SaaS founders in Hyderabad',
    buttonLabel: 'Find & outreach',
    field: 'target_market',
  },
]

export default function WowPage() {
  const [inputs, setInputs] = useState<Record<string, any>>({
    instagram_topic: '',
    video_topic: '',
    payment_email: 'demo@example.com',
    payment_name: 'Demo Customer',
    payment_amount: 4999,
    payment_desc: 'Legion Vittor — Monthly subscription',
    leads_market: '',
    leads_niche: '',
    leads_send: false,
  })
  const [states, setStates] = useState<Record<PipelineKey, PipelineState>>({
    instagram: { running: false, result: null, error: null },
    video:     { running: false, result: null, error: null },
    payment:   { running: false, result: null, error: null },
    leads:     { running: false, result: null, error: null },
  })

  const setRunning = (key: PipelineKey, running: boolean) =>
    setStates(s => ({ ...s, [key]: { ...s[key], running } }))

  const setResult = (key: PipelineKey, result: any) =>
    setStates(s => ({ ...s, [key]: { ...s[key], result, error: null, running: false } }))

  const setError = (key: PipelineKey, error: string) =>
    setStates(s => ({ ...s, [key]: { ...s[key], error, running: false } }))

  const runInstagram = async () => {
    if (!inputs.instagram_topic) { toast.error('Enter a topic'); return }
    setRunning('instagram', true)
    try {
      const r = await api.post('/api/wow/instagram', { topic: inputs.instagram_topic })
      setResult('instagram', r.data)
      toast.success('Instagram post created!')
    } catch (e: any) { setError('instagram', e?.response?.data?.detail || 'Failed'); toast.error('Instagram pipeline failed') }
  }

  const runVideo = async () => {
    if (!inputs.video_topic) { toast.error('Enter a topic'); return }
    setRunning('video', true)
    try {
      const r = await api.post('/api/wow/video', { topic: inputs.video_topic })
      setResult('video', r.data)
      toast.success('Video created!')
    } catch (e: any) { setError('video', e?.response?.data?.detail || 'Failed'); toast.error('Video pipeline failed') }
  }

  const runPayment = async () => {
    setRunning('payment', true)
    try {
      const r = await api.post('/api/wow/payment/create', {
        customer_email: inputs.payment_email,
        customer_name: inputs.payment_name,
        amount_inr: inputs.payment_amount,
        description: inputs.payment_desc,
      })
      setResult('payment', r.data)
      toast.success('Payment order created!')
    } catch (e: any) { setError('payment', e?.response?.data?.detail || 'Failed'); toast.error('Payment pipeline failed') }
  }

  const runLeads = async () => {
    setRunning('leads', true)
    try {
      const r = await api.post('/api/wow/leads', {
        target_market: inputs.leads_market || undefined,
        niche: inputs.leads_niche || undefined,
        lead_count: 3,
        send_emails: inputs.leads_send,
      })
      setResult('leads', r.data)
      toast.success(`Found ${r.data.leads_found} leads!`)
    } catch (e: any) { setError('leads', e?.response?.data?.detail || 'Failed'); toast.error('Leads pipeline failed') }
  }

  const handlers = { instagram: runInstagram, video: runVideo, payment: runPayment, leads: runLeads }

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-lv-navy">Demo pipelines</h1>
          <p className="text-sm text-gray-400 mt-0.5">4 real end-to-end pipelines — each produces a live output</p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {PIPELINES.map(p => {
            const state = states[p.key]
            return (
              <div key={p.key} className="lv-card shadow-lv overflow-hidden">
                <div className="h-1" style={{ background: p.color }} />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: p.bg, border: `1px solid ${p.border}` }}>
                      {p.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 text-sm">{p.title}</div>
                      <div className="text-xs text-gray-400 leading-relaxed mt-0.5">{p.subtitle}</div>
                    </div>
                  </div>

                  {/* Inputs */}
                  {p.field === 'topic' && (
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-lv-navy mb-3"
                      placeholder={p.placeholder || ''}
                      value={inputs[`${p.key}_topic`] || ''}
                      onChange={e => setInputs(i => ({ ...i, [`${p.key}_topic`]: e.target.value }))}
                    />
                  )}

                  {p.field === 'target_market' && (
                    <div className="space-y-2 mb-3">
                      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-lv-navy"
                        placeholder="Target market (e.g. SaaS founders in Hyderabad)"
                        value={inputs.leads_market}
                        onChange={e => setInputs(i => ({ ...i, leads_market: e.target.value }))} />
                      <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-lv-navy"
                        placeholder="Your niche (e.g. AI automation)"
                        value={inputs.leads_niche}
                        onChange={e => setInputs(i => ({ ...i, leads_niche: e.target.value }))} />
                      <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                        <input type="checkbox" checked={inputs.leads_send}
                          onChange={e => setInputs(i => ({ ...i, leads_send: e.target.checked }))} />
                        Send real outreach emails via Resend
                      </label>
                    </div>
                  )}

                  {p.field === 'multi' && (
                    <div className="space-y-2 mb-3">
                      <div className="grid grid-cols-2 gap-2">
                        <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-lv-navy"
                          placeholder="Customer name" value={inputs.payment_name}
                          onChange={e => setInputs(i => ({ ...i, payment_name: e.target.value }))} />
                        <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-lv-navy"
                          type="email" placeholder="Customer email" value={inputs.payment_email}
                          onChange={e => setInputs(i => ({ ...i, payment_email: e.target.value }))} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-lv-navy"
                          type="number" placeholder="Amount (₹)" value={inputs.payment_amount}
                          onChange={e => setInputs(i => ({ ...i, payment_amount: Number(e.target.value) }))} />
                        <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-lv-navy"
                          placeholder="Description" value={inputs.payment_desc}
                          onChange={e => setInputs(i => ({ ...i, payment_desc: e.target.value }))} />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handlers[p.key]}
                    disabled={state.running}
                    className="w-full py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-50 text-white"
                    style={{ background: state.running ? '#888' : p.color }}
                  >
                    {state.running ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span> Running pipeline...
                      </span>
                    ) : `→ ${p.buttonLabel}`}
                  </button>

                  {/* Result */}
                  {state.error && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                      {state.error}
                    </div>
                  )}

                  {state.result && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-xs space-y-1.5">
                      <div className="font-medium text-green-800 flex items-center gap-1.5">
                        ✅ {state.result.demo_mode ? 'Demo mode — ' : ''}Pipeline complete
                      </div>

                      {/* Instagram result */}
                      {p.key === 'instagram' && (
                        <>
                          {state.result.post_url && (
                            <a href={state.result.post_url} target="_blank" rel="noopener noreferrer"
                              className="block text-blue-700 underline truncate">{state.result.post_url}</a>
                          )}
                          <div className="text-gray-600">{state.result.caption}</div>
                        </>
                      )}

                      {/* Video result */}
                      {p.key === 'video' && (
                        <>
                          {state.result.youtube_url && (
                            <a href={state.result.youtube_url} target="_blank" rel="noopener noreferrer"
                              className="block text-blue-700 underline truncate">{state.result.youtube_url}</a>
                          )}
                          <div className="text-gray-600">{state.result.script_preview}</div>
                        </>
                      )}

                      {/* Payment result */}
                      {p.key === 'payment' && (
                        <>
                          <div className="text-gray-700">Order: <span className="font-mono">{state.result.order_id}</span></div>
                          <div className="text-gray-700">Amount: ₹{state.result.amount?.toLocaleString()}</div>
                          {state.result.demo_mode ? (
                            <div className="text-amber-700">{state.result.message}</div>
                          ) : (
                            <RazorpayButton result={state.result} />
                          )}
                        </>
                      )}

                      {/* Leads result */}
                      {p.key === 'leads' && state.result.leads?.map((lead: any, i: number) => (
                        <div key={i} className="border border-green-200 rounded-lg p-2 bg-white">
                          <div className="font-medium text-gray-800">{lead.name} — {lead.role}</div>
                          <div className="text-gray-500">{lead.company} · Score: {lead.score}/100</div>
                          {lead.email_preview && <div className="text-gray-500 mt-1 line-clamp-2">{lead.email_preview}</div>}
                        </div>
                      ))}

                      {state.result.steps && (
                        <div className="text-gray-400 text-[10px]">
                          {state.result.steps.length} steps completed
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Demo status */}
        <DemoStatus />
      </div>
    </AppLayout>
  )
}

function RazorpayButton({ result }: { result: any }) {
  const openCheckout = () => {
    const options = {
      key: result.key_id,
      amount: result.amount * 100,
      currency: 'INR',
      name: 'Legion Vittor',
      description: result.description,
      order_id: result.order_id,
      handler: (response: any) => {
        toast.success('Payment successful! Receipt will be sent by email.')
      },
      prefill: { name: result.customer_name, email: result.customer_email },
      theme: { color: '#1a1f4e' },
    }
    // @ts-ignore
    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  return (
    <button onClick={openCheckout} className="w-full py-1.5 text-xs bg-lv-navy text-white rounded-lg">
      Open Razorpay checkout →
    </button>
  )
}

function DemoStatus() {
  const [status, setStatus] = useState<any>(null)

  const check = async () => {
    try {
      const r = await api.get('/api/wow/demo-status')
      setStatus(r.data.services)
    } catch {}
  }

  return (
    <div className="mt-5 lv-card p-4 shadow-lv">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Service connection status</div>
        <button onClick={check} className="text-xs text-lv-navy hover:underline">Check →</button>
      </div>
      {status ? (
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(status).map(([svc, info]: [string, any]) => (
            <div key={svc} className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${info.connected ? 'bg-green-600' : 'bg-gray-300'}`} />
              <div>
                <div className="font-medium capitalize text-gray-700">{svc}</div>
                <div className="text-gray-400 text-[10px]">{info.used_for}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-gray-400">Click "Check" to see which services are connected</div>
      )}
    </div>
  )
}
