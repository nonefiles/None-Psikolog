'use client'

import { useEffect, useState, useRef } from 'react'
import { Search, FileText, Upload, StickyNote, Users, Share2, Loader2, X, Download, Trash2 } from 'lucide-react'
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
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseEnv } from '@/lib/supabase'

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

type ClientDocument = {
  id: string
  title: string
  file_path: string
  url: string
  type: string
  created_at: string
}

type SessionStats = {
  totalSessions: number
  firstSessionDate: string | null
  lastSessionDate: string | null
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
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalSessions: 0,
    firstSessionDate: null,
    lastSessionDate: null,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load clients
  useEffect(() => {
    async function loadData() {
      if (!hasSupabaseEnv()) {
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()
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

  // Load shared cases and documents for selected client
  useEffect(() => {
    async function loadClientDetails() {
      if (!selected || !userId) return

      try {
        const supabase = createClient()

        // Load shared cases
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

        // Load documents
        const { data: docs } = await supabase
          .from('client_documents')
          .select('*')
          .eq('client_id', selected.id)
          .order('created_at', { ascending: false })

        if (docs) {
          setDocuments(docs)
        }

        // Load session stats
        const { data: appointments } = await supabase
          .from('appointments')
          .select('start_at, end_at, status')
          .eq('psychologist_id', userId)
          .eq('client_id', selected.id)
          .in('status', ['completed', 'confirmed'])

        if (appointments && appointments.length > 0) {
          const completedAppts = appointments.sort(
            (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
          )
          setSessionStats({
            totalSessions: appointments.length,
            firstSessionDate: completedAppts[0]?.start_at || null,
            lastSessionDate: completedAppts[completedAppts.length - 1]?.start_at || null,
          })
        }
      } catch (err) {
        console.error('Failed to load client details:', err)
      }
    }

    loadClientDetails()
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
      const supabase = createClient()
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
      const supabase = createClient()

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
      const supabase = createClient()
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

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files || !selected || !userId) return

    setUploadingFile(true)
    setError(null)

    try {
      const supabase = createClient()
      const file = files[0]

      // Generate unique file path
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop()
      const fileName = `${selected.id}/${timestamp}-${file.name}`

      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('client_documents')
        .upload(fileName, file)

      if (uploadError) {
        setError(`Dosya yüklemesi başarısız: ${uploadError.message}`)
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('client_documents')
        .getPublicUrl(fileName)

      // Save document metadata
      const { error: insertError } = await supabase
        .from('client_documents')
        .insert([
          {
            client_id: selected.id,
            psychologist_id: userId,
            title: file.name,
            file_path: fileName,
            url: urlData.publicUrl,
            type: fileExt || 'unknown',
          },
        ])

      if (insertError) {
        setError('Dosya bilgileri kaydedilemedi')
        return
      }

      // Reload documents
      const { data: docs } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', selected.id)
        .order('created_at', { ascending: false })

      if (docs) {
        setDocuments(docs)
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('Failed to upload file:', err)
      setError('Dosya yüklenirken bir hata oluştu')
    } finally {
      setUploadingFile(false)
    }
  }

  async function deleteDocument(docId: string, filePath: string) {
    if (!userId) return

    setUploadingFile(true)
    try {
      const supabase = createClient()

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('client_documents')
        .remove([filePath])

      if (storageError) {
        console.error('Storage delete error:', storageError)
        // Continue with DB deletion even if storage fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('client_documents')
        .delete()
        .eq('id', docId)

      if (dbError) {
        setError('Dosya silinemedi')
        return
      }

      setDocuments(documents.filter((d) => d.id !== docId))
    } catch (err) {
      console.error('Failed to delete document:', err)
      setError('Dosya silinirken bir hata oluştu')
    } finally {
      setUploadingFile(false)
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

              {/* Session Stats */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xl font-semibold text-foreground">{sessionStats.totalSessions}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Toplam Seans</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium text-foreground">
                    {sessionStats.firstSessionDate
                      ? new Date(sessionStats.firstSessionDate).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">İlk Seans</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium text-foreground">
                    {sessionStats.lastSessionDate
                      ? new Date(sessionStats.lastSessionDate).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Son Seans</p>
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

            {/* Files */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Dosyalar</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {documents.length}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                >
                  {uploadingFile ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Upload className="w-3 h-3" />
                  )}
                  Dosya Yükle
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingFile}
                />
              </div>

              {documents.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-lg py-8 text-center">
                  <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Henüz dosya yüklenmemiş</p>
                  <p className="text-xs text-muted-foreground mt-0.5">PDF, DOC, JPG desteklenir</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = doc.url
                            link.download = doc.title
                            link.click()
                          }}
                        >
                          <Download className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => deleteDocument(doc.id, doc.file_path)}
                          disabled={uploadingFile}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
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
