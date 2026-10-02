import { useEffect, useMemo, useRef } from 'react'
import WatchSVG from './WatchSVG'
import { gsap, prefersReducedMotion, isFinePointer } from '../lib/gsap'
import { scrollToId } from '../store'
import { ArrowDown } from './Icons'

/*
  Hero
  - Live watch (real time) that tilts in 3D toward the cursor on desktop.
  - A soft light follows the cursor; dust particles drift at different depths.
  - The text never moves with the cursor, so it stays easy to read.
  - On touch devices there is no cursor effect, only a gentle scroll parallax.
*/
export default function Hero({ ready, cinema = false }) {
  const root = useRef(null)
  const tiltRef = useRef(null)

  // fixed random particle positions (made once)
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        left: Math.round(Math.random() * 100),
        top: Math.round(Math.random() * 100),
        size: 1 + Math.random() * 2.4,
        depth: 0.3 + Math.random() * 1.4,
        delay: -Math.random() * 12,
        i,
      })),
    []
  )

  // intro animation once the loader is gone
  useEffect(() => {
    if (!ready) return
    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) {
        gsap.set('.hero [data-intro]', { opacity: 1 })
        return
      }
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
      tl.fromTo('.hero-title .line > span', { yPercent: 115 }, { yPercent: 0, duration: 1.3, stagger: 0.12 })
        
        .fromTo('.hero [data-intro]', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08 }, 0.5)
        .fromTo('.hero-rule', { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power2.inOut' }, 0.4)
    }, root)
    return () => ctx.revert()
  }, [ready])

  // cursor interaction + scroll motion
  useEffect(() => {
    const el = root.current
    if (prefersReducedMotion()) return
    if (cinema) {
      // the 3D stage owns the watch; only fade the copy on scroll
      const c = gsap.context(() => {
        gsap.to('.hero-copy', { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } })
        gsap.to(['.hero-specs', '.scroll-cue'], { opacity: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: '30% top', scrub: true } })
      }, el)
      return () => c.revert()
    }
    const ctx = gsap.context(() => {
      // watch slowly turns and rises while the hero scrolls away
      gsap.to('.hero-watch-scroll', {
        rotate: 14,
        yPercent: -10,
        scale: 0.92,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: 0.6 },
      })
      gsap.to('.hero-copy', {
        yPercent: -18,
        opacity: 0.2,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
      })
    }, el)

    if (!isFinePointer()) return () => ctx.revert()

    const rx = gsap.quickTo(tiltRef.current, 'rotationX', { duration: 1.2, ease: 'power3.out' })
    const ry = gsap.quickTo(tiltRef.current, 'rotationY', { duration: 1.2, ease: 'power3.out' })
    const tx = gsap.quickTo(tiltRef.current, 'x', { duration: 1.4, ease: 'power3.out' })
    const ty = gsap.quickTo(tiltRef.current, 'y', { duration: 1.4, ease: 'power3.out' })
    const dust = gsap.utils.toArray('.hero-dust span', el).map((p) => ({
      depth: Number(p.dataset.depth),
      x: gsap.quickTo(p, 'x', { duration: 1.8, ease: 'power3.out' }),
      y: gsap.quickTo(p, 'y', { duration: 1.8, ease: 'power3.out' }),
    }))

    let frame = 0
    const onMove = (e) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const nx = ((e.clientX - r.left) / r.width) * 2 - 1 // -1..1
        const ny = ((e.clientY - r.top) / r.height) * 2 - 1
        ry(nx * 12)
        rx(-ny * 9)
        tx(nx * 16)
        ty(ny * 10)
        el.style.setProperty('--lx', `${50 + nx * 22}%`)
        el.style.setProperty('--ly', `${42 + ny * 18}%`)
        dust.forEach((d) => {
          d.x(-nx * 26 * d.depth)
          d.y(-ny * 18 * d.depth)
        })
      })
    }
    const onLeave = () => {
      rx(0); ry(0); tx(0); ty(0)
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(frame)
      ctx.revert()
    }
  }, [cinema])

  return (
    <section id="top" ref={root} className={`hero theme-dark ${cinema ? 'hero--cinema' : ''}`} aria-labelledby="hero-title">
      {!cinema && <div className="hero-light" aria-hidden="true" />}
      {!cinema && (
        <div className="hero-grid" aria-hidden="true">
          <span /><span /><span />
        </div>
      )}
      <div className="hero-dust" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.i}
            data-depth={p.depth.toFixed(2)}
            style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size, animationDelay: `${p.delay}s` }}
          />
        ))}
      </div>

      {(
      <div className="hero-watch-wrap" aria-hidden="true">
        <div className="hero-watch-scroll">
          <div className="hero-watch-tilt" ref={tiltRef}>
            <WatchSVG model="arc" caseFinish="black" dial="midnight" strap="steel" live title="KAIROS ARC in black steel with a midnight blue dial, showing the current time" />
          </div>
        </div>
        <div className="hero-watch-floor" />
      </div>
      )}

      <div className="hero-copy">
        <p className="eyebrow" data-intro>
          <span className="dot" aria-hidden="true" /> Calibre K-01 &nbsp;/&nbsp; Collection 2026
        </p>
        <h1 id="hero-title" className="hero-title display-xl">
          <span className="line"><span>The moment</span></span>
          <span className="line"><span><em>matters.</em></span></span>
        </h1>
        <div className="hero-rule" aria-hidden="true" />
        <p className="hero-sub" data-intro>Precision-crafted timepieces designed to mark the moments that matter.</p>
        <div className="hero-ctas" data-intro>
          <a href="#collection" className="btn btn-solid" data-cursor="open" onClick={(e) => { e.preventDefault(); scrollToId('collection') }}>
            <span>Explore the collection</span>
          </a>
          <a href="#story" className="btn btn-ghost" data-cursor="open" onClick={(e) => { e.preventDefault(); scrollToId('story') }}>
            <span>Discover KAIROS</span>
          </a>
        </div>
      </div>

      <ul className="hero-specs" data-intro aria-label="Key specifications">
        <li>Automatic</li>
        <li>Sapphire crystal</li>
        <li>316L steel</li>
        <li>100M water resistance</li>
      </ul>

      <a href="#scroll-story" className="scroll-cue" data-intro onClick={(e) => { e.preventDefault(); scrollToId('scroll-story') }}>
        <span>Scroll to discover</span>
        <ArrowDown />
      </a>
    </section>
  )
}
