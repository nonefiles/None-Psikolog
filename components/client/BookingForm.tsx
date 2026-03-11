'use client'
// components/client/BookingForm.tsx
// DÜZELTME: session_types boş array koruması eklendi

import { useState } from 'react'
import toast from 'react-hot-toast'
import type { PublicProfile } from '@/lib/types'

interface Props {
  profile: PublicProfile
}

const DEFAULT_SESSION_TYPES = ['Bireysel Terapi', 'İlk Görüşme', 'Online Seans']

export default function BookingForm({ profile }: Props) {
  const sessionTypes = profile.session_types?.length > 0
    ? profile.session_types
    : DEFAULT_SESSION_TYPES

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    guest_phone: '',
    guest_email: '',
    session_type: sessionTypes[0],
    starts_at: '',
    guest_note: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.first_name.trim() || !form.guest_phone.trim()) {
      toast.error('Ad ve telefon zorunludur')
      return
    }
    setLoading(true)
    const guest_name = `${form.first_name.trim()} ${form.last_name.trim()}`.trim()
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name,
          guest_phone: form.guest_phone,
          guest_email: form.guest_email || null,
          guest_note:  form.guest_note  || null,
          session_type: form.session_type,
          starts_at:   form.starts_at
            ? new Date(form.starts_at).toISOString()
            : new Date().toISOString(),
          psychologist_id: profile.id,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Sunucu hatası')
      }
      setSubmitted(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Bir hata oluştu, lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="font-serif text-2xl mb-2">Talebiniz Alındı!</h2>
        <p className="text-sm text-muted leading-relaxed">
          {profile.full_name} en kısa sürede sizinle<br />
          telefon veya e-posta ile iletişime geçecektir.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Ad *</label>
          <input className="input w-full" placeholder="Adınız"
            value={form.first_name} onChange={e => set('first_name', e.target.value)} required />
        </div>
        <div>
          <label className="label">Soyad</label>
          <input className="input w-full" placeholder="Soyadınız"
            value={form.last_name} onChange={e => set('last_name', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Telefon *</label>
        <input className="input w-full" type="tel" placeholder="05XX XXX XX XX"
          value={form.guest_phone} onChange={e => set('guest_phone', e.target.value)} required />
      </div>

      <div>
        <label className="label">E-posta</label>
        <input className="input w-full" type="email" placeholder="email@ornek.com"
          value={form.guest_email} onChange={e => set('guest_email', e.target.value)} />
      </div>

      <div>
        <label className="label">Seans Türü</label>
        <select className="input w-full" value={form.session_type}
          onChange={e => set('session_type', e.target.value)}>
          {sessionTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Tercih Ettiğiniz Tarih / Saat</label>
        <input className="input w-full" type="datetime-local"
          value={form.starts_at} onChange={e => set('starts_at', e.target.value)} />
      </div>

      <div>
        <label className="label">Belirtmek İstedikleriniz</label>
        <textarea className="input w-full min-h-[80px] resize-y" rows={3}
          placeholder="Neden terapi almayı düşündüğünüzü veya eklemek istediğiniz herhangi bir şeyi yazabilirsiniz."
          value={form.guest_note} onChange={e => set('guest_note', e.target.value)} />
      </div>

      <button type="submit" disabled={loading}
        className="btn-primary w-full justify-center py-3 text-sm font-semibold disabled:opacity-60">
        {loading ? 'Gönderiliyor…' : 'Randevu Talebi Gönder →'}
      </button>
    </form>
  )
}
