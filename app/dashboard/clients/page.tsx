'use client'

import { useEffect, useState } from 'react'
import { Search, FileText, Upload, StickyNote, Users, Share2, Loader2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createSupabaseBrowser, hasSupabaseEnv } from '@/lib/supabase'

type Client = {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  notes_enc: string | null
  created_at: string
}

type SharedClient = {
  id: string
  shared_with_psychologist_id: string
  psychologist_id: string
  status: string
  shared_with_name?: string
}

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [notes, setNotes] = useState<string>('')
  const [editingNote, setEditingNote] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [colleagues, setColleagues] = useState<Array<{ id: string; full_name: string }>>([])
  const [selectedColleague, setSelectedColleague] = useState<string | null>(null)
  const [sharedWith, setSharedWith] = useState<SharedClient[]>([])

  // Load clients
  useEffect(() => {
    async function loadData() {
      if (!hasSupabaseEnv()) {
        setLoading(false)
        return
      }

      try {
        const supabase = createSupabaseBrowser()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        setUserId(user.id)

        // Load clients
        const { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .eq('psychologist_id', user.id)
          .order('created_at', { ascending: false })

        if (clientData) {
          setClients(clientData)
        }

        // Load accepted connections for sharing
        const { data: connections } = await supabase
          .from('connections')
          .select(`
            addressee_id,
            profiles:addressee_id (id, full_name)
          `)
          .eq('requester_id', user.id)
          .eq('status', 'accepted')

        if (connections) {
          const formattedColleagues = connections
            .filter((c) => c.profiles)
            .map((c) => ({
              id: c.addressee_id,
              full_name: c.profiles.full_name,
            }))
          setColleagues(formattedColleagues)
        }

        setLoading(false)
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Veriler yüklenirken hata oluştu')
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Load shared cases for selected client
  useEffect(() => {
    async function loadSharedCases() {
      if (!selected || !userId) return

      try {
        const supabase = createSupabaseBrowser()
        const { data: shared } = await supabase
          .from('shared_cases')
          .select(`
            id,
            shared_with_psychologist_id,
            psychologist_id,
            status,
            profiles:shared_with_psychologist_id (full_name)
          `)
          .eq('client_id', selected.id)

        if (shared) {
          const formattedShared = shared.map((s) => ({
            id: s.id,
            shared_with_psychologist_id: s.shared_with_psychologist_id,
            psychologist_id: s.psychologist_id,
            status: s.status,
            shared_with_name: s.profiles?.full_name,
          }))
          setSharedWith(formattedShared)
        }
      } catch (err) {
        console.error('Failed to load shared cases:', err)
      }
    }

    loadSharedCases()
  }, [selected, userId])

  const filtered = clients.filter(
    (c) =>
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  )

  async function handleSelectClient(c: Client) {
    setSelected(c)
    setNotes(c.notes_enc || '')
    setEditingNote(false)
  }

  async function saveNote() {
    if (!selected || !userId) return

    setSaving(true)
    try {
      const supabase = createSupabaseBrowser()
      const { error: updateError } = await supabase
        .from('clients')
        .update({ notes_enc: notes })
        .eq('id', selected.id)
        .eq('psychologist_id', userId)

      if (updateError) {
        setError('Not kaydedilemedi')
        return
      }

      setEditingNote(false)
      // Update local state
      setClients(clients.map((c) => (c.id === selected.id ? { ...c, notes_enc: notes } : c)))
      setSelected({ ...selected, notes_enc: notes })
    } catch (err) {
      console.error('Failed to save note:', err)
      setError('Bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  async function shareCase() {
    if (!selected || !userId || !selectedColleague) return

    setSaving(true)
    try {
      const supabase = createSupabaseBrowser()

      // Check if already shared
      const { data: existing } = await supabase
        .from('shared_cases')
        .select('id')
        .eq('client_id', selected.id)
        .eq('shared_with_psychologist_id', selectedColleague)
        .single()

      if (existing) {
        setError('Bu vaka zaten bu meslektaşla paylaşılmış')
        setSaving(false)
        return
      }

      const { error: insertError } = await supabase.from('shared_cases').insert([
        {
          client_id: selected.id,
          psychologist_id: userId,
          shared_with_psychologist_id: selectedColleague,
          status: 'active',
          purpose: 'Professional consultation',
        },
      ])

      if (insertError) {
        setError('Vaka paylaşılamadı')
        return
      }

      // Reload shared cases
      const { data: shared } = await supabase
        .from('shared_cases')
        .select(`
          id,
          shared_with_psychologist_id,
          psychologist_id,
          status,
          profiles:shared_with_psychologist_id (full_name)
        `)
        .eq('client_id', selected.id)

      if (shared) {
        const formattedShared = shared.map((s) => ({
          id: s.id,
          shared_with_psychologist_id: s.shared_with_psychologist_id,
          psychologist_id: s.psychologist_id,
          status: s.status,
          shared_with_name: s.profiles?.full_name,
        }))
        setSharedWith(formattedShared)
      }

      setShareDialogOpen(false)
      setSelectedColleague(null)
    } catch (err) {
      console.error('Failed to share case:', err)
      setError('Bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  async function stopSharing(sharedCaseId: string) {
    if (!userId) return

    setSaving(true)
    try {
      const supabase = createSupabaseBrowser()
      const { error: deleteError } = await supabase
        .from('shared_cases')
        .delete()
        .eq('id', sharedCaseId)

      if (deleteError) {
        setError('Paylaşım silinemedi')
        return
      }

      setSharedWith(sharedWith.filter((s) => s.id !== sharedCaseId))
    } catch (err) {
      console.error('Failed to stop sharing:', err)
      setError('Bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Danışan Arşivi</h1>
        <p className="text-muted-foreground mt-1 text-sm">Danışan dosyaları, notlar ve belgeler</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm px-4">
                {clients.length === 0 ? 'Danışan bulunmuyor' : 'Sonuç bulunamadı'}
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectClient(c)}
                  className={`w-full text-left p-3 transition-colors hover:bg-muted ${
                    selected?.id === c.id ? 'bg-accent' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">
                    {c.first_name} {c.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                </button>
              ))
            )}
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
                    {selected.first_name[0]}{selected.last_name[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-foreground">
                    {selected.first_name} {selected.last_name}
                  </h2>
                  <p className="text-sm text-muted-foreground">{selected.email}</p>
                  {selected.phone && (
                    <p className="text-sm text-muted-foreground">{selected.phone}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => setShareDialogOpen(true)}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Vakaları Paylaş
                </Button>
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
                  disabled={saving}
                >
                  {editingNote ? 'Kaydet' : 'Düzenle'}
                </Button>
              </div>
              {editingNote ? (
                <div className="space-y-2">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="text-sm min-h-28 resize-none bg-muted/50 border-0 focus-visible:ring-1"
                  />
                  <Button
                    size="sm"
                    onClick={saveNote}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {notes || 'Henüz not eklenmemiş.'}
                </p>
              )}
            </div>

            {/* Shared With */}
            {sharedWith.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Share2 className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Bu Vaka Paylaşılmış ({sharedWith.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {sharedWith.map((shared) => (
                    <div
                      key={shared.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {shared.shared_with_name}
                        </p>
                        <p className="text-xs text-muted-foreground">Aktif</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => stopSharing(shared.id)}
                        disabled={saving}
                      >
                        {saving ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vakaları Paylaş</DialogTitle>
            <DialogDescription>
              {selected && `${selected.first_name} ${selected.last_name} vakaını paylaşmak için bir meslektaş seçin`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {colleagues.length === 0 ? (
              <Alert>
                <AlertDescription className="text-sm">
                  Önce meslektaş eklemeniz gerekir. Meslektaşlar sayfasından bağlantı kurun.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {colleagues.map((colleague) => (
                  <button
                    key={colleague.id}
                    onClick={() => setSelectedColleague(colleague.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedColleague === colleague.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <p className="text-sm font-medium">{colleague.full_name}</p>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => setShareDialogOpen(false)}
                variant="outline"
                className="flex-1"
              >
                İptal
              </Button>
              <Button
                onClick={shareCase}
                disabled={!selectedColleague || saving || colleagues.length === 0}
                className="flex-1"
              >
                {saving ? 'Paylaşılıyor...' : 'Paylaş'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
