import { useState } from 'react'
import { photos, photoUrl, photoSrcSet } from '../data/photos'

/*
  Responsive, lazy-loaded photo with a graceful fallback.
  If the image cannot load (offline, blocked CDN), `fallback` is rendered
  instead, usually one of the original SVG illustrations, so the layout
  never shows a broken image.
*/
export default function Photo({ name, sizes = '(max-width: 768px) 90vw, 45vw', className = '', eager = false, fallback = null }) {
  const p = photos[name]
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  if (!p || failed) return fallback

  return (
    <img
      className={`photo ${loaded ? 'is-loaded' : ''} ${className}`}
      src={photoUrl(p, 1200)}
      srcSet={photoSrcSet(p)}
      sizes={sizes}
      alt={p.alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
    />
  )
}
