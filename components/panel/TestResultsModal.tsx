'use client'
// components/panel/TestResultsModal.tsx

import { useState } from 'react'
import { X, User, Calendar, MessageSquare, CheckCircle } from 'lucide-react'

interface TestResponse {
  id: string
  test_id: string
  client_id: string | null
  respondent_name: string | null
  answers: { question_index: number; option_index?: number; answer_text?: string; answer_number?: number; answer_boolean?: boolean | null }[]
  total_score: number | null
  completed_at: string
}

interface TestQuestion {
  text: string
  type: 'multiple_choice' | 'text' | 'scale' | 'true_false'
  options: { label: string }[]
}

interface Props {
  isOpen: boolean
  onClose: () => void
  test: {
    id: string
    title: string
    description: string | null
    questions: TestQuestion[]
  }
  responses: TestResponse[]
}

export default function TestResultsModal({ isOpen, onClose, test, responses }: Props) {
  const [selectedResponse, setSelectedResponse] = useState<TestResponse | null>(null)

  // Debug: Veri yapısını kontrol et
  console.log('TestResultsModal - test:', test)
  console.log('TestResultsModal - responses:', responses)
  console.log('TestResultsModal - test.questions:', test.questions)

  // Debug için örnek veri
  const mockResponses: TestResponse[] = [
    {
      id: 'mock-1',
      test_id: test.id,
      client_id: null,
      respondent_name: 'Test Kullanıcısı',
      answers: test.questions.map((q, index) => ({
        question_index: index,
        answer_text: q.type === 'text' ? 'Örnek cevap' : undefined,
        answer_number: q.type === 'scale' ? 5 : undefined,
        answer_boolean: q.type === 'true_false' ? true : undefined
      })),
      total_score: null,
      completed_at: new Date().toISOString()
    }
  ]

  const displayResponses = responses.length > 0 ? responses : mockResponses

  if (!isOpen) return null

  const getAnswerText = (answer: any, question: TestQuestion) => {
    if (question.type === 'multiple_choice' && answer.option_index !== undefined) {
      return question.options[answer.option_index]?.label || 'Seçenek bulunamadı'
    } else if (question.type === 'text' && answer.answer_text) {
      return answer.answer_text
    } else if (question.type === 'scale' && answer.answer_number !== undefined) {
      return `${answer.answer_number}/10`
    } else if (question.type === 'true_false' && answer.answer_boolean !== undefined) {
      return answer.answer_boolean ? 'Doğru' : 'Yanlış'
    }
    return 'Cevap bulunamadı'
  }

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{test.title}</h3>
            <p className="text-sm text-muted">Test Sonuçları</p>
          </div>
          <button 
            onClick={onClose}
            className="text-muted text-xl leading-none hover:text-charcoal"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {displayResponses.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted">
              Bu test için henüz sonuç bulunmuyor.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Responses List */}
              <div className="lg:col-span-1">
                <h4 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Dolduran Kişiler</h4>
                <div className="space-y-2">
                  {displayResponses.map((response) => (
                    <button
                      key={response.id}
                      onClick={() => setSelectedResponse(response)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedResponse?.id === response.id
                          ? 'border-sage bg-sage-pale'
                          : 'border-border hover:border-sage hover:bg-sage-pale/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-muted" />
                        <span className="font-medium text-sm">
                          {response.respondent_name || 'Misafir'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(response.completed_at).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Response Details */}
              <div className="lg:col-span-2">
                {selectedResponse ? (
                  <div className="space-y-6">
                    {/* Response Header */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-sage" />
                        </div>
                        <div>
                          <h5 className="font-semibold">
                            {selectedResponse.respondent_name || 'Misafir'}
                          </h5>
                          <p className="text-sm text-muted">
                            {new Date(selectedResponse.completed_at).toLocaleDateString('tr-TR')} · 
                            {new Date(selectedResponse.completed_at).toLocaleTimeString('tr-TR')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Questions and Answers */}
                    <div>
                      <h4 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
                        Sorular ve Cevaplar
                      </h4>
                      <div className="space-y-4">
                        {test.questions.map((question, index) => {
                          const answer = selectedResponse.answers.find(a => a.question_index === index)
                          return (
                            <div key={index} className="border border-border rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-xs font-bold text-sage">{index + 1}</span>
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm mb-2">{question.text}</p>
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                      <MessageSquare className="w-4 h-4 text-muted" />
                                      <span className="text-sm">
                                        {answer ? getAnswerText(answer, question) : 'Cevaplanmamış'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-muted">
                    Sonuçları görüntülemek için bir kişi seçin.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
