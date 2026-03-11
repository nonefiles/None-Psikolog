'use client'
// components/panel/Sidebar.tsx

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, CalendarDays, Users, Archive,
  Link2, FlaskConical, BookOpen, BarChart3, LogOut,
  Menu, X
} from 'lucide-react'

interface Props {
  profile: { full_name: string; title: string; slug: string }
}

const nav = [
  { label: 'Genel', items: [
    { href: '/panel',          icon: LayoutDashboard, label: 'Gösterge' },
    { href: '/panel/calendar', icon: CalendarDays,    label: 'Takvim' },
  ]},
  { label: 'Danışanlar', items: [
    { href: '/panel/clients',  icon: Users,    label: 'Danışanlar' },
    { href: '/panel/archive',  icon: Archive,  label: 'Arşiv' },
  ]},
  { label: 'Araçlar', items: [
    { href: '/panel/links',    icon: Link2,        label: 'Link Gönder' },
    { href: '/panel/tests',    icon: FlaskConical, label: 'Testler' },
    { href: '/panel/homework', icon: BookOpen,     label: 'Ödevler' },
  ]},
  { label: 'Finans', items: [
    { href: '/panel/finance', icon: BarChart3, label: 'Muhasebe' },
  ]},
]

export default function Sidebar({ profile }: Props) {
  const path = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)

  async function logout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const initials = profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-sage text-white rounded-lg shadow-lg hover:bg-sage-dark transition-colors"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-60 bg-charcoal text-white fixed top-0 left-0 h-screen flex flex-col z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <h1 className="font-serif text-xl text-white">PsikoPanel</h1>
        <p className="text-white/35 text-[11px] mt-0.5">Pratik Yönetim</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {nav.map(section => (
          <div key={section.label}>
            <p className="px-6 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/25">
              {section.label}
            </p>
            {section.items.map(({ href, icon: Icon, label }) => {
              const active = href === '/panel' ? path === href : path.startsWith(href)
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-2.5 px-6 py-2.5 text-[13px] transition-all
                    ${active
                      ? 'text-white bg-white/10 border-l-2 border-sage-l pl-[22px]'
                      : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent pl-[22px]'}`}>
                  <Icon size={15} />
                  {label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-5 py-4 border-t border-white/10">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-sage flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-white text-xs font-medium leading-tight">{profile.full_name}</p>
            <p className="text-white/35 text-[11px]">{profile.title}</p>
          </div>
        </div>
        <button onClick={logout}
          className="flex items-center gap-2 text-white/40 hover:text-white/70 text-xs transition-colors w-full">
          <LogOut size={13} />
          Çıkış Yap
        </button>
      </div>
      </aside>
    </>
  )
}
