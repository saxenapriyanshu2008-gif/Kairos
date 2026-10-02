import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '../lib/gsap'
import { LogoMark } from './Logo'

/*
  Minimal loader. It plays one short reveal (about 1.3s) and leaves as soon as
  the page has loaded. There is no fake waiting time.
*/
export default function Loader({ onDone }) {
  const root = useRef(null)

  useEffect(() => {
    const el = root.current
    if (prefersReducedMotion()) {
      const t = setTimeout(() => {
        el.style.display = 'none'
        onDone()
      }, 150)
      return () => clearTimeout(t)
    }

    let cancelled = false
    const ctx = gsap.context(() => {
      const intro = gsap.timeline()
      intro
        .from('.loader-mark', { scale: 0.6, opacity: 0, duration: 0.6 })
        .from('.loader-word span', { yPercent: 110, duration: 0.7, stagger: 0.05, ease: 'power4.out' }, '-=0.35')
        .fromTo('.loader-line', { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power2.inOut' }, '-=0.5')
        .from('.loader-tag', { opacity: 0, y: 8, duration: 0.5 }, '-=0.35')

      const leave = () =>
        gsap.timeline({ onComplete: () => { el.style.display = 'none' } })
          .add(() => onDone(), 0.35)
          .to('.loader-inner', { opacity: 0, y: -20, duration: 0.45, ease: 'power2.in' })
          .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.8, ease: 'power4.inOut' }, '-=0.15')

      // wait for the page load, but never longer than 2.2s (slow images must not block the site)
      const loaded = Promise.race([
        new Promise((res) => (document.readyState === 'complete' ? res() : window.addEventListener('load', res, { once: true }))),
        new Promise((res) => setTimeout(res, 2200)),
      ])
      Promise.all([loaded, intro.then()]).then(() => !cancelled && leave())
    }, el)
    return () => {
      cancelled = true
      ctx.revert()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={root} className="loader" aria-hidden="true">
      <div className="loader-inner">
        <LogoMark size={34} className="loader-mark" />
        <div className="loader-word" aria-label="KAIROS">
          {'KAIROS'.split('').map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>
        <div className="loader-line" />
        <p className="loader-tag">THE MOMENT MATTERS.</p>
      </div>
    </div>
  )
}
