import { useEffect, useRef, useState } from 'react'
import Hero from './Hero'
import ScrollStory from './ScrollStory'
import { gsap, ScrollTrigger, prefersReducedMotion, isFinePointer } from '../lib/gsap'

/*
  Cinema: the 3D opening of the site (hero + scroll story).

  One fixed WebGL canvas sits behind the hero and the story. A single KAIROS
  watch, modelled in Three.js, travels through the sections while you scroll:
    hero      -> live watch, tilts toward the cursor
    01 CASE   -> turns to show the case side and crown, "316L" behind it
    02 DIAL   -> face-on close-up, a gold ring traces the dial
    03 MOVEMENT -> exploded view with labelled parts, then the camera dives
                   into the calibre while the front parts fly past
    04 MOMENT -> reassembles, slim side profile, then the final hero shot

  If WebGL is missing or the user prefers reduced motion, the original
  SVG hero + story are used instead (same content, no 3D).
*/

const LABELS = [
  { part: 'crystal', n: '01', name: 'Sapphire crystal', side: 'top' },
  { part: 'bezel', n: '02', name: 'Polished bezel', side: 'bottom' },
  { part: 'hands', n: '03', name: 'Diamond-cut hands', side: 'top' },
  { part: 'dial', n: '04', name: 'Sunray dial', side: 'bottom' },
  { part: 'case', n: '05', name: '316L case', side: 'top' },
  { part: 'movement', n: '06', name: 'Calibre K-01', side: 'bottom' },
  { part: 'caseback', n: '07', name: 'Exhibition caseback', side: 'top' },
]

const STAGES = [
  { n: '01', title: 'The Case', text: 'Precision-shaped steel designed to catch light from every angle.' },
  { n: '02', title: 'The Dial', text: 'Every index placed with deliberate precision.' },
  { n: '03', title: 'The Movement', text: 'Mechanical engineering designed to keep every moment moving.' },
  { n: '04', title: 'The Moment', text: 'Everything comes together when time becomes yours.' },
]

const SPECS = [
  ['Case', '39 mm / 316L'],
  ['Crystal', 'Sapphire, AR'],
  ['Calibre', 'K-01 automatic'],
  ['Frequency', '28,800 vph'],
  ['Reserve', '42 hours'],
  ['Water', '100 M'],
]

// Poses for each moment of the film. x/y are fractions of half the viewport.
function poses(mobile) {
  if (mobile) {
    return {
      hero: { x: 0, y: 0.42, size: 0.34, maxW: 0.62, rx: -0.25, ry: -0.35, rz: 0.1, explode: 0, fly: 0, hideStrap: 0, ring: 0, particles: 0, z: 0 },
      a: { x: 0, y: 0.22, size: 0.4, maxW: 0.72, rx: -0.15, ry: 0.8, rz: 0 },
      b: { x: 0, y: 0.2, size: 0.55, maxW: 0.95, rx: 0, ry: 0, rz: 0, ring: 1 },
      c: { x: 0, y: 0.2, size: 0.22, maxW: 0.34, rx: 0.2, ry: -1.3, rz: 0, explode: 1, hideStrap: 1, ring: 0 },
      c2: { x: 0, y: 0.18, size: 0.7, maxW: 1.2, rx: 0, ry: 0, rz: 0.35, explode: 1, fly: 1, particles: 1 },
      d1: { x: 0, y: 0.22, size: 0.42, maxW: 0.8, rx: 0.05, ry: 1.5, rz: 0, explode: 0, fly: 0, hideStrap: 0, particles: 0 },
      d2: { x: 0, y: 0.24, size: 0.44, maxW: 0.8, rx: -0.12, ry: -0.35, rz: 0.05 },
    }
  }
  return {
    hero: { x: 0.46, y: 0.0, size: 0.56, maxW: 0.9, rx: -0.28, ry: -0.5, rz: 0.12, explode: 0, fly: 0, hideStrap: 0, ring: 0, particles: 0, z: 0 },
    a: { x: 0.28, y: 0.0, size: 0.6, maxW: 0.9, rx: -0.25, ry: 1.0, rz: 0.05 },
    b: { x: 0.2, y: 0.0, size: 0.72, maxW: 0.9, rx: 0, ry: 0, rz: 0, ring: 1 },
    c: { x: 0.1, y: 0.04, size: 0.42, maxW: 0.68, rx: 0.22, ry: -1.3, rz: 0, explode: 1, hideStrap: 1, ring: 0 },
    c2: { x: 0.2, y: 0, size: 0.78, maxW: 1.3, rx: 0, ry: 0, rz: 0.35, explode: 1, fly: 1, particles: 1 },
    d1: { x: 0.25, y: 0, size: 0.72, maxW: 0.9, rx: 0.05, ry: 1.5, rz: 0, explode: 0, fly: 0, hideStrap: 0, particles: 0 },
    d2: { x: 0.26, y: 0, size: 0.64, maxW: 0.9, rx: -0.12, ry: -0.35, rz: 0.05 },
  }
}

