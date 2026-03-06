'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createSupabaseBrowser } from '@/lib/supabase'

const schema = z.object({
  full_name: z.string().min(2, 'Ad soyad en az 2 karakter olmalı').max(80),
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
  slug: z
    .string()
    .min(3, 'Kullanıcı adı en az 3 karakter olmalı')
    .max(30)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Yalnızca küçük harf, rakam ve tire kullanın'),
})

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { full_name: '', email: '', password: '', slug: '' } })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    setError(null)
    try {
      const supabase = createSupabaseBrowser()

      // Check if slug is already taken
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('slug', values.slug)
        .single()

      if (existingProfile) {
        form.setError('slug', { message: 'Bu kullanıcı adı kullanımda' })
        return
      }

      // Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          form.setError('email', { message: 'Bu e-posta zaten kayıtlı' })
        } else {
          setError(authError.message)
        }
        return
      }

      if (!authData.user) {
        setError('Hesap oluşturma başarısız oldu')
        return
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            full_name: values.full_name,
            slug: values.slug,
            role: 'psychologist',
            created_at: new Date().toISOString(),
          },
        ])

      if (profileError) {
        setError('Profil oluşturma başarısız: ' + profileError.message)
        return
      }

      // Redirect to login
      router.replace('/login?message=Hesap+başarıyla+oluşturuldu')
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
      console.error(err)
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

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Zaten hesabınız var mı? </span>
          <Link href="/login" className="text-primary hover:underline font-medium">
            Giriş Yap
          </Link>
        </div>
      </div>
    </div>
  )
}
