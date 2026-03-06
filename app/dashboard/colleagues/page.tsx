'use client'

import { useEffect, useState } from 'react'
import { Search, UserPlus, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createSupabaseBrowser, hasSupabaseEnv } from '@/lib/supabase'

interface Colleague {
  id: string
  full_name: string
  slug: string
  status: 'pending' | 'accepted' | 'blocked'
  is_requester: boolean
  connection_id: string
}

interface SearchResult {
  id: string
  full_name: string
  slug: string
}

export default function ColleaguesPage() {
  const [colleagues, setColleagues] = useState<Colleague[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Load current user and colleagues
  useEffect(() => {
    async function loadData() {
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

        // Load connections where user is requester or addressee
        const { data: connections } = await supabase
          .from('connections')
          .select(`
            id,
            requester_id,
            addressee_id,
            status,
            profiles:requester_id (id, full_name, slug),
            profiles_addressee:addressee_id (id, full_name, slug)
          `)
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

        if (connections) {
          const formattedColleagues: Colleague[] = connections.map((conn) => {
            const isRequester = conn.requester_id === user.id
            const profile = isRequester ? conn.profiles : conn.profiles_addressee
            return {
              id: profile.id,
              full_name: profile.full_name,
              slug: profile.slug,
              status: conn.status,
              is_requester: isRequester,
              connection_id: conn.id,
            }
          })
          setColleagues(formattedColleagues)
        }

        setLoading(false)
      } catch (err) {
        console.error('Failed to load colleagues:', err)
        setError('Meslektaşlar yüklenirken hata oluştu')
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Search for colleagues
  async function handleSearch(query: string) {
    setSearchQuery(query)
    if (!query.trim() || !userId) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const supabase = createSupabaseBrowser()

      // Search for profiles by name or slug, excluding current user
      const { data: results } = await supabase
        .from('profiles')
        .select('id, full_name, slug')
        .neq('id', userId)
        .or(`full_name.ilike.%${query}%,slug.ilike.%${query}%`)
        .limit(10)

      if (results) {
        // Filter out already connected colleagues
        const connectedIds = colleagues.map((c) => c.id)
        const filtered = results.filter((r) => !connectedIds.includes(r.id))
        setSearchResults(filtered)
      }
    } catch (err) {
      console.error('Search failed:', err)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  // Send connection request
  async function sendRequest(targetId: string) {
    if (!userId) return

    setActionLoading(targetId)
    try {
      const supabase = createSupabaseBrowser()

      const { error: insertError } = await supabase.from('connections').insert([
        {
          requester_id: userId,
          addressee_id: targetId,
          status: 'pending',
        },
      ])

      if (insertError) {
        setError('İstek gönderilemedi: ' + insertError.message)
        return
      }

      // Update local state
      const targetProfile = searchResults.find((r) => r.id === targetId)
      if (targetProfile) {
        setColleagues([
          ...colleagues,
          {
            id: targetId,
            full_name: targetProfile.full_name,
            slug: targetProfile.slug,
            status: 'pending',
            is_requester: true,
            connection_id: '', // Will be populated when confirmed
          },
        ])
        setSearchResults(searchResults.filter((r) => r.id !== targetId))
      }
    } catch (err) {
      console.error('Failed to send request:', err)
      setError('Bir hata oluştu')
    } finally {
      setActionLoading(null)
    }
  }

  // Accept connection request
  async function acceptRequest(connectionId: string) {
    setActionLoading(connectionId)
    try {
      const supabase = createSupabaseBrowser()

      const { error: updateError } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId)

      if (updateError) {
        setError('İstek kabul edilemedi')
        return
      }

      // Update local state
      setColleagues(
        colleagues.map((c) =>
          c.connection_id === connectionId ? { ...c, status: 'accepted' } : c,
        ),
      )
    } catch (err) {
      console.error('Failed to accept request:', err)
      setError('Bir hata oluştu')
    } finally {
      setActionLoading(null)
    }
  }

  // Reject or remove connection
  async function removeConnection(connectionId: string) {
    setActionLoading(connectionId)
    try {
      const supabase = createSupabaseBrowser()

      const { error: deleteError } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId)

      if (deleteError) {
        setError('Bağlantı silinemedi')
        return
      }

      // Update local state
      setColleagues(colleagues.filter((c) => c.connection_id !== connectionId))
    } catch (err) {
      console.error('Failed to remove connection:', err)
      setError('Bir hata oluştu')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Filter colleagues by status
  const acceptedColleagues = colleagues.filter((c) => c.status === 'accepted')
  const pendingColleagues = colleagues.filter((c) => c.status === 'pending')
  const receivedRequests = pendingColleagues.filter((c) => !c.is_requester)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Meslektaşlar</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Diğer psikologlarla bağlantı kurun ve vakaları paylaşın
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search Section */}
      <Card className="border border-border shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            Yeni Meslektaş Ekle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ad, soyad veya kullanıcı adı ile ara..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {searching && (
            <div className="text-center py-4">
              <Loader2 className="w-4 h-4 animate-spin mx-auto text-primary" />
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{result.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{result.slug}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => sendRequest(result.id)}
                    disabled={actionLoading === result.id}
                  >
                    {actionLoading === result.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3 mr-1" />
                        Ekle
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Received Requests */}
      {receivedRequests.length > 0 && (
        <Card className="border border-border shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              Bağlantı İstekleri ({receivedRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {receivedRequests.map((colleague) => (
              <div
                key={colleague.connection_id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{colleague.full_name}</p>
                  <p className="text-xs text-muted-foreground">@{colleague.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => acceptRequest(colleague.connection_id)}
                    disabled={actionLoading === colleague.connection_id}
                  >
                    {actionLoading === colleague.connection_id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Kabul Et
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeConnection(colleague.connection_id)}
                    disabled={actionLoading === colleague.connection_id}
                  >
                    <XCircle className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pending Requests Sent */}
      {pendingColleagues.filter((c) => c.is_requester).length > 0 && (
        <Card className="border border-border shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              Gönderilen İstekler ({pendingColleagues.filter((c) => c.is_requester).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingColleagues
              .filter((c) => c.is_requester)
              .map((colleague) => (
                <div
                  key={colleague.connection_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{colleague.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{colleague.slug}</p>
                  </div>
                  <Badge variant="outline" className="text-yellow-700 border-yellow-200">
                    <Clock className="w-3 h-3 mr-1" />
                    Bekleniyor
                  </Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Accepted Colleagues */}
      {acceptedColleagues.length > 0 && (
        <Card className="border border-border shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Bağlı Meslektaşlar ({acceptedColleagues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {acceptedColleagues.map((colleague) => (
              <div
                key={colleague.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{colleague.full_name}</p>
                  <p className="text-xs text-muted-foreground">@{colleague.slug}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeConnection(colleague.connection_id)}
                  disabled={actionLoading === colleague.connection_id}
                >
                  {actionLoading === colleague.connection_id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" />
                      Çıkar
                    </>
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {colleagues.length === 0 && searchResults.length === 0 && (
        <Card className="border border-border shadow-none">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Henüz meslektaş eklemediniz</p>
            <p className="text-xs text-muted-foreground mt-1">
              Arama yaparak meslektaşlarınızı bulun ve vakaları paylaşmaya başlayın
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
