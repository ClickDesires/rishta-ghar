import { age, feet, portraitSvg } from './bio'
import type { Profile } from './types'

const loadImg = (src: string) => new Promise<HTMLImageElement>((ok, no) => {
  const i = new Image()
  i.crossOrigin = 'anonymous'
  i.onload = () => ok(i)
  i.onerror = no
  i.src = src
})

function wrapLines(x: CanvasRenderingContext2D, text: string, maxW: number) {
  const lines: string[] = []
  let line = ''
  for (const w of String(text || '').split(/\s+/)) {
    const next = line ? `${line} ${w}` : w
    if (x.measureText(next).width > maxW && line) { lines.push(line); line = w } else line = next
  }
  if (line) lines.push(line)
  return lines
}

/** A 1080×1500 biodata card in English, sized for WhatsApp. */
export async function biodataPng(p: Profile, opts: { photoUrl: string | null; fullName?: string; bureauPhone: string }): Promise<Blob> {
  try { await Promise.all([document.fonts.load('400 48px "Marcellus"'), document.fonts.load('600 24px "Figtree"')]) } catch { /* fallback fonts */ }
  const W = 1080, H = 1500
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const x = c.getContext('2d')!
  const HEN = '#1f5c4f', GOLD = '#b8740a', INK = '#22201f', MUT = '#6c6461'
  const SER = '"Marcellus", Georgia, serif', SAN = '"Figtree", system-ui, sans-serif'

  x.fillStyle = '#fbf8f5'; x.fillRect(0, 0, W, H)
  x.fillStyle = HEN; x.fillRect(0, 0, W, 150)
  x.fillStyle = '#fff'; x.font = `400 46px ${SER}`; x.fillText('Rishta Ghar', 60, 88)
  x.font = `600 20px ${SAN}`; x.fillStyle = '#cfe5de'; x.fillText('MUSLIM MARRIAGE BUREAU  ·  BIODATA', 60, 122)
  x.textAlign = 'right'; x.font = `400 30px ${SER}`; x.fillStyle = '#fff'; x.fillText('بسم الله الرحمن الرحيم', W - 60, 98); x.textAlign = 'left'

  const src = opts.photoUrl ?? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(portraitSvg(p.pid, p.gender, p.hijab))
  try {
    const img = await loadImg(src)
    x.save(); x.beginPath(); x.roundRect(60, 200, 340, 340, 24); x.clip(); x.drawImage(img, 60, 200, 340, 340); x.restore()
  } catch { /* leave the space empty */ }

  x.fillStyle = INK; x.font = `400 58px ${SER}`; x.fillText(opts.fullName || p.first_name, 450, 268)
  x.font = `600 24px ${SAN}`; x.fillStyle = GOLD; x.fillText(`Profile ${p.pid}${p.verified ? '  ·  ✓ Verified' : ''}`, 452, 312)
  x.font = `500 28px ${SAN}`; x.fillStyle = INK
  ;[`${age(p.dob)} years  ·  ${feet(p.height_in)}`, p.marital, `${p.sect}  ·  ${p.practice}`, p.profession, p.city]
    .forEach((s, i) => x.fillText(s, 452, 372 + i * 40))

  let y = 600
  const head = (s: string) => {
    x.fillStyle = HEN; x.font = `700 20px ${SAN}`; x.fillText(s.toUpperCase(), 60, y)
    x.fillStyle = '#e2d9d5'; x.fillRect(60, y + 14, W - 120, 2); y += 54
  }
  const rows = (list: [string, string][]) => {
    for (const [k, v] of list.filter(r => r[1])) {
      x.font = `500 25px ${SAN}`; x.fillStyle = MUT; x.fillText(k, 60, y)
      x.fillStyle = INK; x.font = `500 26px ${SAN}`
      const ls = wrapLines(x, v, 640).slice(0, 2)
      ls.forEach((l, i) => x.fillText(l, 360, y + i * 34))
      y += ls.length > 1 ? 78 : 44
    }
    y += 16
  }
  head('About')
  x.font = `400 26px ${SAN}`; x.fillStyle = INK
  wrapLines(x, p.about || '—', W - 120).slice(0, 4).forEach(l => { x.fillText(l, 60, y); y += 38 })
  y += 24
  head('Deen'); rows([['Sect', p.sect], ['Practice', p.practice], ['Salah', p.salah], ['Hijab', p.gender === 'F' ? p.hijab : '']])
  head('Education & family'); rows([
    ['Education', [p.degree, p.education].filter(Boolean).join(' · ')], ['Mother tongue', p.mother_tongue],
    ['Caste / biradari', p.caste], ['Father', p.father], ['Siblings', p.siblings],
  ])
  x.fillStyle = HEN; x.fillRect(0, H - 110, W, 110)
  x.fillStyle = '#fff'; x.font = `600 28px ${SAN}`; x.fillText(`Contact the bureau: ${opts.bureauPhone}`, 60, H - 62)
  x.font = `400 20px ${SAN}`; x.fillStyle = '#cfe5de'
  x.fillText(`Please quote profile ${p.pid}. Details are shared only through the bureau.`, 60, H - 30)
  return new Promise((ok, no) => c.toBlob(b => (b ? ok(b) : no(new Error('encode failed'))), 'image/png'))
}

/** On phones this opens the share sheet (WhatsApp etc.); elsewhere it downloads the file. */
export async function shareOrDownload(blob: Blob, filename: string): Promise<'shared' | 'saved' | 'cancelled'> {
  const file = new File([blob], filename, { type: blob.type })
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return 'shared' }
    catch (e) { if ((e as Error).name === 'AbortError') return 'cancelled' }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.append(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'saved'
}
