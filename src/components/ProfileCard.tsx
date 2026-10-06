import { age, feet, matchOf } from '../lib/bio'
import { useI18n } from '../lib/i18n'
import { useStore } from '../lib/store'
import { useActions } from '../lib/useActions'
import type { Profile } from '../lib/types'
import { Photo } from './Photo'

export function MatchPill({ score }: { score: number }) {
  const { t } = useI18n()
  return <span className={`match ${score >= 70 ? '' : score >= 45 ? 'mid' : 'low'}`}>{t('match', score)}</span>
}

export function ProfileCard({ p }: { p: Profile }) {
  const { t, tv, comma } = useI18n()
  const s = useStore()
  const act = useActions()
  const mine = s.myApp?.pid === p.pid
  const sent = s.myInts.some(i => i.pid === p.pid)
  const short = s.shortlist.has(p.pid)
  const m = matchOf(s.myApp, p)
  const open = () => s.setDialog({ kind: 'profile', pid: p.pid })

  return (
    <article className="card">
      <button className="photo-btn" onClick={open} aria-label={`${t('biodata')} ${p.pid}`}>
        <Photo seed={p.pid} gender={p.gender} hijab={p.hijab} alt={p.first_name} publicPath={p.photo_path}
          locked={p.photo_private} lockLabel={t('privatePhoto')}>
          {p.verified && <span className="badge">{t('verified')}</span>}
          {m && <MatchPill score={m.score} />}
          <span className="photo-pid">{p.pid}</span>
        </Photo>
      </button>
      <div className="body">
        <div>
          <h4><bdi>{p.first_name}</bdi>{comma} {age(p.dob)}</h4>
          <div className="pid">{p.profession} · {p.city}</div>
        </div>
        <dl>
          <dt>{t('height')}</dt><dd><bdi>{feet(p.height_in)}</bdi></dd>
          <dt>{t('education')}</dt><dd>{p.degree || tv(p.education)}</dd>
          <dt>{t('deen')}</dt><dd>{tv(p.salah)}</dd>
        </dl>
        <div className="tags">
          <span className="tag ok">{tv(p.sect)}</span>
          <span className="tag">{tv(p.practice)}</span>
          {p.marital && p.marital !== 'Never married' && <span className="tag">{tv(p.marital)}</span>}
          {mine && <span className="tag ok">{t('yourProfile')}</span>}
        </div>
      </div>
      <div className="actions">
        <button className="btn" onClick={open}>{t('biodata')}</button>
        {!mine && <>
          <button className="btn primary grow" disabled={sent} onClick={() => void act.interest(p.pid)}>{t(sent ? 'intSent' : 'sendInt')}</button>
          <button className="btn heart" aria-pressed={short} aria-label={t('tabShort')} onClick={() => act.shortlist(p.pid)}>{short ? '♥' : '♡'}</button>
        </>}
      </div>
    </article>
  )
}
