import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useI18n } from '../lib/i18n'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const standalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/** "Install app": Android/desktop use the browser prompt; iPhone gets the Add to Home Screen tip. */
export function InstallButton() {
  const { t } = useI18n()
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null)
  const [tip, setTip] = useState(false)
  const [installed, setInstalled] = useState(standalone)

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as BeforeInstallPromptEvent) }
    const onInstalled = () => { setInstalled(true); setEvt(null) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled) }
  }, [])

  if (installed || (!evt && !isIos())) return null
  return (
    <>
      <button className="btn install" onClick={async () => {
        if (evt) { await evt.prompt(); const r = await evt.userChoice; if (r.outcome === 'accepted') setEvt(null) }
        else setTip(true)
      }}>⤓ {t('install')}</button>
      {tip && (
        <div className="ios-tip" role="dialog">
          <p>{t('iosInstall')}</p>
          <button className="btn primary" onClick={() => setTip(false)}>{t('gotIt')}</button>
        </div>
      )}
    </>
  )
}

/** Tells people when a new version of the app has downloaded. */
export function UpdateBanner() {
  const { t } = useI18n()
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()
  if (!needRefresh) return null
  return (
    <div className="update" role="status">
      {t('updateReady')} <button className="btn primary sm" onClick={() => void updateServiceWorker(true)}>{t('reload')}</button>
    </div>
  )
}
