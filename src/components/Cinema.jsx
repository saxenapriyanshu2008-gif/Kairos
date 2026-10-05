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
  ['Water', '100 M'],
]

// Phones: the hero watch is sized and placed to fit the free space between the
// menu bar and the start of the hero text, so the text never sits on the dial.
function fitMobileHero() {
  const H = window.innerHeight
  const W = window.innerWidth
  const copy = document.querySelector('.hero--cinema .hero-copy')
  const nav = 64
  const top = copy ? copy.getBoundingClientRect().top + window.scrollY : H * 0.45
  const free = Math.max(140, top - nav - 12)
  const d = Math.min(free * 0.92, W * 0.66) // case diameter in px
  const cy = nav + free / 2 + 4
  return { y: 1 - (2 * cy) / H, size: d / H, maxW: d / W }
}

// Poses for each moment of the film. x/y are fractions of half the viewport.
const RESET = { explode: 0, fly: 0, hideStrap: 0, ring: 0, particles: 0, z: 0, lineup: 0, textRing: 0, smoke: 0 }
function poses(mobile) {
  if (mobile) {
    return {
      hero: { ...RESET, x: 0, y: 0.42, size: 0.34, maxW: 0.62, rx: -0.25, ry: -0.35, rz: 0.1 },
      // lineup on phones: the hero takes the top-right cell of a 2 x 2 grid (see stage.js)
      l: { x: 0.5, y: 0.5, size: 0.16, maxW: 0.38, rx: -0.15, ry: -0.25, rz: 0, lineup: 1 },
      a: { x: 0, y: 0.22, size: 0.36, maxW: 0.62, rx: -0.15, ry: 0.8, rz: 0, lineup: 0, textRing: 1 },
      b: { x: 0, y: 0.2, size: 0.55, maxW: 0.95, rx: 0, ry: 0, rz: 0, ring: 1, textRing: 0 },
      c: { x: 0, y: 0.2, size: 0.22, maxW: 0.34, rx: 0.2, ry: -1.3, rz: 0, explode: 1, hideStrap: 1, ring: 0 },
      c2: { x: 0, y: 0.18, size: 0.7, maxW: 1.2, rx: 0, ry: 0, rz: 0.35, explode: 1, fly: 1, particles: 0.6, smoke: 1 },
      p: { x: 0, y: -0.05, size: 0.42, maxW: 0.8, rx: -0.2, ry: -0.3, rz: 0.05, explode: 0, fly: 0, hideStrap: 0, particles: 0, smoke: 1 },
      e: { x: 0, y: -0.25, size: 0.45, maxW: 0.85, rx: -1.0, ry: 0, rz: 0, smoke: 0 },
      sl: { x: 0, y: -0.45, size: 0.5, maxW: 1.0, rx: 0.3, ry: 1.5, rz: 0 },
      d2: { x: 0, y: 0.24, size: 0.44, maxW: 0.8, rx: -0.12, ry: -0.35, rz: 0.05 },
    }
  }
  return {
    hero: { ...RESET, x: 0.46, y: 0.0, size: 0.56, maxW: 0.9, rx: -0.28, ry: -0.5, rz: 0.12 },
    l: { x: -0.25, y: -0.1, size: 0.27, maxW: 0.36, rx: -0.12, ry: -0.3, rz: 0, lineup: 1 },
    a: { x: 0.28, y: 0.0, size: 0.5, maxW: 0.9, rx: -0.25, ry: 1.0, rz: 0.05, lineup: 0, textRing: 1 },
    b: { x: 0.2, y: 0.0, size: 0.72, maxW: 0.9, rx: 0, ry: 0, rz: 0, ring: 1, textRing: 0 },
    c: { x: 0.1, y: 0.04, size: 0.42, maxW: 0.68, rx: 0.22, ry: -1.3, rz: 0, explode: 1, hideStrap: 1, ring: 0 },
    c2: { x: 0.2, y: 0, size: 0.78, maxW: 1.3, rx: 0, ry: 0, rz: 0.35, explode: 1, fly: 1, particles: 0.6, smoke: 1 },
    p: { x: 0, y: -0.16, size: 0.5, maxW: 0.9, rx: -0.25, ry: -0.35, rz: 0.06, explode: 0, fly: 0, hideStrap: 0, particles: 0, smoke: 1 },
    e: { x: 0, y: -0.42, size: 0.62, maxW: 0.9, rx: -1.0, ry: 0, rz: 0, smoke: 0 },
    sl: { x: 0.3, y: -0.5, size: 0.8, maxW: 1.2, rx: 0.3, ry: 1.5, rz: 0 },
    d2: { x: 0.26, y: 0, size: 0.6, maxW: 0.9, rx: -0.12, ry: -0.35, rz: 0.05 },
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
          film: true,
        })
        Object.assign(stage.state, poses(mobile).hero, mobile ? fitMobileHero() : null)
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
      // keep the label text on screen: shift it left when it would pass the right edge
      const txt = el.lastElementChild
      if (txt) {
        txt._w = txt._w || txt.offsetWidth
        const room = window.innerWidth - p.x - 10
        txt.style.left = txt._w > room ? `${Math.round(room - txt._w)}px` : ''
      }
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
        if (c.conditions.mobile) P.hero = { ...P.hero, ...fitMobileHero() }
        S.grid = c.conditions.mobile ? 1 : 0
        st.resize()
        Object.assign(S, P.hero)

        // giant type, overlays and the light chapter follow the (smoothed) film time
        const WIN = [
          ['.gt-l', -1, -0.5, 0.7, 1.2, 0],
          ['.cs-lineup', -1, -0.5, 0.6, 1.0, null],
          ['.gt-c', 3.85, 4.1, 4.6, 4.8, 1],
          ['.cs-parts', 3.95, 4.15, 4.6, 4.75, null],
          ['.gt-c2', 5.1, 5.4, 5.8, 6.0, 2],
          ['.cs-beats', 5.2, 5.4, 5.8, 5.95, null],
          ['.gt-p', 6.3, 6.7, 7.1, 7.35, 3],
          ['.cin-light', 7.25, 7.8, 99, 99, null],
          ['.cs-contours', 7.9, 8.15, 8.5, 8.7, null],
          ['.cs-slim', 9.1, 9.35, 9.6, 9.8, null],
          ['.gt-d', 10.1, 10.5, 99, 99, 4],
        ].map(([sel, a1, b1, c1, d1, liq]) => ({
          el: root.current.querySelector(sel),
          a: a1,
          b: b1,
          c: c1,
          d: d1,
          disp: liq === null ? null : root.current.querySelector(`#liq-${liq} feDisplacementMap`),
          liq,
        }))
        const fade = (t, w) => (t <= w.a || t >= w.d ? 0 : t < w.b ? (t - w.a) / (w.b - w.a) : t <= w.c ? 1 : 1 - (t - w.c) / (w.d - w.c))
        let heroP = 0
        let filmT = 0
        let lastLight = null
        // keep our own reference: React clears root.current before GSAP's cleanup
        // runs, and the timeline repaints one last time while it reverts
        const rootEl = root.current
        const paint = () => {
          if (!rootEl) return
          for (const w of WIN) {
            if (!w.el) continue
            // before the pin starts, the lineup type rises with the hero scroll
            let o = filmT <= 0.001 && w.a < 0 ? Math.max(0, (heroP - 0.35) / 0.65) : fade(filmT, w)
            o = Math.max(0, Math.min(1, o))
            const st2 = w.el.style
            st2.opacity = o
            st2.visibility = o > 0.001 ? 'visible' : 'hidden'
            if (w.liq !== null && w.disp) {
              // ALCHE-style liquid RGB split while the giant type appears or leaves
              const k = 1 - o
              w.disp.setAttribute('scale', (k * 60).toFixed(1))
              st2.filter = o > 0.001 && o < 0.995 ? `url(#liq-${w.liq})` : 'none'
              st2.textShadow = o < 0.995 ? `${(-k * 14).toFixed(1)}px 0 rgba(255,40,90,${0.6 * k}), ${(k * 14).toFixed(1)}px 0 rgba(40,170,255,${0.6 * k})` : 'none'
            } else if (w.liq === null && !w.el.classList.contains('cin-light')) {
              st2.translate = `0 ${((1 - o) * 18).toFixed(1)}px`
            }
          }
          const light = filmT > 7.6
          if (light !== lastLight) {
            lastLight = light
            rootEl.classList.toggle('is-light', light)
          }
        }

        // hero -> lineup, while the hero scrolls away
        gsap.fromTo(S, { ...P.hero }, {
          ...P.hero,
          ...P.l,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 0.8,
            onUpdate: (self) => {
              heroP = self.progress
              paint()
            },
          },
        })

        // pinned story timeline (about 11 "seconds" of film over 10 screens of scroll)
        let last = -1
        const tl = gsap.timeline({
          defaults: { ease: 'power2.inOut' },
          scrollTrigger: {
            trigger: '.cs-pin',
            start: 'top top',
            end: () => '+=' + window.innerHeight * 10,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
          },
        })
        tl.eventCallback('onUpdate', () => {
          filmT = tl.time()
          paint()
          const i = filmT < 2.05 ? 0 : filmT < 3.3 ? 1 : filmT < 7.4 ? 2 : 3
          if (i !== last) {
            last = i
            setActive(i)
          }
        })

        const go = (from, to, at, dur = 0.8) => tl.fromTo(S, { ...from }, { ...to, duration: dur, immediateRender: false }, at)
        const L = { ...P.hero, ...P.l }
        const A = { ...L, ...P.a }
        const B = { ...A, ...P.b }
        const C = { ...B, ...P.c }
        const C2 = { ...C, ...P.c2 }
        const PR = { ...C2, ...P.p }
        const E = { ...PR, ...P.e }
        const SL = { ...E, ...P.sl }
        const D2 = { ...SL, ...P.d2 }

        const steps = gsap.utils.toArray('.cs-step')
        const swap = (from, to, at) => {
          tl.to(steps[from], { autoAlpha: 0, y: -30, duration: 0.3 }, at)
          tl.fromTo(steps[to], { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.35, immediateRender: false }, at + 0.25)
        }
        gsap.set(steps, { autoAlpha: 0 })
        tl.fromTo(steps[0], { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.35, immediateRender: false }, 1.05)

        // 00 lineup: four models in front of giant type, then the others fly out
        tl.to({}, { duration: 0.6 }, 0)
        go(L, { ...A, textRing: 0 }, 0.6, 0.8)
        // 01 case: giant type circles the watch
        tl.fromTo(S, { textRing: 0 }, { textRing: 1, duration: 0.4, immediateRender: false }, 1.0)
        tl.fromTo(S, { ringSpin: 0 }, { ringSpin: 3.4, duration: 1.8, ease: 'none', immediateRender: false }, 0.6)
        tl.to(S, { textRing: 0, duration: 0.3 }, 2.0)
        // 02 dial
        swap(0, 1, 2.1)
        go({ ...A }, { ...B, ring: 0 }, 2.0, 0.8)
        tl.fromTo(S, { ring: 0 }, { ring: 1, duration: 0.6, immediateRender: false }, 2.6)
        // 03 movement: exploded view with labels, then the dive with smoke
        swap(1, 2, 3.35)
        // turn to the side while still closed, then open the parts to both sides
        const CT = { ...C, explode: 0 }
        go(B, CT, 3.3, 0.45)
        go(CT, C, 3.75, 0.5)
        tl.fromTo(S, { lbl: 0 }, { lbl: 1, duration: 0.25, immediateRender: false }, 4.2)
        tl.to(S, { lbl: 0, duration: 0.2 }, 4.7)
        go(C, C2, 4.75, 0.9)
        // precise automatic movement: the watch reassembles in front of giant type
        go(C2, PR, 6.0, 0.9)
        // 04 moment: the film turns light. Elegant contours, slim profile, final shot
        swap(2, 3, 7.4)
        go(PR, E, 7.3, 1.0)
        go(E, SL, 8.6, 0.9)
        go(SL, D2, 9.8, 0.8)
        tl.to({}, { duration: 0.5 }, 10.6)
        paint()

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
        <div className="cin-light" />
        {/* liquid distortion filters for the giant type (one per word) */}
        <svg className="cin-filters" width="0" height="0" aria-hidden="true" focusable="false">
          {[0, 1, 2, 3, 4].map((k) => (
            <filter key={k} id={`liq-${k}`} x="-10%" y="-20%" width="120%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency={`${0.008 + k * 0.002} 0.03`} numOctaves="2" seed={k + 3} />
              <feDisplacementMap in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          ))}
        </svg>
        <div className="cin-type">
          <span className="gt gt-l">KAIROS</span>
          <span className="gt gt-c">184</span>
          <span className="gt gt-c2">28,800</span>
          <span className="gt gt-d">Moment</span>
        </div>
        <canvas ref={canvasRef} className="cin-canvas" />
        {/* above the watch: inverts against it, so it reads over metal and background */}
        <div className="cin-type cin-type-top">
          <span className="gt gt-p">
            Precise
            <br />
            automatic
            <br />
            movement
          </span>
        </div>
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
            <p>Twelve interpretations of time. 184 parts, nothing hidden. 28,800 vibrations per hour. Precise automatic movement. Elegant contours. A slim 10.8 millimetre profile.</p>
          </div>

          <dl className="cs-hud" aria-hidden="true">
            {SPECS.map(([k, v], i) => (
              <div key={k} className={(active === 0 && i < 2) || (active === 2 && i >= 2 && i < 4) || active === 3 ? 'is-on' : active === 1 && i === 1 ? 'is-on' : ''}>
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

          <p className="cs-center cs-lineup" aria-hidden="true">
            <span>Twelve interpretations of time.</span> One KAIROS philosophy.
          </p>
          <div className="cs-center cs-contours" aria-hidden="true">
            <p className="cs-center-title">
              Elegant
              <br />
              contours
            </p>
            <p>Every edge is brushed, then the bevels are polished by hand so the case catches light from above.</p>
          </div>
          <p className="cs-extra cs-parts" aria-hidden="true">
            <strong>184 parts.</strong> Nothing hidden.
          </p>
          <p className="cs-extra cs-beats" aria-hidden="true">
            <strong>Six beats a second.</strong> The balance wheel swings 28,800 times an hour, every hour, for as long as you wear it.
          </p>
          <div className="cs-center cs-slim" aria-hidden="true">
            <p className="cs-center-title">
              Slim
              <br />
              profile
            </p>
            <p>10.8 mm from sapphire to caseback. Slim enough to slide under a cuff.</p>
          </div>

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
