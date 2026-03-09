// app/panel/archive/page.tsx
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Folder, FileText, File, Users, UploadCloud, 
  MoreVertical, Search, ChevronRight, FileQuestion, BookOpen,
  ArrowLeft, LayoutGrid, Tag, Image as ImageIcon, FileSpreadsheet
} from 'lucide-react'
import ArchiveUploader from '@/components/panel/ArchiveUploader'
import FileActions from '@/components/panel/FileActions'

type Props = {
  searchParams?: Promise<{ folder?: string, search?: string }> | { folder?: string, search?: string }
}

type ArchiveItem = {
  id: string;
  originalId: string;
  type: 'document' | 'test' | 'homework';
  title: string;
  respondent: string;
  date: string;
  score: number | null;
  icon: any;
  color: string;
  bg: string;
  storage_path?: string;
  category?: string; // Yeni alan
  notes?: string;    // Yeni alan
}

export default async function ArchivePage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const resolvedSearchParams = await searchParams
  const currentFolder = resolvedSearchParams?.folder || null
  const searchQuery = resolvedSearchParams?.search?.toLowerCase() || ''

  const [{ data: ownTests }, { data: ownHw }, { data: clients }, { data: files }] = await Promise.all([
    supabase.from('tests').select('id, title, slug').eq('psychologist_id', user.id),
    supabase.from('homework').select('id, title, slug').eq('psychologist_id', user.id),
    supabase.from('clients').select('id, full_name, created_at, status').eq('psychologist_id', user.id).order('full_name'),
    supabase.from('files').select('*').eq('psychologist_id', user.id).order('created_at', { ascending: false }),
  ])

  const testIds = (ownTests ?? []).map(t => t.id)
  const hwIds   = (ownHw   ?? []).map(h => h.id)

  const [{ data: testResponses }, { data: hwResponses }] = await Promise.all([
    testIds.length > 0 ? supabase.from('test_responses').select('*').in('test_id', testIds).order('completed_at', { ascending: false }) : Promise.resolve({ data: [] }),
    hwIds.length > 0 ? supabase.from('homework_responses').select('*').in('homework_id', hwIds).order('completed_at', { ascending: false }) : Promise.resolve({ data: [] }),
  ])

  const testMap  = Object.fromEntries((ownTests  ?? []).map(t => [t.id, t.title]))
  const hwMap    = Object.fromEntries((ownHw     ?? []).map(h => [h.id, h.title]))

  // Dosya İkonunu Belirleme Fonksiyonu
  const getFileIcon = (category: string) => {
    if (category === 'PDF Dökümanlar') return File
    if (category === 'Görseller') return ImageIcon
    if (category === 'Tablolar') return FileSpreadsheet
    return FileText
  }

  const allFiles: ArchiveItem[] = [
    ...(files ?? []).map(f => ({
      id: `file-${f.id}`,
      originalId: f.id,
      type: 'document' as const,
      title: f.file_name,
      respondent: 'Kişisel Yükleme',
      date: f.created_at,
      score: null,
      icon: getFileIcon(f.category || 'Diğer Dökümanlar'),
      color: f.category === 'PDF Dökümanlar' ? 'text-red-600' : 'text-blue-600',
      bg: f.category === 'PDF Dökümanlar' ? 'bg-red-100' : 'bg-blue-100',
      storage_path: f.storage_path,
      category: f.category || 'Diğer Dökümanlar',
      notes: f.notes
    })),
    ...(testResponses ?? []).map(r => ({
      id: `test-${r.id}`,
      originalId: r.id,
      type: 'test' as const,
      title: `${testMap[r.test_id] ?? 'Test'} Sonucu`,
      respondent: r.respondent_name ?? 'Anonim',
      date: r.completed_at,
      score: r.total_score,
      icon: FileQuestion,
      color: 'text-sage-600',
      bg: 'bg-sage-100',
      category: 'Test Sonuçları'
    })),
    ...(hwResponses ?? []).map(r => ({
      id: `hw-${r.id}`,
      originalId: r.id,
      type: 'homework' as const,
      title: `${hwMap[r.homework_id] ?? 'Ödev'} Yanıtı`,
      respondent: r.respondent_name ?? 'Anonim',
      date: r.completed_at,
      score: null,
      icon: BookOpen,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      category: 'Ödev Yanıtları'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Dinamik Klasörleri Oluştur (Sadece verisi olan kategorileri gösterir)
  const categoryCounts = allFiles.reduce((acc, file) => {
    acc[file.category!] = (acc[file.category!] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const folders = Object.keys(categoryCounts).map(cat => ({
    id: cat,
    name: cat,
    count: categoryCounts[cat],
    icon: getFileIcon(cat) || Folder,
    color: 'text-sage-600',
    bg: 'bg-sage-100'
  }))

  // Klasöre ve Aramaya Göre Filtrele
  let displayFiles = allFiles
  if (currentFolder) displayFiles = displayFiles.filter(f => f.category === currentFolder)
  if (searchQuery) {
    displayFiles = displayFiles.filter(f => 
      f.title.toLowerCase().includes(searchQuery) || 
      f.respondent.toLowerCase().includes(searchQuery) ||
      (f.notes && f.notes.toLowerCase().includes(searchQuery))
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="bg-white border-b border-border px-8 py-4 sticky top-0 z-40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {currentFolder ? (
            <Link href="/panel/archive" className="p-1.5 hover:bg-cream rounded-lg text-muted transition-colors mr-2"><ArrowLeft className="w-5 h-5" /></Link>
          ) : (
            <div className="p-1.5 text-sage-600 bg-sage-50 rounded-lg mr-2"><UploadCloud className="w-5 h-5" /></div>
          )}
          <Link href="/panel/archive" className="font-serif text-xl hover:text-sage-700 transition-colors">Bulut Arşiv</Link>
          {currentFolder && (
            <><ChevronRight className="w-5 h-5 text-muted" /><span className="text-sm font-medium text-sage-600 bg-sage-50 px-3 py-1 rounded-full">{currentFolder}</span></>
          )}
        </div>
        <form action="/panel/archive" method="GET" className="relative w-full sm:w-auto">
          {currentFolder && <input type="hidden" name="folder" value={currentFolder} />}
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" name="search" defaultValue={searchQuery} placeholder="Dosya, danışan veya notlarda ara..." className="pl-9 pr-4 py-2 bg-cream/50 border border-border rounded-full text-sm focus:ring-2 focus:ring-sage-500 w-full sm:w-72" />
        </form>
      </header>

      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-10">
        {!currentFolder && !searchQuery && <ArchiveUploader userId={user.id} />}

        {!currentFolder && !searchQuery && folders.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <LayoutGrid className="w-5 h-5 text-muted" />
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Kategoriler / Klasörler</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {folders.map(folder => (
                <Link key={folder.id} href={`/panel/archive?folder=${folder.id}`} className="bg-white p-5 rounded-2xl border border-border hover:border-sage-400 hover:shadow-md transition-all group flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl ${folder.bg}`}><folder.icon className={`w-6 h-6 ${folder.color}`} /></div>
                    <ChevronRight className="w-5 h-5 text-muted opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground group-hover:text-sage-700 transition-colors">{folder.name}</h4>
                    <p className="text-xs text-muted mt-1">{folder.count} öğe barındırıyor</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex flex-col sm:flex-row justify-between mb-4 gap-2">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">
              {searchQuery ? `Arama Sonuçları (${displayFiles.length})` : currentFolder ? 'Klasör İçeriği' : 'Tüm Dosyalar ve İşlemler'}
            </h3>
            {(searchQuery || currentFolder) && <Link href="/panel/archive" className="text-sm text-sage-600 hover:text-sage-800 font-medium">Görünümü Temizle &rarr;</Link>}
          </div>

          <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
            {displayFiles.length === 0 ? (
              <div className="p-16 text-center text-muted">Arama kriterlerinize uygun dosya bulunamadı.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-gray-50/50">
                      <th className="px-6 py-4 text-xs font-semibold text-muted uppercase w-1/3">Dosya Adı & Notlar</th>
                      <th className="px-6 py-4 text-xs font-semibold text-muted uppercase">İlgili Kişi</th>
                      <th className="px-6 py-4 text-xs font-semibold text-muted uppercase">Tarih</th>
                      <th className="px-6 py-4 text-xs font-semibold text-muted uppercase">Kategori / Durum</th>
                      <th className="px-6 py-4 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {displayFiles.map(file => {
                      const FileIcon = file.icon
                      return (
                        <tr key={file.id} className="hover:bg-sage-50/40 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2.5 rounded-xl shadow-sm border border-white/50 ${file.bg} mt-1`}><FileIcon className={`w-5 h-5 ${file.color}`} /></div>
                              <div>
                                <span className="font-medium text-sm text-foreground group-hover:text-sage-700 block">{file.title}</span>
                                {file.notes && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1 bg-cream px-2 py-0.5 rounded-md inline-block">
                                    <Tag className="w-3 h-3" /> {file.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted font-medium">{file.respondent}</td>
                          <td className="px-6 py-4 text-sm text-muted">{format(new Date(file.date), 'd MMM, HH:mm', { locale: tr })}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                              {file.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {file.type === 'document' && file.storage_path ? (
                              <FileActions fileId={file.originalId} storagePath={file.storage_path as string} fileName={file.title} />
                            ) : (
                              <button className="text-muted hover:text-sage-600 p-2"><MoreVertical className="w-4 h-4" /></button>
                            )}
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