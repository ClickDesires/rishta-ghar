export type Gender = 'F' | 'M'
export type AppStatus = 'pending' | 'approved' | 'rejected' | 'removal' | 'removed'
export type InterestStatus = 'pending' | 'accepted' | 'declined'

/** Biodata fields shared by applications and published profiles (database column names). */
export interface Bio {
  gender: Gender
  dob: string
  height_in: number | null
  marital: string
  caste: string
  mother_tongue: string
  sect: string
  practice: string
  salah: string
  hijab: string
  education: string
  degree: string
  profession: string
  city: string
  father: string
  siblings: string
  about: string
}

export interface Profile extends Bio {
  pid: string
  application_id: string | null
  first_name: string
  photo_path: string | null
  photo_private: boolean
  verified: boolean
  hidden: boolean
  created_at: string
}

export interface Application extends Bio {
  id: string
  user_id: string
  full_name: string
  phone: string
  guardian: string
  photo_path: string | null
  photo_private: boolean
  status: AppStatus
  pid: string | null
  submitted_at: string
  reviewed_at: string | null
}

/** What the registration form edits. */
export type ApplicationInput = Bio & {
  full_name: string
  phone: string
  guardian: string
  photo_private: boolean
}

export interface Vault {
  pid: string
  user_id: string | null
  full_name: string
  phone: string
  guardian: string
  private_photo_path: string | null
}

export interface Interest {
  id: number
  from_user: string
  pid: string
  status: InterestStatus
  created_at: string
}

export interface Settings {
  phone: string
  hours: string
  addr: string
}

export const SECTS = ['Sunni', 'Shia', 'Ahl-e-Hadith', 'Just Muslim']
export const PRACTICE = ['Very practising', 'Practising', 'Moderately practising']
export const SALAH = ['Prays 5 times', 'Prays regularly', 'Sometimes']
export const HIJAB = ['Wears hijab', 'Wears niqab', 'Dupatta', 'Does not cover']
export const EDUCATION = [
  "Bachelor's",
  "Master's",
  'Doctorate',
  'Professional (MBBS / CA / LLB)',
  'Islamic education (Alim / Hafiz)',
  'Intermediate or below',
]
export const MARITAL = ['Never married', 'Divorced', 'Widowed']
