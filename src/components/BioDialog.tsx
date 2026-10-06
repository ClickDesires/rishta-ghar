import { useEffect, useRef, useState } from 'react'
import { age, feet, matchOf, type Why } from '../lib/bio'
import { biodataPng, shareOrDownload } from '../lib/biodata'
import { approveApplication, rejectApplication, signedPhotoUrl } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { bureauPhone, useStore } from '../lib/store'
import { publicPhotoUrl } from '../lib/supabase'
import { useActions } from '../lib/useActions'
import type { Bio, Profile } from '../lib/types'
import { Photo } from './Photo'
import { useToast } from './Toast'

interface Shown extends Bio {
  pid: string | null
  name: string
  verified: boolean
  publicPath: string | null
  privatePath: string | null
  locked: boolean
  priv: { full_name: string; phone: string; guardian: string } | null
}

export function useWhyText() {
  const { t, tv } = useI18n()
  return ([k, v]: Why) => {
    switch (k) {
      case 'w_gap': return t('w_gap', v)
      case 'w_sect': return t('w_sect', tv(v))
      case 'w_city': return t('w_city', v)
      case 'w_lang': return t('w_lang', v)
      default: return t(k)
    }
  }
}

export function BioDialog() {
  const s = useStore()
  const { t, tv, comma, fmtDate } = useI18n()
  const toast = useToast()
  const act = useActions()
  const whyText = useWhyText()
  const ref = useRef<HTMLDialogElement>(null)
  const [busy, setBusy] = useState(false)
  const d = s.dialog

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (d && !el.open) el.showModal()
    if (!d && el.open) el.close()
  }, [d])

  let shown: Shown | null = null
  let profile: Profile | undefined
  const app = d?.kind === 'application' ? s.apps.find(a => a.id === d.id) : undefined
  if (d?.kind === 'profile') {
    profile = s.profiles.find(p => p.pid === d.pid)
    const v = profile && s.isStaff ? s.vault[profile.pid] : undefined
    if (profile) shown = {
      ...profile, name: profile.first_name, publicPath: profile.photo_path, privatePath: v?.private_photo_path ?? null,
      locked: profile.photo_private, priv: v ?? null,
    }
  } else if (app) {
    shown = {
      ...app, name: app.full_name, verified: false, publicPath: null, privatePath: app.photo_path, locked: false,
      priv: { full_name: app.full_name, phone: app.phone, guardian: app.guardian },
    }
  }

  const close = () => s.setDialog(null)
  const phone = bureauPhone(s.settings)

  async function download(withPrivate: boolean) {
    if (!profile) return
    toast(t('preparing'))
    try {
      const v = s.vault[profile.pid]
      const photoUrl = withPrivate && v?.private_photo_path ? await signedPhotoUrl(v.private_photo_path)
        : profile.photo_path ? publicPhotoUrl(profile.photo_path) : null
      const blob = await biodataPng(profile, { photoUrl, fullName: withPrivate ? v?.full_name : undefined, bureauPhone: phone })
      const r = await shareOrDownload(blob, `Biodata ${profile.pid}.png`)
      if (r !== 'cancelled') toast(t('bioSaved'))
    } catch (e) { console.error(e); toast(t('bioFail')) }
  }

  async function review(approve: boolean) {
    if (!app) return
    setBusy(true)
    try {
      if (approve) toast(t('publishedAs', await approveApplication(app)))
      else { await rejectApplication(app.id); toast(t('rejectedToast')) }
      close(); await s.reload()
    } catch (e) { console.error(e); toast(t('errSave')) }
    setBusy(false)
  }

  const m = profile ? matchOf(s.myApp, profile) : null
  const sugg = app ? s.profiles.filter(q => q.pid !== app.pid && !q.hidden).map(q => ({ q, m: matchOf(app, q)! })).filter(r => r.m)
    .sort((a, b) => b.m.score - a.m.score).slice(0, 5) : []
  const mine = !!profile && s.myApp?.pid === profile.pid
  const sent = !!profile && s.myInts.some(i => i.pid === profile!.pid)

  return (
    <dialog ref={ref} onClose={close} onClick={e => { if (e.target === ref.current) close() }}>
      {shown && <>
        <div className="bio-head">
          <Photo seed={shown.pid ?? shown.name} gender={shown.gender} hijab={shown.hijab} alt={shown.name}
            publicPath={shown.publicPath} privatePath={shown.privatePath} locked={shown.locked} lockLabel={t('privatePhoto')}>
            {shown.verified && <span className="badge">{t('verified')}</span>}
          </Photo>
          <div className="info">
            <h3><bdi>{shown.name}</bdi></h3>
            <div className="pid">{shown.pid ? <bdi>{shown.pid}</bdi> : t('notPublished')}</div>
            <div>{age(shown.dob)} {t('yrs')} · <bdi>{feet(shown.height_in)}</bdi> · {tv(shown.marital)}</div>
            <div className="tags"><span className="tag ok">{tv(shown.sect)}</span><span className="tag">{tv(shown.practice)}</span></div>
          </div>
        </div>
        <div className="bio-body">
          {app && <div><span className={`status ${app.status}`}>{t(`app_${app.status}` as const)}</span> <span className="pid">{t('submittedOn', fmtDate(app.submitted_at))}</span></div>}
          {m && <div>
            <h5>{t('matchWhy', m.score)}</h5>
            <div className="tags">{m.why.length ? m.why.map((w, i) => <span key={i} className="tag ok">{whyText(w)}</span>) : <span className="tag">{t('fewCommon')}</span>}</div>
          </div>}
          {app && <div>
            <h5>{t('suggested')}</h5>
            {sugg.length ? <div className="sugg">{sugg.map(({ q, m }) => (
              <button key={q.pid} onClick={() => s.setDialog({ kind: 'profile', pid: q.pid })}>
                <Photo className="thumb" seed={q.pid} gender={q.gender} hijab={q.hijab} alt="" publicPath={q.photo_path} privatePath={s.vault[q.pid]?.private_photo_path} />
                <span className="grow"><b><bdi>{s.vault[q.pid]?.full_name ?? q.first_name}</bdi></b>{comma} {age(q.dob)} · {q.city}<br />
                  <span className="pid"><bdi>{q.pid}</bdi> · {m.why.slice(0, 3).map(whyText).join(t('join'))}</span></span>
                <span className="status approved">{m.score}%</span>
              </button>))}</div> : <p className="pid">{t('noOpp')}</p>}
          </div>}
          {shown.priv && <div className="private">
            <h5>{t('bureauOnly')}</h5>
            <dl>
              <dt>{t('fullName')}</dt><dd>{shown.priv.full_name}</dd>
              <dt>{t('phoneL')}</dt><dd><bdi>{shown.priv.phone || '—'}</bdi></dd>
              <dt>{t('guardianL')}</dt><dd>{shown.priv.guardian || '—'}</dd>
            </dl>
          </div>}
          <div><h5>{t('about')}</h5><p>{shown.about || '—'}</p></div>
          <div><h5>{t('deen')}</h5><dl>
            <dt>{t('sect')}</dt><dd>{tv(shown.sect)}</dd>
            <dt>{t('practiceL')}</dt><dd>{tv(shown.practice)}</dd>
            <dt>{t('salah')}</dt><dd>{tv(shown.salah)}</dd>
            {shown.gender === 'F' && <><dt>{t('hijab')}</dt><dd>{tv(shown.hijab || '—')}</dd></>}
          </dl></div>
          <div><h5>{t('background')}</h5><dl>
            <dt>{t('caste')}</dt><dd>{shown.caste || t('notSpec')}</dd>
            <dt>{t('motherTongue')}</dt><dd>{shown.mother_tongue || '—'}</dd>
            <dt>{t('education')}</dt><dd>{[shown.degree, tv(shown.education)].filter(Boolean).join(' · ')}</dd>
            <dt>{t('profession')}</dt><dd>{shown.profession}</dd>
            <dt>{t('city')}</dt><dd>{shown.city}</dd>
            <dt>{t('father')}</dt><dd>{shown.father || '—'}</dd>
            <dt>{t('siblings')}</dt><dd>{shown.siblings || '—'}</dd>
          </dl></div>
          {!shown.priv && <p className="pid">{t('sharedNote')} {t('orCall', phone)}</p>}
        </div>
        <div className="bio-foot">
          <button className="btn" onClick={close}>{t('close')}</button>
          {profile && <button className="btn" onClick={() => void download(false)}>{t('dlBio')}</button>}
          {profile && s.isStaff && profile.photo_private && s.vault[profile.pid]?.private_photo_path &&
            <button className="btn" onClick={() => void download(true)}>{t('dlPriv')}</button>}
          {profile && !mine && <>
            <button className="btn heart" aria-pressed={s.shortlist.has(profile.pid)} onClick={() => act.shortlist(profile!.pid)}>
              {t(s.shortlist.has(profile.pid) ? 'shortlisted' : 'shortlistBtn')}</button>
            <button className="btn primary" disabled={sent} onClick={() => void act.interest(profile!.pid)}>{t(sent ? 'intSent' : 'sendInt')}</button>
          </>}
          {app?.status === 'pending' && <>
            <button className="btn danger" disabled={busy} onClick={() => void review(false)}>{t('reject')}</button>
            <button className="btn primary" disabled={busy} onClick={() => void review(true)}>{t('approvePub')}</button>
          </>}
        </div>
      </>}
    </dialog>
  )
}

