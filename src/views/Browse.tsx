import { useMemo, useState } from 'react'
import { age, matchOf } from '../lib/bio'
import { useI18n } from '../lib/i18n'
import { useStore } from '../lib/store'
import { EDUCATION, MARITAL, PRACTICE, SECTS, type Gender, type Profile } from '../lib/types'
import { ProfileCard } from '../components/ProfileCard'
import { useToast } from '../components/Toast'

type Sort = 'new' | 'match' | 'ageA' | 'ageD'
interface Filters { q: string; amin: number; amax: number; sect: string; practice: string; city: string; education: string; marital: string; photo: boolean; verified: boolean }
const DEFAULTS: Filters = { q: '', amin: 18, amax: 45, sect: '', practice: '', city: '', education: '', marital: '', photo: false, verified: false }

function readLooking(): Gender {
  try { return localStorage.getItem('rg:lf') === 'M' ? 'M' : 'F' } catch { return 'F' }
}

export function EmptyState() {
  const { t } = useI18n()
  const s = useStore()
  if (s.status === 'loading') return <div className="empty"><b>{t('loading')}</b></div>
  if (s.status === 'error') return <div className="empty"><b>{t('loadFail')}</b></div>
  return <div className="empty"><b>{t('noneT')}</b>{t(s.isStaff ? 'noneAdmin' : 'noneUser')}</div>
}

export function Browse() {
  const { t, tv } = useI18n()
  const s = useStore()
  const toast = useToast()
  const [looking, setLooking] = useState<Gender>(readLooking)
  const [f, setF] = useState<Filters>(DEFAULTS)
  const [sort, setSort] = useState<Sort>('new')
  const [showFilters, setShowFilters] = useState(false)
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF(prev => ({ ...prev, [k]: v }))

  const pool = useMemo(() => s.profiles.filter(p => !p.hidden), [s.profiles])
  const cities = useMemo(() => [...new Set(pool.map(p => p.city).filter(Boolean))].sort(), [pool])

  const list = useMemo(() => {
    const q = f.q.trim().toLowerCase()
    const score = (p: Profile) => matchOf(s.myApp, p)?.score ?? -1
    const out = pool.filter(p => {
      const a = age(p.dob)
      return p.gender === looking && a >= (f.amin || 18) && a <= (f.amax || 99)
        && (!f.sect || p.sect === f.sect) && (!f.practice || p.practice === f.practice) && (!f.city || p.city === f.city)
        && (!f.education || p.education === f.education) && (!f.marital || p.marital === f.marital)
        && (!f.photo || !!p.photo_path) && (!f.verified || p.verified)
        && (!q || [p.pid, p.profession, p.city, p.degree, p.caste, p.mother_tongue, p.first_name].join(' ').toLowerCase().includes(q))
    })
    if (sort === 'match') out.sort((a, b) => score(b) - score(a))
    else if (sort === 'ageA') out.sort((a, b) => age(a.dob) - age(b.dob))
    else if (sort === 'ageD') out.sort((a, b) => age(b.dob) - age(a.dob))
    return out
  }, [pool, f, looking, sort, s.myApp])

  const chooseLooking = (g: Gender) => {
    setLooking(g)
    try { localStorage.setItem('rg:lf', g) } catch { /* ignore */ }
  }
  const select = (k: 'sect' | 'practice' | 'city' | 'education' | 'marital', list: string[], translate = true) => (
    <select id={`f-${k}`} value={f[k]} onChange={e => set(k, e.target.value)}>
      <option value="">{t('any')}</option>
      {list.map(v => <option key={v} value={v}>{translate ? tv(v) : v}</option>)}
    </select>
  )

  return (
    <section className="browse">
      <aside className={`filters ${showFilters ? 'open' : ''}`} aria-label={t('filters')}>
        <h3>{t('lookingFor')}</h3>
        <div className="seg" role="group">
          <button type="button" aria-pressed={looking === 'F'} onClick={() => chooseLooking('F')}>{t('bride')}</button>
          <button type="button" aria-pressed={looking === 'M'} onClick={() => chooseLooking('M')}>{t('groom')}</button>
        </div>
        <label>{t('search')}<input id="f-q" type="search" value={f.q} placeholder={t('searchPh')} onChange={e => set('q', e.target.value)} /></label>
        <button type="button" className="btn filter-toggle" aria-expanded={showFilters} onClick={() => setShowFilters(v => !v)}>{t('filters')} {showFilters ? '▴' : '▾'}</button>
        <div className="more">
          <div className="row2">
            <label>{t('ageFrom')}<input id="f-amin" type="number" min={18} max={70} value={f.amin} onChange={e => set('amin', Number(e.target.value))} /></label>
            <label>{t('ageTo')}<input id="f-amax" type="number" min={18} max={70} value={f.amax} onChange={e => set('amax', Number(e.target.value))} /></label>
          </div>
          <label>{t('sect')}{select('sect', SECTS)}</label>
          <label>{t('practice')}{select('practice', PRACTICE)}</label>
          <label>{t('city')}{select('city', cities, false)}</label>
          <label>{t('education')}{select('education', EDUCATION)}</label>
          <label>{t('marital')}{select('marital', MARITAL)}</label>
          <label className="check"><input type="checkbox" checked={f.photo} onChange={e => set('photo', e.target.checked)} /> {t('withPhoto')}</label>
          <label className="check"><input type="checkbox" checked={f.verified} onChange={e => set('verified', e.target.checked)} /> {t('verifiedOnly')}</label>
          <button type="button" className="link" onClick={() => setF(DEFAULTS)}>{t('clear')}</button>
        </div>
      </aside>
      <div className="results">
        <div className="results-head">
          <p>{s.status === 'ready' && pool.length ? t('countLine', list.length, looking) : ''}</p>
          <label className="inline">{t('sort')}
            <select id="f-sort" value={sort} onChange={e => {
              const v = e.target.value as Sort
              setSort(v)
              if (v === 'match' && !s.myApp) toast(t('registerForMatch'))
            }}>
              <option value="new">{t('sortNew')}</option>
              <option value="match">{t('sortMatch')}</option>
              <option value="ageA">{t('sortAgeA')}</option>
              <option value="ageD">{t('sortAgeD')}</option>
            </select>
          </label>
        </div>
        <div className="grid">
          {!pool.length ? <EmptyState />
            : list.length ? list.map(p => <ProfileCard key={p.pid} p={p} />)
            : <div className="empty">{t('noMatch')}</div>}
        </div>
      </div>
    </section>
  )
}

export function Shortlist() {
  const { t } = useI18n()
  const s = useStore()
  const list = s.profiles.filter(p => !p.hidden && s.shortlist.has(p.pid))
  return (
    <section className="grid">
      {list.length ? list.map(p => <ProfileCard key={p.pid} p={p} />)
        : <div className="empty"><b>{t('shortEmptyT')}</b>{t('shortEmptyB')}</div>}
    </section>
  )
}
