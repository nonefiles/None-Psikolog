'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardList,
  Receipt,
  Menu,
  X,
  Brain,
  ExternalLink,
  Network,
  Bell,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'Ana Sayfa', icon: LayoutDashboard },
  { href: '/dashboard/calendar', label: 'Takvim', icon: CalendarDays },
  { href: '/dashboard/clients', label: 'Danışan Arşivi', icon: Users },
  { href: '/dashboard/colleagues', label: 'Meslektaşlar', icon: Network },
  { href: '/dashboard/tests', label: 'Test & Ödevler', icon: ClipboardList },
  { href: '/dashboard/accounting', label: 'Muhasebe', icon: Receipt },
  // settings links
  { href: '/dashboard/settings/schedule', label: 'Mesai Saatleri', icon: CalendarDays },
  { href: '/dashboard/settings/notifications', label: 'Bildirimler', icon: Bell },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()
  const envOk = hasSupabaseEnv()
  const [fullName, setFullName] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)

  // Fetch profile from Supabase
  useEffect(() => {
    async function loadProfile() {
      if (!envOk) return
      
      try {
        const supabase = createSupabaseBrowser()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, slug')
          .eq('id', user.id)
          .single()

        if (profile) {
          setFullName(profile.full_name)
          setSlug(profile.slug)
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
      }
    }

    loadProfile()
  }, [envOk])

  const NavContent = () => (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Brain className="w-4.5 h-4.5 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sidebar-foreground text-base tracking-tight">PsikoRandevu</span>
      </div>

      {/* Nav Links */}
      <div className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <Link
          href={slug ? `/${slug}/booking` : '/login'}
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          Randevu Sayfam
        </Link>
        <div className="mt-3 px-3 py-2.5">
          <p className="text-xs font-medium text-foreground">{fullName ?? 'Profil'}</p>
          <p className="text-xs text-muted-foreground">{slug ? `/${slug}/booking` : 'Kullanıcı adı ayarlanmadı'}</p>
        </div>
        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={async () => {
            if (envOk) {
              const supabase = createSupabaseBrowser()
              await supabase.auth.signOut()
            }
            router.replace('/login')
          }}
        >
          Çıkış Yap
        </Button>
      </div>
    </nav>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
        <NavContent />
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm text-sidebar-foreground">PsikoRandevu</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div
            className="absolute inset-0 bg-foreground/20"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-sidebar h-full shadow-xl">
            <NavContent />
          </aside>
        </div>
      )}
    </>
  )
}
