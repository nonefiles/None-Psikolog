'use client'
// components/client/TestRunner.tsx

import { useState } from 'react'
import type { Test } from '@/lib/types'
import PsychologistNotification from '../panel/PsychologistNotification'

interface Props {
  test: Test
  psychologistId: string
}

export default function TestRunner({ test }: Props) {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<{ question_index: number; option_index?: number; answer_text?: string; answer_number?: number; answer_boolean?: boolean | null }[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [selectedText, setSelectedText] = useState('')
  const [selectedNumber, setSelectedNumber] = useState<number>(5)
  const [selectedBoolean, setSelectedBoolean] = useState<boolean | null>(null)
  const [done, setDone] = useState(false)
  const [name, setName] = useState('')
  const [nameSubmitted, setNameSubmitted] = useState(false)
  const [showNotification, setShowNotification] = useState(false)

  const total = test.questions.length
  const progress = total > 0 ? Math.round((currentQ / total) * 100) : 0

  function next() {
    const q = test.questions[currentQ]
    
    if (q.type === 'multiple_choice' && selected === null) return
    if (q.type === 'text' && !selectedText) return
    if (q.type === 'scale' && selectedNumber === undefined) return
    if (q.type === 'true_false' && selectedBoolean === null) return
    
    const newAnswers = [...answers]
    newAnswers[currentQ] = { 
      question_index: currentQ, 
      option_index: q.type === 'multiple_choice' && selected !== null ? selected : undefined,
      answer_text: q.type === 'text' ? selectedText : undefined,
      answer_number: q.type === 'scale' ? selectedNumber : undefined,
      answer_boolean: q.type === 'true_false' ? selectedBoolean : undefined
    }
    setAnswers(newAnswers)
    
    // Reset selection states
    setSelected(null)
    setSelectedText('')
    setSelectedNumber(5)
    setSelectedBoolean(null)

    if (currentQ + 1 >= total) {
      submitTest(newAnswers)
    } else {
      setCurrentQ(currentQ + 1)
    }
  }

  async function submitTest(finalAnswers: typeof answers) {
    try {
      await fetch('/api/tests/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_id: test.id,
          respondent_name: name || 'Misafir',
          answers: finalAnswers,
          total_score: null,
          completed_at: new Date().toISOString()
        })
      })
      setDone(true)
      // Test tamamlandığında notification göster
      setTimeout(() => {
        setShowNotification(true)
      }, 1000)
    } catch (err) {
      console.error('Test gönderilemedi:', err)
      // Hata olsa da notification göster
      setShowNotification(true)
    }
  }

  function getInterpretation(score: number) {
    if (score <= 9)  return { label: 'Minimal', color: 'text-green-700',  bg: 'bg-green-50'  }
    if (score <= 16) return { label: 'Hafif',   color: 'text-yellow-700', bg: 'bg-yellow-50' }
    if (score <= 23) return { label: 'Orta',    color: 'text-orange-700', bg: 'bg-orange-50' }
    return               { label: 'Ağır',    color: 'text-red-700',    bg: 'bg-red-50'    }
  }

  if (!nameSubmitted) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-muted mb-6">Teste başlamadan önce adınızı girin.</p>
        <input className="input mb-4" placeholder="Adınız (opsiyonel)"
          value={name} onChange={e => setName(e.target.value)} />
        <button className="btn-primary w-full justify-center py-3"
          onClick={() => setNameSubmitted(true)}>
          Testi Başlat
        </button>
      </div>
    )
  }

  if (nameSubmitted && done) {
    return (
      <div className="card p-8 text-center">
        <div className={`w-24 h-24 rounded-full bg-sage-100 border-4 border-sage flex flex-col items-center justify-center mx-auto mb-6`}>
          <span className="text-3xl text-sage">✓</span>
          <span className="text-[10px] text-sage font-bold uppercase tracking-wide">Tamamlandı</span>
        </div>
        <h2 className="font-serif text-2xl mb-2">Test Tamamlandı</h2>
        <p className="text-sm text-muted mb-6">Sonuçlarınız psikologunuza iletildi.</p>
        <div className="bg-green-50 rounded-xl p-4">
          <div className="text-xs font-bold text-green-800 uppercase tracking-wide mb-1">Bildirim</div>
          <div className="text-lg font-semibold text-green-800">Psikologunuza iletildi</div>
        </div>
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className="card p-8 text-center text-sm text-muted">
        Bu test henüz soru içermiyor.
      </div>
    )
  }

  const q = test.questions[currentQ]
  
  // Debug: Test veri yapısını kontrol et
  console.log('Current question:', q)
  console.log('Test questions:', test.questions)

  return (
    <div className="space-y-4">
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div className="h-full bg-sage rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs text-muted text-right">{currentQ + 1} / {total}</p>

      <div className="card p-6">
        <p className="text-xs font-bold text-sage uppercase tracking-wide mb-3">Soru {currentQ + 1}</p>
        <p className="text-base font-medium leading-relaxed mb-5">{q.text}</p>
        {q.type === 'multiple_choice' && q.options && q.options.length > 0 ? (
          <div className="space-y-2">
            {q.options.map((opt, i) => (
              <button key={i}
                onClick={() => setSelected(i)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all
                  ${selected === i
                    ? 'border-sage bg-sage-pale font-medium'
                    : 'border-border hover:border-sage hover:bg-sage-pale/50'}`}>
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                  ${selected === i ? 'border-sage bg-sage' : 'border-border'}`}>
                  {selected === i && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span>{opt.label || `Seçenek ${i + 1}`}</span>
              </button>
            ))}
          </div>
        ) : q.type === 'multiple_choice' ? (
          <div className="text-center py-4 text-sm text-muted">
            Bu soru için seçenekler bulunmuyor.
          </div>
        ) : q.type === 'text' ? (
          <div className="space-y-2">
            <textarea 
              className="input w-full h-24 resize-none"
              placeholder="Cevabınızı yazın..."
              value={selectedText || ''}
              onChange={(e) => {
                setSelectedText(e.target.value)
              }}
            />
          </div>
        ) : q.type === 'scale' ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">0</span>
              <input 
                type="range" 
                min="0" 
                max="10" 
                className="flex-1"
                value={selectedNumber || 5}
                onChange={(e) => {
                  setSelectedNumber(parseInt(e.target.value))
                }}
              />
              <span className="text-sm text-muted">10</span>
            </div>
            <div className="text-center">
              <span className="text-lg font-medium">{selectedNumber || 5}/10</span>
            </div>
          </div>
        ) : q.type === 'true_false' ? (
          <div className="space-y-2">
            <button 
              onClick={() => {
                setSelectedBoolean(true)
              }}
              className={`w-full px-4 py-3 rounded-xl border text-left text-sm transition-all
                ${selectedBoolean === true
                  ? 'border-sage bg-sage-pale font-medium'
                  : 'border-border hover:border-sage hover:bg-sage-pale/50'}`}>
              Doğru
            </button>
            <button 
              onClick={() => {
                setSelectedBoolean(false)
              }}
              className={`w-full px-4 py-3 rounded-xl border text-left text-sm transition-all
                ${selectedBoolean === false
                  ? 'border-sage bg-sage-pale font-medium'
                  : 'border-border hover:border-sage hover:bg-sage-pale/50'}`}>
              Yanlış
            </button>
          </div>
        ) : null}
      </div>

      <button onClick={next} disabled={
        (q.type === 'multiple_choice' && selected === null) ||
        (q.type === 'text' && !selectedText) ||
        (q.type === 'scale' && selectedNumber === undefined) ||
        (q.type === 'true_false' && selectedBoolean === null)
      } className="btn-primary w-full justify-center py-3 disabled:opacity-40">
        {currentQ + 1 === total ? 'Testi Tamamla →' : 'Devam →'}
      </button>
    </div>
  )

  return (
    <>
      <div className="space-y-4">
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-sage rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-muted text-right">{currentQ + 1} / {total}</p>

        <div className="card p-6">
          <p className="text-xs font-bold text-sage uppercase tracking-wide mb-3">Soru {currentQ + 1}</p>
          <p className="text-base font-medium leading-relaxed mb-5">{q.text}</p>
          {q.options && q.type === 'multiple_choice' ? (
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <button key={i}
                  onClick={() => setSelected(i)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all
                    ${selected === i
                      ? 'border-sage bg-sage-pale font-medium'
                      : 'border-border hover:border-sage hover:bg-sage-pale/50'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                    ${selected === i ? 'border-sage bg-sage' : 'border-border'}`}>
                    {selected === i && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          ) : q.type === 'text' ? (
            <div className="space-y-2">
              <textarea 
                className="input w-full h-24 resize-none"
                placeholder="Cevabınızı yazın..."
                value={selectedText || ''}
                onChange={(e) => {
                  setSelectedText(e.target.value)
                }}
              />
            </div>
          ) : q.type === 'scale' ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">0</span>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  className="flex-1"
                  value={selectedNumber || 5}
                  onChange={(e) => {
                    setSelectedNumber(parseInt(e.target.value))
                  }}
                />
                <span className="text-sm text-muted">10</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-medium">{selectedNumber || 5}/10</span>
              </div>
            </div>
          ) : q.type === 'true_false' ? (
            <div className="space-y-2">
              <button 
                onClick={() => {
                  setSelectedBoolean(true)
                }}
                className={`w-full px-4 py-3 rounded-xl border text-left text-sm transition-all
                  ${selectedBoolean === true
                    ? 'border-sage bg-sage-pale font-medium'
                    : 'border-border hover:border-sage hover:bg-sage-pale/50'}`}>
                Doğru
              </button>
              <button 
                onClick={() => {
                  setSelectedBoolean(false)
                }}
                className={`w-full px-4 py-3 rounded-xl border text-left text-sm transition-all
                  ${selectedBoolean === false
                    ? 'border-sage bg-sage-pale font-medium'
                    : 'border-border hover:border-sage hover:bg-sage-pale/50'}`}>
                Yanlış
              </button>
            </div>
          ) : null}
        </div>

        <button onClick={next} disabled={
          (q.type === 'multiple_choice' && selected === null) ||
          (q.type === 'text' && !selectedText) ||
          (q.type === 'scale' && selectedNumber === undefined) ||
          (q.type === 'true_false' && selectedBoolean === null)
        } className="btn-primary w-full justify-center py-3 disabled:opacity-40">
          {currentQ + 1 === total ? 'Testi Tamamla →' : 'Devam →'}
        </button>
      </div>
      
      <PsychologistNotification
        isOpen={showNotification}
        onClose={() => setShowNotification(false)}
        testName={test.title}
        testScore={0}
        respondentName={name || 'Misafir'}
        completedAt={new Date().toISOString()}
        onSendEmail={() => Promise.resolve()}
        onSendWhatsApp={() => Promise.resolve()}
      />
    </>
  )
}
