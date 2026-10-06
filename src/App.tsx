import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { configured, supabase } from './lib/supabase'
import { I18nProvider, useI18n } from './lib/i18n'
import { bureauPhone, StoreProvider, useStore, type View } from './lib/store'
import * as api from './lib/api'
import type { Settings } from './lib/types'
import { ToastProvider } from './components/Toast'
import { SignIn } from './components/SignIn'
import { BioDialog } from './components/BioDialog'
import { InstallButton, UpdateBanner } from './components/Install'
import { Browse, Shortlist } from './views/Browse'
import { Interests } from './views/Interests'
import { MyProfile } from './views/MyProfile'
import { Desk } from './views/Desk'

function Logo() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <circle cx="13" cy="17" r="9" fill="none" stroke="var(--henna)" strokeWidth="2.4" />
      <circle cx="21" cy="17" r="9" fill="none" stroke="var(--marigold)" strokeWidth="2.4" />
    </svg>
  )
}

function LangButton() {
  const { lang, setLang } = useI18n()
  return lang === 'en'
    ? <button className="lang" lang="ur" onClick={() => setLang('ur')}>اردو</button>
    : <button className="lang" lang="en" onClick={() => setLang('en')}>English</button>
}

function Intro({ settings }: { settings: Settings }) {
  const { t } = useI18n()
  return (
    <section className="intro">
      <div>
        <p className="bismillah" lang="ar">بسم الله الرحمن الرحيم</p>
        <h2>{t('heroTitle')}</h2>
        <p>{t('heroText')}</p>
      </div>
      <div className="office">
        <span>{settings.hours || t('hoursDefault')}</span><br />
        <b dir="ltr">{bureauPhone(settings)}</b>
        {settings.addr && <><br /><span>{settings.addr}</span></>}
      </div>
    </section>
  )
}

function Brand() {
  const { t } = useI18n()
  return (
    <div className="brand">
      <Logo />
      <div><h1>{t('brand')}</h1><small>{t('brandSub')}</small></div>
    </div>
  )
}

function Main() {
  const { t } = useI18n()
  const s = useStore()
  const pending = s.apps.filter(a => a.status === 'pending' || a.status === 'removal').length
  const tabs: [View, ReturnType<typeof t>, number?][] = [
    ['browse', t('tabBrowse')],
    ['short', t('tabShort'), s.shortlist.size],
    ['int', t('tabInt'), s.myInts.length],
    ['reg', t('tabReg')],
    ...(s.isStaff ? [['admin', t('tabAdmin'), pending] as [View, string, number]] : []),
  ]
  const icons: Record<View, string> = { browse: '⌕', short: '♡', int: '✉', reg: '☺', admin: '▦' }

  return (
    <>
      <header>
        <div className="wrap bar">
          <Brand />
          <nav className="tabs" role="tablist">
            {tabs.map(([v, label, n]) => (
              <button key={v} role="tab" aria-selected={s.view === v} onClick={() => { if (v !== 'reg') s.setAdding(false); s.go(v) }}>
                <span className="ico" aria-hidden="true">{icons[v]}</span><span>{label}</span>
                {!!n && <span className="count">{n}</span>}
              </button>
            ))}
          </nav>
          <div className="tools">
            <InstallButton />
            <LangButton />
            <button className="btn sm" onClick={() => void supabase.auth.signOut()} title={s.email}>{t('signOut')}</button>
          </div>
        </div>
      </header>
      <div className="wrap">
        {s.view === 'browse' && <Intro settings={s.settings} />}
        <main>
          {s.view === 'browse' && <Browse />}
          {s.view === 'short' && <Shortlist />}
          {s.view === 'int' && <Interests />}
          {s.view === 'reg' && <MyProfile />}
          {s.view === 'admin' && <Desk />}
        </main>
      </div>
      <BioDialog />
    </>
  )
}

function SignedOut() {
  const [settings, setSettings] = useState<Settings>({ phone: '', hours: '', addr: '' })
  useEffect(() => { api.loadSettings().then(setSettings).catch(() => {}) }, [])
  return (
    <>
      <header><div className="wrap bar"><Brand /><div className="tools"><InstallButton /><LangButton /></div></div></header>
      <div className="wrap">
        <Intro settings={settings} />
        <main><SignIn /></main>
      </div>
    </>
  )
}

function Setup() {
  return (
    <div className="wrap">
      <main className="signin">
        <h2>Almost ready</h2>
        <p>Add your Supabase project URL and public key to a <code>.env</code> file (see <code>.env.example</code> and the README), then restart the app.</p>
      </main>
    </div>
  )
}

function Shell() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  useEffect(() => {
    if (!configured) return
    void supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!configured) return <Setup />
  if (session === undefined) return null
  if (!session) return <SignedOut />
  return (
    <StoreProvider key={session.user.id} uid={session.user.id} email={session.user.email ?? ''}>
      <Main />
    </StoreProvider>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        <Shell />
        <UpdateBanner />
      </ToastProvider>
    </I18nProvider>
  )
}
