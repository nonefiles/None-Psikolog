'use client'

import { useState } from 'react'
type Client = {
  id: string
  name: string
  surname: string
  phone: string
  email: string
  notes: string
  files: { id: string; name: string; type: string; uploadedAt: string; size: string }[]
  firstSession: string
  lastSession: string
  totalSessions: number
}
import { Search, FileText, Upload, StickyNote, Users, ChevronRight, File, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Client | null>(null)
  const [note, setNote] = useState(selected?.notes ?? '')
  const [editingNote, setEditingNote] = useState(false)

  const clients: Client[] = []
  const filtered = clients.filter(
    (c) =>
      `${c.name} ${c.surname}`.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(c: Client) {
    setSelected(c)
    setNote(c.notes)
    setEditingNote(false)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Danışan Arşivi</h1>
        <p className="text-muted-foreground mt-1 text-sm">Danışan dosyaları, notlar ve belgeler</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Client List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Danışan ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </div>

          {/* Client List */}
          <div className="divide-y divide-border">
            <div className="py-10 text-center text-muted-foreground text-sm">Kayıt bulunmuyor.</div>
          </div>
        </div>

        {/* Client Detail */}
        {selected ? (
          <div className="lg:col-span-2 space-y-4">
            {/* Info Card */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-base font-semibold text-primary">
                    {selected.name[0]}{selected.surname[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-foreground">
                    {selected.name} {selected.surname}
                  </h2>
                  <p className="text-sm text-muted-foreground">{selected.email} · {selected.phone}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xl font-semibold text-foreground">{selected.totalSessions}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Toplam Seans</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium text-foreground">
                    {new Date(selected.firstSession).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">İlk Seans</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium text-foreground">
                    {new Date(selected.lastSession).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Son Seans</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Terapist Notları</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setEditingNote(!editingNote)}
                >
                  {editingNote ? 'Kaydet' : 'Düzenle'}
                </Button>
              </div>
              {editingNote ? (
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="text-sm min-h-28 resize-none bg-muted/50 border-0 focus-visible:ring-1"
                />
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {note || 'Henüz not eklenmemiş.'}
                </p>
              )}
            </div>

            {/* Files */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Dosyalar</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {selected.files.length}
                  </span>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                  <Upload className="w-3 h-3" />
                  Dosya Yükle
                </Button>
              </div>

              {selected.files.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-lg py-8 text-center">
                  <File className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Henüz dosya yüklenmemiş</p>
                  <p className="text-xs text-muted-foreground mt-0.5">PDF, DOC, JPG desteklenir</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selected.files.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{f.size} · {new Date(f.uploadedAt).toLocaleDateString('tr-TR')}</p>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 flex items-center justify-center bg-card border border-border rounded-xl">
            <div className="text-center py-16">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Danışan seçin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
