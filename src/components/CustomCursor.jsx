import { useEffect, useRef } from 'react'
import { gsap, isFinePointer, prefersReducedMotion } from '../lib/gsap'

/*
  Desktop-only cursor, the same everywhere on the site: a small gold dot that
  follows exactly and a thin ring that follows with a little lag.
  It never grows, shows words or inverts the colours behind it.
  A soft dark edge keeps it visible on both dark and light sections.
  Hidden over text fields so the normal text cursor shows there.
  Disabled on touch devices and with reduced motion.
*/
export default function CustomCursor() {
  const dot = useRef(null)
  const ring = useRef(null)

  useEffect(() => {
    if (!isFinePointer() || prefersReducedMotion()) return
    document.documentElement.classList.add('has-cursor')

    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.08, ease: 'power3' })
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.08, ease: 'power3' })
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.4, ease: 'power3' })
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.4, ease: 'power3' })
    let shown = false
    let hidden = false

    const onMove = (e) => {
      dx(e.clientX)
      dy(e.clientY)
      rx(e.clientX)
      ry(e.clientY)
      const overField = !!e.target.closest?.('input:not([type="radio"]):not([type="checkbox"]):not([type="range"]), textarea, select')
      if (!shown || overField !== hidden) {
        shown = true
        hidden = overField
        gsap.to([dot.current, ring.current], { opacity: overField ? 0 : 1, duration: 0.25 })
      }
    }
    const onLeave = () => {
      shown = false
      gsap.to([dot.current, ring.current], { opacity: 0, duration: 0.3 })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <div className="cursor" aria-hidden="true">
      <div ref={ring} className="cursor-ring" />
      <div ref={dot} className="cursor-dot" />
    </div>
  )
}
