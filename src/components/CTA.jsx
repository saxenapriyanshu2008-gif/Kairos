import { useEffect, useRef } from 'react'
import WatchSVG from './WatchSVG'
import { gsap, prefersReducedMotion } from '../lib/gsap'
import { scrollToId } from '../store'

export default function CTA() {
  const root = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.final-watch', { scale: 1.35, rotate: -20 }, {
        scale: 1, rotate: 6, ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
      })
      gsap.fromTo('.final-title .line > span', { yPercent: 110 }, {
        yPercent: 0, stagger: 0.12, duration: 1.2, ease: 'power4.out',
        scrollTrigger: { trigger: '.final-title', start: 'top 80%' },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="final theme-dark" aria-labelledby="final-title">
      <div className="final-bg" aria-hidden="true">
        <div className="final-watch">
          <WatchSVG model="atlas" caseFinish="steel" dial="midnight" strap="steel" />
        </div>
      </div>
      <div className="final-inner">
        <h2 id="final-title" className="final-title display-xl">
          <span className="line"><span>Your time.</span></span>
          <span className="line"><span><em>Your moment.</em></span></span>
        </h2>
        <p className="lede" data-reveal>Discover the KAIROS collection.</p>
        <div className="hero-ctas" data-reveal>
          <a href="#collection" className="btn btn-solid" data-cursor="open" onClick={(e) => { e.preventDefault(); scrollToId('collection') }}>
            <span>Explore collection</span>
          </a>
          <a href="#contact" className="btn btn-ghost" data-cursor="open" onClick={(e) => { e.preventDefault(); scrollToId('contact') }}>
            <span>Contact KAIROS</span>
          </a>
        </div>
      </div>
    </section>
  )
}
