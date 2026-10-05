import { useEffect, useRef } from 'react'

/*
  Product gallery shown in the studio stage for every watch.
  Every watch: a still photo, a drag-to-rotate 3D view, and an exploded
  "Inside" view with each part numbered and explained.
  PULSE also gets four screen images and a feature video.
  The 3D slides use the studio canvas underneath; image and video slides
  sit on top of it. Arrows, dots, keyboard arrows and swipe all work.
  All images and the video are rendered from our own 3D model
  (see tools/render-pulse.py).
*/

const BASE = import.meta.env.BASE_URL
const media = (f) => `${BASE}media/${f}`

const PULSE_SLIDES = [
  { type: 'photo', id: 'photo', label: 'Photo', src: media('pulse-photo.webp'), alt: 'KAIROS PULSE in black aluminium with a navy rubber strap' },
  { type: '3d', id: '360', label: '360°' },
  { type: 'back', id: 'back', label: 'Back', k: 'Sensor back', t: 'Heart rate, SpO2 and charging', s: 'Green and red LEDs, four photodiodes and two gold charging contacts under domed glass.' },
  { type: 'screen', page: 'apps', id: 'apps', label: 'Apps', src: media('pulse-apps.webp'), alt: 'PULSE app launcher with round app icons', k: 'Wear OS 4', t: 'Your apps on your wrist', s: 'Calls, messages, music, maps, weather and NFC payments.' },
  { type: 'screen', page: 'sports', id: 'sports', label: 'Sports', src: media('pulse-sports.webp'), alt: 'PULSE sports mode list', k: 'Sport', t: '100+ sports modes', s: 'Running, cycling, pool swim, badminton, skiing and more.' },
  { type: 'screen', page: 'workout', id: 'workout', label: 'Workout', src: media('pulse-workout.webp'), alt: 'PULSE live outdoor run with time, distance, pace and heart rate', k: 'Dual-band GPS', t: 'Every run, tracked right', s: 'L1 + L5 GPS, live pace and heart-rate zones.' },
  { type: 'screen', page: 'health', id: 'health', label: 'Health', src: media('pulse-health.webp'), alt: 'PULSE health page with heart rate, SpO2, sleep and stress', k: 'Health', t: 'Heart, SpO2, sleep, stress', s: 'Measured all day and shown on one page.' },
  { type: 'video', id: 'video', label: 'Video', src: media('pulse-features.mp4'), webm: media('pulse-features.webm'), poster: media('pulse-features-poster.webp') },
  { type: 'explode', id: 'inside', label: 'Inside' },
]

// parts in the exploded view: [part, name, what it does]
const PULSE_PARTS = [
  ['crystal', 'Toughened glass', 'Flat, scratch-resistant glass over the screen.'],
  ['bezel', 'Bezel', 'Raised aluminium ring that guards the glass edge.'],
  ['dial', 'AMOLED screen', '1.43 in, 466 x 466, up to 1000 nits, always-on.'],
  ['case', 'Aluminium case', '47 mm and 37 g. Sealed to 5 ATM and IP68.'],
  ['movement', 'Dual chips + battery', 'Snapdragon W5 and BES2700 with a 500 mAh cell for up to 100 hours.'],
  ['caseback', 'Sensor back', 'Heart-rate LEDs, SpO2 sensors, charging contacts and the founder\'s engraved signature.'],
]

// slides for any watch
export function slidesFor(watch) {
  if (watch.id === 'pulse') return PULSE_SLIDES
  return [
    { type: 'photo', id: 'photo', label: 'Photo', src: media(`${watch.id}-photo.webp`), alt: `${watch.name}, ${watch.category.toLowerCase()}` },
    { type: '3d', id: '360', label: '360°' },
    { type: 'back', id: 'back', label: 'Back', k: 'Caseback', t: 'Signed by our founder', s: 'Engraved details, a numbered serial and Priyanshu Saxena\'s signature in gold.' },
    { type: 'explode', id: 'inside', label: 'Inside' },
  ]
}