const canUse3D = () => {
  if (typeof window === 'undefined' || prefersReducedMotion()) return false
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function Cinema({ ready }) {
  const [mode, setMode] = useState(() => (canUse3D() ? '3d' : 'svg'))
  const [loaded, setLoaded] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef(null)
  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const labelRefs = useRef([])
  const engine = useRef(null)
  const onScreen = useRef(true)
  const readyRef = useRef(ready)
  readyRef.current = ready

  // 1. load Three.js only after the loader is done (separate chunk), then build the stage.
  //    Until then the hero shows the lightweight SVG watch, so nothing waits on WebGL.
  useEffect(() => {
    if (mode !== '3d' || !ready) return
    let cancelled = false
    import('../three/stage')
      .then(({ createStage }) => {
        if (cancelled) return
        const mobile = window.innerWidth < 768
        const stage = createStage(canvasRef.current, {
          look: { model: 'arc', caseFinish: 'black', dial: 'midnight', strap: 'steel' },
          maxDpr: mobile ? 1.5 : 1.75,
          onFrame: () => placeLabels(),
        })
        Object.assign(stage.state, poses(mobile).hero)
        engine.current = stage
        stage.frame()
        setLoaded(true)
      })
      .catch(() => !cancelled && setMode('svg'))
    return () => {
      cancelled = true
      engine.current?.dispose()
      engine.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, ready])

  // labels follow their parts on screen during the exploded view
  function placeLabels() {
    const st = engine.current
    if (!st || st.state.lbl <= 0.01) return
    LABELS.forEach((l, i) => {
      const el = labelRefs.current[i]
      const p = st.project(l.part)
      if (!el || !p) return
      el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`
    })
  }

  // 2. scroll choreography
  useEffect(() => {
    if (mode !== '3d' || !loaded) return
    const st = engine.current
    const S = st.state
    S.lbl = 0
    const stageEl = stageRef.current
    const labelsEl = stageEl.querySelector('.cin-labels')

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add({ mobile: '(max-width: 767px)', desktop: '(min-width: 768px)' }, (c) => {
        const P = poses(c.conditions.mobile)
        st.resize()
        Object.assign(S, P.hero)

        // hero -> stage 01, while the hero scrolls away
        gsap.fromTo(S, { ...P.hero }, { ...P.a, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.8 } })

        // pinned story timeline
        let last = -1
        const tl = gsap.timeline({
          defaults: { ease: 'power2.inOut' },
          scrollTrigger: {
            trigger: '.cs-pin',
            start: 'top top',
            end: () => '+=' + window.innerHeight * 6,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
          },
        })
        // giant type + side notes: opacity follows the (smoothed) timeline time
        const WINDOWS = [
          ['.gt-a', 0.05, 0.3, 0.55, 0.8],
          ['.gt-c', 2.35, 2.6, 3.2, 3.4],
          ['.cs-parts', 2.45, 2.65, 3.2, 3.35],
          ['.gt-c2', 3.65, 3.95, 4.3, 4.5],
          ['.cs-beats', 3.8, 4.0, 4.3, 4.45],
          ['.cs-slim', 4.95, 5.15, 5.4, 5.6],
          ['.gt-d', 5.7, 6.05, 99, 99],
        ].map(([sel, a, b, c2, d]) => ({ el: root.current.querySelector(sel), a, b, c: c2, d }))
        const fade = (t, w) => (t <= w.a || t >= w.d ? 0 : t < w.b ? (t - w.a) / (w.b - w.a) : t <= w.c ? 1 : 1 - (t - w.c) / (w.d - w.c))
        tl.eventCallback('onUpdate', () => {
          const t = tl.time()
          for (const w of WINDOWS) {
            const o = fade(t, w)
            w.el.style.opacity = o
            w.el.style.visibility = o > 0.001 ? 'visible' : 'hidden'
            w.el.style.translate = `0 ${((1 - o) * 18).toFixed(1)}px`
          }
          const i = t < 1.1 ? 0 : t < 2.2 ? 1 : t < 4.25 ? 2 : 3
          if (i !== last) {
            last = i
            setActive(i)
          }
        })

        const go = (from, to, at, dur = 0.8) => tl.fromTo(S, { ...from }, { ...to, duration: dur, immediateRender: false }, at)
        const A = { ...P.hero, ...P.a }
        const B = { ...A, ...P.b }
        const C = { ...B, ...P.c }
        const C2 = { ...C, ...P.c2 }
        const D1 = { ...C2, ...P.d1 }
        const D2 = { ...D1, ...P.d2 }

        const steps = gsap.utils.toArray('.cs-step')
        const swap = (from, to, at) => {
          tl.to(steps[from], { autoAlpha: 0, y: -30, duration: 0.3 }, at)
          tl.fromTo(steps[to], { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.35, immediateRender: false }, at + 0.25)
        }
        gsap.set(steps, { autoAlpha: 0 })
        gsap.set(steps[0], { autoAlpha: 1, y: 0 })

        tl.to({}, { duration: 0.5 }, 0)
        // 02 dial
        swap(0, 1, 0.7)
        go(A, { ...B, ring: 0 }, 0.6, 0.8)
        tl.fromTo(S, { ring: 0 }, { ring: 1, duration: 0.6, immediateRender: false }, 1.2)
        // 03 movement: exploded view with labels
        swap(1, 2, 1.95)
        go(B, C, 1.9, 0.9)
        tl.fromTo(S, { lbl: 0 }, { lbl: 1, duration: 0.3, immediateRender: false }, 2.5)
        // dive into the movement
        tl.to(S, { lbl: 0, duration: 0.2 }, 3.3)
        go(C, C2, 3.35, 0.9)
        // 04 moment: reassemble in side profile, then final shot
        swap(2, 3, 4.45)
        go(C2, D1, 4.45, 0.9)
        go(D1, D2, 5.55, 0.8)
        tl.to({}, { duration: 0.4 }, 6.35)

        // labels container follows S.lbl
        const syncLabels = () => {
          labelsEl.style.opacity = S.lbl
        }
        gsap.ticker.add(syncLabels)
        return () => gsap.ticker.remove(syncLabels)
      })

      // run the render loop only while the cinema is on screen
      ScrollTrigger.create({
        trigger: root.current,
        refreshPriority: -1, // measure after the pin has added its spacing
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => {
          stageEl.classList.toggle('is-on', self.isActive)
          onScreen.current = self.isActive
          // never render while the loader is still playing, so the intro stays smooth
          self.isActive && readyRef.current ? st.start() : st.stop()
        },
      })

    }, root)

    // cursor: subtle tilt + moving light (desktop only)
    let onMove = null
    if (isFinePointer()) {
      const tx = gsap.quickTo(S, 'tiltX', { duration: 1.2, ease: 'power3.out' })
      const ty = gsap.quickTo(S, 'tiltY', { duration: 1.2, ease: 'power3.out' })
      onMove = (e) => {
        const nx = (e.clientX / window.innerWidth) * 2 - 1
        const ny = (e.clientY / window.innerHeight) * 2 - 1
        ty(nx * 0.22)
        tx(ny * 0.14)
        st.setPointer(nx, -ny) // move the shine light with the cursor
        stageEl.style.setProperty('--lx', `${50 + nx * 22}%`)
        stageEl.style.setProperty('--ly', `${42 + ny * 18}%`)
      }
      window.addEventListener('pointermove', onMove, { passive: true })
    }

    const onResize = () => st.resize()
    window.addEventListener('resize', onResize)
    ScrollTrigger.refresh()
    return () => {
      window.removeEventListener('resize', onResize)
      if (onMove) window.removeEventListener('pointermove', onMove)
      ctx.revert()
    }
  }, [mode, loaded])

  // start rendering once the loader has finished
  useEffect(() => {
    if (ready && loaded && onScreen.current) engine.current?.start()
  }, [ready, loaded])

  if (mode === 'svg') {
    return (
      <>
        <Hero ready={ready} />
        <ScrollStory />
      </>
    )
  }

  return (
    <div ref={root} className={`cinema ${loaded ? 'is-3d' : ''}`}>
      <div ref={stageRef} className="cin-stage" aria-hidden="true">
        <div className="cin-backdrop" />
        <div className="cin-type">
          <span className="gt gt-a">316L</span>
          <span className="gt gt-c">184</span>
          <span className="gt gt-c2">28,800</span>
          <span className="gt gt-d">Moment</span>
        </div>
        <canvas ref={canvasRef} className="cin-canvas" />
        <div className="cin-labels">
          {LABELS.map((l, i) => (
            <div key={l.part} ref={(el) => (labelRefs.current[i] = el)} className={`cin-label is-${l.side}`}>
              <span className="cin-label-line" />
              <span className="cin-label-text">
                <em>{l.n}</em> {l.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Hero ready={ready} cinema />

      <section id="scroll-story" className="cs" aria-label="Anatomy of a KAIROS, in four stages">
        <div className="cs-pin">
          <div className="sr-only">
            {STAGES.map((s) => (
              <div key={s.n}>
                <h2>{s.title}</h2>
                <p>{s.text}</p>
              </div>
            ))}
            <p>184 parts, nothing hidden. 28,800 vibrations per hour. 10.8 millimetres slim.</p>
          </div>

          <dl className="cs-hud" aria-hidden="true">
            {SPECS.map(([k, v], i) => (
              <div key={k} className={(active === 0 && i < 2) || (active === 2 && i >= 2 && i < 5) || active === 3 ? 'is-on' : active === 1 && i === 1 ? 'is-on' : ''}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>

          <div className="cs-text" aria-hidden="true">
            {STAGES.map((s) => (
              <div key={s.n} className="cs-step">
                <p className="eyebrow">Stage {s.n} / 04</p>
                <p className="display-l cs-title">{s.title}</p>
                <p className="cs-copy">{s.text}</p>
              </div>
            ))}
          </div>

          <p className="cs-extra cs-parts" aria-hidden="true">
            <strong>184 parts.</strong> Nothing hidden.
          </p>
          <p className="cs-extra cs-beats" aria-hidden="true">
            <strong>Six beats a second.</strong> The balance wheel swings 28,800 times an hour, every hour, for as long as you wear it.
          </p>
          <p className="cs-extra cs-slim" aria-hidden="true">
            <strong>10.8 mm.</strong> Slim enough to slide under a cuff.
          </p>

          <ol className="ss-progress cs-progress" aria-hidden="true">
            {STAGES.map((s, i) => (
              <li key={s.n} className={i === active ? 'is-active' : i < active ? 'is-done' : ''}>
                <span>{s.n}</span>
                <em>{s.title}</em>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}
