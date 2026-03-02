'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Clock, Users, CheckCircle2, AlertCircle, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const statusLabel: Record<string, string> = {
  pending: 'Bekliyor',
  confirmed: 'Onaylandı',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed: 'bg-accent text-accent-foreground border-accent',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

export default function DashboardPage() {
  const [greetingName, setGreetingName] = useState<string | null>(null)
  useEffect(() => {
    try {
      const authRaw = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null
      const profilesRaw = typeof window !== 'undefined' ? localStorage.getItem('profiles') : null
      const auth = authRaw ? JSON.parse(authRaw) as { id: string } : null
      const profiles: Array<{ id: string; full_name: string }> = profilesRaw ? JSON.parse(profilesRaw) : []
      const p = auth ? profiles.find((x) => x.id === auth.id) : null
      if (p?.full_name) setGreetingName(p.full_name)
    } catch {}
  }, [])
  const todayAppts: any[] = []
  const todayRevenue = 0
  const pending: any[] = []
  const upcomingAppts: any[] = []

  const stats = [
    {
      title: 'Bugünkü Gelir',
      value: `₺${todayRevenue.toLocaleString('tr-TR')}`,
      sub: `0 onaylı seans`,
      icon: TrendingUp,
      accent: 'text-primary',
      bg: 'bg-accent/60',
    },
    {
      title: "Bugünkü Randevular",
      value: String(todayAppts.length),
      sub: 'Toplam bugün',
      icon: Calendar,
      accent: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Bekleyen Onay',
      value: String(pending.length),
      sub: 'Onay bekliyor',
      icon: AlertCircle,
      accent: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      title: 'Toplam Danışan',
      value: String(0),
      sub: 'Aktif danışan',
      icon: Users,
      accent: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          {greetingName ? `Hoş Geldiniz, ${greetingName}` : 'Hoş Geldiniz'}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border border-border shadow-none">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
                    <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.sub}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`w-4.5 h-4.5 ${stat.accent}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Today's Appointments */}
      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 border border-border shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Bugünkü Randevular
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayAppts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Bugün randevu bulunmamaktadır.
              </div>
            ) : (
              todayAppts
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-8 rounded-full bg-primary shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {apt.clientName} {apt.clientSurname}
                        </p>
                        <p className="text-xs text-muted-foreground">{apt.clientEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground">{apt.time}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[apt.status]}`}
                      >
                        {statusLabel[apt.status]}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming */}
        <Card className="lg:col-span-2 border border-border shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Yaklaşan Randevular
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingAppts.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Yaklaşan randevu bulunmuyor.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
