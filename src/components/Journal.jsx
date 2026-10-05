import { useEffect, useRef, useState } from 'react'
import JournalImage from './JournalImage'
import { ArrowIcon } from './Icons'
import { articles } from '../data/journal'
import { useShop } from '../store'
import { gsap, prefersReducedMotion } from '../lib/gsap'
import useMedia from '../hooks/useMedia'

/*
  The KAIROS Journal as a curved-screen carousel.
  The section pins and scrolling moves through the stories. The centre story
  is shown on a concave, curved screen (built from thin vertical slices
  placed on a cylinder with CSS 3D), with the neighbours turned away in
  perspective. Prev / next buttons and the story list work with a keyboard.
  Reduced motion gets a simple editorial grid instead.
*/

const SLICES = 16

function Media({ a }) {
  return <JournalImage a={a} />
}

// one panel, cut into vertical slices that sit on the inside of a cylinder
function CurvedPanel({ a, curved }) {
  if (!curved) {
    return (
      <div className="jc-flat">
        <Media a={a} />
      </div>
    )
  }
  // panel width in px (matches the CSS) and the cylinder radius
  const W = Math.min(window.innerWidth * 0.62, 900)
  const R = W * 0.78
  return (
    <div className="jc-curve" style={{ '--r': `${R}px` }}>
      {Array.from({ length: SLICES }, (_, k) => (
        <div
          key={k}
          className="jc-slice"
          style={{
            '--k': k,
            '--n': SLICES,
            // angle of this slice on the cylinder (concave, so edges turn toward you)
            '--a': `${(-((k - (SLICES - 1) / 2) * (W / SLICES)) / R).toFixed(4)}rad`,
            '--shade': (1 - (Math.abs(k - (SLICES - 1) / 2) / SLICES) * 0.6).toFixed(3),
          }}
        >
          <div className="jc-slice-inner">
            <Media a={a} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Journal() {
  const { setDrawer } = useShop()
  const root = useRef(null)
  const [pos, setPos] = useState(0)
  const [reduced] = useState(prefersReducedMotion)
  const mobile = useMedia('(max-width: 767px)')
  const trig = useRef(null)
  const n = articles.length

  useEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const st = { p: 0 }
      gsap.to(st, {
        p: n - 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.jc-pin',
          start: 'top top',
          end: () => '+=' + window.innerHeight * (n - 0.5),
          pin: true,
          scrub: 0.7,
          snap: { snapTo: 1 / (n - 1), duration: { min: 0.2, max: 0.6 }, ease: 'power2.inOut' },
          onRefresh: (self) => (trig.current = self),
          onUpdate: (self) => (trig.current = self),
        },
        onUpdate: () => setPos(st.p),
      })
    }, root)
    return () => ctx.revert()
  }, [reduced, n])

  const active = Math.round(pos)
  const goTo = (i) => {
    const t = trig.current
    if (!t) return
    const y = t.start + ((t.end - t.start) * i) / (n - 1)
    window.scrollTo({ top: y + 2, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }
  const open = (a) => setDrawer({ type: 'article', id: a.id })

  if (reduced) {
    return (
      <section id="journal" className="section journal theme-light" aria-labelledby="journal-title">
        <header className="section-head journal-head">
          <p className="eyebrow">Chapter VI &nbsp;/&nbsp; Journal</p>
          <h2 id="journal-title" className="display-l">The KAIROS Journal</h2>
        </header>
        <ul className="journal-grid">
          {articles.map((a, i) => (
            <li key={a.id} className={`jcard j${i + 1}`}>
              <a href={`#journal-${a.id}`} className="jcard-btn" onClick={(e) => { e.preventDefault(); open(a) }}>
                <div className="jcard-media"><Media a={a} /></div>
                <div className="jcard-meta"><span className="jcard-cat">{a.category}</span><span>{a.date}</span><span>{a.read}</span></div>
                <h3 className="jcard-title"><span>{a.title}</span></h3>
                <p className="jcard-excerpt">{a.excerpt}</p>
              </a>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  const cur = articles[active]
  return (
    <section id="journal" ref={root} className="jc" aria-labelledby="journal-title">
      <div className="jc-pin">
        <div className="jc-grid" aria-hidden="true" />
        <header className="jc-head">
          <p className="eyebrow">Chapter VI &nbsp;/&nbsp; Journal</p>
          <h2 id="journal-title" className="jc-title">The KAIROS Journal</h2>
        </header>

        <div className="jc-stage" aria-hidden="true">
          {articles.map((a, i) => {
            const d = i - pos
            const ad = Math.abs(d)
            return (
              <div
                key={a.id}
                className={`jc-panel ${i === active ? 'is-active' : ''}`}
                style={{
                  transform: `translate3d(${d * (mobile ? 88 : 100)}%, 0, ${-ad * (mobile ? 120 : 320)}px) rotateY(${-d * (mobile ? 18 : 24)}deg) scale(${1 - Math.min(ad, 2) * 0.16})`,
                  opacity: ad < 0.04 ? 1 : Math.max(0, 1 - ad * 0.45),
                  zIndex: 10 - Math.round(ad * 2),
                  // filters flatten 3D, so the centre panel gets none and keeps its curve
                  filter: ad < 0.04 ? 'none' : `blur(${Math.min(ad, 1.5) * 1.6}px)`,
                }}
                onClick={() => (i === active ? open(a) : goTo(i))}
                data-cursor={i === active ? 'open' : 'view'}
              >
                <CurvedPanel a={a} curved={!mobile && ad < 1.6} />
                <span className="jc-panel-no">{String(i + 1).padStart(2, '0')}</span>
              </div>
            )
          })}
        </div>

        <div className="jc-info" aria-live="polite">
          <p className="jc-meta">
            <span>{cur.date}</span>
            <span className="jc-tag">{cur.category}</span>
            <span>{cur.read}</span>
          </p>
          <h3 className="jc-story">{cur.title}</h3>
          <p className="jc-excerpt">{cur.excerpt}</p>
          <button className="btn-link" onClick={() => open(cur)} data-cursor="open">
            Read the story <ArrowIcon />
          </button>
        </div>

        <nav className="jc-nav" aria-label="Journal stories">
          <button className="icon-btn" onClick={() => goTo(Math.max(0, active - 1))} aria-label="Previous story" disabled={active === 0}>
            <ArrowIcon />
          </button>
          <ol>
            {articles.map((a, i) => (
              <li key={a.id}>
                <button className={i === active ? 'is-on' : ''} onClick={() => goTo(i)} aria-current={i === active ? 'true' : undefined}>
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <em>{a.title}</em>
                </button>
              </li>
            ))}
          </ol>
          <button className="icon-btn" onClick={() => goTo(Math.min(n - 1, active + 1))} aria-label="Next story" disabled={active === n - 1}>
            <ArrowIcon />
          </button>
        </nav>
      </div>
    </section>
  )
}
