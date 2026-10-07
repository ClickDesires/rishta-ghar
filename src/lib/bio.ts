import type { Bio } from './types'

export function age(dob: string | null | undefined): number {
  if (!dob) return 0
  const d = new Date(dob), n = new Date()
  let a = n.getFullYear() - d.getFullYear()
  if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--
  return a
}

/** 66 → 5′6″ */
export const feet = (h: number | null | undefined) => (h ? `${Math.floor(h / 12)}′${h % 12}″` : '–')
export const firstName = (n: string) => n.trim().split(/\s+/)[0] || 'Member'

// ───────────── match score (0–100) between two biodata of opposite gender ─────────────
export type Why = ['w_gap', number] | ['w_sameAge'] | ['w_olderBride'] | ['w_sect', string] | ['w_pr'] | ['w_city', string] | ['w_edu'] | ['w_lang', string]
export interface Match { score: number; why: Why[] }

const PRACTICE_ORDER = ['Moderately practising', 'Practising', 'Very practising']
const EDU_TIER: Record<string, number> = {
  'Intermediate or below': 0, "Bachelor's": 1, 'Islamic education (Alim / Hafiz)': 1,
  "Master's": 2, 'Professional (MBBS / CA / LLB)': 2, 'Doctorate': 3,
}
const same = (a?: string, b?: string) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase()

export function matchOf(a: Bio | null | undefined, p: Bio): Match | null {
  if (!a || a.gender === p.gender || !a.dob || !p.dob) return null
  const groom = a.gender === 'M' ? a : p, bride = a.gender === 'M' ? p : a
  const why: Why[] = []
  let s = 0
  const gap = age(groom.dob) - age(bride.dob)
  if (gap >= 0 && gap <= 6) { s += 25; why.push(gap === 0 ? ['w_sameAge'] : ['w_gap', gap]) }
  else if (gap > 6 && gap <= 10) { s += 15; why.push(['w_gap', gap]) }
  else if (gap < 0 && gap >= -2) { s += 10; why.push(['w_olderBride']) }
  if (a.sect === p.sect) { s += 25; why.push(['w_sect', a.sect]) }
  else if (a.sect === 'Just Muslim' || p.sect === 'Just Muslim') s += 15
  const pd = Math.abs(PRACTICE_ORDER.indexOf(a.practice) - PRACTICE_ORDER.indexOf(p.practice))
  if (pd === 0) { s += 15; why.push(['w_pr']) } else if (pd === 1) s += 8
  if (same(a.city, p.city)) { s += 10; why.push(['w_city', p.city.trim()]) }
  const ed = Math.abs((EDU_TIER[a.education] ?? 1) - (EDU_TIER[p.education] ?? 1))
  s += ed === 0 ? 10 : ed === 1 ? 6 : 0
  if (ed === 0) why.push(['w_edu'])
  if (same(a.mother_tongue, p.mother_tongue)) { s += 10; why.push(['w_lang', p.mother_tongue.trim()]) }
  if ((a.marital === 'Never married') === (p.marital === 'Never married')) s += 5
  return { score: s, why }
}

// ───────────── illustrated portrait for profiles without a visible photo ─────────────
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
const SKIN = ['#f1c9a5', '#e3b48f', '#d29c74', '#c08660', '#a8714f']
const HAIR = ['#1d1512', '#2b1d16', '#3a2618', '#4a3324']
const HIJABS = ['#2f5d62', '#7a3b4f', '#c9a27e', '#45506b', '#8c6a9e', '#5f7f5a', '#b5675a', '#d9ccbc']
const SHIRT = ['#f2efe9', '#34495e', '#5a7d9a', '#7b8f6a', '#2f3b40', '#b8a07a']
const BGS = ['#dfe9e4', '#f1e3cf', '#e6e0ef', '#dde6ee', '#f0dfdf', '#e7e9d9']

