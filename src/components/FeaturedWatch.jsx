import { useEffect, useRef } from 'react'
import WatchSVG from './WatchSVG'
import { gsap, prefersReducedMotion } from '../lib/gsap'
import { getWatch, formatPrice } from '../data/watches'
import { useShop } from '../store'

const SPECS = [
  ['Case', '316L Stainless Steel'],
  ['Crystal', 'Sapphire'],
  ['Movement', 'Automatic'],
  ['Resistance', '100M'],
]

export default function FeaturedWatch() {
  const root = useRef(null)
  const noir = getWatch('noir')
  const { setDrawer } = useShop()

  useEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const st = { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true }
      gsap.fromTo('.fw-ghost', { xPercent: 8 }, { xPercent: -22, ease: 'none', scrollTrigger: st })
      gsap.fromTo('.fw-watch', { yPercent: 12, rotate: -10 }, { yPercent: -10, rotate: 8, ease: 'none', scrollTrigger: st })
      gsap.fromTo('.fw-beam', { opacity: 0.2, xPercent: -20 }, { opacity: 0.9, xPercent: 20, ease: 'none', scrollTrigger: st })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="noir" ref={root} className="section featured theme-dark" aria-labelledby="noir-title">
      <div className="fw-ghost" aria-hidden="true">NOIR</div>
      <div className="fw-grid">
        <div className="fw-visual" data-cursor="discover" onClick={() => setDrawer({ type: 'product', id: 'noir' })}>
          <div className="fw-beam" aria-hidden="true" />
          <div className="fw-watch">
            <WatchSVG {...noir.look} title="KAIROS NOIR, black steel case with obsidian dial" />
          </div>
        </div>

        <div className="fw-copy">
          <p className="eyebrow" data-reveal>The flagship &nbsp;/&nbsp; {noir.category}</p>
          <h2 id="noir-title" className="display-l" data-split>KAIROS NOIR</h2>
          <blockquote className="fw-quote" data-reveal>“Designed for the hours when everything becomes quieter.”</blockquote>

          <dl className="specs" data-reveal>
            {SPECS.map(([k, v]) => (
              <div key={k} className="spec">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>

          <div className="fw-foot" data-reveal>
            <span className="fw-price">{formatPrice(noir.price)}</span>
            <button className="btn btn-solid" data-cursor="open" onClick={() => setDrawer({ type: 'product', id: 'noir' })}>
              <span>Explore Noir</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
