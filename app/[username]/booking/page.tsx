'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getPsychologistByUsername, mockPsychologist } from '@/lib/mock-data'
import { createSupabaseBrowser } from '@/lib/supabase'
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Brain,
  MapPin,
  Star,
} from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

// Mock available time slots
const availableSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']

// Simulate some booked slots
const bookedSlots: Record<string, string[]> = {
  '2026-03-02': ['09:00', '10:00', '14:00'],
  '2026-03-04': ['11:00'],
}

type Step = 'select-date' | 'fill-form' | 'success'

export default function BookingPage() {
  const params = useParams()
  const username = params?.username as string
  const psy = getPsychologistByUsername(username) ?? mockPsychologist
  const supabase = createSupabaseBrowser()
  const [displayName, setDisplayName] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    supabase
      .from('profiles')
      .select('full_name')
      .eq('slug', username)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        if (data?.full_name) setDisplayName(data.full_name)
      })
    return () => {
      active = false
    }
  }, [supabase, username])

  const [step, setStep] = useState<Step>('select-date')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', surname: '', phone: '', email: '', details: '' })

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })
  const weekDays = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']

  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null
  const takenSlots = selectedDateKey ? (bookedSlots[selectedDateKey] ?? []) : []
  const freeSlots = availableSlots.filter((s) => !takenSlots.includes(s))

  function handleDayClick(day: Date) {
    if (isBefore(day, startOfDay(new Date()))) return
    setSelectedDate(day)
    setSelectedTime(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStep('success')
  }

  // ─── Success Screen ───────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Randevunuz Alındı!</h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              <strong>{form.name} {form.surname}</strong> adına{' '}
              <strong>
                {selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: tr }) : ''}, {selectedTime}
              </strong>{' '}
              tarihinde randevunuz oluşturuldu.
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-left space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <span className="text-foreground">
                {selectedDate ? format(selectedDate, "d MMMM yyyy, EEEE", { locale: tr }) : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <span className="text-foreground">{selectedTime} · 50 dakika</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Brain className="w-4 h-4 text-primary shrink-0" />
              <span className="text-foreground">{displayName ?? psy.name}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Onay bilgisi <strong>{form.email}</strong> adresinize gönderilecektir.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => { setStep('select-date'); setSelectedDate(null); setSelectedTime(null); setForm({ name: '', surname: '', phone: '', email: '', details: '' }) }}
          >
            Yeni Randevu Al
          </Button>
        </div>
      </div>
    )
  }

  // ─── Form Step ────────────────────────────────────────────────────────────
  if (step === 'fill-form') {
    return (
      <div className="min-h-screen bg-background p-4 flex items-start justify-center pt-10">
        <div className="max-w-lg w-full space-y-6">
          {/* Back */}
          <button
            onClick={() => setStep('select-date')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Geri Dön
          </button>

          {/* Summary */}
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {selectedDate ? format(selectedDate, "d MMMM yyyy, EEEE", { locale: tr }) : ''}
              </p>
              <p className="text-xs text-muted-foreground">{selectedTime} · {psy.name}</p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-base font-semibold text-foreground mb-4">Bilgilerinizi Girin</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">Ad *</Label>
                  <Input
                    id="name"
                    placeholder="Adınız"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="surname" className="text-xs font-medium text-muted-foreground">Soyad *</Label>
                  <Input
                    id="surname"
                    placeholder="Soyadınız"
                    value={form.surname}
                    onChange={(e) => setForm({ ...form, surname: e.target.value })}
                    required
                    className="h-10 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground">Telefon *</Label>
                <Input
                  id="phone"
                  placeholder="05XX XXX XX XX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">E-posta *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="details" className="text-xs font-medium text-muted-foreground">
                  Eklemek İstediğiniz Detaylar
                </Label>
                <Textarea
                  id="details"
                  placeholder="Görüşmek istediğiniz konular, öncelikli endişeleriniz..."
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                  className="text-sm resize-none min-h-24"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
              >
                Randevuyu Onayla
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Randevunuz üyelik gerektirmez. Verileriniz güvende tutulur.
              </p>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ─── Date/Time Selection ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto space-y-6 pt-6 pb-10">
        {/* Psychologist Card */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-xl font-semibold text-primary">AY</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-foreground">{displayName ?? psy.name}</h1>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{psy.title}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{psy.specialty}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{psy.sessionDuration} dk</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>₺{psy.sessionFee.toLocaleString('tr-TR')} / seans</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>Online / Yüz Yüze</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: tr })}
              </h2>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {weekDays.map((d) => (
                <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-0.5">
              {days.map((day) => {
                const inMonth = isSameMonth(day, currentMonth)
                const isPast = isBefore(day, startOfDay(new Date()))
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                const todayDay = isToday(day)

                return (
                  <button
                    key={day.toISOString()}
                    disabled={isPast || !inMonth}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      'h-9 w-full rounded-lg text-sm font-medium transition-colors flex items-center justify-center',
                      !inMonth && 'invisible',
                      isPast && 'text-muted-foreground/40 cursor-not-allowed',
                      !isPast && inMonth && 'hover:bg-muted',
                      todayDay && !isSelected && 'border border-primary text-primary',
                      isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time Slots */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              {selectedDate
                ? format(selectedDate, "d MMMM, EEEE", { locale: tr })
                : 'Tarih seçin'}
            </h2>

            {!selectedDate ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Calendar className="w-8 h-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Müsait saatleri görmek için tarih seçin</p>
              </div>
            ) : freeSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <p className="text-sm text-muted-foreground">Bu gün için müsait saat bulunmamaktadır.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {freeSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={cn(
                      'py-2.5 rounded-lg text-sm font-medium border transition-colors',
                      selectedTime === slot
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-foreground hover:border-primary hover:bg-accent/40'
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        {selectedDate && selectedTime && (
          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="text-sm">
              <p className="font-medium text-foreground">
                {format(selectedDate, "d MMMM yyyy, EEEE", { locale: tr })} · {selectedTime}
              </p>
              <p className="text-muted-foreground text-xs">{psy.sessionDuration} dakika seans</p>
            </div>
            <Button
              onClick={() => setStep('fill-form')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            >
              Devam Et
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
