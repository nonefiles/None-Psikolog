// Mock data - ready for real API/Database integration

export interface Psychologist {
  id: string
  username: string
  name: string
  title: string
  specialty: string
  bio: string
  avatar: string
  sessionDuration: number // minutes
  sessionFee: number // TRY
}

export interface Appointment {
  id: string
  psychologistId: string
  clientName: string
  clientSurname: string
  clientPhone: string
  clientEmail: string
  details?: string
  date: string // ISO string
  time: string // HH:MM
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  fee: number
}

export interface Client {
  id: string
  psychologistId: string
  name: string
  surname: string
  phone: string
  email: string
  notes: string
  files: ClientFile[]
  firstSession: string
  lastSession: string
  totalSessions: number
}

export interface ClientFile {
  id: string
  name: string
  type: string
  uploadedAt: string
  size: string
}

export interface Test {
  id: string
  psychologistId: string
  title: string
  link: string
  sentTo: string
  sentAt: string
  status: 'sent' | 'answered'
  answers?: string
}

export interface Transaction {
  id: string
  psychologistId: string
  type: 'income' | 'expense'
  description: string
  amount: number
  date: string
  category: string
}

// ─── Mock Psychologist ───────────────────────────────────────────────────────

export const mockPsychologist: Psychologist = {
  id: 'psy_1',
  username: 'dr-ayse-demir',
  name: 'Dr. Ayşe Demir',
  title: 'Klinik Psikolog',
  specialty: 'Anksiyete, Depresyon, Bilişsel Davranışçı Terapi',
  bio: 'İstanbul Üniversitesi Klinik Psikoloji mezunuyum. 8 yıldır bireysel terapi alanında çalışmaktayım. Bilişsel Davranışçı Terapi ve EMDR konularında uzmanlaşmış durumdayım.',
  avatar: '',
  sessionDuration: 50,
  sessionFee: 1500,
}

// ─── Mock Appointments ───────────────────────────────────────────────────────

export const mockAppointments: Appointment[] = [
  {
    id: 'apt_1',
    psychologistId: 'psy_1',
    clientName: 'Mehmet',
    clientSurname: 'Yılmaz',
    clientPhone: '0532 111 2233',
    clientEmail: 'mehmet@example.com',
    date: '2026-03-02',
    time: '09:00',
    status: 'confirmed',
    fee: 1500,
  },
  {
    id: 'apt_2',
    psychologistId: 'psy_1',
    clientName: 'Elif',
    clientSurname: 'Kaya',
    clientPhone: '0541 222 3344',
    clientEmail: 'elif@example.com',
    date: '2026-03-02',
    time: '10:00',
    status: 'confirmed',
    fee: 1500,
  },
  {
    id: 'apt_3',
    psychologistId: 'psy_1',
    clientName: 'Ali',
    clientSurname: 'Çelik',
    clientPhone: '0555 333 4455',
    clientEmail: 'ali@example.com',
    date: '2026-03-02',
    time: '14:00',
    status: 'pending',
    fee: 1500,
  },
  {
    id: 'apt_4',
    psychologistId: 'psy_1',
    clientName: 'Zeynep',
    clientSurname: 'Arslan',
    clientPhone: '0544 444 5566',
    clientEmail: 'zeynep@example.com',
    date: '2026-03-03',
    time: '11:00',
    status: 'confirmed',
    fee: 1500,
  },
  {
    id: 'apt_5',
    psychologistId: 'psy_1',
    clientName: 'Can',
    clientSurname: 'Şahin',
    clientPhone: '0533 555 6677',
    clientEmail: 'can@example.com',
    date: '2026-03-04',
    time: '15:00',
    status: 'completed',
    fee: 1500,
  },
  {
    id: 'apt_6',
    psychologistId: 'psy_1',
    clientName: 'Selin',
    clientSurname: 'Doğan',
    clientPhone: '0506 666 7788',
    clientEmail: 'selin@example.com',
    date: '2026-03-05',
    time: '10:00',
    status: 'confirmed',
    fee: 1500,
  },
]

