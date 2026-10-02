import { useEffect, useMemo, useRef, useState } from 'react'
import WatchSVG from './WatchSVG'
import { CloseIcon, HeartIcon } from './Icons'
import { getWatch, formatPrice, studioOptions, strapKey, strapParts, studioPrice } from '../data/watches'
import { useShop, scrollToId } from '../store'
import { useDialog } from './Overlays'
import { prefersReducedMotion } from '../lib/gsap'

/*
  ProductStudio
  -------------
  Opens when any watch is selected. A full-screen 3D studio with:
    - 360° view: drag to rotate (arrow keys too), or turn on auto-spin
    - Explode: a slider that separates crystal, bezel, hands, dial, case,
      calibre and caseback, with live labels
    - Options: case colour, dial colour, strap type and strap colour,
      with the price updating as you choose
  Uses the same Three.js stage as the hero. Falls back to the SVG render
  when WebGL is not available.
*/

const can3D = () => {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

const LABELS = {
  default: [
    ['crystal', 'Sapphire crystal'],
    ['bezel', 'Bezel'],
    ['hands', 'Hands'],
    ['dial', 'Dial'],
    ['case', 'Case'],
    ['movement', 'Calibre'],
    ['caseback', 'Caseback'],
  ],
  pulse: [
    ['crystal', 'Sapphire glass'],
    ['bezel', 'Bezel'],
    ['dial', 'AMOLED screen'],
    ['case', 'Case'],
    ['movement', 'Board + battery'],
    ['caseback', 'Sensor back'],
  ],
}

const SCREENS = [
  ['face', 'Watch face'],
  ['apps', 'Apps'],
  ['sports', 'Sports'],
  ['workout', 'Workout'],
  ['health', 'Health'],
]
const FRONT = { rx: -0.08, ry: 0 } // face-on, to read the screen

const VIEW = { rx: -0.28, ry: -0.45 } // resting 3/4 view
const SIDE = { rx: 0.2, ry: -1.25 } // side view for the exploded parts

export default function ProductStudio() {
  const { drawer, setDrawer, addToBag, wishlist, toggleWish } = useShop()
  const open = drawer?.type === 'product'
  const watch = open ? getWatch(drawer.id) : null
  const panel = useRef(null)
  const close = () => setDrawer(null)
  useDialog(open, close, panel)

  const [look, setLook] = useState(null)
  const [explode, setExplode] = useState(0)
  const [spin, setSpin] = useState(false)
  const [screen, setScreen] = useState('face')
  const screenRef = useRef(screen)
  screenRef.current = screen
  const [ready, setReady] = useState(false)
  const [webgl] = useState(can3D)
  const canvasRef = useRef(null)
  const labelRefs = useRef([])
  const engine = useRef(null)
  const ctl = useRef({ target: { ...VIEW }, spin: false, explode: 0, dragging: false })
  const lookRef = useRef(look)
  lookRef.current = look

  // reset when a different watch opens
  useEffect(() => {
    if (!watch) return
    setLook({ ...watch.look })
    setExplode(0)
    setScreen('face')
    setSpin(!prefersReducedMotion())
    ctl.current.target = { ...VIEW }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawer?.id, open])

  ctl.current.spin = spin
  ctl.current.explode = explode
  ctl.current.labels = LABELS[look?.model === 'pulse' ? 'pulse' : 'default']

  // build the 3D stage while the studio is open
  useEffect(() => {
    if (!open || !webgl || !look) return
    let cancelled = false
    let raf = 0
    const cleanups = []
    import('../three/stage').then(({ createStage }) => {
      if (cancelled) return
      // use the latest look: it may have changed while Three.js was loading
      const st = createStage(canvasRef.current, { look: lookRef.current, maxDpr: 1.75 })
      engine.current = st
      st.setScreen?.(screenRef.current)
      setReady(true)
      const S = st.state
      Object.assign(S, { x: 0, y: 0.02, size: 0.42, maxW: 0.72, ...VIEW })
      let last = performance.now()

      const loop = () => {
        const now = performance.now()
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now
        const c = ctl.current
        if (c.spin && !c.dragging) c.target.ry += dt * 0.55
        S.rx += (c.target.rx - S.rx) * 0.1
        S.ry += (c.target.ry - S.ry) * 0.1
        S.explode += (c.explode - S.explode) * 0.12
        S.hideStrap = Math.min(1, S.explode * 1.6)
        const goalSize = 0.42 - 0.17 * Math.min(1, c.explode)
        S.size += (goalSize - S.size) * 0.1
        st.frame()
        // labels follow the exploded parts
        const show = S.explode > 0.35
        c.labels.forEach(([part], i) => {
          const el = labelRefs.current[i]
          if (!el) return
          const p = show ? st.project(part) : null
          el.style.opacity = p ? Math.min(1, (S.explode - 0.35) * 3) : 0
          if (p) el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`
        })
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)

      // drag to rotate (360°)
      const el = canvasRef.current
      let sx = 0
      let sy = 0
      let start = null
      const down = (e) => {
        ctl.current.dragging = true
        sx = e.clientX
        sy = e.clientY
        start = { ...ctl.current.target }
        el.setPointerCapture?.(e.pointerId)
      }
      const move = (e) => {
        const r = el.getBoundingClientRect()
        st.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1))
        if (!ctl.current.dragging) return
        ctl.current.target.ry = start.ry + (e.clientX - sx) * 0.012
        ctl.current.target.rx = Math.max(-1.3, Math.min(1.3, start.rx + (e.clientY - sy) * 0.009))
      }
      const up = () => (ctl.current.dragging = false)
      const key = (e) => {
        const t = ctl.current.target
        if (e.key === 'ArrowLeft') t.ry -= 0.35
        else if (e.key === 'ArrowRight') t.ry += 0.35
        else if (e.key === 'ArrowUp') t.rx = Math.max(-1.3, t.rx - 0.25)
        else if (e.key === 'ArrowDown') t.rx = Math.min(1.3, t.rx + 0.25)
        else return
        e.preventDefault()
      }
      const resize = () => st.resize()
      el.addEventListener('pointerdown', down)
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      el.addEventListener('keydown', key)
      window.addEventListener('resize', resize)
      cleanups.push(() => {
        el.removeEventListener('pointerdown', down)
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        el.removeEventListener('keydown', key)
        window.removeEventListener('resize', resize)
      })
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      cleanups.forEach((f) => f())
      engine.current?.dispose()
      engine.current = null
      setReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, webgl, look === null])

  // smartwatch screen page
  useEffect(() => {
    engine.current?.setScreen?.(screen)
  }, [screen, ready])

  // apply option changes instantly
  useEffect(() => {
    if (look) engine.current?.setLook(look)
  }, [look])

  const strap = look ? strapParts(look.strap) : null
  const price = useMemo(() => (watch && look ? studioPrice(watch, look) : 0), [watch, look])

  if (!open || !watch || !look) return <div className="studio-root" aria-hidden="true" />

  const set = (k, v) => setLook((l) => ({ ...l, [k]: v }))
  const setStrapType = (type) => {
    const colors = studioOptions.strapColor[type]
    const keep = colors?.find((c) => c.id === strap.color)
    set('strap', strapKey(type, keep ? keep.id : colors?.[0].id))
  }
  const toggleExplode = (v) => {
    setExplode(v)
    // turn to the side so the parts spread across the screen
    ctl.current.target = v > 0 ? { ...SIDE } : { ...VIEW }
    if (v > 0) setSpin(false)
  }
  const resetView = () => {
    setExplode(0)
    ctl.current.target = { ...VIEW }
  }
  const saved = wishlist.includes(watch.id)
  const isPulse = look.model === 'pulse'
  const caseLabel = studioOptions.caseFinish.find((o) => o.id === look.caseFinish)?.label
  const dialLabel = studioOptions.dial.find((o) => o.id === look.dial)?.label
  const strapLabel = `${strap.color ? studioOptions.strapColor[strap.type].find((c) => c.id === strap.color)?.label + ' ' : ''}${studioOptions.strapType.find((t) => t.id === strap.type)?.label.toLowerCase()}`
  const labels = LABELS[isPulse ? 'pulse' : 'default']

  return (
    <div className="studio-root is-open">
      <div ref={panel} className="studio" role="dialog" aria-modal="true" aria-labelledby="studio-title">
        {/* ---------- 3D stage ---------- */}
        <div className="studio-stage">
          <div className="studio-backdrop" aria-hidden="true" />
          {webgl ? (
            <>
              {!ready && (
                <div className="studio-fallback">
                  <WatchSVG {...look} title={watch.name} />
                </div>
              )}
              <canvas
                ref={canvasRef}
                className={`studio-canvas ${ready ? 'is-ready' : ''}`}
                tabIndex={0}
                role="img"
                aria-label={`${watch.name} in 3D. Drag, or use the arrow keys, to rotate.`}
              />
              <div className="studio-labels" aria-hidden="true">
                {labels.map(([part, name], i) => (
                  <div key={part} ref={(el) => (labelRefs.current[i] = el)} className={`cin-label ${i % 2 ? 'is-bottom' : 'is-top'}`}>
                    <span className="cin-label-line" />
                    <span className="cin-label-text">
                      <em>{String(i + 1).padStart(2, '0')}</em> {name}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="studio-fallback">
              <WatchSVG {...look} title={watch.name} />
            </div>
          )}

          <div className="studio-tools">
            <button className={`tool ${spin ? 'is-on' : ''}`} aria-pressed={spin} onClick={() => setSpin((s) => !s)} disabled={!webgl}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <ellipse cx="12" cy="12" rx="9" ry="4" />
                <path d="M17 7.5l1.6 1.2-1.6 1.2" />
              </svg>
              360°
            </button>
            <label className="tool tool-range">
              <span>Explode</span>
              <input type="range" min="0" max="1" step="0.01" value={explode} onChange={(e) => toggleExplode(Number(e.target.value))} disabled={!webgl} aria-valuetext={`${Math.round(explode * 100)} percent`} />
            </label>
            <button className="tool" onClick={() => toggleExplode(explode > 0 ? 0 : 1)} disabled={!webgl}>
              {explode > 0 ? 'Assemble' : 'Explode'}
            </button>
            <button className="tool" onClick={resetView} disabled={!webgl}>
              Reset
            </button>
          </div>
          <p className="studio-hint" aria-hidden="true">{webgl ? 'Drag to rotate 360°' : 'Interactive 3D needs WebGL'}</p>
        </div>

        {/* ---------- details + options ---------- */}
        <div className="studio-panel">
          <button className="icon-btn studio-close" onClick={close} aria-label="Close" data-autofocus>
            <CloseIcon />
          </button>
          <p className="eyebrow">{watch.category}</p>
          <h2 id="studio-title" className="display-m">{watch.name}</h2>
          <p className="studio-price" aria-live="polite">{formatPrice(price)}</p>
          <p className="studio-text">{watch.long}</p>

          {isPulse && (
            <fieldset className="opt-group">
              <legend>
                Screen <span>{SCREENS.find(([id]) => id === screen)?.[1]}</span>
              </legend>
              <div className="opt-pills opt-screens">
                {SCREENS.map(([id, label]) => (
                  <label key={id} className={`pill ${screen === id ? 'is-on' : ''}`}>
                    <input
                      type="radio"
                      name="s-screen"
                      checked={screen === id}
                      onChange={() => {
                        setScreen(id)
                        // stop and face the screen so the page can be read
                        setSpin(false)
                        setExplode(0)
                        ctl.current.target = { ...FRONT }
                      }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset className="opt-group">
            <legend>
              Case colour <span>{caseLabel}</span>
            </legend>
            <div className="opt-swatches">
              {studioOptions.caseFinish.map((o) => (
                <label key={o.id} className={`swatch ${look.caseFinish === o.id ? 'is-on' : ''}`} title={o.label}>
                  <input type="radio" name="s-case" checked={look.caseFinish === o.id} onChange={() => set('caseFinish', o.id)} />
                  <span style={{ background: o.swatch }} aria-hidden="true" />
                  <em className="sr-only">{o.label}</em>
                </label>
              ))}
            </div>
          </fieldset>

          {!isPulse && (
            <fieldset className="opt-group">
              <legend>
                Dial colour <span>{dialLabel}</span>
              </legend>
              <div className="opt-swatches">
                {studioOptions.dial.map((o) => (
                  <label key={o.id} className={`swatch ${look.dial === o.id ? 'is-on' : ''}`} title={o.label}>
                    <input type="radio" name="s-dial" checked={look.dial === o.id} onChange={() => set('dial', o.id)} />
                    <span style={{ background: o.swatch }} aria-hidden="true" />
                    <em className="sr-only">{o.label}</em>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset className="opt-group">
            <legend>
              Strap type <span>{studioOptions.strapType.find((t) => t.id === strap.type)?.label}</span>
            </legend>
            <div className="opt-pills">
              {studioOptions.strapType.map((t) => (
                <label key={t.id} className={`pill ${strap.type === t.id ? 'is-on' : ''}`}>
                  <input type="radio" name="s-strap" checked={strap.type === t.id} onChange={() => setStrapType(t.id)} />
                  {t.label}
                  <small>{t.price ? '+' + formatPrice(t.price) : 'Included'}</small>
                </label>
              ))}
            </div>
          </fieldset>

          {studioOptions.strapColor[strap.type] ? (
            <fieldset className="opt-group">
              <legend>
                Strap colour <span>{studioOptions.strapColor[strap.type].find((c) => c.id === strap.color)?.label}</span>
              </legend>
              <div className="opt-swatches">
                {studioOptions.strapColor[strap.type].map((c) => (
                  <label key={c.id} className={`swatch ${strap.color === c.id ? 'is-on' : ''}`} title={c.label}>
                    <input type="radio" name="s-strapc" checked={strap.color === c.id} onChange={() => set('strap', strapKey(strap.type, c.id))} />
                    <span style={{ background: c.swatch }} aria-hidden="true" />
                    <em className="sr-only">{c.label}</em>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <p className="opt-note">Metal straps are finished to match the case colour.</p>
          )}

          <dl className="specs specs-compact">
            {Object.entries(watch.specs).map(([k, v]) => (
              <div className="spec" key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>

          <div className="studio-actions">
            <button
              className="btn btn-solid"
              onClick={() => addToBag({ id: watch.id, name: watch.name, price, look, note: `${caseLabel} / ${isPulse ? 'AMOLED' : dialLabel} / ${strapLabel}` })}
            >
              <span>Add to bag</span>
            </button>
            <button className={`icon-btn wish ${saved ? 'is-on' : ''}`} aria-pressed={saved} aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'} onClick={() => toggleWish(watch.id)}>
              <HeartIcon filled={saved} />
            </button>
          </div>
          <button className="btn-link" onClick={() => { close(); setTimeout(() => scrollToId('contact'), 60) }}>
            Ask about this watch
          </button>
        </div>
      </div>
    </div>
  )
}
