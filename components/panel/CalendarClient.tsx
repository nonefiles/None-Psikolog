'use client'
// components/panel/CalendarClient.tsx

import { useState, useEffect } from 'react'
import { format, addMonths, subMonths } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Search, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Appt {
  id: string
  starts_at: string
  duration_min: number
  session_type: string
  status: string
  guest_name: string | null
  guest_phone: string | null
  guest_email: string | null
  guest_note: string | null
  notes: string | null
  client?: { id: string; full_name: string }[] | null
}

interface Props {
  appointments: Appt[]
  todayAppts: Appt[]
  viewDate: { year: number; month: number }
  today: string
}

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  pending:   { text: 'Bekliyor', cls: 'pill-orange' },
  confirmed: { text: 'Onaylı',   cls: 'pill-green'  },
  completed: { text: 'Tamamlandı', cls: 'pill-sage'   },
  cancelled: { text: 'İptal',      cls: 'pill-orange' },
}

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export default function CalendarClient({ appointments, todayAppts, viewDate, today }: Props) {
  const [addOpen, setAddOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<{ dateKey: string; day: number } | null>(null)
  const [transferringClientId, setTransferringClientId] = useState<string | null>(null)
  const [deleteConfirmClientId, setDeleteConfirmClientId] = useState<string | null>(null)
  const [deleteDayConfirm, setDeleteDayConfirm] = useState<string | null>(null)
  const [deletingDay, setDeletingDay] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState({ guest_name: '', session_type: 'Bireysel Terapi', starts_at: '', duration_min: '50', notes: '' })
  const [loading, setLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Prevent hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  const { year, month } = viewDate
  const firstDay = new Date(year, month - 1, 1)
  const offset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month, 0).getDate()

  const byDay: Record<string, Appt[]> = {}
  for (const a of appointments) {
    const key = a.starts_at.slice(0, 10)
    if (!byDay[key]) byDay[key] = []
    byDay[key].push(a)
  }

  // Arama filtrelemesi
  const filteredAppointments = appointments.filter(appt => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    const clientName = appt.client?.[0]?.full_name?.toLowerCase() || ''
    const guestName = appt.guest_name?.toLowerCase() || ''
    const sessionType = appt.session_type?.toLowerCase() || ''
    const notes = appt.notes?.toLowerCase() || ''
    
    return (
      clientName.includes(query) ||
      guestName.includes(query) ||
      sessionType.includes(query) ||
      notes.includes(query)
    )
  })

  // Filtrelenmiş randevuları günlere göre grupla
  const filteredByDay: Record<string, Appt[]> = {}
  for (const a of filteredAppointments) {
    const key = a.starts_at.slice(0, 10)
    if (!filteredByDay[key]) filteredByDay[key] = []
    filteredByDay[key].push(a)
  }

  function getName(a: Appt) {
    return a.client?.[0]?.full_name ?? a.guest_name ?? '—'
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.guest_name || !form.starts_at) { toast.error('İsim ve saat zorunlu'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: form.guest_name,
          guest_phone: null,
          session_type: form.session_type,
          starts_at: new Date(form.starts_at).toISOString(),
          duration_min: parseInt(form.duration_min),
          notes: form.notes || null,
          _panel_add: true,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Randevu eklendi!')
      setAddOpen(false)
      window.location.reload()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch('/api/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) {
      toast.success('Güncellendi')
      window.location.reload()
    } else {
      toast.error('Güncelleme başarısız')
    }
  }

  async function deleteAllDayAppointments(dateKey: string) {
    setDeletingDay(true)
    try {
      const dayAppointments = byDay[dateKey] || []
      
      // Tüm randevuları sil
      const deletePromises = dayAppointments.map(async (appt) => {
        const res = await fetch(`/api/appointments?id=${appt.id}`, {
          method: 'DELETE',
        })
        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Randevu silinemedi')
        }
        return appt.id
      })
      
      await Promise.all(deletePromises)
      toast.success(`${dayAppointments.length} randevu silindi!`)
      setDeleteDayConfirm(null)
      setSelectedDay(null)
      window.location.reload()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu')
    } finally {
      setDeletingDay(false)
    }
  }

  async function deleteClient(clientId: string) {
    try {
      const res = await fetch(`/api/clients?id=${clientId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Silme başarısız')
      }
      toast.success('Danışan silindi!')
      window.location.reload()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu')
    } finally {
      setDeleteConfirmClientId(null)
    }
  }

  async function transferToClient(appointment: Appt) {
    if (!appointment.guest_name) {
      toast.error('Danışan adı bulunamadı')
      return
    }

    setTransferringClientId(appointment.id)
    try {
      // 1. Yeni danışan oluştur
      const clientRes = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: appointment.guest_name,
          phone: appointment.guest_phone || null,
          email: appointment.guest_email || null,
          session_type: appointment.session_type,
          notes: appointment.guest_note || `Randevu üzerinden aktarıldı\nTarih: ${format(new Date(appointment.starts_at), 'dd.MM.yyyy HH:mm')}\n${appointment.notes || ''}`,
        }),
      })

      if (!clientRes.ok) {
        const error = await clientRes.json()
        throw new Error(error.error || 'Danışan oluşturulamadı')
      }

      const newClient = await clientRes.json()

      // 2. Randevuyu yeni danışana bağla
      const appointmentRes = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: appointment.id,
          client_id: newClient.id,
          status: 'confirmed',
        }),
      })

      if (!appointmentRes.ok) {
        const error = await appointmentRes.json()
        throw new Error(error.error || 'Randevu güncellenemedi')
      }

      toast.success('Danışan bilgileri aktarıldı!')
      window.location.reload()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Aktarım başarısız')
    } finally {
      setTransferringClientId(null)
    }
  }

  const cells: { day: number | null; dateKey: string }[] = []
  for (let i = 0; i < offset; i++) cells.push({ day: null, dateKey: '' })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, dateKey })
  }

  return (
    <>
      <header className="bg-white border-b border-border px-8 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="font-serif text-xl">Takvim</h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="text" 
                placeholder="Kişi, seans türü veya notlarda ara..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-10 py-2 bg-cream/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent w-80 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {searchQuery && (
              <span className="text-sm text-muted">
                {filteredAppointments.length} sonuç bulundu
              </span>
            )}
            <a href={`/panel/calendar`}
              className="btn-outline py-1.5 px-3 text-xs" title="Bugüne dön">
              Bugün
            </a>
            <button onClick={() => setAddOpen(true)} className="btn-primary">+ Randevu Ekle</button>
          </div>
        </div>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar - 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-serif text-xl">
                  {format(new Date(viewDate.year, viewDate.month - 1), 'MMMM yyyy', { locale: tr })}
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => window.location.href = `/panel/calendar?year=${year}&month=${month - 1}`}
                    className="text-sage hover:text-sage-dark transition-colors" title="Önceki ay">
                    ‹
                  </button>
                  <button onClick={() => window.location.href = `/panel/calendar?year=${year}&month=${month + 1}`}
                    className="text-sage hover:text-sage-dark transition-colors" title="Sonraki ay">
                    ›
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-7 mb-2">
                  {DAY_NAMES.map(d => (
                    <div key={d} className="py-2.5 text-center text-xs font-bold text-white uppercase tracking-wide">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {cells.map((cell, i) => {
                    if (!cell.day) return <div key={`empty-${i}`} className="min-h-[60px] border-r border-b border-border/40 bg-gray-50/30" />
                    const isToday = cell.dateKey === today
                    const dayAppts = (searchQuery ? filteredByDay : byDay)[cell.dateKey] ?? []
                    return (
                      <div key={cell.dateKey}
                        className={`min-h-[60px] p-1 border-r border-b border-border/40 transition-colors hover:bg-sage-pale/30 ${isToday ? 'bg-sage-pale/50' : ''} ${dayAppts.length > 0 ? 'cursor-pointer' : ''}`}
                        onClick={() => dayAppts.length > 0 && cell.day && setSelectedDay({ dateKey: cell.dateKey, day: cell.day })}>
                        <div className={`w-5 h-5 flex items-center justify-center text-xs font-semibold mb-1 ${isToday ? 'bg-sage text-white rounded-full' : 'text-charcoal'}`}>
                          {cell.day}
                        </div>
                        {dayAppts.slice(0, 1).map(a => (
                          <div key={a.id}
                            className={`text-[9px] px-1 py-0.5 rounded mb-0.5 truncate text-white font-medium ${a.status === 'cancelled' ? 'bg-gray-400' : 'bg-sage'}`}>
                            {format(new Date(a.starts_at), 'HH:mm')} {getName(a).split(' ')[0]}
                          </div>
                        ))}
                        {dayAppts.length > 1 && (
                          <div className="text-[9px] text-muted font-medium">+{dayAppts.length - 1}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Today's Appointments Card - 1 column on large screens */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold">Bugünün Randevuları</h3>
                <a href="/panel/calendar" className="text-xs text-sage hover:underline">Takvime Git →</a>
              </div>
              {todayAppts.length > 0 ? (
                <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                  {todayAppts.map(a => {
                    const s = STATUS_LABEL[a.status] ?? STATUS_LABEL.pending
                    return (
                      <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{getName(a)}</p>
                          <p className="text-xs text-muted">
                            {format(new Date(a.starts_at), 'HH:mm')} · {a.session_type}
                          </p>
                          {a.notes && (
                            <p className="text-xs text-muted mt-1 truncate">{a.notes}</p>
                          )}
                        </div>
                        <span className={s.cls}>{s.text}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-muted">
                  Bugün randevu yok
                </div>
              )}
            </div>

            {/* Quick Add Button */}
            <button onClick={() => setAddOpen(true)} className="btn-primary w-full justify-center mt-4">
              + Randevu Ekle
            </button>
          </div>
        </div>
      </div>

                      {/* Day Detail Modal */}
      {selectedDay && isClient && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-lg overflow-hidden max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">
                {selectedDay.day} {format(new Date(selectedDay.dateKey), 'MMMM', { locale: tr })} Randevuları
              </h3>
              <div className="flex items-center gap-2">
                {(searchQuery ? filteredByDay : byDay)[selectedDay.dateKey] && (searchQuery ? filteredByDay : byDay)[selectedDay.dateKey]!.length > 0 && (
                  <button 
                    onClick={() => setDeleteDayConfirm(selectedDay.dateKey)}
                    className="btn-outline py-1.5 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50"
                    title="Günün tüm randevularını sil">
                    Günü Sil
                  </button>
                )}
                <button onClick={() => setSelectedDay(null)} className="text-muted text-xl leading-none">×</button>
              </div>
            </div>
            <div className="p-6">
              {(searchQuery ? filteredByDay : byDay)[selectedDay.dateKey]?.length ? (
                <div className="space-y-3">
                  {(searchQuery ? filteredByDay : byDay)[selectedDay.dateKey]!.map(a => {
                    const s = STATUS_LABEL[a.status] ?? STATUS_LABEL.pending
                    const clientId = a.client?.[0]?.id
                    return (
                      <div key={a.id} className="border border-border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{getName(a)}</p>
                            <p className="text-sm text-muted">
                              {format(new Date(a.starts_at), 'HH:mm')} · {a.session_type} · {a.duration_min} dk
                            </p>
                            {a.notes && <p className="text-xs text-muted mt-1">{a.notes}</p>}
                          </div>
                          <span className={s.cls}>{s.text}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {a.status === 'pending' && (
                            <>
                              <button onClick={() => updateStatus(a.id, 'confirmed')}
                                className="btn-primary py-1.5 px-3 text-xs">Onayla</button>
                              <button onClick={() => updateStatus(a.id, 'cancelled')}
                                className="btn-outline py-1.5 px-3 text-xs">Reddet</button>
                            </>
                          )}
                          {a.status === 'confirmed' && (
                            <button onClick={() => updateStatus(a.id, 'completed')}
                              className="btn-outline py-1.5 px-3 text-xs">Tamamlandı ✓</button>
                          )}
                          {clientId && (
                            <>
                              <button 
                                onClick={() => window.location.href = `/panel/clients#${clientId}`}
                                className="btn-outline py-1.5 px-3 text-xs">
                                Danışan Sayfası
                              </button>
                              <button 
                                onClick={() => setDeleteConfirmClientId(clientId)}
                                className="btn-outline py-1.5 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50">
                                Danışanı Sil
                              </button>
                            </>
                          )}
                          {!a.client?.[0] && a.guest_name && (
                            <button 
                              onClick={() => transferToClient(a)}
                              disabled={transferringClientId === a.id}
                              className="btn-primary py-1.5 px-3 text-xs disabled:opacity-60">
                              {transferringClientId === a.id ? 'Aktarılıyor…' : 'Danışan Bilgileri Aktar'}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted">
                  Bu gün randevu yok
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Appointment Modal */}
      {addOpen && isClient && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Yeni Randevu</h3>
              <button onClick={() => setAddOpen(false)} className="text-muted text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="label">İsim *</label>
                <input className="input" placeholder="Misafir adı" required
                  value={form.guest_name} onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Seans Türü</label>
                <select className="input" value={form.session_type}
                  onChange={e => setForm(f => ({ ...f, session_type: e.target.value }))}>
                  <option>Bireysel Terapi</option>
                  <option>İlk Görüşme</option>
                  <option>Çift Terapisi</option>
                  <option>Online Seans</option>
                </select>
              </div>
              <div>
                <label className="label">Tarih & Saat *</label>
                <input className="input" type="datetime-local" required
                  value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
              </div>
              <div>
                <label className="label">Süre (dk)</label>
                <select className="input" value={form.duration_min}
                  onChange={e => setForm(f => ({ ...f, duration_min: e.target.value }))}>
                  <option value="30">30 dk</option>
                  <option value="50">50 dk</option>
                  <option value="60">60 dk</option>
                  <option value="90">90 dk</option>
                </select>
              </div>
              <div>
                <label className="label">Not</label>
                <textarea className="input resize-none" rows={2}
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setAddOpen(false)} className="btn-outline flex-1 justify-center">İptal</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center disabled:opacity-60">
                  {loading ? 'Ekleniyor…' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete day confirmation modal */}
      {deleteDayConfirm && isClient && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold">Günün Randevularını Sil</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted mb-4">
                {format(new Date(deleteDayConfirm), 'd MMMM', { locale: tr })} tarihindeki 
                {(searchQuery ? filteredByDay : byDay)[deleteDayConfirm]?.length || 0} randevuyu silmek istediğinizden emin misiniz? 
                Bu işlem geri alınamaz.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteDayConfirm(null)}
                  className="btn-outline flex-1 justify-center">
                  İptal
                </button>
                <button 
                  onClick={() => deleteAllDayAppointments(deleteDayConfirm)}
                  disabled={deletingDay}
                  className="btn-primary flex-1 justify-center bg-red-600 hover:bg-red-700 border-red-600 disabled:opacity-60">
                  {deletingDay ? 'Siliniyor…' : 'Sil'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete client confirmation modal */}
      {deleteConfirmClientId && isClient && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold">Danışanı Sil</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted mb-4">
                Bu danışanı silmek istediğinizden emin misiniz? Danışana ait randevular varsa, 
                randevular korunacak ancak danışan bilgileri kaldırılacaktır.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirmClientId(null)}
                  className="btn-outline flex-1 justify-center">
                  İptal
                </button>
                <button 
                  onClick={() => deleteClient(deleteConfirmClientId)}
                  className="btn-primary flex-1 justify-center bg-red-600 hover:bg-red-700 border-red-600">
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