// ─── Mock Clients ─────────────────────────────────────────────────────────────

export const mockClients: Client[] = [
  {
    id: 'cli_1',
    psychologistId: 'psy_1',
    name: 'Mehmet',
    surname: 'Yılmaz',
    phone: '0532 111 2233',
    email: 'mehmet@example.com',
    notes: 'Anksiyete bozukluğu. BDT protokolü uygulanıyor. 5. seansta belirgin ilerleme gözlemlendi.',
    files: [
      { id: 'f1', name: 'Başlangıç Değerlendirmesi.pdf', type: 'pdf', uploadedAt: '2026-01-10', size: '245 KB' },
      { id: 'f2', name: 'Beck Anksiyete Envanteri.pdf', type: 'pdf', uploadedAt: '2026-02-15', size: '180 KB' },
    ],
    firstSession: '2026-01-10',
    lastSession: '2026-03-02',
    totalSessions: 8,
  },
  {
    id: 'cli_2',
    psychologistId: 'psy_1',
    name: 'Elif',
    surname: 'Kaya',
    phone: '0541 222 3344',
    email: 'elif@example.com',
    notes: 'Majör depresif bozukluk. İlaç tedavisiyle birlikte terapi. Psikiyatrist Dr. Özcan ile koordineli çalışılıyor.',
    files: [
      { id: 'f3', name: 'İlk Görüşme Notu.pdf', type: 'pdf', uploadedAt: '2026-01-20', size: '312 KB' },
    ],
    firstSession: '2026-01-20',
    lastSession: '2026-03-02',
    totalSessions: 6,
  },
  {
    id: 'cli_3',
    psychologistId: 'psy_1',
    name: 'Ali',
    surname: 'Çelik',
    phone: '0555 333 4455',
    email: 'ali@example.com',
    notes: 'İlişki sorunları. Çift terapisi önerildi, henüz kabul etmedi. Bireysel çalışmaya devam.',
    files: [],
    firstSession: '2026-02-01',
    lastSession: '2026-03-02',
    totalSessions: 4,
  },
  {
    id: 'cli_4',
    psychologistId: 'psy_1',
    name: 'Zeynep',
    surname: 'Arslan',
    phone: '0544 444 5566',
    email: 'zeynep@example.com',
    notes: 'Travma sonrası stres bozukluğu. EMDR seansları başlandı. Hafıza yeniden işleme iyi gidiyor.',
    files: [
      { id: 'f4', name: 'EMDR Protokol Formu.pdf', type: 'pdf', uploadedAt: '2026-02-10', size: '290 KB' },
      { id: 'f5', name: 'Travma Geçmişi.pdf', type: 'pdf', uploadedAt: '2026-02-10', size: '150 KB' },
    ],
    firstSession: '2026-02-10',
    lastSession: '2026-03-03',
    totalSessions: 5,
  },
  {
    id: 'cli_5',
    psychologistId: 'psy_1',
    name: 'Can',
    surname: 'Şahin',
    phone: '0533 555 6677',
    email: 'can@example.com',
    notes: 'Sınav kaygısı ve perfeksyonizm. Üniversite öğrencisi. Hedef belirleme teknikleri çalışılıyor.',
    files: [],
    firstSession: '2026-02-20',
    lastSession: '2026-03-04',
    totalSessions: 3,
  },
]

// ─── Mock Tests ───────────────────────────────────────────────────────────────

