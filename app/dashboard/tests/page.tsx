'use client'

import { useState } from 'react'
type Test = {
  id: string
  psychologistId: string
  title: string
  link: string
  sentTo: string
  sentAt: string
  status: 'sent' | 'answered'
  answers?: string
}
import { ClipboardList, Plus, Link2, Send, CheckCircle2, Clock, ChevronDown, ChevronUp, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', link: '', sentTo: '' })
  const [copied, setCopied] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.link || !form.sentTo) return
    const newTest: Test = {
      id: `tst_${Date.now()}`,
      psychologistId: 'psy_1',
      title: form.title,
      link: form.link,
      sentTo: form.sentTo,
      sentAt: new Date().toISOString().split('T')[0],
      status: 'sent',
    }
    setTests((prev) => [newTest, ...prev])
    setForm({ title: '', link: '', sentTo: '' })
    setShowForm(false)
  }

  function handleCopy(link: string, id: string) {
    navigator.clipboard.writeText(link)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const answered = tests.filter((t) => t.status === 'answered')
  const sent = tests.filter((t) => t.status === 'sent')

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Test & Ödevler</h1>
          <p className="text-muted-foreground mt-1 text-sm">Danışanlara test gönderin ve sonuçları takip edin</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          Yeni Test
        </Button>
      </div>

      {/* New Test Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" />
            Yeni Test Linki Oluştur
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-medium text-muted-foreground">
                  Test Adı
                </Label>
                <Input
                  id="title"
                  placeholder="Örn: Beck Depresyon Envanteri"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="h-9 text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sentTo" className="text-xs font-medium text-muted-foreground">
                  Gönderilecek Danışan
                </Label>
                <Input
                  id="sentTo"
                  placeholder="Danışan adı"
                  value={form.sentTo}
                  onChange={(e) => setForm({ ...form, sentTo: e.target.value })}
                  className="h-9 text-sm"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="link" className="text-xs font-medium text-muted-foreground">
                Form Linki
              </Label>
              <Input
                id="link"
                placeholder="https://forms.google.com/..."
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                className="h-9 text-sm"
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                İptal
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-primary-foreground gap-2">
                <Send className="w-3.5 h-3.5" />
                Gönder
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{sent.length}</p>
            <p className="text-xs text-muted-foreground">Bekleyen</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{answered.length}</p>
            <p className="text-xs text-muted-foreground">Yanıtlandı</p>
          </div>
        </div>
      </div>

      {/* Awaiting Answer */}
      {sent.length === 0 && (
        <div className="text-sm text-muted-foreground">Gönderilmiş test bulunmuyor.</div>
      )}

      {/* Answered Tests */}
      {answered.length === 0 && (
        <div className="text-sm text-muted-foreground">Yanıtlanmış test bulunmuyor.</div>
      )}
    </div>
  )
}
