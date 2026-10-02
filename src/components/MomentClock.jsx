import { useEffect, useRef, useState } from 'react'
import { handAngles } from './WatchSVG'
import { isFinePointer, prefersReducedMotion } from '../lib/gsap'
import { scrollToId } from '../store'

/*
  THE MOMENT
  A large clock that shows the real time. On desktop the hands lean a few
  degrees toward the cursor and a gold point follows it around the ring.
  Picking a "moment" sweeps the hands to that time, then "Now" returns to live.

  Everything runs in one requestAnimationFrame loop that writes straight to the
  SVG (no React re-render per frame), and it stops while the section is off screen.
*/

const MOMENTS = [
  { id: 'sunrise', label: 'Sunrise', time: [6, 12, 0], line: 'The light arrives before anyone else does.' },
  { id: 'meeting', label: 'A first meeting', time: [19, 30, 0], line: 'Half past seven. You are a little early, on purpose.' },
  { id: 'finish', label: 'The finish line', time: [11, 58, 42], line: 'Forty-two seconds you will retell for years.' },
  { id: 'midnight', label: 'Midnight', time: [23, 59, 59], line: 'One second before everything begins again.' },
]

const R = 230 // dial radius in the 600x600 artboard
const CX = 300

const pad = (n) => String(n).padStart(2, '0')

