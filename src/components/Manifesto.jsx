import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '../lib/gsap'
import LineLogo from './LineLogo'

/*
  Manifesto: a light, gridded interlude after the film.
  Each line is "typed" inside a black highlight block, then the block
  wipes away and leaves plain ink text. A slanted metal bar sweeps across
  as you scroll, and the K-clock logo draws itself as a blueprint.
*/
const LINES = [
  'We do not make watches to count the hours.',
  'We make them for the moments you will remember.',
  'Built slowly, finished by hand, made in small numbers.',
  'KAIROS. The moment matters.',
]

export default function Manifesto() {
  const root = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray('.mf-line')
      gsap.set('.mf-ch', { opacity: 0 })
      const tl = gsap.timeline({ scrollTrigger: { trigger: '.mf-text', start: 'top 72%', once: true } })
      lines.forEach((line, i) => {
        const chars = line.querySelectorAll('.mf-ch')
        tl.set(line, { className: 'mf-line is-typing' }, i === 0 ? 0 : '>-0.15')
        tl.to(chars, { opacity: 1, duration: 0.01, stagger: 0.022, ease: 'none' })
        tl.set(line, { className: 'mf-line is-done' }, '>+0.25')
      })
      // slanted metal bar sweeps across while the section scrolls
      gsap.fromTo('.mf-bar', { xPercent: 120, rotate: 18 }, {
        xPercent: -260, rotate: 26, ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="manifesto" aria-labelledby="mf-title">
      <div className="mf-grid" aria-hidden="true" />
      <div className="mf-bar" aria-hidden="true" />
      <div className="mf-inner">
        <div className="mf-text">
          <p className="eyebrow" id="mf-title">Manifesto</p>
          <h2 className="sr-only">KAIROS manifesto</h2>
          <p className="sr-only">{LINES.join(' ')}</p>
          <div aria-hidden="true">
            {LINES.map((l, i) => (
              <p key={i} className="mf-line">
                {[...l].map((c, k) => (
                  <span key={k} className="mf-ch">
                    {c === ' ' ? ' ' : c}
                  </span>
                ))}
              </p>
            ))}
          </div>
          <p className="mf-meta" aria-hidden="true">
            <span>KRS / 2026</span>
            <span>Calibre K-01</span>
            <span>01:22:30</span>
          </p>
        </div>
        <LineLogo className="mf-logo" tone="light" />
      </div>
    </section>
  )
}
