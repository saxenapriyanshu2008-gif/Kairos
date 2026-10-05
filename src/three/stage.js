import * as THREE from 'three'
import { studioScene } from './studio.js'
import { buildWatch } from './model'

/*
  createStage(canvas, options)
  ----------------------------
  One small Three.js "photo studio": renderer, camera, studio reflections,
  the KAIROS watch, a gold ring and a particle field.

  The page never touches Three.js directly. It only changes `stage.state`
  (usually with GSAP + ScrollTrigger) and the render loop reads it:

    x, y        position as a fraction of half the viewport (-1..1)
    size        case diameter as a fraction of viewport height
    rx, ry, rz  rotation in radians
    explode     0 = assembled, 1 = exploded view, >1 = parts fly past camera
    hideStrap   0..1
    ring        0..1 gold ring drawn around the dial
    particles   0..1 particle field around the movement
    tiltX/Y     extra rotation from the cursor
  Film-only extras (film: true):
    lineup      0..1 three more KAIROS models fly in beside the main watch
    textRing    0..1 a ring of giant type circling the watch in 3D
    smoke       0..1 flowing light streams around the movement
*/
export function createStage(canvas, { look, maxDpr = 1.75, onFrame, film = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.92
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const studio = studioScene()
  const envTex = pmrem.fromScene(studio.scene, 0.02).texture
  studio.dispose()
  scene.environment = envTex
  scene.environmentIntensity = 1 // softbox studio: sharp light and dark bands on polished steel

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100)
  camera.position.set(0, 0, 10)

  // studio lights on top of the environment reflections
  const key = new THREE.DirectionalLight('#fff3e0', 1.3)
  key.position.set(-4, 5, 6)
  const rim = new THREE.DirectionalLight('#c9ad7c', 2.0)
  rim.position.set(5, -2, -4)
  const fill = new THREE.AmbientLight('#ffffff', 0.12)
  scene.add(key, rim, fill)

  // Live shine: a small warm light that follows the cursor in front of the watch,
  // so a highlight slides across the case, bezel and crystal like a real lamp.
  const shine = new THREE.PointLight('#fff6e8', 0, 14, 1.6)
  shine.position.set(0, 0, 4)
  scene.add(shine)
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false, last: 0 }

  // pose pivot -> watch
  const pivot = new THREE.Group()
  scene.add(pivot)
  const watch = buildWatch(look)
  pivot.add(watch.root)

  // gold ring around the dial (drawn progressively)
  const ringPts = []
  for (let i = 0; i <= 256; i++) {
    const a = Math.PI / 2 - (i / 256) * Math.PI * 2
    ringPts.push(new THREE.Vector3(Math.cos(a) * 1.18, Math.sin(a) * 1.18, 0.2))
  }
  const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts)
  const ringMat = new THREE.LineBasicMaterial({ color: '#c9ad7c', transparent: true })
  const ring = new THREE.Line(ringGeo, ringMat)
  watch.root.add(ring)

  // particle field ("mechanical heart")
  const PCOUNT = window.innerWidth < 768 ? 900 : 2200
  const pGeo = new THREE.BufferGeometry()
  const pos = new Float32Array(PCOUNT * 3)
  const col = new Float32Array(PCOUNT * 3)
  const gold = new THREE.Color('#c9ad7c')
  const ivory = new THREE.Color('#efe9de')
  for (let i = 0; i < PCOUNT; i++) {
    const a = Math.random() * Math.PI * 2
    const r = 1.3 + Math.pow(Math.random(), 1.6) * 3.2
    const wobble = Math.sin(a * 3) * 0.35
    pos[i * 3] = Math.cos(a) * r
    pos[i * 3 + 1] = Math.sin(a) * r * 0.62 + wobble
    pos[i * 3 + 2] = (Math.random() - 0.5) * 1.6
    const c = Math.random() < 0.35 ? gold : ivory
    col[i * 3] = c.r
    col[i * 3 + 1] = c.g
    col[i * 3 + 2] = c.b
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  const pMat = new THREE.PointsMaterial({ size: 0.022, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true })
  const points = new THREE.Points(pGeo, pMat)
  scene.add(points)

  // ---------- film extras ----------
  const extras = []
  let ringG = null
  let smoke = null
  const disposeExtra = []
  let buildExtra = () => false
  if (film) {
    // 1. lineup: three more models that fly in beside the main watch (two florals and VOID)
    const LOOKS = [
      { model: 'flora', caseFinish: 'rose', dial: 'pearl', strap: 'blushLeather' },
      { model: 'void', caseFinish: 'blue', dial: 'midnight', strap: 'steel' },
      { model: 'jardin', caseFinish: 'champagne', dial: 'emerald', strap: 'steel' },
    ]
    // These watches only appear after some scrolling, so they are not built with
    // the scene (that made the first screen slow on phones). They are built one
    // per idle moment after the first scroll or touch, long before the lineup.
    let built = 0
    buildExtra = () => {
      if (built >= LOOKS.length) return false
      const k = built++
      const l = LOOKS[k]
      const p = new THREE.Group()
      const wch = buildWatch(l)
      // never opened, so skip the calibre, except on VOID whose open dial shows it
      wch.parts.movement.visible = l.model === 'void'
      p.add(wch.root)
      p.visible = false
      scene.add(p)
      extras.push({ p, w: wch, slot: [0, 2, 3][k], k })
      disposeExtra.push(() => wch.dispose())
      return built < LOOKS.length
    }
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 60))
    const step = () => buildExtra() && idle(step, { timeout: 400 })
    const EVENTS = ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown']
    const kick = () => {
      EVENTS.forEach((ev) => window.removeEventListener(ev, kick))
      idle(step, { timeout: 400 })
    }
    EVENTS.forEach((ev) => window.addEventListener(ev, kick, { passive: true }))
    disposeExtra.push(() => EVENTS.forEach((ev) => window.removeEventListener(ev, kick)))

    // 2. a ring of giant type that circles the watch (front letters pass in front of it)
    const c = document.createElement('canvas')
    c.width = 4096
    c.height = 512
    const g = c.getContext('2d')
    g.fillStyle = '#efe9de'
    g.font = '800 300px "Manrope Variable", Arial, sans-serif'
    g.textBaseline = 'middle'
    const phrase = 'KAIROS — K-01 — 316L — '
    let x = 0
    while (x < c.width) {
      g.fillText(phrase, x, 270)
      x += g.measureText(phrase).width
    }
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = THREE.RepeatWrapping
    tex.anisotropy = 8
    const geo = new THREE.CylinderGeometry(1.75, 1.75, 0.62, 160, 1, true)
    const front = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.3, side: THREE.FrontSide, toneMapped: false })
    const back = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.22, side: THREE.BackSide, depthWrite: false, toneMapped: false })
    ringG = new THREE.Group()
    ringG.add(new THREE.Mesh(geo, back), new THREE.Mesh(geo, front))
    ringG.visible = false
    scene.add(ringG)
    disposeExtra.push(() => {
      geo.dispose()
      front.dispose()
      back.dispose()
      tex.dispose()
    })

    // 3. smoke: particles drift through a flow field; each is drawn as a short
    //    streak (from its position back along its velocity) so they read as silk threads
    const N = window.innerWidth < 768 ? 900 : 2000
    const P = new Float32Array(N * 3)
    const V = new Float32Array(N * 3)
    const age = new Float32Array(N)
    const seg = new Float32Array(N * 6)
    const spawn = (i) => {
      const a = Math.random() * Math.PI * 2
      const r = 1.2 + Math.random() * 1.6
      P[i * 3] = Math.cos(a) * r
      P[i * 3 + 1] = Math.sin(a) * r * 0.7
      // keep the threads in a layer behind the watch so they never cross its face
      P[i * 3 + 2] = -1.1 - Math.random() * 0.9
      age[i] = Math.random() * 6
    }
    for (let i = 0; i < N; i++) spawn(i)
    const sgeo = new THREE.BufferGeometry()
    sgeo.setAttribute('position', new THREE.BufferAttribute(seg, 3))
    const smat = new THREE.LineBasicMaterial({ color: '#efe9de', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    const lines = new THREE.LineSegments(sgeo, smat)
    lines.frustumCulled = false
    lines.renderOrder = -1 // draw first, so the watch always covers it
    lines.visible = false
    scene.add(lines)
    smoke = {
      lines,
      step(t, dt) {
        for (let i = 0; i < N; i++) {
          const j = i * 3
          const x = P[j]
          const y = P[j + 1]
          const z = P[j + 2]
          const r = Math.hypot(x, y) + 0.4
          let vx = Math.sin(y * 1.7 + t * 0.4) - Math.cos(z * 1.3) * 0.6 - (y / r) * 1.2 - x * 0.08
          let vy = Math.sin(z * 1.5 + t * 0.3) + Math.cos(x * 1.1) * 0.8 + (x / r) * 1.2 - y * 0.08
          let vz = Math.sin(x * 1.3 - t * 0.2) * 0.3 - (z + 1.5) * 0.6
          V[j] += (vx - V[j]) * 0.1
          V[j + 1] += (vy - V[j + 1]) * 0.1
          V[j + 2] += (vz - V[j + 2]) * 0.1
          P[j] += V[j] * dt * 0.55
          P[j + 1] += V[j + 1] * dt * 0.55
          P[j + 2] += V[j + 2] * dt * 0.55
          // hard stop: never drift forward past the back of the case
          if (P[j + 2] > -0.9) P[j + 2] = -0.9
          age[i] += dt
          if (age[i] > 7 || r > 4.2) spawn(i)
          const k = i * 6
          seg[k] = P[j]
          seg[k + 1] = P[j + 1]
          seg[k + 2] = P[j + 2]
          seg[k + 3] = P[j] - V[j] * 0.09
          seg[k + 4] = P[j + 1] - V[j + 1] * 0.09
          seg[k + 5] = P[j + 2] - V[j + 2] * 0.09
        }
        sgeo.attributes.position.needsUpdate = true
      },
    }
    disposeExtra.push(() => {
      sgeo.dispose()
      smat.dispose()
    })
  }

  const state = { x: 0, y: 0, z: 0, fly: 0, size: 0.6, maxW: 0.84, rx: 0, ry: 0, rz: 0, explode: 0, hideStrap: 0, ring: 0, particles: 0, tiltX: 0, tiltY: 0, opacity: 1, lineup: 0, textRing: 0, ringSpin: 0, smoke: 0 }

  let w = 1
  let h = 1
  let halfH = 1
  let halfW = 1
  function resize() {
    const r = canvas.getBoundingClientRect()
    w = Math.max(1, r.width)
    h = Math.max(1, r.height)
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z
    halfW = halfH * camera.aspect
  }
  resize()

  const clock = new THREE.Clock()
  let raf = 0
  let running = false

  const _centre = new THREE.Vector3()
  function applyPose() {
    const s = Math.min(state.size * halfH, state.maxW * halfW)
    pivot.scale.setScalar(s)
    pivot.position.set(state.x * halfW, state.y * halfH, state.z)
    pivot.rotation.set(state.rx + state.tiltX, state.ry + state.tiltY, state.rz)
    // the front parts travel further than the back ones (crystal 1.55, caseback 1.05),
    // so slide the whole watch back by half the difference: the opened watch stays
    // centred on its case and spreads evenly to both sides
    if (state.explode > 0.001) {
      _centre.set(0, 0, -0.25 * state.explode * s).applyEuler(pivot.rotation)
      pivot.position.add(_centre)
    }
    points.position.copy(pivot.position)
    points.scale.setScalar(s * 0.9)
    // lineup: slots across the screen, the extras slide in from the right one by one
    const SLOTS = [-0.75, -0.25, 0.25, 0.75]
    // lineup reached before the idle builds finished (e.g. a jump link): build now
    if (state.lineup > 0.5) while (buildExtra());
    for (const e of extras) {
      // the extras only start once the hero watch has nearly reached its slot,
      // then rise into their own slots from below and from further back,
      // so they never cross the hero watch's path
      const l = Math.max(0, Math.min(1, (state.lineup - 0.62) * 4.6 - e.k * 0.25))
      e.p.visible = l > 0.01
      if (!e.p.visible) continue
      const ease = 1 - Math.pow(1 - l, 3)
      e.p.scale.setScalar(s * (0.85 + 0.15 * ease))
      e.p.position.set(SLOTS[e.slot] * halfW, state.y * halfH - (1 - ease) * 1.1 * halfH, -1.8 * (1 - ease))
      e.p.rotation.set(state.rx + state.tiltX + (1 - ease) * 0.6, state.ry + state.tiltY + (1 - ease) * 0.8, state.rz)
    }
    if (ringG) {
      ringG.visible = state.textRing > 0.01
      ringG.position.copy(pivot.position)
      ringG.scale.setScalar(s)
      ringG.children.forEach((m, i) => (m.material.opacity = state.textRing * (i === 0 ? 0.22 : 1)))
    }
    if (smoke) {
      smoke.lines.visible = state.smoke > 0.01
      smoke.lines.position.copy(pivot.position)
      smoke.lines.scale.setScalar(s * 0.95)
      smoke.lines.material.opacity = state.smoke * 0.32
    }
  }

  let lastT = 0
  // skipRender lets an offline renderer advance the scene without drawing every step
  function frame(skipRender = false) {
    const t = clock.getElapsedTime()
    const dt = Math.min(0.05, t - lastT)
    lastT = t
    applyPose()
    for (const e of extras) if (e.p.visible) e.w.update(t)
    if (ringG?.visible) {
      ringG.rotation.set(0.28 + state.tiltX * 0.5, t * 0.12 + state.ringSpin, -0.08)
      ringG.children[1].material.alphaTest = 0.3
    }
    if (smoke?.lines.visible) smoke.step(t, dt)
    // cursor light: follow the pointer; with no pointer, drift slowly by itself
    if (!pointer.active || t - pointer.last > 4) {
      pointer.tx = Math.sin(t * 0.35) * 0.7
      pointer.ty = Math.cos(t * 0.27) * 0.45
    }
    pointer.x += (pointer.tx - pointer.x) * 0.08
    pointer.y += (pointer.ty - pointer.y) * 0.08
    shine.position.set(pointer.x * halfW, pointer.y * halfH, 2.8)
    shine.intensity = 24
    watch.update(t, state.explode, state.hideStrap, state.fly)
    ring.geometry.setDrawRange(0, Math.floor(257 * state.ring))
    ring.visible = state.ring > 0.001
    pMat.opacity = state.particles * 0.9
    points.visible = state.particles > 0.01
    points.rotation.z = t * 0.05
    points.rotation.x = Math.sin(t * 0.2) * 0.15
    if (!skipRender) renderer.render(scene, camera)
    onFrame?.()
  }

  function loop() {
    frame()
    if (running) raf = requestAnimationFrame(loop)
  }
  function start() {
    if (running) return
    running = true
    raf = requestAnimationFrame(loop)
  }
  function stop() {
    running = false
    cancelAnimationFrame(raf)
  }

  // screen position (CSS px, relative to the canvas) of a part's label anchor
  const v = new THREE.Vector3()
  function project(part) {
    const p = watch.parts[part]
    if (!p) return null
    v.copy(watch.anchors[part])
    p.localToWorld(v)
    v.project(camera)
    return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, behind: v.z > 1 }
  }
  function projectCenter() {
    v.set(0, 0, 0)
    pivot.localToWorld(v)
    v.project(camera)
    return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h }
  }

  function dispose() {
    buildExtra = () => false // an idle build still queued must not touch a disposed scene
    stop()
    watch.dispose()
    pGeo.dispose()
    pMat.dispose()
    ringGeo.dispose()
    ringMat.dispose()
    disposeExtra.forEach((f) => f())
    envTex.dispose()
    pmrem.dispose()
    renderer.dispose()
  }

  // nx, ny in -1..1 across the canvas (y up)
  function setPointer(nx, ny) {
    pointer.tx = nx
    pointer.ty = ny
    pointer.active = true
    pointer.last = clock.getElapsedTime()
  }

  return { state, start, stop, resize, frame, setPointer, project, projectCenter, setLook: watch.setLook, setScreen: watch.setScreen, handTime: watch.handTime, dispose }
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}