export const mockTests: Test[] = [
  {
    id: 'tst_1',
    psychologistId: 'psy_1',
    title: 'Beck Depresyon Envanteri',
    link: 'https://forms.example.com/beck-depresyon',
    sentTo: 'Elif Kaya',
    sentAt: '2026-02-28',
    status: 'answered',
    answers: 'Toplam Puan: 28 (Orta-Şiddetli). Madde 9 (İntihar Düşüncesi): 0. Sonraki seansta değerlendirilecek.',
  },
  {
    id: 'tst_2',
    psychologistId: 'psy_1',
    title: 'Beck Anksiyete Envanteri',
    link: 'https://forms.example.com/beck-anksiyete',
    sentTo: 'Mehmet Yılmaz',
    sentAt: '2026-02-25',
    status: 'answered',
    answers: 'Toplam Puan: 22 (Orta Düzey Anksiyete). Bedensel belirtiler baskın. Nefes egzersizleri önerildi.',
  },
  {
    id: 'tst_3',
    psychologistId: 'psy_1',
    title: 'Durumluk-Sürekli Kaygı Envanteri',
    link: 'https://forms.example.com/stai',
    sentTo: 'Can Şahin',
    sentAt: '2026-03-01',
    status: 'sent',
  },
  {
    id: 'tst_4',
    psychologistId: 'psy_1',
    title: 'TSSB Kontrol Listesi (PCL-5)',
    link: 'https://forms.example.com/pcl5',
    sentTo: 'Zeynep Arslan',
    sentAt: '2026-03-01',
    status: 'sent',
  },
]

// ─── Mock Transactions ────────────────────────────────────────────────────────

export const mockTransactions: Transaction[] = [
  { id: 'tx_1', psychologistId: 'psy_1', type: 'income', description: 'Seans - Mehmet Yılmaz', amount: 1500, date: '2026-03-02', category: 'Seans Ücreti' },
  { id: 'tx_2', psychologistId: 'psy_1', type: 'income', description: 'Seans - Elif Kaya', amount: 1500, date: '2026-03-02', category: 'Seans Ücreti' },
  { id: 'tx_3', psychologistId: 'psy_1', type: 'income', description: 'Seans - Can Şahin', amount: 1500, date: '2026-03-04', category: 'Seans Ücreti' },
  { id: 'tx_4', psychologistId: 'psy_1', type: 'expense', description: 'Kira - Şubat', amount: 8000, date: '2026-03-01', category: 'Kira' },
  { id: 'tx_5', psychologistId: 'psy_1', type: 'income', description: 'Seans - Zeynep Arslan', amount: 1500, date: '2026-02-28', category: 'Seans Ücreti' },
  { id: 'tx_6', psychologistId: 'psy_1', type: 'income', description: 'Seans - Ali Çelik', amount: 1500, date: '2026-02-28', category: 'Seans Ücreti' },
  { id: 'tx_7', psychologistId: 'psy_1', type: 'expense', description: 'Ofis Malzemeleri', amount: 450, date: '2026-02-27', category: 'Gider' },
  { id: 'tx_8', psychologistId: 'psy_1', type: 'income', description: 'Seans - Mehmet Yılmaz', amount: 1500, date: '2026-02-26', category: 'Seans Ücreti' },
  { id: 'tx_9', psychologistId: 'psy_1', type: 'income', description: 'Seans - Elif Kaya', amount: 1500, date: '2026-02-25', category: 'Seans Ücreti' },
  { id: 'tx_10', psychologistId: 'psy_1', type: 'expense', description: 'Supervision Ücreti', amount: 2000, date: '2026-02-20', category: 'Eğitim' },
]

// ─── Helper Functions ─────────────────────────────────────────────────────────

export function getPsychologistByUsername(username: string): Psychologist | undefined {
  if (username === mockPsychologist.username) return mockPsychologist
  return undefined
}

export function getTodayAppointments(): Appointment[] {
  const today = new Date().toISOString().split('T')[0]
  return mockAppointments.filter((a) => a.date === today)
}

export function getPendingAppointments(): Appointment[] {
  return mockAppointments.filter((a) => a.status === 'pending')
}

export function getTodayRevenue(): number {
  return getTodayAppointments()
    .filter((a) => a.status === 'confirmed' || a.status === 'completed')
    .reduce((sum, a) => sum + a.fee, 0)
}
