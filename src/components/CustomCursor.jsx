import { useEffect, useRef } from 'react'
import { gsap, isFinePointer, prefersReducedMotion } from '../lib/gsap'

/*
  Desktop-only cursor: a small dot that follows exactly, and a ring that
  follows with a little lag. Elements with data-cursor="view|open|discover"
  grow the ring and show a word. Disabled on touch devices and with reduced
  motion, and hidden over form fields so the normal text cursor shows.
*/
const LABELS = { view: 'View', open: 'Open', discover: 'Discover' }

export default function CustomCursor() {
  const dot = useRef(null)
  const ring = useRef(null)
  const label = useRef(null)

  useEffect(() => {
    if (!isFinePointer() || prefersReducedMotion()) return
    document.documentElement.classList.add('has-cursor')

    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.08, ease: 'power3' })
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.08, ease: 'power3' })
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.45, ease: 'power3' })
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.45, ease: 'power3' })
    let mode = ''
    let shown = false

    const onMove = (e) => {
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY)
      if (!shown) {
        shown = true
        gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.3 })
      }
      const t = e.target.closest?.('[data-cursor], input, textarea, select')
      let next = ''
      if (t) next = t.matches('input, textarea, select') ? 'hide' : t.getAttribute('data-cursor')
      else if (e.target.closest?.('a, button, label, [role="button"]')) next = 'link'
      if (next !== mode) {
        mode = next
        ring.current.dataset.mode = mode
        label.current.textContent = LABELS[mode] || ''
      }
    }
    const onLeave = () => {
      shown = false
      gsap.to([dot.current, ring.current], { opacity: 0, duration: 0.3 })
    }
    const onDown = () => ring.current.classList.add('is-down')
    const onUp = () => ring.current.classList.remove('is-down')

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  return (
    <div className="cursor" aria-hidden="true">
      <div ref={ring} className="cursor-ring">
        <span ref={label} className="cursor-label" />
      </div>
      <div ref={dot} className="cursor-dot" />
    </div>
  )
}
