// app/panel/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/panel/Sidebar'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, title, slug')
    .eq('id', user.id)
    .single()

  // Profil yoksa login sayfasına yönlendir
  if (!profile) redirect('/auth/login')

  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile} />
      <div className="ml-60 flex-1 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  )
}
