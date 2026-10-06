import { useEffect, useState, type FormEvent } from 'react'
import { age, feet } from '../lib/bio'
import { squareJpeg } from '../lib/api'
import { useI18n, type Key } from '../lib/i18n'
import { EDUCATION, HIJAB, MARITAL, PRACTICE, SALAH, SECTS, type Application, type ApplicationInput } from '../lib/types'
import { usePrivatePhoto } from './Photo'
import { useToast } from './Toast'

const BLANK: ApplicationInput = {
  full_name: '', phone: '', guardian: '', gender: 'F', dob: '', height_in: 66, marital: 'Never married', caste: '',
  mother_tongue: '', sect: 'Sunni', practice: 'Practising', salah: 'Prays 5 times', hijab: 'Wears hijab',
  education: "Bachelor's", degree: '', profession: '', city: '', father: '', siblings: '', about: '', photo_private: true,
}
const HEIGHTS = Array.from({ length: 23 }, (_, i) => 56 + i)

export type PhotoChange = Blob | null | 'keep' | 'remove'

function fromApplication(a: Application | null): ApplicationInput {
  const next = { ...BLANK }
  if (!a) return next
  for (const k of Object.keys(BLANK) as (keyof ApplicationInput)[]) {
    const v = a[k]
    if (v !== null && v !== undefined) (next as Record<string, unknown>)[k] = v
  }
  return next
}

interface Props {
  initial: Application | null
  submitLabel: Key
  onSubmit: (input: ApplicationInput, photo: PhotoChange) => Promise<void>
  onCancel?: () => void
}

