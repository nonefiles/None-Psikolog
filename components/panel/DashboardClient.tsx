'use client'
// components/panel/DashboardClient.tsx

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import MiniCalendar from './MiniCalendar'
import ArchiveCard from './ArchiveCard'

interface TodayAppt {
  id: string
  starts_at: string
  session_type: string
  duration_min: number
  status: string
  guest_name: string | null
  client?: { full_name: string } | null
}

interface Props {
  todayAppts: TodayAppt[]
  monthAppts: TodayAppt[]
  totalClients: number
  pendingAppts: number
  income: number
  expense: number
  today: Date
  testResponses: any[]
  homeworkResponses: any[]
  clients: any[]
  testTitles: Record<string, string>
  homeworkTitles: Record<string, string>
}

const statusLabel: Record<string, { text: string; cls: string }> = {
  pending:   { text: 'Bekliyor', cls: 'pill-orange' },
  confirmed: { text: 'Onaylı',   cls: 'pill-green'  },
  completed: { text: 'Tamamlandı', cls: 'pill-sage' },
  cancelled: { text: 'İptal',    cls: 'pill-orange'  },
}

export default function DashboardClient({ todayAppts, monthAppts, totalClients, pendingAppts, income, expense, today, testResponses, homeworkResponses, clients, testTitles, homeworkTitles }: Props) {
  const [selectedModal, setSelectedModal] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Prevent hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  const stats = [
    { 
      key: 'today', 
      label: 'Bugünkü Randevular', 
      value: todayAppts.length, 
      badge: 'Bugün', 
      cls: 'pill-blue',
      href: '/panel/calendar',
      detail: `${format(today, 'd MMMM', { locale: tr })} günü toplam randevu sayısı`
    },
    { 
      key: 'clients', 
      label: 'Aktif Danışanlar', 
      value: totalClients, 
      badge: 'Toplam', 
      cls: 'pill-sage',
      href: '/panel/clients',
      detail: 'Sisteme kayıtlı aktif danışan sayısı'
    },
    { 
      key: 'pending', 
      label: 'Bekleyen Onay', 
      value: pendingAppts, 
      badge: 'Yeni', 
      cls: 'pill-orange',
      href: '/panel/calendar',
      detail: 'Onay bekleyen yeni randevu talepleri'
    },
    { 
      key: 'income', 
      label: `${format(today, 'MMMM', { locale: tr })} Geliri`, 
      value: `₺${income.toLocaleString('tr-TR')}`, 
      badge: `Gider ₺${expense.toLocaleString('tr-TR')}`, 
      cls: 'pill-green',
      href: '/panel/finance',
      detail: `Bu ayki toplam gelir ve gider durumu`
    },
  ]

  function handleStatClick(stat: typeof stats[0]) {
    setSelectedModal(stat.key)
  }

  function handleNavigate(href: string) {
    window.location.href = href
  }

  return (
    <>
      <div className="p-4 md:p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(stat => (
            <div 
              key={stat.key} 
              className="card p-5 cursor-pointer hover:bg-cream/30 transition-colors group"
              onClick={() => handleStatClick(stat)}
            >
              <p className="text-[11px] font-bold text-muted uppercase tracking-wide">{stat.label}</p>
              <p className="font-serif text-3xl mt-1.5 mb-1 leading-none">{stat.value}</p>
              <span className={stat.cls}>{stat.badge}</span>
              <div className="mt-2 text-xs text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                Tıkla → Detaylar
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bugünün programı */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="px-4 md:px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold">Bugünün Programı</h3>
                <a href="/panel/calendar" className="text-xs text-sage hover:underline">Takvime Git →</a>
              </div>
              {todayAppts.length > 0 ? (
                <ul>
                  {todayAppts.map(appt => {
                    const s = statusLabel[appt.status] ?? statusLabel.pending
                    const name = appt.client?.full_name ?? appt.guest_name ?? '—'
                    return (
                      <li key={appt.id} className="flex items-center gap-2 md:gap-4 px-4 md:px-6 py-3.5 border-b border-border/60 last:border-0 hover:bg-cream/50 transition-colors">
                        <span className="text-xs font-bold text-sage w-12 flex-shrink-0">
                          {format(new Date(appt.starts_at), 'HH:mm')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{name}</p>
                          <p className="text-xs text-muted">{appt.session_type} · {appt.duration_min} dk</p>
                        </div>
                        <span className={s.cls + ' flex-shrink-0'}>{s.text}</span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="px-4 md:px-6 py-10 text-center text-sm text-muted">
                  Bugün randevu yok
                </div>
              )}
            </div>

            {/* Arşiv Kartı */}
            <ArchiveCard 
              testResponses={testResponses}
              homeworkResponses={homeworkResponses}
              clients={clients}
              testTitles={testTitles}
              homeworkTitles={homeworkTitles}
            />
          </div>

          {/* Mini Calendar */}
          <div>
            <MiniCalendar 
              appointments={monthAppts}
              today={today}
              onDayClick={(date) => {
                // Navigate to calendar with selected date
                const dateStr = format(date, 'yyyy-MM-dd')
                window.location.href = `/panel/calendar?date=${dateStr}`
              }}
            />
          </div>
        </div>
      </div>

      {/* Detail Modals */}
      {selectedModal && isClient && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            {(() => {
              const stat = stats.find(s => s.key === selectedModal)
              if (!stat) return null

              return (
                <>
                  <div className="px-4 md:px-6 py-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-sm md:text-base">{stat.label}</h3>
                    <button onClick={() => setSelectedModal(null)} className="text-muted text-xl leading-none">×</button>
                  </div>
                  <div className="p-4 md:p-6">
                    <div className="text-center mb-6">
                      <p className="font-serif text-4xl mb-2">{stat.value}</p>
                      <span className={stat.cls}>{stat.badge}</span>
                    </div>
                    
                    <p className="text-sm text-muted mb-6 text-center">{stat.detail}</p>

                    {selectedModal === 'today' && todayAppts.length > 0 && (
                      <div className="space-y-2 mb-6">
                        <h4 className="text-sm font-semibold">Bugünün Randevuları:</h4>
                        {todayAppts.slice(0, 3).map(appt => {
                          const name = appt.client?.full_name ?? appt.guest_name ?? '—'
                          return (
                            <div key={appt.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                              <span>{format(new Date(appt.starts_at), 'HH:mm')} - {name}</span>
                              <span className={statusLabel[appt.status]?.cls}>
                                {statusLabel[appt.status]?.text}
                              </span>
                            </div>
                          )
                        })}
                        {todayAppts.length > 3 && (
                          <p className="text-xs text-muted text-center">+{todayAppts.length - 3} randevu daha...</p>
                        )}
                      </div>
                    )}

                    {selectedModal === 'income' && (
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                          <span className="text-sm font-medium">Gelir</span>
                          <span className="text-green-600 font-bold">₺{income.toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                          <span className="text-sm font-medium">Gider</span>
                          <span className="text-red-600 font-bold">₺{expense.toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-sage-pale rounded">
                          <span className="text-sm font-medium">Net</span>
                          <span className="text-sage font-bold">₺{(income - expense).toLocaleString('tr-TR')}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button 
                        onClick={() => setSelectedModal(null)}
                        className="btn-outline flex-1 justify-center">
                        Kapat
                      </button>
                      <button 
                        onClick={() => handleNavigate(stat.href)}
                        className="btn-primary flex-1 justify-center">
                        Sayfaya Git
                      </button>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </>
  )
}