export default function MomentClock() {
  const root = useRef(null)
  const svg = useRef(null)
  const hands = { h: useRef(null), m: useRef(null), s: useRef(null) }
  const marker = useRef(null)
  const digital = useRef(null)
  const [moment, setMoment] = useState(null)
  const momentRef = useRef(null)
  momentRef.current = moment

  useEffect(() => {
    const reduce = prefersReducedMotion()
    const fine = isFinePointer()
    const cur = { h: 0, m: 0, s: 0 }
    let first = true
    const pointer = { active: false, angle: 0 }
    let raf = 0
    let visible = false
    let lastText = ''

    // nearest equivalent angle so hands never spin the long way round
    const near = (target, current) => target + 360 * Math.round((current - target) / 360)
    // signed smallest difference a - b in degrees
    const diff = (a, b) => ((((a - b) % 360) + 540) % 360) - 180

    const loop = () => {
      const m = momentRef.current
      let target
      let text
      if (m) {
        const [hh, mm, ss] = m.time
        target = { h: ((hh % 12) + mm / 60) * 30, m: (mm + ss / 60) * 6, s: ss * 6 }
        text = `${pad(hh)}:${pad(mm)}:${pad(ss)}`
      } else {
        const now = new Date()
        target = handAngles(now)
        if (reduce) target.s = Math.floor(target.s / 6) * 6
        text = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
      }

      for (const k of ['h', 'm', 's']) {
        let t = target[k]
        // hands lean toward the cursor, up to ~7 degrees
        if (pointer.active) t += Math.max(-7, Math.min(7, diff(pointer.angle, t) * 0.09))
        t = near(t, cur[k])
        const speed = first || reduce ? 1 : m ? 0.06 : k === 's' && !pointer.active ? 0.5 : 0.12
        cur[k] += (t - cur[k]) * speed
        hands[k].current?.setAttribute('transform', `rotate(${cur[k].toFixed(2)} ${CX} ${CX})`)
      }
      first = false

      if (marker.current) {
        marker.current.style.opacity = pointer.active ? 1 : 0
        marker.current.setAttribute('transform', `rotate(${pointer.angle.toFixed(1)} ${CX} ${CX})`)
      }
      if (text !== lastText && digital.current) {
        digital.current.textContent = text
        lastText = text
      }
      if (visible) raf = requestAnimationFrame(loop)
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      cancelAnimationFrame(raf)
      if (visible) raf = requestAnimationFrame(loop)
    })
    io.observe(root.current)
    loop()

    const el = root.current
    const onMove = (e) => {
      const r = svg.current.getBoundingClientRect()
      const x = e.clientX - (r.left + r.width / 2)
      const y = e.clientY - (r.top + r.height / 2)
      pointer.angle = (Math.atan2(x, -y) * 180) / Math.PI
      pointer.active = true
    }
    const onLeave = () => (pointer.active = false)
    if (fine && !reduce) {
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerleave', onLeave)
    }
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ticks drawn as single paths
  let minor = ''
  let major = ''
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2
    const big = i % 5 === 0
    const r1 = R - (big ? 26 : 12)
    const p = `M${(CX + Math.sin(a) * R).toFixed(1)} ${(CX - Math.cos(a) * R).toFixed(1)}L${(CX + Math.sin(a) * r1).toFixed(1)} ${(CX - Math.cos(a) * r1).toFixed(1)}`
    if (big) major += p
    else minor += p
  }

  return (
    <section id="moment" ref={root} className="section moment theme-dark" aria-labelledby="moment-title">
      <div className="moment-grid">
        <div className="moment-copy">
          <p className="eyebrow" data-reveal>Chapter V &nbsp;/&nbsp; Kairos</p>
          <h2 id="moment-title" className="display-l" data-split>
            What moment are you <em>waiting for?</em>
          </h2>
          <p className="lede" data-reveal>
            Chronos is time that passes. Kairos is the moment that matters. Choose one, and watch the hands find it.
          </p>

          <div className="moment-chips" role="group" aria-label="Choose a moment" data-reveal>
            <button className={`chip ${!moment ? 'is-on' : ''}`} aria-pressed={!moment} onClick={() => setMoment(null)}>
              Now
            </button>
            {MOMENTS.map((m) => (
              <button key={m.id} className={`chip ${moment?.id === m.id ? 'is-on' : ''}`} aria-pressed={moment?.id === m.id} onClick={() => setMoment(m)}>
                {m.label}
              </button>
            ))}
          </div>
          <p className="moment-line" aria-live="polite">{moment ? moment.line : 'This second will not happen again.'}</p>

          <button className="btn btn-solid" data-cursor="open" onClick={() => scrollToId('configure')}>
            <span>Discover your KAIROS</span>
          </button>
        </div>

        <div className="moment-clock">
          <svg ref={svg} viewBox="0 0 600 600" role="img" aria-label={moment ? `Clock set to ${moment.label}` : 'Clock showing the current time'}>
            <defs>
              <radialGradient id="mc-face" cx=".45" cy=".4" r=".7">
                <stop offset="0" stopColor="#1d1c1a" />
                <stop offset="1" stopColor="#0a0a09" />
              </radialGradient>
            </defs>
            <circle cx={CX} cy={CX} r={R + 40} fill="none" stroke="#efe9de" strokeOpacity=".08" />
            <circle cx={CX} cy={CX} r={R + 14} fill="url(#mc-face)" stroke="#efe9de" strokeOpacity=".22" />
            <path d={minor} stroke="#efe9de" strokeOpacity=".35" strokeWidth="1.2" />
            <path d={major} stroke="#efe9de" strokeWidth="3" />
            {[12, 3, 6, 9].map((n, i) => {
              const a = (i / 4) * Math.PI * 2
              return (
                <text key={n} x={CX + Math.sin(a) * (R - 62)} y={CX - Math.cos(a) * (R - 62) + 14} textAnchor="middle" className="mc-num">
                  {n}
                </text>
              )
            })}
            <g ref={marker} style={{ opacity: 0, transition: 'opacity .4s' }}>
              <circle cx={CX} cy={CX - R - 40} r="6" fill="#c9ad7c" />
            </g>
            <g ref={hands.h}>
              <path d={`M${CX - 7} ${CX + 26}L${CX - 6} ${CX - 120}L${CX} ${CX - 134}L${CX + 6} ${CX - 120}L${CX + 7} ${CX + 26}Z`} fill="#efe9de" />
            </g>
            <g ref={hands.m}>
              <path d={`M${CX - 5} ${CX + 32}L${CX - 4} ${CX - 190}L${CX} ${CX - 204}L${CX + 4} ${CX - 190}L${CX + 5} ${CX + 32}Z`} fill="#cfcfcb" />
            </g>
            <g ref={hands.s}>
              <path d={`M${CX} ${CX + 46}L${CX} ${CX - 214}`} stroke="#c9ad7c" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx={CX} cy={CX + 36} r="7" fill="#c9ad7c" />
            </g>
            <circle cx={CX} cy={CX} r="10" fill="#c9ad7c" />
            <circle cx={CX} cy={CX} r="3.5" fill="#0a0a09" />
          </svg>
          <p className="moment-digital" aria-hidden="true">
            <span ref={digital}>00:00:00</span>
          </p>
        </div>
      </div>
    </section>
  )
}
