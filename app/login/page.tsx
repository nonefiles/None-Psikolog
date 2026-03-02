'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createSupabaseBrowser, hasSupabaseEnv } from '@/lib/supabase'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const envOk = hasSupabaseEnv()
  const supabase = envOk ? createSupabaseBrowser() : null
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      if (!supabase) return
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })
      if (error) {
        form.setError('email', { message: 'Giriş başarısız. Bilgilerinizi kontrol edin.' })
        return
      }
      router.replace('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (!envOk) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-3 border border-border rounded-xl p-6 bg-card text-center">
          <h1 className="text-lg font-semibold text-foreground">Yapılandırma Gerekli</h1>
          <p className="text-sm text-muted-foreground">
            Supabase anahtarları ayarlanmadı. Lütfen .env.local dosyasına
            NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY değerlerini ekleyin.
          </p>
          <p className="text-xs text-muted-foreground">Supabase Proje → Settings → API sayfasından alınır.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 border border-border rounded-xl p-6 bg-card">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">Giriş Yap</h1>
          <p className="text-sm text-muted-foreground">Hesabınıza e-posta ve şifre ile giriş yapın</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-posta</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="ornek@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şifre</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
