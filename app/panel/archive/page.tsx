// app/panel/archive/page.tsx
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Folder, 
  FileText, 
  File, 
  Link as LinkIcon, 
  Users, 
  UploadCloud, 
  MoreVertical, 
  Search,
  ChevronRight,
  FileQuestion,
  BookOpen
} from 'lucide-react'

// Arama parametrelerini Next.js 14/15 uyumlu almak için (Opsiyonel klasör içi görünüm için altyapı)
type Props = {
  searchParams?: Promise<{ folder?: string }> | { folder?: string }
}

export default async function ArchivePage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Gelen parametreyi çözümle
  const resolvedSearchParams = await searchParams
  const currentFolder = resolvedSearchParams?.folder || null

  // 1. Psikologun test, ödev ve danışan verilerini al
  const [{ data: ownTests }, { data: ownHw }, { data: clients }] = await Promise.all([
    supabase.from('tests').select('id, title, slug').eq('psychologist_id', user.id),
    supabase.from('homework').select('id, title, slug').eq('psychologist_id', user.id),
    supabase.from('clients').select('id, full_name, created_at, status').eq('psychologist_id', user.id).order('full_name'),
  ])

  const testIds = (ownTests ?? []).map(t => t.id)
  const hwIds   = (ownHw   ?? []).map(h => h.id)

  // 2. Bu id'lere ait yanıtları al
  const [{ data: testResponses }, { data: hwResponses }] = await Promise.all([
    testIds.length > 0
      ? supabase.from('test_responses').select('*').in('test_id', testIds).order('completed_at', { ascending: false }).limit(50)
      : Promise.resolve({ data: [] }),
    hwIds.length > 0
      ? supabase.from('homework_responses').select('*').in('homework_id', hwIds).order('completed_at', { ascending: false }).limit(50)
      : Promise.resolve({ data: [] }),
  ])

  // 3. Title lookup map
  const testMap  = Object.fromEntries((ownTests  ?? []).map(t => [t.id, t.title]))
  const hwMap    = Object.fromEntries((ownHw     ?? []).map(h => [h.id, h.title]))

  // 4. Bütün dosyaları tek bir "Bulut Dosya" formatında birleştir ve tarihe göre sırala
  const allFiles = [
    ...(testResponses ?? []).map(r => ({
      id: `test-${r.id}`,
      type: 'test',
      title: `${testMap[r.test_id] ?? 'Test'} Sonucu`,
      respondent: r.respondent_name ?? 'Anonim',
      date: r.completed_at,
      score: r.total_score,
      icon: FileQuestion,
      color: 'text-sage-600',
      bg: 'bg-sage-100'
    })),
    ...(hwResponses ?? []).map(r => ({
      id: `hw-${r.id}`,
      type: 'homework',
      title: `${hwMap[r.homework_id] ?? 'Ödev'} Yanıtı`,
      respondent: r.respondent_name ?? 'Anonim',
      date: r.completed_at,
      score: null,
      icon: BookOpen,
      color: 'text-orange-600',
      bg: 'bg-orange-100'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // İleride veritabanından çekilecek mock değerler
  const pdfCount = 0 
  const urlCount = 0

  // Klasör Verileri
  const folders = [
    { id: 'clients', name: 'Danışan Dosyaları', count: clients?.length ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: 'tests', name: 'Test Sonuçları', count: testResponses?.length ?? 0, icon: FileQuestion, color: 'text-sage-600', bg: 'bg-sage-100' },
    { id: 'homework', name: 'Ödev Yanıtları', count: hwResponses?.length ?? 0, icon: BookOpen, color: 'text-orange-600', bg: 'bg-orange-100' },
    { id: 'pdfs', name: 'PDF Dökümanlar', count: pdfCount, icon: File, color: 'text-red-500', bg: 'bg-red-100' },
    { id: 'urls', name: 'Bağlantılar / URL', count: urlCount, icon: LinkIcon, color: 'text-purple-600', bg: 'bg-purple-100' },
  ]

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header - Drive Tarzı */}
      <header className="bg-white border-b border-border px-8 py-4 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/panel/archive" className="font-serif text-xl hover:text-sage-700 transition-colors">
            Bulut Arşiv
          </Link>
          {currentFolder && (
            <>
              <ChevronRight className="w-5 h-5 text-muted" />
              <span className="font-medium text-foreground">
                {folders.find(f => f.id === currentFolder)?.name}
              </span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              placeholder="Arşivde ara..." 
              className="pl-9 pr-4 py-2 bg-cream/50 border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent w-64 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 bg-sage-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-sage-700 transition-colors shadow-sm">
            <UploadCloud className="w-4 h-4" />
            Yeni Yükle
          </button>
        </div>
      </header>

      <div className="p-8 max-w-7xl mx-auto space-y-10">
        
        {/* Sürükle-Bırak Dosya Yükleme Alanı */}
        <section>
          <div className="relative group flex flex-col items-center justify-center w-full p-10 border-2 border-dashed border-sage-300 rounded-2xl bg-white hover:bg-sage-50 hover:border-sage-400 transition-all cursor-pointer shadow-sm">
            {/* Gizli File Input: 'absolute inset-0' ve 'opacity-0' ile bu div'in tamamını kaplar.
              Böylece kullanıcı bu alana dosya sürüklediğinde veya tıkladığında native tarayıcı özelliği tetiklenir.
            */}
            <input 
              type="file" 
              multiple 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              title="Dosya seçmek için tıklayın veya sürükleyin"
            />
            
            <div className="flex flex-col items-center text-center space-y-3 pointer-events-none">
              <div className="p-4 bg-sage-100 text-sage-600 rounded-full group-hover:scale-110 group-hover:bg-sage-200 transition-all duration-300">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-foreground">
                  Dosyaları buraya sürükleyip bırakın
                </h4>
                <p className="text-sm text-muted mt-1">
                  veya gözatmak için <span className="text-sage-600 font-medium">tıklayın</span>
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                <span className="bg-cream px-2 py-1 rounded-md">PDF</span>
                <span className="bg-cream px-2 py-1 rounded-md">DOCX</span>
                <span className="bg-cream px-2 py-1 rounded-md">JPG</span>
                <span className="bg-cream px-2 py-1 rounded-md">PNG</span>
                <span className="ml-2 border-l border-border pl-2">Maks: 10MB</span>
              </div>
            </div>
          </div>
        </section>

        {/* Klasörler Grid */}
        {!currentFolder && (
          <section>
            <h3 className="text-sm font-semibold text-muted mb-4 uppercase tracking-wider">Klasörlerim</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {folders.map(folder => {
                const Icon = folder.icon
                return (
                  <Link 
                    key={folder.id} 
                    href={`/panel/archive?folder=${folder.id}`}
                    className="bg-white p-5 rounded-2xl border border-border hover:border-sage-400 hover:shadow-md transition-all group flex flex-col gap-3 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-xl ${folder.bg}`}>
                        <Icon className={`w-6 h-6 ${folder.color}`} />
                      </div>
                      <MoreVertical className="w-5 h-5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground group-hover:text-sage-700 transition-colors">{folder.name}</h4>
                      <p className="text-xs text-muted mt-1">{folder.count} öğe</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* İçerik Görünümü (Son Dosyalar veya Klasör İçi) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">
              {currentFolder ? 'Klasör İçeriği' : 'Hızlı Erişim / Son İşlemler'}
            </h3>
          </div>

          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            {allFiles.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <Folder className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h4 className="text-lg font-medium">Burası şimdilik boş</h4>
                <p className="text-sm text-muted mt-1">Arşivinizde henüz hiç dosya veya yanıt bulunmuyor.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-cream/30">
                      <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Adı</th>
                      <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">İlgili Kişi</th>
                      <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Tarih</th>
                      <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Skor/Durum</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {allFiles.map(file => {
                      const FileIcon = file.icon
                      return (
                        <tr key={file.id} className="hover:bg-cream/40 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${file.bg}`}>
                                <FileIcon className={`w-4 h-4 ${file.color}`} />
                              </div>
                              <span className="font-medium text-sm text-foreground">{file.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted">
                            {file.respondent}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted">
                            {format(new Date(file.date), 'd MMM yyyy, HH:mm', { locale: tr })}
                          </td>
                          <td className="px-6 py-4">
                            {file.type === 'test' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sage-100 text-sage-800">
                                {file.score !== null ? `${file.score} Puan` : 'Hesaplanmadı'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Tamamlandı
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-muted hover:text-sage-600 transition-colors opacity-0 group-hover:opacity-100 p-1">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}