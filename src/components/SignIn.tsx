import { useState, type FormEvent } from 'react'
import { useI18n } from '../lib/i18n'
import { supabase } from '../lib/supabase'

export function SignIn() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function sendCode(e: FormEvent) {
    e.preventDefault()
    const addr = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) { setErr(t('badEmail')); return }
    setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithOtp({ email: addr, options: { shouldCreateUser: true } })
    setBusy(false)
    if (error) { console.error(error); setErr(t('codeFail')); return }
    setEmail(addr); setStep('code')
  }

  async function verify(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setErr('')
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' })
    setBusy(false)
    if (error) { console.error(error); setErr(t('badCode')) }
  }

  return (
    <section className="signin">
      <h2>{t('signInT')}</h2>
      {step === 'email' ? (
        <form onSubmit={e => void sendCode(e)} noValidate>
          <p>{t('signInB')}</p>
          <label>{t('email')}<input id="si-email" type="email" inputMode="email" autoComplete="email" dir="ltr" value={email} onChange={e => setEmail(e.target.value)} required /></label>
          <button className="btn primary big" type="submit" disabled={busy}>{t('sendCode')}</button>
        </form>
      ) : (
        <form onSubmit={e => void verify(e)} noValidate>
          <p>{t('codeSent', email)}</p>
          <label>{t('codeL')}<input id="si-code" inputMode="numeric" autoComplete="one-time-code" dir="ltr" maxLength={10} value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))} required /></label>
          <button className="btn primary big" type="submit" disabled={busy || code.length < 6}>{t('verify')}</button>
          <button className="link" type="button" onClick={() => { setStep('email'); setCode(''); setErr('') }}>{t('changeEmail')}</button>
        </form>
      )}
      {err && <p className="err" role="alert">{err}</p>}
      <p className="hint">{t('privacyNote')}</p>
    </section>
  )
}
