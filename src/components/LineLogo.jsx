import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '../lib/gsap'
import { LOGO_TIME } from './Logo'

/*
  The KAIROS K-clock drawn as a technical line drawing: construction lines
  first, then the circle, the stem and the two hands, like a blueprint being
  drawn. Drawing is tied to scroll (scrub) while it passes through the screen.
*/
const C = 200
const pt = (deg, len) => {
  const a = (deg * Math.PI) / 180
  return [C + Math.sin(a) * len, C - Math.cos(a) * len]
}

export default function LineLogo({ className = '', tone = 'dark' }) {
  const root = useRef(null)

  useEffect(() => {
    const el = root.current
    const paths = el.querySelectorAll('[data-draw]')
    paths.forEach((p) => {
      const len = p.getTotalLength ? p.getTotalLength() : 1000
      p.style.strokeDasharray = len
      p.style.strokeDashoffset = prefersReducedMotion() ? 0 : len
    })
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.to(paths, {
        strokeDashoffset: 0,
        ease: 'none',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 90%', end: 'center 45%', scrub: 0.6 },
      })
      gsap.fromTo('.ll-dot', { scale: 0, transformOrigin: '200px 200px' }, { scale: 1, ease: 'back.out(3)', scrollTrigger: { trigger: el, start: 'center 60%', end: 'center 45%', scrub: true } })
    }, el)
    return () => ctx.revert()
  }, [])

  const [hx, hy] = pt(LOGO_TIME.hour, 104)
  const [mx, my] = pt(LOGO_TIME.minute, 128)
  const ink = tone === 'dark' ? '#efe9de' : '#161514'

  return (
    <svg ref={root} viewBox="0 0 400 400" className={`line-logo ${className}`} aria-hidden="true">
      {/* construction lines */}
      <g stroke={ink} strokeOpacity=".22" strokeWidth=".8" fill="none">
        <path data-draw d="M0 200H400" />
        <path data-draw d="M200 0V400" />
        <path data-draw d="M40 40L360 360" />
        <path data-draw d="M360 40L40 360" />
        <path data-draw d="M200 200m-178 0a178 178 0 1 0 356 0a178 178 0 1 0 -356 0" />
        <path data-draw d="M200 200m-120 0a120 120 0 1 0 240 0a120 120 0 1 0 -240 0" strokeDasharray="3 5" />
        <path data-draw d="M60 0V400M340 0V400M0 60H400M0 340H400" />
      </g>
      {/* the mark */}
      <g stroke={ink} fill="none" strokeLinecap="round">
        <path data-draw d="M200 200m-150 0a150 150 0 1 0 300 0a150 150 0 1 0 -300 0" strokeWidth="2.4" />
        <path data-draw d="M200 80V320" strokeWidth="5" />
        <path data-draw d={`M200 200L${hx.toFixed(1)} ${hy.toFixed(1)}`} strokeWidth="5" />
        <path data-draw d={`M200 200L${mx.toFixed(1)} ${my.toFixed(1)}`} strokeWidth="4" />
      </g>
      <circle className="ll-dot" cx="200" cy="200" r="9" fill="#c9ad7c" />
      <g fontFamily="Manrope Variable, sans-serif" fontSize="8" letterSpacing="2" fill={ink} fillOpacity=".5">
        <text x="208" y="14">12</text>
        <text x="384" y="196">3</text>
        <text x="208" y="394">6</text>
        <text x="6" y="196">9</text>
        <text x="236" y="70">H 41.25°</text>
        <text x="300" y="300">M 135°</text>
      </g>
    </svg>
  )
}
