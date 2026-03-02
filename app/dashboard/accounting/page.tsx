'use client'

type Transaction = {
  id: string
  type: 'income' | 'expense'
  description: string
  amount: number
  date: string
  category: string
}
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
  const [transactions] = useState<Transaction[]>([])
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
        <div />
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

      {/* Empty Chart State */}
      <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
        Henüz işlem bulunmuyor.
      </div>

      {/* Empty Table State */}
      <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
        Kayıtlı işlem yok.
      </div>
    </div>
  )
}
