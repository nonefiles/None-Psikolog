// app/panel/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format, startOfDay, endOfDay } from 'date-fns'
import { tr } from 'date-fns/locale'
import DashboardClient from '@/components/panel/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = new Date()

  // Paralel sorgular
  const [
    { count: totalClients },
    { count: pendingAppts },
    { data: todayAppts },
    { data: monthAppts },
    { data: recentMonth },
    { data: ownTests },
    { data: ownHw },
    { data: clients },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('psychologist_id', user.id).eq('status', 'active'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('psychologist_id', user.id).eq('status', 'pending'),
    supabase.from('appointments').select('*, client:clients(full_name)').eq('psychologist_id', user.id)
      .gte('starts_at', startOfDay(today).toISOString())
      .lte('starts_at', endOfDay(today).toISOString())
      .order('starts_at'),
supabase.from('appointments').select('*, client:clients(full_name)').eq('psychologist_id', user.id)
      .gte('starts_at', format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd'))
      .lte('starts_at', format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd')),
    supabase.from('finance_entries').select('type, amount').eq('psychologist_id', user.id)
      .gte('entry_date', format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd')),
    supabase.from('tests').select('id, title, slug').eq('psychologist_id', user.id),
    supabase.from('homework').select('id, title, slug').eq('psychologist_id', user.id),
    supabase.from('clients').select('id, full_name, created_at, status').eq('psychologist_id', user.id).order('full_name'),
  ])

  const income  = recentMonth?.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0) ?? 0
  const expense = recentMonth?.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0) ?? 0

  // Arşiv verileri için id'leri al
  const testIds = (ownTests ?? []).map(t => t.id)
  const hwIds   = (ownHw   ?? []).map(h => h.id)

  // Test ve ödev yanıtlarını al
  const [
    { data: testResponses }, 
    { data: hwResponses }
  ] = await Promise.all([
    testIds.length > 0
      ? supabase.from('test_responses').select('*').in('test_id', testIds).order('completed_at', { ascending: false }).limit(10)
      : Promise.resolve({ data: [] }),
    hwIds.length > 0
      ? supabase.from('homework_responses').select('*').in('homework_id', hwIds).order('completed_at', { ascending: false }).limit(10)
      : Promise.resolve({ data: [] }),
  ])

  // Title lookup maps
  const testMap  = Object.fromEntries((ownTests  ?? []).map(t => [t.id, t.title]))
  const hwMap    = Object.fromEntries((ownHw     ?? []).map(h => [h.id, h.title]))

  return (
    <>
      <header className="bg-white border-b border-border px-4 md:px-8 py-4 sticky top-0 z-40">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h2 className="font-serif text-xl md:text-2xl md:pl-12">Gösterge Paneli</h2>
          <span className="text-sm text-muted">{format(today, 'd MMMM yyyy, EEEE', { locale: tr })}</span>
        </div>
      </header>

      <DashboardClient 
        todayAppts={todayAppts ?? []}
        monthAppts={monthAppts ?? []}
        totalClients={totalClients ?? 0}
        pendingAppts={pendingAppts ?? 0}
        income={income}
        expense={expense}
        today={today}
        testResponses={testResponses ?? []}
        homeworkResponses={hwResponses ?? []}
        clients={clients ?? []}
        testTitles={testMap}
        homeworkTitles={hwMap}
      />
    </>
  )
}
