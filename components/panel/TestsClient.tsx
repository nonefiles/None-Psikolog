'use client'
// components/panel/TestsClient.tsx
// DÜZELTME: response_count → responses key düzeltildi

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import type { Test } from '@/lib/types'
import QuizApp from './QuizApp'
import TestResultsModal from './TestResultsModal'

type TestWithCount = Test & { responses?: { count: number }[] }

interface Props {
  tests: TestWithCount[]
  profileSlug: string
}

function toSlug(text: string) {
  return text.toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
    .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')
}

export default function TestsClient({ tests: initial, profileSlug }: Props) {
  const [tests, setTests] = useState(initial)
  const [addOpen, setAddOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', slug: '', description: '', creationType: 'manual' })
  const [isClient, setIsClient] = useState(false)
  const [quizAppOpen, setQuizAppOpen] = useState(false)
  const [selectedTestId, setSelectedTestId] = useState('')
  const [resultsModalOpen, setResultsModalOpen] = useState(false)
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [testResponses, setTestResponses] = useState<any[]>([])

  // Prevent hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  function copyUrl(testSlug: string) {
    const url = `${baseUrl}/${profileSlug}/test/${testSlug}`
    navigator.clipboard.writeText(url)
    toast.success('Link kopyalandı!')
  }

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch('/api/tests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    })
    if (res.ok) {
      setTests(ts => ts.map(t => t.id === id ? { ...t, is_active: !current } : t))
      toast.success(!current ? 'Test aktifleştirildi' : 'Test pasifleştirildi')
    } else {
      toast.error('Güncelleme başarısız')
    }
  }

  async function deleteTest(id: string) {
    if (!confirm('Bu testi silmek istediğinizden emin misiniz?')) return
    const res = await fetch(`/api/tests?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTests(ts => ts.filter(t => t.id !== id))
      toast.success('Test silindi')
    } else {
      toast.error('Silme başarısız')
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.slug) { toast.error('Başlık ve URL zorunlu'); return }
    setLoading(true)
    try {
      let testBody: any = { title: form.title, slug: form.slug, description: form.description, questions: [] }
      
      if (form.creationType === 'quizapp') {
        // Quiz App formatında test oluştur ve QuizApp'ı aç
        testBody = {
          ...testBody,
          type: 'quiz_app',
          settings: {
            allowRetake: true,
            showResults: true,
            randomizeQuestions: false,
            timeLimit: null,
            passingScore: 70
          }
        }
        
        const res = await fetch('/api/tests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testBody),
        })
        if (!res.ok) throw new Error((await res.json()).error)
        const newTest: TestWithCount = await res.json()
        setTests(t => [newTest, ...t])
        
        // QuizApp'ı aç
        setSelectedTestId(newTest.id)
        setQuizAppOpen(true)
        setAddOpen(false)
        setForm({ title: '', slug: '', description: '', creationType: 'manual' })
        toast.success('Test oluşturuldu! Şimdi soruları ekleyin.')
      } else if (form.creationType === 'json') {
        // JSON formatında test oluştur
        testBody = {
          ...testBody,
          type: 'json',
          settings: {
            allowRetake: true,
            showResults: true,
            randomizeQuestions: false,
            timeLimit: null,
            passingScore: 70
          }
        }

        const res = await fetch('/api/tests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testBody),
        })
        if (!res.ok) throw new Error((await res.json()).error)
        const newTest: TestWithCount = await res.json()
        setTests(t => [newTest, ...t])
        setAddOpen(false)
        setForm({ title: '', slug: '', description: '', creationType: 'manual' })
        toast.success('Test oluşturuldu!')
      } else {
        // Manuel test oluştur
        const res = await fetch('/api/tests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testBody),
        })
        if (!res.ok) throw new Error((await res.json()).error)
        const newTest: TestWithCount = await res.json()
        setTests(t => [newTest, ...t])
        setAddOpen(false)
        setForm({ title: '', slug: '', description: '', creationType: 'manual' })
        toast.success('Test oluşturuldu!')
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  function handleQuizAppSave(questions: any[]) {
    // Update test with questions
    fetch('/api/tests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedTestId, questions }),
    }).then(res => {
      if (res.ok) {
        toast.success('Sorular kaydedi!')
        setQuizAppOpen(false)
        setSelectedTestId('')
      } else {
        toast.error('Sorular kaydedilemedi')
      }
    })
  }

  async function fetchTestResponses(testId: string) {
    console.log('fetchTestResponses called with testId:', testId)
    try {
      const res = await fetch(`/api/tests/${testId}/responses`)
      console.log('API response status:', res.status)
      if (res.ok) {
        const responses = await res.json()
        console.log('API responses data:', responses)
        setTestResponses(responses)
      } else {
        console.log('API response not ok:', res.status, res.statusText)
        const errorText = await res.text()
        console.log('API error text:', errorText)
        setTestResponses([])
      }
    } catch (error) {
      console.error('Test yanıtları alınamadı:', error)
      setTestResponses([])
    }
  }

  function handleTestClick(test: Test) {
    setSelectedTest(test)
    setResultsModalOpen(true)
    fetchTestResponses(test.id)
  }

  async function handleDeleteTest(testId: string) {
    if (!confirm('Bu testi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return
    }
    
    try {
      const res = await fetch('/api/tests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: testId })
      })
      
      if (res.ok) {
        setTests(tests.filter(t => t.id !== testId))
        toast.success('Test silindi')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Test silinemedi')
      }
    } catch (error) {
      toast.error('Test silinemedi')
    }
  }

  async function handleToggleActive(testId: string, isActive: boolean) {
    try {
      const res = await fetch('/api/tests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: testId, is_active: isActive })
      })
      
      if (res.ok) {
        toast.success(`Test ${isActive ? 'aktif' : 'pasif'} edildi!`)
        setTests(tests.map(t => 
          t.id === testId ? { ...t, is_active: isActive } : t
        ))
      } else {
        toast.error('Test durumu güncellenemedi')
      }
    } catch (error) {
      console.error('Test durumu güncellenemedi:', error)
      toast.error('Test durumu güncellenemedi')
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-end mb-5">
        <button onClick={() => setAddOpen(true)} className="btn-primary">+ Yeni Test</button>
      </div>

      {tests.length === 0 && (
        <div className="text-center py-16 text-muted text-sm">
          Henüz test yok.{' '}
          <button onClick={() => setAddOpen(true)} className="text-sage hover:underline">İlk testi oluştur →</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tests.map(t => (
          <div
            key={t.id}
            onClick={() => handleTestClick(t)}
            className="card p-5 text-left hover:border-sage transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-charcoal group-hover:text-sage transition-colors">{t.title}</h3>
                {t.description && <p className="text-xs text-muted mt-1">{t.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={t.is_active}
                    onChange={(e) => {
                      e.stopPropagation()
                      handleToggleActive(t.id, e.target.checked)
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
                </label>
                <span className={`text-xs font-medium ${t.is_active ? 'text-sage' : 'text-gray-600'}`}>
                  {t.is_active ? 'Aktif' : 'Pasif'}
                </span>
                {/* Sil butonu buraya, flex container içine alındı */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteTest(t.id)
                  }}
                  className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
                  title="Testi Sil"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted">
              <div className="flex items-center gap-1">
                <span>{t.questions.length}</span>
                <span>soru</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{t.responses?.[0]?.count || 0}</span>
                <span>yanıt</span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  copyUrl(t.slug)
                }}
                className="btn-outline btn-xs flex-1"
              >
                Kopyala
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(`/${profileSlug}/test/${t.slug}`, '_blank')
                }}
                className="btn-outline btn-xs flex-1"
              >
                Test Et
              </button>
            </div>
          </div>
        ))}
        <button onClick={() => setAddOpen(true)}
          className="border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-muted hover:border-sage hover:text-sage transition-colors min-h-[160px]">
          <span className="text-3xl">+</span>
          <span className="text-sm font-medium">Yeni Test</span>
        </button>
      </div>

      {addOpen && isClient && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Yeni Test Oluştur</h3>
              <button onClick={() => setAddOpen(false)} className="text-muted text-xl leading-none hover:text-charcoal">×</button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="label">Test Adı *</label>
                <input className="input" required placeholder="ör. Beck Depresyon Envanteri"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: toSlug(e.target.value) }))} />
              </div>
              <div>
                <label className="label">URL Kısaltması *</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted whitespace-nowrap font-mono">{profileSlug}/test/</span>
                  <input className="input font-mono" required placeholder="bdi"
                    value={form.slug} onChange={e => setForm(f => ({ ...f, slug: toSlug(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="label">Açıklama</label>
                <input className="input" placeholder="ör. 21 madde · Otomatik puanlama"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              
              {/* Creation Type Selection */}
              <div>
                <label className="label">Oluşturma Türü *</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-cream/50 transition-colors">
                    <input 
                      type="radio" 
                      name="creationType" 
                      value="manual" 
                      checked={form.creationType === 'manual'}
                      onChange={e => setForm(f => ({ ...f, creationType: e.target.value }))}
                      className="w-4 h-4 text-sage-600 focus:ring-sage-500"
                    />
                    <div>
                      <p className="font-medium text-sm">Manuel Oluştur</p>
                      <p className="text-xs text-muted">Soru ekleme ve ayarlama manuel olarak yapılır</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-sage rounded-lg cursor-pointer hover:bg-sage-pale/50 transition-colors">
                    <input 
                      type="radio" 
                      name="creationType" 
                      value="quizapp" 
                      checked={form.creationType === 'quizapp'}
                      onChange={e => setForm(f => ({ ...f, creationType: e.target.value }))}
                      className="w-4 h-4 text-sage-600 focus:ring-sage-500"
                    />
                    <div>
                      <p className="font-medium text-sm">Quiz App Oluştur</p>
                      <p className="text-xs text-muted">Soruları tek tek oluşturabileceğiniz interaktif test</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-sage rounded-lg cursor-pointer hover:bg-sage-pale/50 transition-colors">
                    <input 
                      type="radio" 
                      name="creationType" 
                      value="json" 
                      checked={form.creationType === 'json'}
                      onChange={e => setForm(f => ({ ...f, creationType: e.target.value }))}
                      className="w-4 h-4 text-sage-600 focus:ring-sage-500"
                    />
                    <div>
                      <p className="font-medium text-sm">JSON Formatı</p>
                      <p className="text-xs text-muted">JSON verisi ile hızlı test oluşturma</p>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setAddOpen(false)} className="btn-outline flex-1 justify-center">İptal</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center disabled:opacity-60">
                  {loading ? 'Oluşturuluyor…' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QuizApp Modal */}
      {quizAppOpen && isClient && (
        <QuizApp 
          testId={selectedTestId}
          onSave={handleQuizAppSave}
          onClose={() => {
            setQuizAppOpen(false)
            setSelectedTestId('')
          }}
        />
      )}

      {/* TestResultsModal */}
      {resultsModalOpen && isClient && selectedTest && (
        <TestResultsModal
          isOpen={resultsModalOpen}
          onClose={() => {
            setResultsModalOpen(false)
            setSelectedTest(null)
            setTestResponses([])
          }}
          test={selectedTest}
          responses={testResponses}
        />
      )}
    </div>
  )
}
