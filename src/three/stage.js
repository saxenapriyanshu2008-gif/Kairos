import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
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
*/
export function createStage(canvas, { look, maxDpr = 1.75, onFrame } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.92
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = envTex
  scene.environmentIntensity = 0.5 // softer studio reflections = matte, less chrome

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

  const state = { x: 0, y: 0, z: 0, fly: 0, size: 0.6, maxW: 0.84, rx: 0, ry: 0, rz: 0, explode: 0, hideStrap: 0, ring: 0, particles: 0, tiltX: 0, tiltY: 0, opacity: 1 }

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

  function applyPose() {
    const s = Math.min(state.size * halfH, state.maxW * halfW)
    pivot.scale.setScalar(s)
    pivot.position.set(state.x * halfW, state.y * halfH, state.z)
    pivot.rotation.set(state.rx + state.tiltX, state.ry + state.tiltY, state.rz)
    points.position.copy(pivot.position)
    points.scale.setScalar(s * 0.9)
  }

  function frame() {
    const t = clock.getElapsedTime()
    applyPose()
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
    renderer.render(scene, camera)
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
    stop()
    watch.dispose()
    pGeo.dispose()
    pMat.dispose()
    ringGeo.dispose()
    ringMat.dispose()
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

  return { state, start, stop, resize, frame, setPointer, project, projectCenter, setLook: watch.setLook, handTime: watch.handTime, dispose }
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}
