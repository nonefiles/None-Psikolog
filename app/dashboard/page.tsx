'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Clock, Users, CheckCircle2, AlertCircle, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { hasSupabaseEnv } from '@/lib/supabase'

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

interface Appointment {
  id: string
  start_at: string
  end_at: string
  status: string
  guest_name: string
  guest_email: string
}

interface Transaction {
  id: string
  amount: number
  type: string
  occurred_on: string
}

export default function DashboardPage() {
  const [greetingName, setGreetingName] = useState<string | null>(null)
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([])
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [pending, setPending] = useState<Appointment[]>([])
  const [upcomingAppts, setUpcomingAppts] = useState<Appointment[]>([])
  const [clientCount, setClientCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
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

        // Load profile name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        if (profile?.full_name) {
          setGreetingName(profile.full_name)
        }

        // Get today's date range
        const today = new Date()
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

        // Load today's appointments
        const { data: appointments } = await supabase
          .from('appointments')
          .select('*')
          .eq('psychologist_id', user.id)
          .gte('start_at', startOfDay.toISOString())
          .lt('start_at', endOfDay.toISOString())
          .order('start_at', { ascending: true })

        if (appointments) {
          setTodayAppts(appointments)
          const pendingAppts = appointments.filter((a) => a.status === 'pending')
          setPending(pendingAppts)
        }

        // Load today's revenue (confirmed/completed appointments)
        if (appointments) {
          const revenue = appointments
            .filter((a) => a.status === 'confirmed' || a.status === 'completed')
            .reduce((sum) => sum + 100, 0) // Placeholder: assume 100 per session
          setTodayRevenue(revenue)
        }

        // Load upcoming appointments (next 7 days)
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        const { data: upcoming } = await supabase
          .from('appointments')
          .select('*')
          .eq('psychologist_id', user.id)
          .gte('start_at', endOfDay.toISOString())
          .lt('start_at', nextWeek.toISOString())
          .order('start_at', { ascending: true })
          .limit(5)

        if (upcoming) {
          setUpcomingAppts(upcoming)
        }

        // Load client count
        const { count } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('psychologist_id', user.id)

        if (count !== null) {
          setClientCount(count)
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const confirmedCount = todayAppts.filter(
    (a) => a.status === 'confirmed' || a.status === 'completed',
  ).length

  const stats = [
    {
      title: 'Bugünkü Gelir',
      value: `₺${todayRevenue.toLocaleString('tr-TR')}`,
      sub: `${confirmedCount} onaylı seans`,
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
      value: String(clientCount),
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
              todayAppts.map((apt) => {
                const startTime = new Date(apt.start_at)
                const timeStr = startTime.toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                return (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-8 rounded-full bg-primary shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {apt.guest_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{apt.guest_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground">{timeStr}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                          statusColor[apt.status] || 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {statusLabel[apt.status] || apt.status}
                      </span>
                    </div>
                  </div>
                )
              })
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
