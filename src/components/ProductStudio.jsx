import { useEffect, useMemo, useRef, useState } from 'react'
import WatchSVG from './WatchSVG'
import { CloseIcon, HeartIcon } from './Icons'
import { getWatch, formatPrice, studioOptions, strapKey, strapParts, studioPrice } from '../data/watches'
import { useShop, scrollToId } from '../store'
import { useDialog } from './Overlays'
import ProductGallery, { slidesFor, partsFor } from './ProductGallery'

/*
  ProductStudio
  -------------
  Opens when any watch is selected. Full screen, with two halves:
    - left: a product gallery with arrows (photo, drag-to-rotate 360° view,
      and an exploded "Inside" view with every part explained; PULSE also
      shows its screens and a feature video)
    - right: details and options (case colour, dial colour, strap type and
      strap colour), with the price updating as you choose
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

const VIEW = { rx: -0.28, ry: -0.45 } // resting 3/4 view
const SIDE = { rx: 0.2, ry: -1.25 } // side view for the exploded parts
// the gallery "photo" angle and the face-on angle for smartwatch screens
const PHOTO = { rx: -0.3, ry: -0.5 }
const SCREEN = { rx: -0.06, ry: -0.08 }
const BACK = { rx: -0.06, ry: Math.PI + 0.1 } // the caseback, slightly turned

export default function ProductStudio() {
  const { drawer, setDrawer, addToBag, wishlist, toggleWish } = useShop()
  const open = drawer?.type === 'product'
  const watch = open ? getWatch(drawer.id) : null
  const panel = useRef(null)
  const close = () => setDrawer(null)
  useDialog(open, close, panel)

  const [look, setLook] = useState(null)
  const [explode, setExplode] = useState(0)
  const [slide, setSlide] = useState(0)
  const [ready, setReady] = useState(false)
  const [webgl] = useState(can3D)
  const canvasRef = useRef(null)
  const labelRefs = useRef([])
  const engine = useRef(null)
  const ctl = useRef({ target: { ...VIEW }, explode: 0, dragging: false })
  const lookRef = useRef(look)
  lookRef.current = look

  // reset when a different watch opens
  useEffect(() => {
    if (!watch) return
    setLook({ ...watch.look })
    setExplode(0)
    setSlide(0)
    ctl.current.target = { ...PHOTO } // every gallery starts on the photo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawer?.id, open])

  ctl.current.explode = explode
  ctl.current.labels = watch ? partsFor(watch) : []

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
      setReady(true)
      const S = st.state
      Object.assign(S, { x: 0, y: 0.02, size: 0.46, maxW: 0.72, ...ctl.current.target })

      const loop = () => {
        const c = ctl.current
        if (c.active === false) {
          raf = requestAnimationFrame(loop)
          return
        }
        // opening: turn to the side first, then spread the parts once the turn is done.
        // closing: bring the parts together first, then turn back.
        const opening = c.explode > 0.5
        const turning = Math.abs(c.target.rx - S.rx) + Math.abs(c.target.ry - S.ry) > 0.06
        const holdTurn = !opening && S.explode > 0.04
        if (!holdTurn) {
          S.rx += (c.target.rx - S.rx) * 0.09
          S.ry += (c.target.ry - S.ry) * 0.09
        }
        const goalEx = opening && turning ? 0 : c.explode
        S.explode += (goalEx - S.explode) * 0.07
        // the strap fades while the watch turns, before the parts open
        const goalStrap = opening ? 1 : Math.min(1, S.explode * 1.6)
        S.hideStrap += (goalStrap - S.hideStrap) * 0.08
        const goalSize = c.size || 0.42 - 0.13 * Math.min(1, c.explode)
        S.size += (goalSize - S.size) * 0.1
        const goalY = c.lift ? 0.21 : 0.02
        S.y += (goalY - S.y) * 0.1
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
        if (ctl.current.locked) return
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
        if (ctl.current.locked) return
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

  // gallery: only the 3D slides use the stage
  // the photo and screen slides are rendered live from the 3D model in a fixed pose,
  // so they always show the case, dial and strap that are currently chosen
  const cur = watch ? slidesFor(watch)[slide] : null
  const kind = cur?.type || '3d'
  ctl.current.active = kind === '3d' || kind === 'explode' || kind === 'photo' || kind === 'screen' || kind === 'back'
  ctl.current.locked = kind === 'photo' || kind === 'screen' || kind === 'back' // fixed shot, no dragging
  ctl.current.lift = kind === 'explode'
  ctl.current.size = kind === 'screen' ? 0.6 : kind === 'photo' ? 0.46 : kind === 'back' ? 0.64 : null
  useEffect(() => {
    if (!watch) return
    const ex = kind === 'explode'
    setExplode(ex ? 1 : 0)
    const goal = ex ? { ...SIDE } : kind === 'photo' ? { ...PHOTO } : kind === 'screen' ? { ...SCREEN } : kind === 'back' ? { ...BACK } : { ...VIEW }
    // turn the short way round (the 360 view may have spun the watch several times)
    const curRy = engine.current?.state.ry ?? goal.ry
    goal.ry += Math.PI * 2 * Math.round((curRy - goal.ry) / (Math.PI * 2))
    ctl.current.target = goal
    engine.current?.setScreen?.(kind === 'screen' ? cur.page : 'face')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide, watch?.id, ready])

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
  const saved = wishlist.includes(watch.id)
  const isPulse = look.model === 'pulse'
  const caseLabel = studioOptions.caseFinish.find((o) => o.id === look.caseFinish)?.label
  const dialLabel = studioOptions.dial.find((o) => o.id === look.dial)?.label
  const strapLabel = `${strap.color ? studioOptions.strapColor[strap.type].find((c) => c.id === strap.color)?.label + ' ' : ''}${studioOptions.strapType.find((t) => t.id === strap.type)?.label.toLowerCase()}`
  const labels = partsFor(watch)

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
                className={`studio-canvas ${ready ? 'is-ready' : ''} ${ctl.current.active === false ? 'is-off' : ''}`}
                tabIndex={0}
                role="img"
                aria-label={`${watch.name} in 3D. Drag, or use the arrow keys, to rotate.`}
              />
              <div className="studio-labels" aria-hidden="true">
                {labels.map(([part], i) => (
                  <div key={part} ref={(el) => (labelRefs.current[i] = el)} className={`cin-label ${i % 2 ? 'is-bottom' : 'is-top'}`}>
                    <span className="cin-label-line" />
                    <span className="cin-label-text">
                      <em>{String(i + 1).padStart(2, '0')}</em>
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

          <ProductGallery watch={watch} slide={slide} setSlide={setSlide} live={webgl && ready} />

          {kind === '3d' && <p className="studio-hint" aria-hidden="true">{webgl ? 'Drag to rotate 360°' : 'Interactive 3D needs WebGL'}</p>}
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