/** SVG markup built only from constants, so it is safe to inject. */
export function portraitSvg(seed: string, gender: string, hijab = ''): string {
  const r = hash(seed)
  const pick = (a: string[], o: number) => a[(r >> o) % a.length]
  const skin = pick(SKIN, 1), hair = pick(HAIR, 3), bg = pick(BGS, 5)
  const eyes = `<ellipse cx="44" cy="48" rx="1.8" ry="2.1" fill="#2a1d18"/><ellipse cx="56" cy="48" rx="1.8" ry="2.1" fill="#2a1d18"/>`
  const brows = `<path d="M40.5 43.5 Q44 41.8 47.5 43.2 M52.5 43.2 Q56 41.8 59.5 43.5" stroke="${hair}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`
  const mouth = `<path d="M45.5 57 Q50 60 54.5 57" stroke="#7a3f36" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
  let s = `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="${bg}"/><circle cx="82" cy="18" r="22" fill="#ffffff" opacity=".35"/>`
  if (gender === 'F') {
    const hj = pick(HIJABS, 2)
    s += `<path d="M50 20 C30 20 25 36 25 50 C25 66 31 76 14 100 L86 100 C69 76 75 66 75 50 C75 36 70 20 50 20Z" fill="${hj}"/><path d="M14 100 Q30 80 50 80 Q70 80 86 100Z" fill="${hj}" opacity=".85"/>`
    s += `<ellipse cx="50" cy="50" rx="13.5" ry="16.5" fill="${skin}"/><path d="M35.5 50 Q35 31 50 31 Q65 31 64.5 50 Q63 37 50 36 Q37 37 35.5 50Z" fill="${hj}"/>`
    s += brows + eyes + (hijab === 'Wears niqab'
      ? `<path d="M36.5 52 L63.5 52 Q63 70 50 71 Q37 70 36.5 52Z" fill="${hj}"/>`
      : `<ellipse cx="42" cy="54" rx="3" ry="1.6" fill="#e08a7a" opacity=".35"/><ellipse cx="58" cy="54" rx="3" ry="1.6" fill="#e08a7a" opacity=".35"/>` + mouth)
  } else {
    const sh = pick(SHIRT, 2), beard = (r >> 7) % 3 !== 0, cap = (r >> 9) % 4 === 0
    s += `<path d="M14 100 Q16 76 50 74 Q84 76 86 100Z" fill="${sh}"/><path d="M44 74 L50 84 L56 74Z" fill="#00000022"/><rect x="44" y="60" width="12" height="15" rx="4" fill="${skin}"/>`
    s += `<ellipse cx="35.5" cy="49" rx="2.6" ry="4" fill="${skin}"/><ellipse cx="64.5" cy="49" rx="2.6" ry="4" fill="${skin}"/><ellipse cx="50" cy="47" rx="14.5" ry="17.5" fill="${skin}"/>`
    s += cap
      ? `<path d="M35 38 Q35 25 50 25 Q65 25 65 38Z" fill="#f4f1ea"/><path d="M35 38 L65 38" stroke="#d8d2c6" stroke-width="1.5"/>`
      : `<path d="M35 45 Q33 26 50 25 Q67 26 65 45 Q63 33 52 33 Q42 33 37 38 Q36 41 35 45Z" fill="${hair}"/>`
    s += brows + eyes + (beard
      ? `<path d="M35.5 48 Q35 67 50 68 Q65 67 64.5 48 Q63 59 57 60 Q53 56 50 56.5 Q47 56 43 60 Q37 59 35.5 48Z" fill="${hair}"/><path d="M46 61 Q50 62.5 54 61" stroke="#7a3f36" stroke-width="1.3" fill="none" stroke-linecap="round"/>`
      : mouth)
  }
  return s + '</svg>'
}

// ───────────── contact details stay with the bureau (mirrors has_contact_info in schema.sql) ─────────────
export function hasContactInfo(text: string): boolean {
  return /[0-9۰-۹٠-٩]{7,}/.test(text.replace(/[\s().+-]/g, ''))
    || /[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(text)
    || /(https?:\/\/|www\.|wa\.me|whatsapp\.com|facebook\.com|fb\.com|instagram\.com|t\.me\/)/i.test(text)
}
