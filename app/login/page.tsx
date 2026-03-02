'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const profilesRaw = typeof window !== 'undefined' ? localStorage.getItem('profiles') : null
      const profiles: Array<{ id: string; email: string; password: string }> = profilesRaw ? JSON.parse(profilesRaw) : []
      const found = profiles.find(
        (p) => p.email.toLowerCase() === values.email.toLowerCase() && p.password === values.password,
      )
      if (!found) {
        form.setError('email', { message: 'Giriş başarısız. Bilgilerinizi kontrol edin.' })
        return
      }
      localStorage.setItem('auth_user', JSON.stringify({ id: found.id, email: found.email }))
      router.replace('/dashboard')
    } finally {
      setLoading(false)
    }
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
