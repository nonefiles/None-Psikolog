'use client'
// components/panel/ClientsClient.tsx

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import type { Client } from '@/lib/types'

interface Props {
  clients: Client[]
  profileSlug: string
}

const STATUS: Record<string, { text: string; cls: string }> = {
  active:  { text: 'Aktif',  cls: 'pill-green'  },
  passive: { text: 'Pasif',  cls: 'pill-orange' },
  new:     { text: 'Yeni',   cls: 'pill-blue'   },
}

export default function ClientsClient({ clients: initial, profileSlug }: Props) {
  const [clients, setClients] = useState(initial)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', session_type: 'Bireysel Terapi', notes: '' })
  const [loading, setLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Prevent hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  const filtered = clients.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(clientId: string) {
    try {
      const res = await fetch(`/api/clients?id=${clientId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Silme başarısız')
      }
      setClients(c => c.filter(client => client.id !== clientId))
      toast.success('Danışan silindi!')
      setDeleteConfirm(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu')
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name) { toast.error('Ad zorunlu'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const newClient = await res.json()
      setClients(c => [newClient, ...c])
      setAddOpen(false)
      setForm({ full_name: '', phone: '', email: '', session_type: 'Bireysel Terapi', notes: '' })
      toast.success('Danışan eklendi!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            className="input w-full sm:w-64"
            placeholder="İsim, telefon veya e-posta ile ara…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="btn-outline btn-sm"
              title="Aramayı temizle">
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center justify-between md:justify-end gap-3">
          <span className="text-sm text-muted">{filtered.length} danışan</span>
          <button onClick={() => setAddOpen(true)} className="btn-primary">+ Yeni Danışan</button>
        </div>
      </div>

      {/* Booking link banner */}
      <div className="mb-5 bg-sage-pale border border-sage-l rounded-xl px-4 md:px-5 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-sage">Randevu Linkiniz</p>
          <p className="text-sm font-mono mt-0.5 break-all">psikopanel.tr/{profileSlug}/booking</p>
          <p className="text-xs text-muted mt-0.5">Bu linki danışanlarınızla paylaşın — üye olmadan randevu alabilirler.</p>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${profileSlug}/booking`); toast.success('Kopyalandı!') }}
          className="btn-outline btn-sm flex-shrink-0 w-full md:w-auto">
          📋 Kopyala
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-cream">
                <th className="px-3 md:px-5 py-3 text-left text-xs font-bold text-muted uppercase tracking-wide border-b border-border">Ad Soyad</th>
                <th className="px-3 md:px-5 py-3 text-left text-xs font-bold text-muted uppercase tracking-wide border-b border-border hidden sm:table-cell">Telefon</th>
                <th className="px-3 md:px-5 py-3 text-left text-xs font-bold text-muted uppercase tracking-wide border-b border-border hidden md:table-cell">E-posta</th>
                <th className="px-3 md:px-5 py-3 text-left text-xs font-bold text-muted uppercase tracking-wide border-b border-border hidden lg:table-cell">Seans</th>
                <th className="px-3 md:px-5 py-3 text-left text-xs font-bold text-muted uppercase tracking-wide border-b border-border">Durum</th>
                <th className="px-3 md:px-5 py-3 text-left text-xs font-bold text-muted uppercase tracking-wide border-b border-border hidden md:table-cell">Kayıt</th>
              <th className="px-3 md:px-5 py-3 text-left text-xs font-bold text-muted uppercase tracking-wide border-b border-border">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 md:px-5 py-12 text-center text-sm text-muted">
                    {search ? 'Sonuç bulunamadı' : 'Henüz danışan yok'}
                  </td>
                </tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-cream/50 transition-colors">
                  <td className="px-3 md:px-5 py-3.5 font-medium text-sm">
                    <button 
                      onClick={() => setSelectedClient(c)}
                      className="text-sage-600 hover:text-sage-800 hover:underline transition-colors text-left"
                    >
                      {c.full_name}
                    </button>
                  </td>
                  <td className="px-3 md:px-5 py-3.5 text-sm text-muted hidden sm:table-cell">{c.phone ?? '—'}</td>
                  <td className="px-3 md:px-5 py-3.5 text-sm text-muted hidden md:table-cell">{c.email ?? '—'}</td>
                  <td className="px-3 md:px-5 py-3.5 text-sm hidden lg:table-cell">{c.session_type ?? '—'}</td>
                  <td className="px-3 md:px-5 py-3.5">
                    <span className={STATUS[c.status]?.cls ?? 'pill-sage'}>
                      {STATUS[c.status]?.text ?? c.status}
                    </span>
                  </td>
                  <td className="px-3 md:px-5 py-3.5 text-xs text-muted hidden md:table-cell">
                    {new Date(c.created_at).toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-3 md:px-5 py-3.5">
                    <button
                      onClick={() => setDeleteConfirm(c.id)}
                      className="btn-outline py-1 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50">
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add modal */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Yeni Danışan</h3>
              <button onClick={() => setAddOpen(false)} className="text-muted text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="label">Ad Soyad *</label>
                <input className="input w-full" required placeholder="Ayşe Yılmaz"
                  value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">Telefon</label>
                  <input className="input w-full" placeholder="05XX XXX XX XX"
                    value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="label">E-posta</label>
                  <input className="input w-full" type="email" placeholder="email@ornek.com"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Seans Türü</label>
                <select className="input w-full" value={form.session_type}
                  onChange={e => setForm(f => ({ ...f, session_type: e.target.value }))}>
                  <option>Bireysel Terapi</option>
                  <option>İlk Görüşme</option>
                  <option>Çift Terapisi</option>
                  <option>Online Seans</option>
                </select>
              </div>
              <div>
                <label className="label">Notlar</label>
                <textarea className="input w-full resize-none" rows={2} placeholder="Başvuru sebebi, yönlendiren…"
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

      {/* Delete confirmation modal */}
      {deleteConfirm && (
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
                  onClick={() => setDeleteConfirm(null)}
                  className="btn-outline flex-1 justify-center">
                  İptal
                </button>
                <button 
                  onClick={() => handleDelete(deleteConfirm)}
                  className="btn-primary flex-1 justify-center bg-red-600 hover:bg-red-700 border-red-600">
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Detail Popup */}
      {selectedClient && isClient && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Danışan Bilgileri</h3>
              <button onClick={() => setSelectedClient(null)} className="text-muted text-xl leading-none">×</button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Kişisel Bilgiler</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted">Ad Soyad</label>
                      <p className="font-medium">{selectedClient.full_name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted">Telefon</label>
                      <p className="font-medium">{selectedClient.phone || 'Belirtilmemiş'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted">E-posta</label>
                      <p className="font-medium">{selectedClient.email || 'Belirtilmemiş'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Terapi Bilgileri</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted">Seans Türü</label>
                      <p className="font-medium">{selectedClient.session_type || 'Belirtilmemiş'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted">Durum</label>
                      <span className={STATUS[selectedClient.status]?.cls ?? 'pill-sage'}>
                        {STATUS[selectedClient.status]?.text ?? selectedClient.status}
                      </span>
                    </div>
                    <div>
                      <label className="text-xs text-muted">Kayıt Tarihi</label>
                      <p className="font-medium">{new Date(selectedClient.created_at).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit', 
                        year: 'numeric'
                      })}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <h4 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Notlar</h4>
                {selectedClient.notes ? (
                  <div className="bg-cream/50 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{selectedClient.notes}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted italic">Henüz not eklenmemiş</p>
                )}
              </div>

              {/* Psychologist Notes */}
              <div>
                <h4 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Psikolog Notları</h4>
                <div className="bg-sage-pale border border-sage-l rounded-lg p-4">
                  <textarea 
                    className="w-full bg-transparent border-none resize-none focus:outline-none text-sm"
                    rows={4}
                    placeholder="Bu danışan hakkında psikolog notları... (Bu notlar sadece sizin görünürsünüz)"
                    defaultValue=""
                  />
                  <div className="mt-2 flex justify-end">
                    <button className="btn-outline btn-sm">
                      Notu Kaydet
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Appointments */}
              <div>
                <h4 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Son Randevular</h4>
                <div className="text-sm text-muted">
                  <p>Randevu geçmişi burada gösterilecek (API entegrasyonu ile)</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <button 
                  onClick={() => setSelectedClient(null)}
                  className="btn-outline flex-1 justify-center">
                  Kapat
                </button>
                <button 
                  onClick={() => {
                    // Edit client functionality
                    toast('Düzenleme özelliği yakında...', { icon: 'ℹ️' })
                  }}
                  className="btn-primary flex-1 justify-center">
                  Düzenle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
