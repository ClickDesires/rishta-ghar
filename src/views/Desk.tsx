import { useEffect, useState } from 'react'
import * as api from '../lib/api'
import { age } from '../lib/bio'
import { useI18n } from '../lib/i18n'
import { useStore } from '../lib/store'
import type { InterestStatus, Profile, Settings } from '../lib/types'
import { Photo } from '../components/Photo'
import { useToast } from '../components/Toast'

export function Desk() {
  const { t, comma, fmtDate } = useI18n()
  const s = useStore()
  const toast = useToast()
  const [armed, setArmed] = useState<string | null>(null)
  useEffect(() => {
    if (!armed) return
    const id = window.setTimeout(() => setArmed(null), 4000)
    return () => window.clearTimeout(id)
  }, [armed])

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try { await fn(); if (ok) toast(ok); await s.reload() } catch (e) { console.error(e); toast(t('errSave')) }
  }

  const open = s.apps.filter(a => a.status === 'pending' || a.status === 'removal')
  const byUser = new Map(s.apps.map(a => [a.user_id, a]))
  const live = s.profiles.filter(p => !p.hidden)

  const remove = (p: Profile, confirmed = false) => {
    if (!confirmed && armed !== p.pid) { setArmed(p.pid); return }
    setArmed(null)
    void run(() => api.removeProfile(p), t('removedPid', p.pid))
  }

  return (
    <section className="stack">
      <div className="stats">
        <div className="stat"><b>{open.length}</b><span>{t('statWaiting')}</span></div>
        <div className="stat"><b>{live.length}</b><span>{t('statPublished')}</span></div>
        <div className="stat"><b>{s.allInts.filter(i => i.status === 'pending').length}</b><span>{t('statOpen')}</span></div>
      </div>
      <div className="actions"><button className="btn primary" onClick={() => { s.setAdding(true); s.go('reg') }}>{t('addClient')}</button></div>

      <div className="panel">
        <h3>{t('appsT')} <small>{t('appsHint')}</small></h3>
        {!open.length && <div className="li muted"><div className="grow">{t('noApps')}</div></div>}
        {open.map(a => {
          const p = a.pid ? s.profiles.find(x => x.pid === a.pid) : undefined
          return (
            <div className="li" key={a.id}>
              <Photo className="thumb" seed={a.id} gender={a.gender} hijab={a.hijab} alt="" privatePath={a.photo_path} />
              <div className="grow">
                <b><bdi>{a.full_name}</bdi></b>{comma} {age(a.dob)} · {t(a.gender === 'F' ? 'genderF' : 'genderM')} · {a.city}<br />
                <span className="pid">{a.profession} · <bdi>{a.phone}</bdi>{a.pid && <> · {t('updating', a.pid)}</>}</span>
              </div>
              <span className={`status ${a.status}`}>{t(`app_${a.status}` as const)}</span>
              <button className="btn sm" onClick={() => s.setDialog({ kind: 'application', id: a.id })}>{t('biodata')}</button>
              {a.status === 'removal'
                ? p && <button className="btn sm danger" onClick={() => remove(p, true)}>{t('removeProfile')}</button>
                : <>
                    <button className="btn sm danger" onClick={() => void run(() => api.rejectApplication(a.id), t('rejectedToast'))}>{t('reject')}</button>
                    <button className="btn sm primary" onClick={() => void run(async () => toast(t('publishedAs', await api.approveApplication(a))))}>{t('approve')}</button>
                  </>}
            </div>
          )
        })}
      </div>

      <div className="panel">
        <h3>{t('intsT')} <small>{t('intsHint')}</small></h3>
        {!s.allInts.length && <div className="li muted"><div className="grow">{t('noIntsAdmin')}</div></div>}
        {s.allInts.map(i => {
          const from = byUser.get(i.from_user), target = s.profiles.find(p => p.pid === i.pid), v = s.vault[i.pid]
          return (
            <div className="li" key={i.id}>
              <div className="grow">
                <b>{from ? <><bdi>{from.full_name}</bdi>{from.pid && <> (<bdi>{from.pid}</bdi>)</>} · <bdi>{from.phone}</bdi></> : t('unregistered')}</b><br />
                <span className="pid">{t('interestedIn', i.pid)}
                  {v ? <> · <bdi>{v.full_name}</bdi> · <bdi>{v.phone}</bdi></> : target ? <> · {target.first_name}</> : <> · {t('noLonger')}</>}
                  {' · '}{fmtDate(i.created_at)}</span>
              </div>
              <select className="auto" value={i.status} aria-label={t('thStatus')}
                onChange={e => void run(() => api.setInterestStatus(i.id, e.target.value as InterestStatus), t('intUpdated'))}>
                {(['pending', 'accepted', 'declined'] as const).map(st => <option key={st} value={st}>{t(`int_${st}`)}</option>)}
              </select>
            </div>
          )
        })}
      </div>

      <div className="panel">
        <h3>{t('profT')}</h3>
        {!s.profiles.length ? <div className="li muted"><div className="grow">{t('nothingPub')}</div></div> :
          <div className="table">
            <table>
              <thead><tr><th>{t('thId')}</th><th>{t('thName')}</th><th>{t('thAge')}</th><th>{t('city')}</th><th>{t('phoneL')}</th><th>{t('thStatus')}</th><th></th></tr></thead>
              <tbody>
                {s.profiles.map(p => {
                  const v = s.vault[p.pid]
                  return (
                    <tr key={p.pid}>
                      <td><bdi>{p.pid}</bdi></td><td><bdi>{v?.full_name ?? p.first_name}</bdi></td><td>{age(p.dob)}</td><td>{p.city}</td>
                      <td><bdi>{v?.phone || '—'}</bdi></td>
                      <td>{p.hidden ? <span className="status declined">{t('hiddenS')}</span> : <span className="status approved">{t('liveS')}</span>}</td>
                      <td><div className="actions">
                        <button className="btn sm" onClick={() => s.setDialog({ kind: 'profile', pid: p.pid })}>{t('view')}</button>
                        <button className="btn sm" onClick={() => void run(() => api.setProfileFlags(p.pid, { verified: !p.verified }))}>{t(p.verified ? 'unverify' : 'markVer')}</button>
                        <button className="btn sm" onClick={() => void run(() => api.setProfileFlags(p.pid, { hidden: !p.hidden }), t(p.hidden ? 'liveAgain' : 'hiddenToast'))}>{t(p.hidden ? 'showP' : 'hideP')}</button>
                        <button className={`btn sm danger ${armed === p.pid ? 'armed' : ''}`} onClick={() => remove(p)}>{t(armed === p.pid ? 'confirmRemove' : 'remove')}</button>
                      </div></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>}
      </div>

      <div className="panel">
        <h3>{t('detailsT')} <small>{t('detailsHint')}</small></h3>
        <SettingsForm key={JSON.stringify(s.settings)} initial={s.settings} onSave={form => void run(() => api.saveSettings(form), t('detailsSaved'))} />
      </div>
    </section>
  )
}

function SettingsForm({ initial, onSave }: { initial: Settings; onSave: (s: Settings) => void }) {
  const { t } = useI18n()
  const [form, setForm] = useState<Settings>(initial)
  return (
    <form className="settings" onSubmit={e => { e.preventDefault(); onSave(form) }}>
      <label>{t('phoneWa')}<input id="s-phone" dir="ltr" type="tel" value={form.phone} placeholder="+92 300 000 0000" onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
      <label>{t('hoursL')}<input id="s-hours" value={form.hours} placeholder={t('hoursDefault')} onChange={e => setForm({ ...form, hours: e.target.value })} /></label>
      <label>{t('addrL')}<input id="s-addr" value={form.addr} placeholder={t('addrPh')} onChange={e => setForm({ ...form, addr: e.target.value })} /></label>
      <div className="end"><button className="btn primary" type="submit">{t('saveDetails')}</button></div>
    </form>
  )
}