// exploded-view parts for any watch: [part, name, what it does]
export function partsFor(watch) {
  if (watch.id === 'pulse') return PULSE_PARTS
  const m = watch.look.model
  const dial = {
    void: ['Open dial', 'A skeleton chapter ring, so the whole movement shows through.'],
    apex: ['Chronograph dial', 'Three sub-dials for running seconds, 30 minutes and 12 hours.'],
    atlas: ['Dive dial', 'Large lume plots and a date window, easy to read underwater.'],
    mono: ['Dial', 'Matte black with a small seconds sub-dial at six.'],
    flora: ['Painted dial', 'Mother-of-pearl, with a cherry blossom branch painted by hand and diamond hour markers.'],
    jardin: ['Garden dial', 'Emerald sunray with an engraved gold vine, leaves and tiny flowers.'],
    luna: ['Night sky dial', 'Midnight blue with star dust, a polished crescent moon and a stone at every hour.'],
    aura: ['Dial', 'Blush pink sunray with slim indices and a single stone at twelve.'],
  }[m] || ['Dial', 'Sunray finish with applied, hand-set indices.']
  const bezel = {
    atlas: ['Dive bezel', 'Turns one way only, with a 60-minute scale to time a dive.'],
    apex: ['Tachymetre bezel', 'Reads speed over a measured distance with the chronograph.'],
    flora: ['Stone-set bezel', '44 brilliant-cut stones, each in its own polished setting.'],
    luna: ['Stone-set bezel', '44 brilliant-cut stones, each in its own polished setting.'],
  }[m] || ['Bezel', 'Polished ring that seats the crystal and seals the case.']
  return [
    ['crystal', 'Sapphire crystal', 'Scratch-resistant sapphire with anti-reflective coating.'],
    ['bezel', ...bezel],
    ['hands', 'Hands', 'Faceted and hand-polished, filled with lume.'],
    ['dial', ...dial],
    ['case', 'Case', `${watch.specs.Case}. Water resistant to ${watch.specs.Resistance}.`],
    ['movement', 'Calibre', `${watch.specs.Movement}: 28,800 vph, 25 jewels.`],
    ['caseback', 'Caseback', 'Sapphire window onto the rotor, engraved details and the founder\'s signature.'],
  ]
}

function Arrow({ dir }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      {dir < 0 ? <path d="M15 5l-7 7 7 7" /> : <path d="M9 5l7 7-7 7" />}
    </svg>
  )
}

export default function ProductGallery({ watch, slide, setSlide, live }) {
  const name = watch.name
  const SLIDES = slidesFor(watch)
  const PARTS = partsFor(watch)
  const n = SLIDES.length
  const cur = SLIDES[Math.min(slide, n - 1)]
  const video = useRef(null)
  const go = (d) => setSlide((s) => (s + d + n) % n)

  // play the video only while its slide is showing
  useEffect(() => {
    const v = video.current
    if (!v) return
    if (cur.type === 'video') {
      v.currentTime = 0
      v.play().catch(() => {})
    } else v.pause()
  }, [cur.type])

  // swipe on the image and video slides
  const swipe = useRef(null)
  const down = (e) => (swipe.current = e.clientX)
  const up = (e) => {
    if (swipe.current == null) return
    const dx = e.clientX - swipe.current
    swipe.current = null
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
  }

  const key = (e) => {
    // the 3D canvas uses the arrow keys to rotate, so leave those alone
    if (e.target.tagName === 'CANVAS' || e.target.tagName === 'VIDEO') return
    if (e.key === 'ArrowLeft') go(-1)
    else if (e.key === 'ArrowRight') go(1)
    else return
    e.preventDefault()
  }

  return (
    <div className="pg" role="region" aria-roledescription="carousel" aria-label={`${name} gallery`} onKeyDown={key}>
      {SLIDES.map((s, i) =>
        s.type === 'image' || s.type === 'video' || s.type === 'photo' || s.type === 'screen' || s.type === 'back' ? (
          <figure
            key={s.id}
            className={`pg-slide pg-${s.type} ${i === slide ? 'is-on' : ''} ${(live && (s.type === 'photo' || s.type === 'screen')) || s.type === 'back' ? 'is-live' : ''}`}
            aria-hidden={i !== slide}
            onPointerDown={down}
            onPointerUp={up}
          >
            {s.type === 'back' ? null : s.type !== 'video' ? (
              <img src={s.src} alt={s.alt} draggable="false" loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
            ) : (
              <video ref={video} poster={s.poster} muted playsInline loop controls preload="none" aria-label={`${name} feature video`}>
                <source src={s.webm} type="video/webm" />
                <source src={s.src} type="video/mp4" />
              </video>
            )}
            {s.t && (
              <figcaption className="pg-cap">
                <span>{s.k}</span>
                <strong>{s.t}</strong>
                <em>{s.s}</em>
              </figcaption>
            )}
          </figure>
        ) : null,
      )}

      {cur.type === 'explode' && (
        <ol className="pg-legend" aria-label={`Parts of ${name}`}>
          {PARTS.map(([part, title, text], i) => (
            <li key={part}>
              <em>{String(i + 1).padStart(2, '0')}</em>
              <strong>{title}</strong>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      )}

      <button className="icon-btn pg-arrow pg-prev" onClick={() => go(-1)} aria-label="Previous image">
        <Arrow dir={-1} />
      </button>
      <button className="icon-btn pg-arrow pg-next" onClick={() => go(1)} aria-label="Next image">
        <Arrow dir={1} />
      </button>

      <div className="pg-nav">
        <span className="pg-count" aria-live="polite">
          {String(slide + 1).padStart(2, '0')} / {String(n).padStart(2, '0')} <b>{cur.label}</b>
        </span>
        <div className="pg-dots">
          {SLIDES.map((s, i) => (
            <button key={s.id} className={i === slide ? 'is-on' : ''} onClick={() => setSlide(i)} aria-label={`Show ${s.label}`} aria-current={i === slide ? 'true' : undefined} />
          ))}
        </div>
      </div>
    </div>
  )
}
