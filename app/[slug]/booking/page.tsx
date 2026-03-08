// app/[slug]/booking/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BookingForm from '@/components/client/BookingForm'
import type { PublicProfile } from '@/lib/types'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('full_name, title')
    .eq('slug', params.slug)
    .single()
  if (!data) return { title: 'PsikoPanel' }
  return { title: `${data.full_name} — Randevu Al` }
}

export default async function BookingPage({ params }: Props) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, slug, full_name, title, bio, session_types, session_price, avatar_url')
    .eq('slug', params.slug)
    .single()

  if (!profile) notFound()

  return (
    <main className="min-h-screen bg-gradient-to-br from-sage-pale via-cream to-accent-l flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="bg-sage rounded-t-2xl px-8 py-8 text-white text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl mx-auto mb-4">
            🌿
          </div>
          <h1 className="font-serif text-2xl">{profile.full_name}</h1>
          <p className="text-sm opacity-75 mt-1">{profile.title}</p>
          <p className="text-xs font-mono opacity-50 mt-2">
            psikopanel.tr/{profile.slug}/booking
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-b-2xl shadow-lg px-8 py-8">
          <BookingForm profile={profile as PublicProfile} />
        </div>

        <p className="text-center text-xs text-muted mt-4">
          Üye olmak gerekmez · Bilgileriniz gizli tutulur
        </p>
      </div>
    </main>
  )
}
