'use client'

import { useState } from 'react'
import { mockTests, Test } from '@/lib/mock-data'
import { ClipboardList, Plus, Link2, Send, CheckCircle2, Clock, ChevronDown, ChevronUp, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>(mockTests)
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
      {sent.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Yanıt Bekleniyor
          </h2>
          <div className="space-y-2">
            {sent.map((t) => (
              <div key={t.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center shrink-0">
                    <ClipboardList className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.sentTo} · {new Date(t.sentAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">Bekliyor</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleCopy(t.link, t.id)}
                    title="Linki Kopyala"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  {copied === t.id && (
                    <span className="text-xs text-primary">Kopyalandı!</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answered Tests */}
      {answered.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Yanıtlanan Testler
          </h2>
          <div className="space-y-2">
            {answered.map((t) => (
              <div key={t.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                  className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.sentTo} · {new Date(t.sentAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className="bg-green-100 text-green-700 border-0 text-xs">Yanıtlandı</Badge>
                    {expandedId === t.id ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
                {expandedId === t.id && t.answers && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5">Sonuçlar</p>
                      <p className="text-sm text-foreground leading-relaxed">{t.answers}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
