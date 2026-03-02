'use client'

import { mockTransactions, Transaction } from '@/lib/mock-data'
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const categoryColors: Record<string, string> = {
  'Seans Ücreti': 'text-green-600 bg-green-50',
  'Kira': 'text-red-600 bg-red-50',
  'Gider': 'text-orange-600 bg-orange-50',
  'Eğitim': 'text-blue-600 bg-blue-50',
}

// Build chart data from transactions
function buildChartData(transactions: Transaction[]) {
  const byDate: Record<string, { income: number; expense: number }> = {}
  transactions.forEach((t) => {
    if (!byDate[t.date]) byDate[t.date] = { income: 0, expense: 0 }
    if (t.type === 'income') byDate[t.date].income += t.amount
    else byDate[t.date].expense += t.amount
  })
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      date: new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
      Gelir: vals.income,
      Gider: vals.expense,
    }))
}

export default function AccountingPage() {
  const [transactions] = useState<Transaction[]>(mockTransactions)
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense

  const filtered = transactions
    .filter((t) => filter === 'all' || t.type === filter)
    .sort((a, b) => b.date.localeCompare(a.date))

  const chartData = buildChartData(transactions)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Muhasebe</h1>
          <p className="text-muted-foreground mt-1 text-sm">Gelir ve giderlerinizi takip edin</p>
        </div>
        <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          İşlem Ekle
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Toplam Bakiye</p>
              <p className={cn('text-2xl font-semibold mt-1', balance >= 0 ? 'text-foreground' : 'text-destructive')}>
                ₺{balance.toLocaleString('tr-TR')}
              </p>
            </div>
            <div className="w-10 h-10 bg-accent/60 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Toplam Gelir</p>
              <p className="text-2xl font-semibold mt-1 text-green-600">
                ₺{totalIncome.toLocaleString('tr-TR')}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Toplam Gider</p>
              <p className="text-2xl font-semibold mt-1 text-red-500">
                ₺{totalExpense.toLocaleString('tr-TR')}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Gelir / Gider Grafiği</h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGelir" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.52 0.12 175)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="oklch(0.52 0.12 175)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorGider" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`₺${value.toLocaleString('tr-TR')}`, '']}
              />
              <Area type="monotone" dataKey="Gelir" stroke="oklch(0.52 0.12 175)" strokeWidth={2} fill="url(#colorGelir)" />
              <Area type="monotone" dataKey="Gider" stroke="#ef4444" strokeWidth={2} fill="url(#colorGider)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-3 border-b border-border">
          {(['all', 'income', 'expense'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                filter === f
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {f === 'all' ? 'Tümü' : f === 'income' ? 'Gelirler' : 'Giderler'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Açıklama</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Kategori</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Tarih</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                        t.type === 'income' ? 'bg-green-50' : 'bg-red-50'
                      )}>
                        {t.type === 'income' ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                        )}
                      </div>
                      <span className="text-sm text-foreground">{t.description}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      categoryColors[t.category] ?? 'text-muted-foreground bg-muted'
                    )}>
                      {t.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {new Date(t.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className={cn(
                    'py-3 px-4 text-sm font-semibold text-right',
                    t.type === 'income' ? 'text-green-600' : 'text-red-500'
                  )}>
                    {t.type === 'income' ? '+' : '-'}₺{t.amount.toLocaleString('tr-TR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
