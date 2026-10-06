import { useCallback } from 'react'
import * as api from './api'
import { useI18n } from './i18n'
import { useStore } from './store'
import { useToast } from '../components/Toast'

/** Member actions shared by cards, the biodata dialog and the interests list. */
export function useActions() {
  const { t } = useI18n()
  const toast = useToast()
  const s = useStore()

  const interest = useCallback(async (pid: string) => {
    if (!s.myApp) {
      toast(t('registerFirst'))
      s.setDialog(null)
      s.go('reg')
      return
    }
    try { await api.sendInterest(pid); toast(t('intSentToast')); await s.reload() }
    catch (e) { console.error(e); toast(t('errSave')) }
  }, [s, t, toast])

  const withdraw = useCallback(async (id: number) => {
    try { await api.withdrawInterest(id); toast(t('withdrawn')); await s.reload() }
    catch (e) { console.error(e); toast(t('errSave')) }
  }, [s, t, toast])

  const shortlist = useCallback((pid: string) => {
    toast(t(s.toggleShort(pid) ? 'addedShort' : 'removedShort'))
  }, [s, t, toast])

  return { interest, withdraw, shortlist }
}
