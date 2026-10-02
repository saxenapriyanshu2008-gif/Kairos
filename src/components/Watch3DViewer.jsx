import { useEffect, useRef, useState } from 'react'
import WatchSVG from './WatchSVG'
import { prefersReducedMotion } from '../lib/gsap'

/*
  Drag-to-rotate 3D preview used by the configurator.
  Reuses the same Three.js stage as the hero. Changing `look` only swaps
  colours and parts, so it updates instantly. Falls back to the SVG render
  when WebGL is not available or the user prefers reduced motion.
*/

const can3D = () => {
  if (prefersReducedMotion()) return false
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function Watch3DViewer({ look, title }) {
  const [use3D] = useState(can3D)
  const [ready, setReady] = useState(false)
  const wrap = useRef(null)
  const canvas = useRef(null)
  const stage = useRef(null)
  const lookRef = useRef(look)
  lookRef.current = look

  useEffect(() => {
    if (!use3D) return
    let cancelled = false
    let io
    let raf = 0
    const cleanups = []

    // load only when the configurator is near the viewport
    io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !stage.current) {
          import('../three/stage').then(({ createStage }) => {
            if (cancelled) return
            const st = createStage(canvas.current, { look: lookRef.current, maxDpr: 1.5 })
            Object.assign(st.state, { size: 0.36, maxW: 0.8, rx: -0.35, ry: -0.5, rz: 0.08, x: 0, y: 0.02 })
            stage.current = st
            setReady(true)
            attachDrag(st)
            run(true)
          })
        } else if (stage.current) {
          run(e.isIntersecting)
        }
      },
      { rootMargin: '200px' }
    )
    io.observe(wrap.current)

    // render loop with a slow idle sway; drag rotates the watch
    let dragging = false
    let target = { rx: -0.35, ry: -0.5 }
    let idle = true
    let t0 = performance.now()
    function loop() {
      const st = stage.current
      if (!st) return
      const t = (performance.now() - t0) / 1000
      const S = st.state
      const goalRy = idle ? target.ry + Math.sin(t * 0.4) * 0.35 : target.ry
      S.ry += (goalRy - S.ry) * 0.08
      S.rx += (target.rx - S.rx) * 0.08
      st.frame()
      raf = requestAnimationFrame(loop)
    }
    function run(on) {
      cancelAnimationFrame(raf)
      if (on) raf = requestAnimationFrame(loop)
    }

    function attachDrag(st) {
      const el = canvas.current
      let sx = 0
      let sy = 0
      let start = null
      const down = (e) => {
        dragging = true
        idle = false
        sx = e.clientX
        sy = e.clientY
        start = { ...target }
        el.setPointerCapture?.(e.pointerId)
      }
      const move = (e) => {
        const r = el.getBoundingClientRect()
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          st.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1))
        }
        if (!dragging) return
        target.ry = start.ry + (e.clientX - sx) * 0.012
        target.rx = Math.max(-1.1, Math.min(0.9, start.rx + (e.clientY - sy) * 0.008))
      }
      const up = () => {
        dragging = false
        setTimeout(() => !dragging && (idle = true, (t0 = performance.now())), 2500)
      }
      // keyboard: arrow keys rotate
      const key = (e) => {
        if (e.key === 'ArrowLeft') target.ry -= 0.3
        else if (e.key === 'ArrowRight') target.ry += 0.3
        else if (e.key === 'ArrowUp') target.rx = Math.max(-1.1, target.rx - 0.2)
        else if (e.key === 'ArrowDown') target.rx = Math.min(0.9, target.rx + 0.2)
        else return
        e.preventDefault()
        idle = false
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
    }

    return () => {
      cancelled = true
      io?.disconnect()
      cancelAnimationFrame(raf)
      cleanups.forEach((f) => f())
      stage.current?.dispose()
      stage.current = null
    }
  }, [use3D])

  // apply configuration changes
  useEffect(() => {
    stage.current?.setLook(look)
  }, [look])

  if (!use3D) return <WatchSVG {...look} title={title} />

  return (
    <div ref={wrap} className={`viewer3d ${ready ? 'is-ready' : ''}`}>
      {!ready && <WatchSVG {...look} title={title} />}
      <canvas
        ref={canvas}
        className="viewer3d-canvas"
        tabIndex={0}
        role="img"
        aria-label={`${title}. 3D view: drag, or use the arrow keys, to rotate.`}
        data-cursor="discover"
      />
      <span className="viewer3d-hint" aria-hidden="true">Drag to rotate</span>
    </div>
  )
}
