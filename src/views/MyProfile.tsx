import * as api from '../lib/api'
import { useI18n } from '../lib/i18n'
import { useStore } from '../lib/store'
import { ApplicationForm } from '../components/ApplicationForm'
import { useToast } from '../components/Toast'

export function MyProfile() {
  const { t, fmtDate } = useI18n()
  const s = useStore()
  const toast = useToast()

  if (s.adding) {
    return (
      <section className="stack">
        <div className="notice warn"><div className="grow"><b>{t('addingT')}</b><br />{t('addingB')}</div></div>
        <ApplicationForm initial={null} submitLabel="publishBtn"
          onCancel={() => { s.setAdding(false); s.go('admin') }}
          onSubmit={async (input, photo) => {
            const pid = await api.staffAddProfile(input, photo instanceof Blob ? photo : null)
            toast(t('publishedAs', pid))
            s.setAdding(false); s.go('admin'); await s.reload()
          }} />
      </section>
    )
  }

  const a = s.myApp
  const body = !a ? null
    : a.status === 'pending' ? t('stPending', fmtDate(a.submitted_at))
    : a.status === 'approved' ? t('stApproved')
    : a.status === 'rejected' ? t('stRejected')
    : a.status === 'removal' ? t('stRemoval') : t('stRemoved')

  return (
    <section className="stack">
      {!a
        ? <div className="notice"><div className="grow"><b>{t('regT')}</b><br />{t('regB')}</div></div>
        : <div className={`notice ${a.status === 'rejected' ? 'bad' : a.status === 'approved' ? '' : 'warn'}`}>
            <div className="grow"><b>{t(`app_${a.status}` as const)}{a.pid && <> · <bdi>{a.pid}</bdi></>}</b><br />{body}</div>
            {a.status === 'approved' && a.pid && <>
              <button className="btn" onClick={() => s.setDialog({ kind: 'profile', pid: a.pid! })}>{t('viewMine')}</button>
              <button className="btn danger" onClick={async () => {
                try { await api.requestRemoval(a.id); toast(t('removalSent')); await s.reload() } catch { toast(t('errSave')) }
              }}>{t('askRemove')}</button>
            </>}
          </div>}
      <ApplicationForm key={a ? `${a.id}:${a.submitted_at}` : 'new'} initial={a} submitLabel={a ? 'submitChanges' : 'submitBtn'}
        onSubmit={async (input, photo) => {
          try { await api.submitApplication(s.uid, input, a, photo) }
          catch (e) { if (photo instanceof Blob) toast(t('uploadFail')); throw e }
          toast(t('sentReview')); window.scrollTo({ top: 0, behavior: 'smooth' }); await s.reload()
        }} />
    </section>
  )
}
