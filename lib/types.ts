// lib/types.ts

export type Profile = {
  id: string
  slug: string
  full_name: string
  title: string
  email: string | null
  phone: string | null
  bio: string | null
  session_types: string[]
  session_price: number
  avatar_url: string | null
  created_at: string
}

export type Client = {
  id: string
  psychologist_id: string
  full_name: string
  phone: string | null
  email: string | null
  session_type: string | null
  notes: string | null
  status: 'active' | 'passive' | 'new'
  created_at: string
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export type Appointment = {
  id: string
  psychologist_id: string
  client_id: string | null
  guest_name: string | null
  guest_phone: string | null
  guest_email: string | null
  guest_note: string | null
  session_type: string
  starts_at: string
  duration_min: number
  status: AppointmentStatus
  price: number | null
  notes: string | null
  created_at: string
  // joined
  client?: Client
}

export type TestQuestion = {
  text: string
  type: 'multiple_choice' | 'text' | 'scale' | 'true_false'
  options: { label: string; score: number }[]
}

export type Test = {
  id: string
  psychologist_id: string
  slug: string
  title: string
  description: string | null
  questions: TestQuestion[]
  is_active: boolean
  created_at: string
}

export type TestResponse = {
  id: string
  test_id: string
  client_id: string | null
  respondent_name: string | null
  answers: { question_index: number; option_index: number; score: number }[]
  total_score: number | null
  completed_at: string
}

export type HomeworkQuestion = {
  text: string
}

export type Homework = {
  id: string
  psychologist_id: string
  slug: string
  title: string
  description: string | null
  questions: HomeworkQuestion[]
  due_date: string | null
  is_active: boolean
  created_at: string
}

export type HomeworkResponse = {
  id: string
  homework_id: string
  client_id: string | null
  respondent_name: string | null
  answers: { question_index: number; answer_text: string }[]
  completed_at: string
}

export type FinanceType = 'income' | 'expense'

export type FinanceEntry = {
  id: string
  psychologist_id: string
  type: FinanceType
  amount: number
  description: string
  appointment_id: string | null
  entry_date: string
  created_at: string
}

// API request/response helpers
export type BookingRequest = {
  guest_name: string
  guest_phone: string
  guest_email: string
  guest_note?: string
  session_type: string
  starts_at: string
}

export type PublicProfile = Pick<Profile, 'id' | 'slug' | 'full_name' | 'title' | 'bio' | 'session_types' | 'session_price' | 'avatar_url'>
