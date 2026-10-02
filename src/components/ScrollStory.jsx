import { useEffect, useRef, useState } from 'react'
import WatchSVG from './WatchSVG'
import { MovementSVG } from './Art'
import { gsap, prefersReducedMotion } from '../lib/gsap'

/*
  ScrollStory: the required scroll-driven sequence.
  The section is pinned while one GSAP timeline is "scrubbed" by the scrollbar:
    01 THE CASE      watch rises into frame
    02 THE DIAL      watch turns, a gold ring traces the dial
    03 THE MOVEMENT  camera pushes in and the dial dissolves into the movement
    04 THE MOMENT    pull back to the final hero shot
  With reduced motion the four stages are shown as a simple static list.
*/

const STAGES = [
  { n: '01', title: 'The Case', text: 'Precision-shaped steel designed to catch light from every angle.' },
  { n: '02', title: 'The Dial', text: 'Every index placed with deliberate precision.' },
  { n: '03', title: 'The Movement', text: 'Mechanical engineering designed to keep every moment moving.' },
  { n: '04', title: 'The Moment', text: 'Everything comes together when time becomes yours.' },
]

export default function ScrollStory() {
  const root = useRef(null)
  const [active, setActive] = useState(0)
  const [reduced] = useState(prefersReducedMotion)

  useEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const steps = gsap.utils.toArray('.ss-step')
      gsap.set(steps, { autoAlpha: 0, y: 40 })
      gsap.set(steps[0], { autoAlpha: 1, y: 0 })

      let last = 0
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut', duration: 1 },
        scrollTrigger: {
          trigger: '.ss-pin',
          start: 'top top',
          end: () => '+=' + window.innerHeight * 3.2,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          onUpdate: (self) => {
            const i = Math.min(3, Math.floor(self.progress * 4 + 0.1))
            if (i !== last) {
              last = i
              setActive(i)
            }
          },
        },
      })

      const swap = (from, to, at) => {
        tl.to(steps[from], { autoAlpha: 0, y: -40, duration: 0.5 }, at)
        tl.fromTo(steps[to], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.5 }, at + 0.35)
      }

      // 01 -> the watch rises into frame while the section scrolls in (before the pin)
      gsap.fromTo('.ss-watch', { scale: 0.6, yPercent: 26, rotate: -18, opacity: 0 }, {
        scale: 0.92, yPercent: 0, rotate: 0, opacity: 1, ease: 'power2.out',
        scrollTrigger: { trigger: root.current, start: 'top 85%', end: 'top top', scrub: 0.6 },
      })
      gsap.fromTo('.ss-bignum', { yPercent: 30, opacity: 0 }, {
        yPercent: 0, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top 60%', end: 'top top', scrub: true },
      })
      tl.to({}, { duration: 0.7 }) // hold on stage 01

      // 02 -> the dial (explicit start values, so it does not read the entrance state)
      swap(0, 1, 1)
      tl.fromTo('.ss-watch', { scale: 0.92, yPercent: 0, rotate: 0, xPercent: 0, opacity: 1 }, { scale: 1.18, rotate: 22, xPercent: -4, duration: 1.2, immediateRender: false }, 1)
        .fromTo('.ss-ring circle', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1 }, 1.2)
        .to('.ss-ring', { opacity: 1, duration: 0.3 }, 1.1)

      // 03 -> camera pushes in, dial dissolves into the movement
      swap(1, 2, 2.3)
      tl.to('.ss-ring', { opacity: 0, duration: 0.4 }, 2.3)
        .to('.ss-watch', { scale: 2.8, rotate: 40, opacity: 0, duration: 1.2, ease: 'power2.in' }, 2.3)
        .fromTo('.ss-movement', { scale: 0.55, opacity: 0, rotate: -30 }, { scale: 1, opacity: 1, rotate: 0, duration: 1.2, ease: 'power2.out' }, 2.75)

      // 04 -> pull back for the final shot
      swap(2, 3, 3.7)
      tl.to('.ss-movement', { scale: 1.6, opacity: 0, duration: 0.9, ease: 'power2.in' }, 3.7)
        .fromTo('.ss-watch', { scale: 1.6, rotate: -12, opacity: 0 }, { scale: 1, rotate: 0, xPercent: 0, opacity: 1, duration: 1.1, ease: 'power3.out' }, 4.1)
        .fromTo('.ss-halo', { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.1 }, 4.1)
        .to({}, { duration: 0.4 }) // short hold at the end
    }, root)
    return () => ctx.revert()
  }, [reduced])

  if (reduced) {
    return (
      <section id="scroll-story" className="ss ss--static theme-dark" aria-label="Anatomy of a KAIROS">
        <div className="ss-static-grid">
          {STAGES.map((s, i) => (
            <article key={s.n} className="ss-static-item">
              <div className="ss-static-visual">
                {i === 2 ? <MovementSVG animate={false} /> : <WatchSVG model="arc" caseFinish="steel" dial="ivory" strap="brownLeather" showStrap={i !== 1} />}
              </div>
              <p className="eyebrow">Stage {s.n}</p>
              <h2 className="display-m">{s.title}</h2>
              <p>{s.text}</p>
            </article>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section id="scroll-story" ref={root} className="ss theme-dark" aria-label="Anatomy of a KAIROS, in four stages">
      <div className="ss-pin">
        <div className="ss-bignum" aria-hidden="true">{STAGES[active].n}</div>

        <div className="ss-visual" aria-hidden="true">
          <div className="ss-halo" />
          <div className="ss-movement">
            <MovementSVG />
          </div>
          <div className="ss-watch">
            <WatchSVG model="arc" caseFinish="steel" dial="ivory" strap="brownLeather">
              <g className="ss-ring">
                <circle cx="200" cy="320" r="146" pathLength="1" strokeDasharray="1" strokeDashoffset="1" transform="rotate(-90 200 320)" />
              </g>
            </WatchSVG>
          </div>
        </div>

        {/* screen readers get all four stages at once */}
        <div className="sr-only">
          {STAGES.map((s) => (
            <div key={s.n}>
              <h2>{s.title}</h2>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
        <div className="ss-text" aria-hidden="true">
          {STAGES.map((s) => (
            <div key={s.n} className="ss-step">
              <p className="eyebrow">Stage {s.n} / 04</p>
              <p className="display-l ss-title">{s.title}</p>
              <p className="ss-copy">{s.text}</p>
            </div>
          ))}
        </div>

        <ol className="ss-progress" aria-hidden="true">
          {STAGES.map((s, i) => (
            <li key={s.n} className={i === active ? 'is-active' : i < active ? 'is-done' : ''}>
              <span>{s.n}</span>
              <em>{s.title}</em>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
