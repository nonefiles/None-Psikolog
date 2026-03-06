'use client'

import { useEffect, useState } from 'react'
import { Bell, Mail, CheckCircle2, Loader2, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createSupabaseBrowser, hasSupabaseEnv } from '@/lib/supabase'

interface NotificationSettings {
  id: string
  psychologist_id: string
  appointment_confirmed: boolean
  appointment_reminder_24h: boolean
  appointment_reminder_1h: boolean
  case_shared: boolean
  colleague_request: boolean
  booking_received: boolean
  created_at: string
  updated_at: string
}

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load notification settings
  useEffect(() => {
    async function loadSettings() {
      if (!hasSupabaseEnv()) {
        setLoading(false)
        return
      }

      try {
        const supabase = createSupabaseBrowser()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        setUserId(user.id)

        // Load or create notification settings
        const { data: existingSettings } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('psychologist_id', user.id)
          .single()

        if (existingSettings) {
          setSettings(existingSettings)
        } else {
          // Create default settings
          const { data: newSettings } = await supabase
            .from('notification_settings')
            .insert([
              {
                psychologist_id: user.id,
                appointment_confirmed: true,
                appointment_reminder_24h: true,
                appointment_reminder_1h: true,
                case_shared: true,
                colleague_request: true,
                booking_received: true,
              },
            ])
            .select()
            .single()

          if (newSettings) {
            setSettings(newSettings)
          }
        }

        setLoading(false)
      } catch (err) {
        console.error('Failed to load settings:', err)
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  async function updateSetting(key: keyof NotificationSettings, value: boolean) {
    if (!settings || !userId) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createSupabaseBrowser()

      const updatedSettings = { ...settings, [key]: value }
      const { error: updateError } = await supabase
        .from('notification_settings')
        .update({ [key]: value })
        .eq('id', settings.id)

      if (updateError) {
        setError('Ayar güncellenemedi')
        return
      }

      setSettings(updatedSettings)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to update setting:', err)
      setError('Bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-muted-foreground">Ayarlar yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Bildirim Ayarları
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          E-mail bildirimlerini yönetin ve kişiselleştirin
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Ayarlar başarıyla kaydedildi
          </AlertDescription>
        </Alert>
      )}

      {settings && (
        <div className="space-y-6">
          {/* Appointment Notifications */}
          <Card className="border border-border shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Randevu Bildirimleri</CardTitle>
                  <CardDescription>
                    Randevularla ilgili e-mail bildirimleri alın
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Appointment Confirmed */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                <div>
                  <p className="text-sm font-medium text-foreground">Randevu Onaylandı</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Yeni randevu eklendiğinde bildirim al
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={settings.appointment_confirmed ? 'default' : 'outline'}
                  onClick={() =>
                    updateSetting('appointment_confirmed', !settings.appointment_confirmed)
                  }
                  disabled={saving}
                  className={
                    settings.appointment_confirmed ? 'gap-1' : ''
                  }
                >
                  {settings.appointment_confirmed && <Check className="w-3 h-3" />}
                  {settings.appointment_confirmed ? 'Açık' : 'Kapalı'}
                </Button>
              </div>

              {/* 24h Reminder */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                <div>
                  <p className="text-sm font-medium text-foreground">24 Saat Hatırlatıcı</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Randevudan 24 saat önce hatırlatıcı al
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={settings.appointment_reminder_24h ? 'default' : 'outline'}
                  onClick={() =>
                    updateSetting('appointment_reminder_24h', !settings.appointment_reminder_24h)
                  }
                  disabled={saving}
                  className={
                    settings.appointment_reminder_24h ? 'gap-1' : ''
                  }
                >
                  {settings.appointment_reminder_24h && <Check className="w-3 h-3" />}
                  {settings.appointment_reminder_24h ? 'Açık' : 'Kapalı'}
                </Button>
              </div>

              {/* 1h Reminder */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                <div>
                  <p className="text-sm font-medium text-foreground">1 Saat Hatırlatıcı</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Randevudan 1 saat önce hatırlatıcı al
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={settings.appointment_reminder_1h ? 'default' : 'outline'}
                  onClick={() =>
                    updateSetting('appointment_reminder_1h', !settings.appointment_reminder_1h)
                  }
                  disabled={saving}
                  className={
                    settings.appointment_reminder_1h ? 'gap-1' : ''
                  }
                >
                  {settings.appointment_reminder_1h && <Check className="w-3 h-3" />}
                  {settings.appointment_reminder_1h ? 'Açık' : 'Kapalı'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Case & Colleague Notifications */}
          <Card className="border border-border shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Vaka & Meslektaş Bildirimleri</CardTitle>
                  <CardDescription>Meslektaşlarla paylaşım ve istek bildirimleri</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Case Shared */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                <div>
                  <p className="text-sm font-medium text-foreground">Vaka Paylaşımı</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Bir vaka sizinle paylaşıldığında bildirim al
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={settings.case_shared ? 'default' : 'outline'}
                  onClick={() =>
                    updateSetting('case_shared', !settings.case_shared)
                  }
                  disabled={saving}
                  className={
                    settings.case_shared ? 'gap-1' : ''
                  }
                >
                  {settings.case_shared && <Check className="w-3 h-3" />}
                  {settings.case_shared ? 'Açık' : 'Kapalı'}
                </Button>
              </div>

              {/* Colleague Request */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                <div>
                  <p className="text-sm font-medium text-foreground">Meslektaş İsteği</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Yeni meslektaş isteği aldığınızda bildirim al
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={settings.colleague_request ? 'default' : 'outline'}
                  onClick={() =>
                    updateSetting('colleague_request', !settings.colleague_request)
                  }
                  disabled={saving}
                  className={
                    settings.colleague_request ? 'gap-1' : ''
                  }
                >
                  {settings.colleague_request && <Check className="w-3 h-3" />}
                  {settings.colleague_request ? 'Açık' : 'Kapalı'}
                </Button>
              </div>

              {/* Booking Received */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                <div>
                  <p className="text-sm font-medium text-foreground">Rezervasyon Alındı</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Yeni randevu talebinden haberdar ol
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={settings.booking_received ? 'default' : 'outline'}
                  onClick={() =>
                    updateSetting('booking_received', !settings.booking_received)
                  }
                  disabled={saving}
                  className={
                    settings.booking_received ? 'gap-1' : ''
                  }
                >
                  {settings.booking_received && <Check className="w-3 h-3" />}
                  {settings.booking_received ? 'Açık' : 'Kapalı'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border border-border shadow-none bg-blue-50/50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900">
                ℹ️ Bildirim e-postaları hesabınızla kaydedilen e-posta adresine gönderilecektir. Tüm
                bildirimleri kapatabilir veya belirli bildirimleri seçici olarak yönetebilirsiniz.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
