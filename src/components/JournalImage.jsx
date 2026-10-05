import { useState } from 'react'
import { JournalArt } from './Art'

const BASE = import.meta.env.BASE_URL

/*
  Journal picture: a render of our own 3D watch, stored with the site so it
  always loads. Falls back to the drawn illustration if the file is missing.
*/
export default function JournalImage({ a, className = 'journal-art', eager = false }) {
  const [failed, setFailed] = useState(false)
  if (!a.image || failed) return <JournalArt kind={a.art} />
  return (
    <img
      className={`photo is-loaded ${className}`}
      src={`${BASE}media/${a.image}`}
      alt={a.alt}
      width="1600"
      height="1000"
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
