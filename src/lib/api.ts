import { supabase, PRIVATE_BUCKET, PUBLIC_BUCKET } from './supabase'
import type { Application, ApplicationInput, Interest, InterestStatus, Profile, Settings, Vault } from './types'

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

// ───────────── reads ─────────────
export async function loadSettings(): Promise<Settings> {
  const rows = must(await supabase.from('settings').select('phone, hours, addr').limit(1))
  return rows[0] ?? { phone: '', hours: '', addr: '' }
}
export const loadProfiles = async () =>
  must(await supabase.from('profiles').select('*').order('created_at', { ascending: false })) as Profile[]
export const loadMyApplication = async (uid: string) =>
  (must(await supabase.from('applications').select('*').eq('user_id', uid).limit(1)) as Application[])[0] ?? null
export const loadMyInterests = async (uid: string) =>
  must(await supabase.from('interests').select('*').eq('from_user', uid).order('created_at', { ascending: false })) as Interest[]
export const loadIsStaff = async (uid: string) =>
  (must(await supabase.from('staff').select('user_id').eq('user_id', uid).limit(1)) as unknown[]).length > 0

// staff only (RLS returns nothing for members)
export const loadApplications = async () =>
  must(await supabase.from('applications').select('*').order('submitted_at', { ascending: false })) as Application[]
export const loadAllInterests = async () =>
  must(await supabase.from('interests').select('*').order('created_at', { ascending: false })) as Interest[]
export const loadVault = async () => must(await supabase.from('vault').select('*')) as Vault[]

// ───────────── photos ─────────────
/** Crop to a square and shrink, so uploads stay small on mobile data. */
export function squareJpeg(file: File, size = 600): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = c.height = size
      const m = Math.min(img.width, img.height)
      c.getContext('2d')!.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, size, size)
      URL.revokeObjectURL(url)
      c.toBlob(b => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', 0.82)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')) }
    img.src = url
  })
}

async function upload(bucket: string, path: string, blob: Blob) {
  must(await supabase.storage.from(bucket).upload(path, blob, { contentType: 'image/jpeg', upsert: true }))
  return path
}

const signedCache = new Map<string, { url: string; until: number }>()
export async function signedPhotoUrl(path: string): Promise<string | null> {
  const hit = signedCache.get(path)
  if (hit && hit.until > Date.now()) return hit.url
  const { data } = await supabase.storage.from(PRIVATE_BUCKET).createSignedUrl(path, 3600)
  if (!data?.signedUrl) return null
  signedCache.set(path, { url: data.signedUrl, until: Date.now() + 50 * 60_000 })
  return data.signedUrl
}

// ───────────── member actions ─────────────
export async function submitApplication(uid: string, input: ApplicationInput, existing: Application | null, photo: Blob | null | 'keep' | 'remove') {
  let photo_path = existing?.photo_path ?? null
  if (photo === 'remove') photo_path = null
  else if (photo instanceof Blob) photo_path = await upload(PRIVATE_BUCKET, `${uid}/${Date.now()}.jpg`, photo)
  const row = { ...input, photo_path, status: 'pending' as const }
  if (existing) must(await supabase.from('applications').update(row).eq('id', existing.id).select())
  else must(await supabase.from('applications').insert(row).select())
}
export async function requestRemoval(appId: string) {
  must(await supabase.from('applications').update({ status: 'removal' }).eq('id', appId).select())
}
export async function sendInterest(pid: string) {
  must(await supabase.from('interests').insert({ pid }).select())
}
export async function withdrawInterest(id: number) {
  must(await supabase.from('interests').delete().eq('id', id).select())
}

// ───────────── staff actions ─────────────
export async function approveApplication(app: Application): Promise<string> {
  let publicPath: string | null = null
  if (app.photo_path && !app.photo_private) {
    const blob = must(await supabase.storage.from(PRIVATE_BUCKET).download(app.photo_path))
    publicPath = await upload(PUBLIC_BUCKET, `${app.id}-${Date.now()}.jpg`, blob)
  }
  return must(await supabase.rpc('approve_application', { app_id: app.id, public_photo: publicPath })) as string
}
export async function rejectApplication(id: string) {
  must(await supabase.from('applications').update({ status: 'rejected' }).eq('id', id).select())
}
export async function staffAddProfile(input: ApplicationInput, photo: Blob | null): Promise<string> {
  let publicPath: string | null = null, privatePath: string | null = null
  if (photo) {
    const id = crypto.randomUUID()
    privatePath = await upload(PRIVATE_BUCKET, `staff/${id}.jpg`, photo)
    if (!input.photo_private) publicPath = await upload(PUBLIC_BUCKET, `${id}.jpg`, photo)
  }
  return must(await supabase.rpc('staff_add_profile', { p: input, public_photo: publicPath, private_photo: privatePath })) as string
}
export async function setProfileFlags(pid: string, flags: Partial<Pick<Profile, 'verified' | 'hidden'>>) {
  must(await supabase.from('profiles').update(flags).eq('pid', pid).select())
}
export async function removeProfile(p: Profile) {
  must(await supabase.rpc('remove_profile', { target: p.pid }))
  if (p.photo_path) await supabase.storage.from(PUBLIC_BUCKET).remove([p.photo_path])
}
export async function setInterestStatus(id: number, status: InterestStatus) {
  must(await supabase.from('interests').update({ status }).eq('id', id).select())
}
export async function saveSettings(s: Settings) {
  must(await supabase.from('settings').update(s).eq('id', 1).select())
}
