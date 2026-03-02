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
  full_name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6),
  slug: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Yalnızca küçük harf, rakam ve tire kullanın'),
})

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { full_name: '', email: '', password: '', slug: '' } })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const profilesRaw = typeof window !== 'undefined' ? localStorage.getItem('profiles') : null
      const profiles: Array<{ id: string; full_name: string; email: string; password: string; slug: string; created_at: string }> =
        profilesRaw ? JSON.parse(profilesRaw) : []
      const slugTaken = profiles.some((p) => p.slug === values.slug)
      if (slugTaken) {
        form.setError('slug', { message: 'Bu kullanıcı adı kullanımda' })
        return
      }
      const emailTaken = profiles.some((p) => p.email.toLowerCase() === values.email.toLowerCase())
      if (emailTaken) {
        form.setError('email', { message: 'Bu e-posta kullanımda' })
        return
      }
      const id = (globalThis.crypto && 'randomUUID' in globalThis.crypto ? crypto.randomUUID() : `user_${Date.now()}`)
      const profile = {
        id,
        full_name: values.full_name,
        email: values.email,
        password: values.password,
        slug: values.slug,
        created_at: new Date().toISOString(),
      }
      const next = [...profiles, profile]
      localStorage.setItem('profiles', JSON.stringify(next))
      router.replace('/login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 border border-border rounded-xl p-6 bg-card">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">Hesap Oluştur</h1>
          <p className="text-sm text-muted-foreground">Randevularınızı yönetmek için hesabınızı oluşturun</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad Soyad</FormLabel>
                  <FormControl>
                    <Input placeholder="Ad Soyad" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kullanıcı Adı / URL Uzantısı</FormLabel>
                  <FormControl>
                    <Input placeholder="ornek: ayse-yilmaz" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Profil adresiniz: siteadi.com/{field.value || 'kullanici-adi'}</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Kayıt olunuyor...' : 'Kayıt Ol'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
