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
  const envOk = hasSupabaseEnv()
  const supabase = envOk ? createSupabaseBrowser() : null
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { full_name: '', email: '', password: '', slug: '' } })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      if (!supabase) return
      const { error: slugErr, count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('slug', values.slug)
      if (!slugErr && (count ?? 0) > 0) {
        form.setError('slug', { message: 'Bu kullanıcı adı kullanımda' })
        return
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { full_name: values.full_name, slug: values.slug },
        },
      })
      if (signUpError) {
        form.setError('email', { message: signUpError.message })
        return
      }

      const user = signUpData.user
      if (user) {
        const { error: insErr } = await supabase.from('profiles').insert({
          id: user.id,
          full_name: values.full_name,
          slug: values.slug,
        })
        if (insErr) {
          form.setError('slug', { message: 'Kayıt sırasında bir hata oluştu' })
          return
        }
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