export function ApplicationForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const { t, tv } = useI18n()
  const toast = useToast()
  // Filled once from `initial`; callers pass a `key` that changes only when a new version is saved,
  // so a background refresh never wipes what someone is typing.
  const [f, setF] = useState<ApplicationInput>(() => fromApplication(initial))
  const [photo, setPhoto] = useState<PhotoChange>('keep')
  const [preview, setPreview] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const existingUrl = usePrivatePhoto(photo === 'keep' ? initial?.photo_path : null)

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const set = <K extends keyof ApplicationInput>(k: K, v: ApplicationInput[K]) => setF(prev => ({ ...prev, [k]: v }))
  const text = (k: keyof ApplicationInput, ph?: Key) => ({
    id: `r-${k}`, value: String(f[k] ?? ''), placeholder: ph ? t(ph) : undefined,
    onChange: (e: { target: { value: string } }) => set(k, e.target.value as never),
  })

  async function pick(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) { toast(t('chooseImg')); return }
    try {
      const blob = await squareJpeg(file)
      setPhoto(blob)
      setPreview(URL.createObjectURL(blob))
    } catch { toast(t('badImg')) }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const missing = (['full_name', 'dob', 'profession', 'city', 'phone'] as const).filter(k => !String(f[k]).trim())
    if (missing.length) { setErr(t('missing', missing.map(k => t(`m_${k}` as const)).join(t('join')))); return }
    if (age(f.dob) < 18) { setErr(t('under18')); return }
    setErr(''); setBusy(true)
    try {
      await onSubmit({ ...f, hijab: f.gender === 'F' ? f.hijab : '' }, photo)
      setPhoto('keep'); setPreview(null)
    } catch (x) {
      console.error(x)
      setErr(t('errSave'))
    }
    setBusy(false)
  }

  const shownPhoto = preview ?? (photo === 'keep' ? existingUrl : null)
  const hasPhoto = photo instanceof Blob || (photo === 'keep' && !!initial?.photo_path)
  const options = (list: string[]) => list.map(v => <option key={v} value={v}>{tv(v)}</option>)

  return (
    <form className="reg" onSubmit={e => void submit(e)} noValidate>
      <fieldset>
        <legend>{t('photoLg')}</legend>
        <div className="upload full">
          <div className="prev">{shownPhoto ? <img src={shownPhoto} alt="" /> : t('noPhoto')}</div>
          <div className="ctrl">
            <label>{t('upload')}<input id="r-photo" type="file" accept="image/*" onChange={e => void pick(e.target.files?.[0])} /></label>
            <label className="check"><input type="checkbox" checked={f.photo_private} onChange={e => set('photo_private', e.target.checked)} /> {t('keepPrivate')}</label>
            {hasPhoto && <button type="button" className="link" onClick={() => { setPhoto('remove'); setPreview(null) }}>{t('removePhoto')}</button>}
          </div>
        </div>
      </fieldset>
      <fieldset>
        <legend>{t('basicLg')}</legend>
        <label>{t('fullName')}<input {...text('full_name', 'namePh')} required autoComplete="name" /><span className="hint">{t('firstOnly')}</span></label>
        <label>{t('gender')}<select id="r-gender" value={f.gender} onChange={e => set('gender', e.target.value as 'F' | 'M')}>
          <option value="F">{t('genderF')}</option><option value="M">{t('genderM')}</option></select></label>
        <label>{t('dob')}<input id="r-dob" type="date" required value={f.dob} onChange={e => set('dob', e.target.value)} /></label>
        <label>{t('height')}<select id="r-height" value={f.height_in ?? 66} onChange={e => set('height_in', Number(e.target.value))}>
          {HEIGHTS.map(h => <option key={h} value={h}>{feet(h)} ({Math.round(h * 2.54)} cm)</option>)}</select></label>
        <label>{t('marital')}<select id="r-marital" value={f.marital} onChange={e => set('marital', e.target.value)}>{options(MARITAL)}</select></label>
        <label>{t('caste')}<input {...text('caste', 'optional')} /></label>
        <label>{t('motherTongue')}<input {...text('mother_tongue', 'langPh')} /></label>
      </fieldset>
      <fieldset>
        <legend>{t('deen')}</legend>
        <label>{t('sect')}<select id="r-sect" value={f.sect} onChange={e => set('sect', e.target.value)}>{options(SECTS)}</select></label>
        <label>{t('practice')}<select id="r-practice" value={f.practice} onChange={e => set('practice', e.target.value)}>{options(PRACTICE)}</select></label>
        <label>{t('salah')}<select id="r-salah" value={f.salah} onChange={e => set('salah', e.target.value)}>{options(SALAH)}</select></label>
        {f.gender === 'F' && <label>{t('hijabDress')}<select id="r-hijab" value={f.hijab || HIJAB[0]} onChange={e => set('hijab', e.target.value)}>{options(HIJAB)}</select></label>}
      </fieldset>
      <fieldset>
        <legend>{t('eduLg')}</legend>
        <label>{t('education')}<select id="r-education" value={f.education} onChange={e => set('education', e.target.value)}>{options(EDUCATION)}</select></label>
        <label>{t('degree')}<input {...text('degree', 'degPh')} /></label>
        <label>{t('profession')}<input {...text('profession', 'jobPh')} required /></label>
        <label>{t('city')}<input {...text('city', 'cityPh')} required autoComplete="address-level2" /></label>
      </fieldset>
      <fieldset>
        <legend>{t('familyLg')}</legend>
        <label>{t('fatherOcc')}<input {...text('father', 'faPh')} /></label>
        <label>{t('siblings')}<input {...text('siblings', 'sibPh')} /></label>
        <label className="full">{t('aboutL')}<textarea {...text('about', 'aboutPh')} rows={3} maxLength={2000} /></label>
      </fieldset>
      <fieldset>
        <legend>{t('privLg')} <span className="hint">{t('privHint')}</span></legend>
        <label>{t('phoneWa')}<input {...text('phone')} required type="tel" inputMode="tel" dir="ltr" placeholder="0300 1234567" autoComplete="tel" /></label>
        <label>{t('wali')}<input {...text('guardian', 'walPh')} /></label>
      </fieldset>
      <div className="form-foot">
        <button className="btn primary" type="submit" disabled={busy}>{t(submitLabel)}</button>
        {onCancel && <button className="btn" type="button" onClick={onCancel}>{t('cancel')}</button>}
        {err && <span className="err" role="alert">{err}</span>}
      </div>
    </form>
  )
}
