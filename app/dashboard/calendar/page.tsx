'use client'

import { useEffect, useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns'
import { tr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseEnv } from '@/lib/supabase'

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-accent text-accent-foreground',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}

const statusLabel: Record<string, string> = {
  pending: 'Bekliyor',
  confirmed: 'Onaylandı',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
}

interface Appointment {
  id: string
  start_at: string
  end_at: string
  guest_name: string
  guest_email: string
  status: string
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // Load appointments
  useEffect(() => {
    async function loadAppointments() {
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

        // Load all appointments for the psychologist
        const { data: appts } = await supabase
          .from('appointments')
          .select('*')
          .eq('psychologist_id', user.id)
          .order('start_at', { ascending: true })

        if (appts) {
          setAppointments(appts)
        }

        setLoading(false)
      } catch (err) {
        console.error('Failed to load appointments:', err)
        setLoading(false)
      }
    }

    loadAppointments()
  }, [])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const getApptsForDay = (day: Date) => {
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0)
    const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59)

    return appointments
      .filter((apt) => {
        const aptStart = new Date(apt.start_at)
        return aptStart >= dayStart && aptStart <= dayEnd
      })
      .map((apt) => {
        const aptStart = new Date(apt.start_at)
        return {
          id: apt.id,
          time: aptStart.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          clientName: apt.guest_name.split(' ')[0],
          clientSurname: apt.guest_name.split(' ').slice(1).join(' ') || '',
          clientEmail: apt.guest_email,
          status: apt.status || 'pending',
          fee: 100, // Placeholder
        }
      })
      .sort((a, b) => a.time.localeCompare(b.time))
  }

  const selectedDayAppts = selectedDay
    ? getApptsForDay(selectedDay).sort((a, b) => a.time.localeCompare(b.time))
    : []

  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-muted-foreground">Takvim yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Takvim</h1>
        <p className="text-muted-foreground mt-1 text-sm">Randevularınızı takvim görünümünde yönetin</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-foreground capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: tr })}
            </h2>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 px-3"
                onClick={() => setCurrentDate(new Date())}
              >
                Bugün
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Week Headers */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1.5">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {days.map((day) => {
              const dayAppts = getApptsForDay(day)
              const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
              const inMonth = isSameMonth(day, currentDate)
              const todayDay = isToday(day)

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    'bg-card p-2 min-h-16 text-left hover:bg-muted/50 transition-colors flex flex-col gap-1',
                    !inMonth && 'opacity-40',
                    isSelected && 'bg-accent/30 hover:bg-accent/40',
                  )}
                >
                  <span
                    className={cn(
                      'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                      todayDay && 'bg-primary text-primary-foreground',
                      !todayDay && 'text-foreground',
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {dayAppts.slice(0, 2).map((a) => (
                      <span
                        key={a.id}
                        className={cn(
                          'text-[10px] px-1 rounded truncate font-medium',
                          statusColor[a.status]
                        )}
                      >
                        {a.time} {a.clientName}
                      </span>
                    ))}
                    {dayAppts.length > 2 && (
                      <span className="text-[10px] text-muted-foreground px-1">
                        +{dayAppts.length - 2} daha
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Day Detail Panel */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              {selectedDay
                ? format(selectedDay, "d MMMM yyyy, EEEE", { locale: tr })
                : 'Gün seçin'}
            </h3>
          </div>

          {selectedDayAppts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Bu gün randevu yok.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayAppts.map((apt) => (
                <div key={apt.id} className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {apt.clientName} {apt.clientSurname}
                      </p>
                      <p className="text-xs text-muted-foreground">{apt.clientEmail}</p>
                    </div>
                    <Badge className={cn('text-[10px] px-2 py-0.5 border-0 font-medium', statusColor[apt.status])}>
                      {statusLabel[apt.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{apt.time} · 50 dk</span>
                    <span className="ml-auto font-medium text-foreground">₺{apt.fee.toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
