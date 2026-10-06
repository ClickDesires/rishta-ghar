import { age } from '../lib/bio'
import { useI18n } from '../lib/i18n'
import { useStore } from '../lib/store'
import { useActions } from '../lib/useActions'
import { Photo } from '../components/Photo'

export function Interests() {
  const { t, comma, fmtDate } = useI18n()
  const s = useStore()
  const act = useActions()

  return (
    <section className="two">
      <div className="panel">
        <h3>{t('intsSentT')}</h3>
        {!s.myInts.length && <div className="li muted"><div className="grow">{t('noInts')}</div></div>}
        {s.myInts.map(i => {
          const p = s.profiles.find(x => x.pid === i.pid)
          return (
            <div className="li" key={i.id}>
              {p ? <Photo className="thumb" seed={p.pid} gender={p.gender} hijab={p.hijab} alt="" publicPath={p.photo_path} />
                : <div className="thumb" />}
              <div className="grow">
                <b>{p ? <><bdi>{p.first_name}</bdi>{comma} {age(p.dob)}</> : t('gone')}</b>{p && ` · ${p.city}`}<br />
                <span className="pid"><bdi>{i.pid}</bdi> · {t('sentOn', fmtDate(i.created_at))}</span>
                {i.status === 'accepted' && <><br /><span className="pid">{t('willCall')}</span></>}
              </div>
              <span className={`status ${i.status}`}>{t(`int_${i.status}` as const)}</span>
              {i.status === 'pending' && <button className="btn sm" onClick={() => void act.withdraw(i.id)}>{t('withdraw')}</button>}
            </div>
          )
        })}
      </div>
      <div className="panel">
        <h3>{t('howT')}</h3>
        {(['1', '2', '3'] as const).map(n => (
          <div className="li" key={n}><div className="grow"><b>{t(`how${n}T`)}</b><br /><span className="pid">{t(`how${n}`)}</span></div></div>
        ))}
      </div>
    </section>
  )
}
