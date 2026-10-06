import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as api from './api'
import type { Application, Interest, Profile, Settings, Vault } from './types'

export type View = 'browse' | 'short' | 'int' | 'reg' | 'admin'
export type Dialog = { kind: 'profile'; pid: string } | { kind: 'application'; id: string } | null

interface Store {
  uid: string
  email: string
  status: 'loading' | 'ready' | 'error'
  isStaff: boolean
  settings: Settings
  profiles: Profile[]
  myApp: Application | null
  myInts: Interest[]
  apps: Application[]
  allInts: Interest[]
  vault: Record<string, Vault>
  shortlist: Set<string>
  toggleShort: (pid: string) => boolean
  reload: () => Promise<void>
  view: View
  go: (v: View) => void
  dialog: Dialog
  setDialog: (d: Dialog) => void
  adding: boolean
  setAdding: (b: boolean) => void
}

const Ctx = createContext<Store | null>(null)
const EMPTY: Settings = { phone: '', hours: '', addr: '' }
const VIEWS: View[] = ['browse', 'short', 'int', 'reg', 'admin']

function readShortlist(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem('rg:short') || '[]') as string[]) } catch { return new Set() }
}
function readView(): View {
  const h = location.hash.slice(1) as View
  return VIEWS.includes(h) ? h : 'browse'
}

export function StoreProvider({ uid, email, children }: { uid: string; email: string; children: ReactNode }) {
  const [status, setStatus] = useState<Store['status']>('loading')
  const [isStaff, setIsStaff] = useState(false)
  const [settings, setSettings] = useState<Settings>(EMPTY)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [myApp, setMyApp] = useState<Application | null>(null)
  const [myInts, setMyInts] = useState<Interest[]>([])
  const [apps, setApps] = useState<Application[]>([])
  const [allInts, setAllInts] = useState<Interest[]>([])
  const [vault, setVault] = useState<Record<string, Vault>>({})
  const [shortlist, setShortlist] = useState(readShortlist)
  const [view, setView] = useState<View>(readView)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [adding, setAdding] = useState(false)

  const reload = useCallback(async () => {
    try {
      const [s, p, a, i, staff] = await Promise.all([
        api.loadSettings(), api.loadProfiles(), api.loadMyApplication(uid), api.loadMyInterests(uid), api.loadIsStaff(uid),
      ])
      setSettings(s); setProfiles(p); setMyApp(a); setMyInts(i); setIsStaff(staff)
      if (staff) {
        const [as, is, vs] = await Promise.all([api.loadApplications(), api.loadAllInterests(), api.loadVault()])
        setApps(as); setAllInts(is); setVault(Object.fromEntries(vs.map(v => [v.pid, v])))
      }
      setStatus('ready')
    } catch (e) {
      console.error(e)
      setStatus(s => (s === 'ready' ? s : 'error'))
    }
  }, [uid])

  useEffect(() => { void reload() }, [reload])
  // Pick up the bureau's changes when someone comes back to the app.
  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === 'visible') void reload() }
    document.addEventListener('visibilitychange', onFocus)
    return () => document.removeEventListener('visibilitychange', onFocus)
  }, [reload])

  const go = useCallback((v: View) => {
    setView(v)
    try { history.replaceState(null, '', '#' + v) } catch { /* ignore */ }
    window.scrollTo({ top: 0 })
  }, [])

  const toggleShort = useCallback((pid: string) => {
    const added = !shortlist.has(pid)
    const next = new Set(shortlist)
    if (added) next.add(pid); else next.delete(pid)
    setShortlist(next)
    try { localStorage.setItem('rg:short', JSON.stringify([...next])) } catch { /* ignore */ }
    return added
  }, [shortlist])

  const value = useMemo<Store>(() => ({
    uid, email, status, isStaff, settings, profiles, myApp, myInts, apps, allInts, vault, shortlist, toggleShort, reload,
    view: view === 'admin' && !isStaff ? 'browse' : view, go, dialog, setDialog, adding, setAdding,
  }), [uid, email, status, isStaff, settings, profiles, myApp, myInts, apps, allInts, vault, shortlist, toggleShort, reload, view, go, dialog, adding])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore must be used inside StoreProvider')
  return v
}

export const bureauPhone = (s: Settings) => s.phone || '+92 300 000 0000'
