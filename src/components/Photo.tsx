import { useEffect, useState, type ReactNode } from 'react'
import { portraitSvg } from '../lib/bio'
import { signedPhotoUrl } from '../lib/api'
import { publicPhotoUrl } from '../lib/supabase'

interface Props {
  seed: string
  gender: string
  hijab?: string
  alt: string
  /** Path in the public bucket. */
  publicPath?: string | null
  /** Path in the private bucket — only staff and the owner can open it. */
  privatePath?: string | null
  /** Show the blurred, locked illustration instead of a photo. */
  locked?: boolean
  lockLabel?: string
  className?: string
  children?: ReactNode
}

export function usePrivatePhoto(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    setUrl(null)
    if (path) void signedPhotoUrl(path).then(u => { if (live) setUrl(u) })
    return () => { live = false }
  }, [path])
  return url
}

export function Photo({ seed, gender, hijab, alt, publicPath, privatePath, locked, lockLabel, className = '', children }: Props) {
  const privateUrl = usePrivatePhoto(privatePath)
  const src = privateUrl ?? (publicPath ? publicPhotoUrl(publicPath) : null)
  const showLock = locked && !privateUrl
  return (
    <div className={`photo ${showLock ? 'locked' : ''} ${className}`}>
      {src
        ? <img src={src} alt={alt} loading="lazy" />
        : <span className="art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: portraitSvg(seed, gender, hijab) }} />}
      {showLock && lockLabel && (
        <span className="lock">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          {lockLabel}
        </span>
      )}
      {children}
    </div>
  )
}
