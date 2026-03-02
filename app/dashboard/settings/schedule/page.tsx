'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type DayKey = 1 | 2 | 3 | 4 | 5 | 6 | 7 // 1=Pzt ... 7=Paz
type DayConfig = { enabled: boolean; start: string; end: string }
type WeeklyConfig = Record<DayKey, DayConfig>

const dayNames: Record<DayKey, string> = {
  1: 'Pzt',
  2: 'Sal',
  3: 'Çar',
  4: 'Per',
  5: 'Cum',
  6: 'Cmt',
  7: 'Paz',
}

function defaultWeekly(): WeeklyConfig {
  return {
    1: { enabled: true, start: '09:00', end: '17:00' },
    2: { enabled: true, start: '09:00', end: '17:00' },
    3: { enabled: true, start: '09:00', end: '17:00' },
    4: { enabled: true, start: '09:00', end: '17:00' },
    5: { enabled: true, start: '09:00', end: '17:00' },
    6: { enabled: false, start: '10:00', end: '14:00' },
    7: { enabled: false, start: '10:00', end: '14:00' },
  }
}

export default function ScheduleSettingsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [slotMinutes, setSlotMinutes] = useState<number>(50)
  const [weekly, setWeekly] = useState<WeeklyConfig>(defaultWeekly())
  const valid = useMemo(() => {
    for (const k of Object.keys(weekly) as unknown as DayKey[]) {
      const d = weekly[k]
      if (!d.enabled) continue
      if (!d.start || !d.end) return false
      if (d.end <= d.start) return false
    }
    return slotMinutes >= 15 && slotMinutes <= 120
  }, [weekly, slotMinutes])

  useEffect(() => {
    try {
      const authRaw = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null
      const auth = authRaw ? (JSON.parse(authRaw) as { id: string }) : null
      if (auth?.id) setUserId(auth.id)
      const schedulesRaw = typeof window !== 'undefined' ? localStorage.getItem('schedules') : null
      const schedules: Array<{ userId: string; weekly: WeeklyConfig; slotMinutes: number }> =
        schedulesRaw ? JSON.parse(schedulesRaw) : []
      const s = auth ? schedules.find((x) => x.userId === auth.id) : null
      if (s) {
        setWeekly(s.weekly)
        setSlotMinutes(s.slotMinutes)
      }
    } catch {}
  }, [])

  function updateDay(k: DayKey, patch: Partial<DayConfig>) {
    setWeekly((w) => ({ ...w, [k]: { ...w[k], ...patch } }))
  }

  function handleSave() {
    if (!userId) return
    const schedulesRaw = localStorage.getItem('schedules')
    const schedules: Array<{ userId: string; weekly: WeeklyConfig; slotMinutes: number }> =
      schedulesRaw ? JSON.parse(schedulesRaw) : []
    const others = schedules.filter((x) => x.userId !== userId)
    const next = [...others, { userId, weekly, slotMinutes }]
    localStorage.setItem('schedules', JSON.stringify(next))
    alert('Mesai saatleri kaydedildi')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Mesai Saatleri</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Haftalık çalışma saatlerinizi belirleyin; danışanlar randevu sayfanızda bu saatlere göre boş zamanları görür.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.keys(weekly) as unknown as DayKey[]).map((k) => {
            const d = weekly[k]
            return (
              <div key={k} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">{dayNames[k]}</span>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={d.enabled}
                      onChange={(e) => updateDay(k, { enabled: e.target.checked })}
                    />
                    Aktif
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor={`start-${k}`} className="text-xs">Başlangıç</Label>
                    <Input
                      id={`start-${k}`}
                      type="time"
                      disabled={!d.enabled}
                      value={d.start}
                      onChange={(e) => updateDay(k, { start: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`end-${k}`} className="text-xs">Bitiş</Label>
                    <Input
                      id={`end-${k}`}
                      type="time"
                      disabled={!d.enabled}
                      value={d.end}
                      onChange={(e) => updateDay(k, { end: e.target.value })}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <Label htmlFor="slot" className="text-xs">Slot Süresi (dk)</Label>
            <Input
              id="slot"
              type="number"
              min={15}
              max={120}
              step={5}
              value={slotMinutes}
              onChange={(e) => setSlotMinutes(Number(e.target.value))}
              className="w-28 h-9"
            />
          </div>
        </div>

        <div className="pt-2">
          <Button
            onClick={handleSave}
            disabled={!valid || !userId}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Kaydet
          </Button>
        </div>
      </div>
    </div>
  )
}
