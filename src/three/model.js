import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

/*
  buildWatch(look)
  ----------------
  A KAIROS watch modelled entirely in code (no downloaded 3D files).
  Units: the case is 2 units wide. The dial faces +Z.

  Every part lives in its own group so it can be "exploded" along Z:
    crystal, bezel, hands, dial, case (with lugs + crown), movement, caseback, strap
  look = { caseFinish, dial, strap, model }  (same names as the SVG version)
*/

// ---------- materials ----------
// Matte, brushed finishes: darker base colours and higher roughness read as
// real metal instead of the bright plastic look of a pure white chrome.
const METAL = {
  steel: { color: '#a9aaa7', polish: '#c2c3c0' },
  black: { color: '#2b2c31', polish: '#3a3c42' },
  champagne: { color: '#b49a6c', polish: '#c9ad7c' },
}
const DIALS = {
  ivory: { a: '#f8f4ec', b: '#d8cfbd', ink: '#1d1c1a', sub: '#6d675d', ray: 'rgba(255,255,255,0.06)' },
  obsidian: { a: '#2d2d31', b: '#060607', ink: '#ece7dd', sub: '#8f8a82', ray: 'rgba(255,255,255,0.05)' },
  midnight: { a: '#2c4170', b: '#08101e', ink: '#ece7dd', sub: '#9aa6bd', ray: 'rgba(190,210,255,0.06)' },
}
const LEATHER = { blackLeather: '#151413', brownLeather: '#6a3f26' }

function metalMat(hex, rough, roughnessMap = null) {
  return new THREE.MeshStandardMaterial({ color: hex, metalness: 1, roughness: rough, roughnessMap, envMapIntensity: 0.75 })
}

// Brushed-steel grain: fine streaks of varying roughness. Used as a roughness
// map so the cursor light breaks into soft lines instead of a flat white blob.
function brushedTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 64
  const g = c.getContext('2d')
  g.fillStyle = 'rgb(200,200,200)'
  g.fillRect(0, 0, 512, 64)
  for (let i = 0; i < 1400; i++) {
    const v = 150 + Math.random() * 105
    g.fillStyle = `rgba(${v},${v},${v},0.55)`
    g.fillRect(Math.random() * 512, Math.random() * 64, 30 + Math.random() * 140, 0.6 + Math.random() * 0.8)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(3, 1)
  return t
}

// ---------- canvas textures ----------
function dialTexture(dialKey, model) {
  const d = DIALS[dialKey] || DIALS.ivory
  const S = 1024
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')
  const R = S / 2
  const grd = g.createRadialGradient(R * 0.85, R * 0.75, 10, R, R, R)
  grd.addColorStop(0, d.a)
  grd.addColorStop(1, d.b)
  g.fillStyle = grd
  g.fillRect(0, 0, S, S)
  // sunray brushing
  g.strokeStyle = d.ray
  g.lineWidth = 1.2
  for (let i = 0; i < 360; i++) {
    const a = (i / 360) * Math.PI * 2
    g.beginPath()
    g.moveTo(R + Math.cos(a) * 30, R + Math.sin(a) * 30)
    g.lineTo(R + Math.cos(a) * R, R + Math.sin(a) * R)
    g.stroke()
  }
  // minute track
  g.strokeStyle = d.ink
  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) continue
    const a = (i / 60) * Math.PI * 2
    g.globalAlpha = 0.65
    g.lineWidth = 3
    g.beginPath()
    g.moveTo(R + Math.sin(a) * (R - 14), R - Math.cos(a) * (R - 14))
    g.lineTo(R + Math.sin(a) * (R - 40), R - Math.cos(a) * (R - 40))
    g.stroke()
  }
  g.globalAlpha = 1
  g.textAlign = 'center'
  g.fillStyle = d.ink
  g.font = '600 50px "Manrope Variable", Arial, sans-serif'
  g.letterSpacing = '18px'
  g.fillText('KAIROS', R + 9, R - 200)
  g.font = '600 24px "Manrope Variable", Arial, sans-serif'
  g.letterSpacing = '9px'
  g.fillStyle = d.sub
  g.fillText(model === 'atlas' ? 'AUTOMATIC · 200M' : 'AUTOMATIC', R + 4, R + 230)
  g.font = '500 19px "Manrope Variable", Arial, sans-serif'
  g.letterSpacing = '6px'
  g.fillText(model === 'atlas' ? 'CALIBRE K-02' : 'CALIBRE K-01', R + 3, R + 268)
  // small K mark: the logo's stem plus the two hands
  g.strokeStyle = d.ink
  g.lineWidth = 5
  g.lineCap = 'round'
  g.beginPath()
  g.moveTo(R - 10, R - 312)
  g.lineTo(R - 10, R - 262)
  g.moveTo(R - 10, R - 287)
  g.lineTo(R + 12, R - 312)
  g.moveTo(R - 10, R - 287)
  g.lineTo(R + 15, R - 260)
  g.stroke()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

function bezelTexture() {
  const S = 1024
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')
  const R = S / 2
  g.fillStyle = '#101216'
  g.fillRect(0, 0, S, S)
  g.strokeStyle = '#e8e5dd'
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2
    const big = i % 5 === 0
    if (i === 0) continue
    g.lineWidth = big ? 10 : 4
    g.beginPath()
    g.moveTo(R + Math.sin(a) * (R - 8), R - Math.cos(a) * (R - 8))
    g.lineTo(R + Math.sin(a) * (R - (big ? 70 : 40)), R - Math.cos(a) * (R - (big ? 70 : 40)))
    g.stroke()
  }
  g.fillStyle = '#c9ad7c'
  g.beginPath()
  g.moveTo(R - 26, 10)
  g.lineTo(R + 26, 10)
  g.lineTo(R, 70)
  g.fill()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// Côtes de Genève: fine, low-contrast wave stripes for plates and bridges.
// Used both as colour and as roughness, so the stripes catch light like the real finish.
function cotesTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')
  g.fillStyle = '#a3a4a0'
  g.fillRect(0, 0, 512, 512)
  g.save()
  g.translate(256, 256)
  g.rotate(-0.6)
  for (let x = -760; x < 760; x += 64) {
    const grd = g.createLinearGradient(x, 0, x + 64, 0)
    grd.addColorStop(0, '#999a96')
    grd.addColorStop(0.5, '#b2b3af')
    grd.addColorStop(1, '#999a96')
    g.fillStyle = grd
    g.fillRect(x, -760, 64, 1520)
  }
  g.restore()
  // fine grain noise
  const img = g.getImageData(0, 0, 512, 512)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 10
    img.data[i] += n
    img.data[i + 1] += n
    img.data[i + 2] += n
  }
  g.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping // bridges use local x/y as UVs
  return tex
}

// Sunray brushing for the dial roughness: thin radial streaks from the centre,
// so a moving light draws a bright "ray" across the dial like a real sunburst.
function sunrayTexture() {
  const S = 1024
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')
  g.fillStyle = 'rgb(120,120,120)'
  g.fillRect(0, 0, S, S)
  g.translate(S / 2, S / 2)
  for (let i = 0; i < 2600; i++) {
    const a = Math.random() * Math.PI * 2
    const v = 60 + Math.random() * 150
    g.strokeStyle = `rgba(${v},${v},${v},0.5)`
    g.lineWidth = 0.6 + Math.random() * 1.4
    g.beginPath()
    g.moveTo(Math.cos(a) * 8, Math.sin(a) * 8)
    g.lineTo(Math.cos(a) * S * 0.72, Math.sin(a) * S * 0.72)
    g.stroke()
  }
  return new THREE.CanvasTexture(c)
}

// Circular graining (snailing) for gears, barrel and rotor: fine concentric rings.
// Geometry UVs on extruded parts are local x/y, so we offset the texture by 0.5
// to put the rings' centre on each part's axle.
function snailTexture() {
  const S = 512
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')
  g.fillStyle = 'rgb(130,130,130)'
  g.fillRect(0, 0, S, S)
  for (let r = 2; r < S * 0.72; r += 1.6) {
    const v = 70 + Math.random() * 140
    g.strokeStyle = `rgba(${v},${v},${v},0.55)`
    g.lineWidth = 0.9
    g.beginPath()
    g.arc(S / 2, S / 2, r, 0, Math.PI * 2)
    g.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.offset.set(0.5, 0.5)
  return t
}

// Engraving on the barrel bridge
function engravingTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = 'rgba(0,0,0,0)'
  g.fillRect(0, 0, 512, 128)
  g.fillStyle = '#d9bf86'
  g.textAlign = 'center'
  g.font = '600 46px "Manrope Variable", Arial, sans-serif'
  g.letterSpacing = '10px'
  g.fillText('KAIROS  K-01', 256, 58)
  g.font = '500 26px "Manrope Variable", Arial, sans-serif'
  g.letterSpacing = '7px'
  g.fillText('25 JEWELS · UNADJUSTED', 256, 102)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// ---------- geometry helpers ----------
function lathe(points, segments = 128) {
  const geo = new THREE.LatheGeometry(points.map(([r, z]) => new THREE.Vector2(r, z)), segments)
  geo.rotateX(Math.PI / 2) // lathe axis Y -> Z
  return geo
}

function gearShape(r, teeth, depth, hole = 0.25, spokes = 4) {
  const s = new THREE.Shape()
  const steps = teeth * 4
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const phase = i % 4
    const rr = phase === 1 || phase === 2 ? r : r - depth
    const x = Math.cos(a) * rr
    const y = Math.sin(a) * rr
    i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)
  }
  // windows between spokes
  if (spokes) {
    const inner = r * 0.78
    const hub = r * hole
    for (let k = 0; k < spokes; k++) {
      const a0 = (k / spokes) * Math.PI * 2 + 0.22
      const a1 = ((k + 1) / spokes) * Math.PI * 2 - 0.22
      const h = new THREE.Path()
      h.absarc(0, 0, inner, a0, a1, false)
      h.absarc(0, 0, hub + r * 0.12, a1, a0, true)
      s.holes.push(h)
    }
  }
  return s
}

function handShape(len, w, tail) {
  const s = new THREE.Shape()
  s.moveTo(-w * 0.8, -tail)
  s.lineTo(-w, len * 0.82)
  s.lineTo(0, len)
  s.lineTo(w, len * 0.82)
  s.lineTo(w * 0.8, -tail)
  s.closePath()
  return s
}

// strap path: leaves the lug and curves back, like a watch lying on a wrist
function strapPose(i, sign, R, start) {
  const a = (i * 0.215) / R
  const y = sign * (start + R * Math.sin(a))
  const z = -R + R * Math.cos(a) - 0.06
  return { y, z, rx: -sign * a }
}

export function buildWatch(initialLook) {
  const root = new THREE.Group()
  const parts = {}
  const disposables = []
  const track = (o) => (disposables.push(o), o)

  const mk = (name) => {
    const g = new THREE.Group()
    g.name = name
    root.add(g)
    parts[name] = g
    return g
  }
  const caseG = mk('case')
  const strapG = mk('strap')
  const movementG = mk('movement')
  const casebackG = mk('caseback')
  const dialG = mk('dial')
  const handsG = mk('hands')
  const bezelG = mk('bezel')
  const crystalG = mk('crystal')

  // base Z of each layer (explode adds offsets)
  const BASE = { crystal: 0.19, bezel: 0, hands: 0.15, dial: 0.115, case: 0, movement: -0.02, caseback: 0, strap: 0 }
  const EXPLODE = { crystal: 1.55, bezel: 1.1, hands: 0.75, dial: 0.38, case: 0, movement: -0.55, caseback: -1.05, strap: 0 }

  // shared materials (colors change with the look)
  const M = {
    case: track(metalMat('#a9aaa7', 0.52, track(brushedTexture()))),
    polish: track(metalMat('#c2c3c0', 0.3)),
    hand: track(metalMat('#d4d4d0', 0.22)),
    gold: track(metalMat('#c4a466', 0.3)),
    // movement finishes
    brass: track(new THREE.MeshStandardMaterial({ color: '#a68a55', metalness: 1, roughness: 0.46, roughnessMap: track(snailTexture()), envMapIntensity: 0.8 })),
    plate: track(new THREE.MeshStandardMaterial({ color: '#a7a8a4', metalness: 1, roughness: 0.62, map: null, roughnessMap: null, envMapIntensity: 0.75 })),
    anglage: track(metalMat('#c9cac6', 0.16)), // polished bevelled edges of bridges
    blued: track(metalMat('#1d3260', 0.3)),
    ruby: track(new THREE.MeshPhysicalMaterial({ color: '#6e0b1e', roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.3, sheen: 0 })),
    chaton: track(metalMat('#b89a5f', 0.28)),
    engrave: track(new THREE.MeshStandardMaterial({ map: track(engravingTexture()), transparent: true, metalness: 0.8, roughness: 0.4, depthWrite: false })),
    slot: track(new THREE.MeshStandardMaterial({ color: '#0b1226', roughness: 0.6 })),
    lume: track(new THREE.MeshStandardMaterial({ color: '#f2efe6', roughness: 0.5 })),
    dial: track(new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.55, roughnessMap: track(sunrayTexture()), envMapIntensity: 0.9 })),
    bezelInsert: track(new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.2, map: track(bezelTexture()) })),
    crystal: track(new THREE.MeshPhysicalMaterial({ color: '#dfe6f2', metalness: 0, roughness: 0.03, transparent: true, opacity: 0.14, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.1, depthWrite: false })),
    leather: track(new THREE.MeshStandardMaterial({ color: '#6a3f26', roughness: 0.75, metalness: 0 })),
    stitch: track(new THREE.MeshStandardMaterial({ color: '#d8b48b', roughness: 0.8 })),
  }
  // the bracelet gets its own copies so it can fade out without fading the case
  M.sCase = track(M.case.clone())
  M.sPolish = track(M.polish.clone())
  {
    const cotes = track(cotesTexture())
    M.plate.map = cotes
    M.plate.roughnessMap = cotes
  }

  // ---------- CASE ----------
  const caseGeo = track(lathe([[0.84, -0.17], [0.95, -0.17], [1.0, -0.12], [1.025, -0.03], [1.0, 0.07], [0.95, 0.105], [0.84, 0.105], [0.84, -0.17]]))
  caseG.add(new THREE.Mesh(caseGeo, M.case))
  const lugGeo = track(new RoundedBoxGeometry(0.2, 0.46, 0.2, 3, 0.07))
  for (const sx of [-1, 1])
    for (const sy of [-1, 1]) {
      const lug = new THREE.Mesh(lugGeo, M.case)
      lug.position.set(sx * 0.6, sy * 0.95, -0.07)
      lug.rotation.x = sy * 0.38
      caseG.add(lug)
    }
  const crownGeo = track(new THREE.CylinderGeometry(0.105, 0.105, 0.14, 40))
  crownGeo.rotateZ(Math.PI / 2)
  const crown = new THREE.Mesh(crownGeo, M.polish)
  crown.position.set(1.1, 0, -0.03)
  caseG.add(crown)
  const stemGeo = track(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 24))
  stemGeo.rotateZ(Math.PI / 2)
  const stem = new THREE.Mesh(stemGeo, M.case)
  stem.position.set(1.02, 0, -0.03)
  caseG.add(stem)
  // crown grip ridges
  const ridgeGeo = track(new THREE.TorusGeometry(0.105, 0.008, 6, 40))
  ridgeGeo.rotateY(Math.PI / 2)
  for (let i = -2; i <= 2; i++) {
    const r = new THREE.Mesh(ridgeGeo, M.case)
    r.position.set(1.1 + i * 0.025, 0, -0.03)
    caseG.add(r)
  }

  // ---------- BEZEL ----------
  const bezelGeo = track(lathe([[0.83, 0.1], [0.97, 0.1], [0.99, 0.13], [0.95, 0.17], [0.86, 0.175], [0.83, 0.16], [0.83, 0.1]]))
  const bezelMesh = new THREE.Mesh(bezelGeo, M.polish)
  bezelG.add(bezelMesh)
  const insertGeo = track(new THREE.RingGeometry(0.8, 0.955, 120, 1))
  // ring UVs: map planar so the canvas texture lines up
  {
    const pos = insertGeo.attributes.position
    const uv = insertGeo.attributes.uv
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / 1.91 + 0.5, pos.getY(i) / 1.91 + 0.5)
  }
  const insert = new THREE.Mesh(insertGeo, M.bezelInsert)
  insert.position.z = 0.176
  bezelG.add(insert)

  // ---------- DIAL ----------
  const dialMesh = new THREE.Mesh(track(new THREE.CircleGeometry(0.84, 128)), M.dial)
  dialG.add(dialMesh)
  const indexGroup = new THREE.Group()
  dialG.add(indexGroup)
  const dateGroup = new THREE.Group()
  dialG.add(dateGroup)

  // ---------- HANDS ----------
  const ex = (shape, depth = 0.01) => track(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 }))
  const hourHand = new THREE.Group()
  hourHand.add(new THREE.Mesh(ex(handShape(0.46, 0.042, 0.1)), M.hand))
  const hl = new THREE.Mesh(track(new RoundedBoxGeometry(0.026, 0.24, 0.012, 2, 0.006)), M.lume)
  hl.position.set(0, 0.28, 0.012)
  hourHand.add(hl)
  hourHand.position.z = 0.0
  const minuteHand = new THREE.Group()
  minuteHand.add(new THREE.Mesh(ex(handShape(0.72, 0.032, 0.12)), M.hand))
  const ml = new THREE.Mesh(track(new RoundedBoxGeometry(0.02, 0.44, 0.012, 2, 0.005)), M.lume)
  ml.position.set(0, 0.42, 0.012)
  minuteHand.add(ml)
  minuteHand.position.z = 0.016
  const secondHand = new THREE.Group()
  const sh = new THREE.Mesh(track(new THREE.BoxGeometry(0.012, 0.98, 0.006)), M.gold)
  sh.position.y = 0.3
  secondHand.add(sh)
  const cw = new THREE.Mesh(track(new THREE.CylinderGeometry(0.035, 0.035, 0.008, 24).rotateX(Math.PI / 2)), M.gold)
  cw.position.y = -0.14
  secondHand.add(cw)
  secondHand.position.z = 0.032
  const cap = new THREE.Mesh(track(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 32).rotateX(Math.PI / 2)), M.gold)
  cap.position.z = 0.03
  handsG.add(hourHand, minuteHand, secondHand, cap)

  // ---------- CRYSTAL ----------
  const crystal = new THREE.Mesh(track(lathe([[0, 0.0], [0.86, 0.0], [0.86, 0.02], [0.6, 0.035], [0, 0.04]], 96)), M.crystal)
  crystal.renderOrder = 10
  crystalG.add(crystal)
  const rim = new THREE.Mesh(track(new THREE.TorusGeometry(0.86, 0.012, 8, 96)), M.polish)
  rim.position.z = 0.012
  crystalG.add(rim)

  // ---------- MOVEMENT ----------
  // Calibre K-01, dial side up: main plate with Côtes de Genève, brass wheels with
  // circular graining, bevelled bridges, a mainspring barrel, escape wheel and
  // pallet fork that tick with the balance, jewels in gold settings, blued screws.
  const exM = (shape, depth, bevel = 0.006) =>
    track(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 24 }))
  const plate = new THREE.Mesh(track(new THREE.CylinderGeometry(0.8, 0.8, 0.05, 128).rotateX(Math.PI / 2)), M.plate)
  plate.position.z = -0.03
  movementG.add(plate)
  // sunk recesses in the plate (darker rings)
  for (const [x, y, r] of [[-0.3, 0.2, 0.33], [0.3, -0.36, 0.25]]) {
    const ring = new THREE.Mesh(track(new THREE.RingGeometry(r - 0.012, r, 64)), M.anglage)
    ring.position.set(x, y, -0.004)
    movementG.add(ring)
  }

  const jewel = (x, y, z, r = 0.022) => {
    const set = new THREE.Mesh(track(new THREE.TorusGeometry(r * 1.25, r * 0.38, 10, 32)), M.chaton)
    set.position.set(x, y, z)
    const j = new THREE.Mesh(track(new THREE.SphereGeometry(r, 20, 14)), M.ruby)
    j.scale.z = 0.55
    j.position.set(x, y, z + 0.004)
    movementG.add(set, j)
  }
  const screw = (x, y, z, r = 0.034) => {
    const head = new THREE.Mesh(track(new THREE.CylinderGeometry(r, r * 1.05, 0.024, 24).rotateX(Math.PI / 2)), M.blued)
    head.position.set(x, y, z)
    const sl = new THREE.Mesh(track(new THREE.BoxGeometry(r * 1.7, r * 0.28, 0.012)), M.slot)
    sl.position.set(x, y, z + 0.012)
    sl.rotation.z = Math.random() * Math.PI
    movementG.add(head, sl)
  }

  const gears = []
  const addGear = (x, y, r, teeth, speed, z = 0, spokes = 5) => {
    const geo = exM(gearShape(r, teeth, r * 0.07, 0.25, spokes), 0.016, 0.003)
    const m = new THREE.Mesh(geo, M.brass)
    const g = new THREE.Group()
    g.position.set(x, y, z)
    g.add(m)
    // pinion + arbor
    const pin = new THREE.Mesh(track(new THREE.CylinderGeometry(r * 0.16, r * 0.16, 0.05, 16).rotateX(Math.PI / 2)), M.anglage)
    pin.position.z = 0.01
    g.add(pin)
    movementG.add(g)
    gears.push({ g, speed })
    return g
  }
  // mainspring barrel: big toothed drum with a snailed cover and ratchet wheel
  const barrel = addGear(-0.3, 0.2, 0.31, 70, 0.04, 0, 0)
  // the cover is a cylinder (UVs 0..1), so it needs its own texture without the offset
  const coverMat = track(M.brass.clone())
  coverMat.roughnessMap = track(M.brass.roughnessMap.clone())
  coverMat.roughnessMap.offset.set(0, 0)
  coverMat.roughnessMap.needsUpdate = true
  const cover = new THREE.Mesh(track(new THREE.CylinderGeometry(0.27, 0.27, 0.02, 96).rotateX(Math.PI / 2)), coverMat)
  cover.position.z = 0.022
  barrel.add(cover)
  const ratchet = new THREE.Mesh(exM(gearShape(0.14, 36, 0.012, 0.2, 0), 0.014, 0.002), M.plate)
  ratchet.position.z = 0.032
  barrel.add(ratchet)
  addGear(0.2, 0.38, 0.16, 40, -0.35, 0.002)
  addGear(0.4, 0.1, 0.11, 30, 0.8, 0.004)
  addGear(-0.05, -0.2, 0.13, 34, -0.55, 0.004)
  // escape wheel: pointed "club" teeth, moves in little steps
  const escShape = new THREE.Shape()
  for (let i = 0; i <= 30; i++) {
    const a = (i / 30) * Math.PI * 2
    const rr = i % 2 === 0 ? 0.105 : 0.075
    const aa = a + (i % 2 === 0 ? 0.08 : 0)
    i === 0 ? escShape.moveTo(Math.cos(aa) * rr, Math.sin(aa) * rr) : escShape.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr)
  }
  const escHole = new THREE.Path()
  escHole.absarc(0, 0, 0.05, 0, Math.PI * 2, true)
  escShape.holes.push(escHole)
  const escape = new THREE.Group()
  escape.position.set(0.1, -0.5, 0.004)
  escape.add(new THREE.Mesh(exM(escShape, 0.012, 0.002), M.brass))
  movementG.add(escape)
  // pallet fork
  const forkShape = new THREE.Shape()
  forkShape.moveTo(-0.11, -0.012)
  forkShape.lineTo(0.12, -0.008)
  forkShape.lineTo(0.12, 0.008)
  forkShape.lineTo(-0.11, 0.012)
  forkShape.closePath()
  const fork = new THREE.Group()
  fork.position.set(0.2, -0.44, 0.02)
  const forkMesh = new THREE.Mesh(exM(forkShape, 0.01, 0.002), M.anglage)
  forkMesh.position.x = 0.05
  fork.add(forkMesh)
  for (const px of [-0.04, 0.02]) {
    const stone = new THREE.Mesh(track(new THREE.BoxGeometry(0.012, 0.03, 0.012)), M.ruby)
    stone.position.set(px, -0.02, 0.006)
    fork.add(stone)
  }
  movementG.add(fork)

  // bridges: matte, with polished bevelled edges (caps = matte, sides = polished)
  const bridgeShape = new THREE.Shape()
  bridgeShape.moveTo(-0.72, -0.12)
  bridgeShape.bezierCurveTo(-0.45, -0.32, 0.05, -0.02, 0.62, -0.18)
  bridgeShape.lineTo(0.66, -0.03)
  bridgeShape.bezierCurveTo(0.08, 0.12, -0.42, -0.1, -0.68, 0.02)
  bridgeShape.closePath()
  const bridge = new THREE.Mesh(exM(bridgeShape, 0.026, 0.008), [M.plate, M.anglage])
  bridge.position.z = 0.03
  movementG.add(bridge)
  const bBridgeShape = new THREE.Shape()
  bBridgeShape.moveTo(-0.62, 0.36)
  bBridgeShape.quadraticCurveTo(-0.32, 0.62, 0.02, 0.5)
  bBridgeShape.lineTo(0.04, 0.4)
  bBridgeShape.quadraticCurveTo(-0.3, 0.48, -0.56, 0.28)
  bBridgeShape.closePath()
  const barrelBridge = new THREE.Mesh(exM(bBridgeShape, 0.024, 0.007), [M.plate, M.anglage])
  barrelBridge.position.z = 0.042
  movementG.add(barrelBridge)
  const engr = new THREE.Mesh(track(new THREE.PlaneGeometry(0.36, 0.09)), M.engrave)
  engr.position.set(0.12, 0.02, 0.071)
  engr.rotation.z = 0.08
  movementG.add(engr)

  // balance wheel (beats 6 times a second) under its cock
  const balance = new THREE.Group()
  balance.position.set(0.3, -0.36, 0.045)
  balance.add(new THREE.Mesh(track(new THREE.TorusGeometry(0.19, 0.016, 14, 96)), M.brass))
  for (let k = 0; k < 2; k++) {
    const sp = new THREE.Mesh(track(new THREE.BoxGeometry(0.38, 0.018, 0.01)), M.brass)
    sp.rotation.z = (k * Math.PI) / 2
    balance.add(sp)
  }
  // timing screws around the rim
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2
    const ts = new THREE.Mesh(track(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 10)), M.chaton)
    ts.position.set(Math.cos(a) * 0.205, Math.sin(a) * 0.205, 0)
    ts.rotation.z = a + Math.PI / 2
    balance.add(ts)
  }
  // hairspring: a real spiral
  {
    const pts = []
    for (let i = 0; i <= 260; i++) {
      const a = i * 0.12
      const r = 0.03 + i * 0.00033
      pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0.012))
    }
    const hs = new THREE.Mesh(track(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.0028, 5, false)), M.blued)
    balance.add(hs)
  }
  movementG.add(balance)
  const cockShape = new THREE.Shape()
  cockShape.moveTo(0.02, -0.05)
  cockShape.lineTo(0.42, -0.07)
  cockShape.quadraticCurveTo(0.5, 0, 0.42, 0.07)
  cockShape.lineTo(0.02, 0.05)
  cockShape.absarc(0, 0, 0.06, Math.PI / 2, -Math.PI / 2, false)
  const cock = new THREE.Mesh(exM(cockShape, 0.02, 0.006), [M.plate, M.anglage])
  cock.position.set(0.3, -0.36, 0.07)
  cock.rotation.z = 0.55
  movementG.add(cock)
  jewel(0.3, -0.36, 0.1, 0.026)

  // jewels on the wheel arbors and blued screws on the bridges
  for (const [x, y] of [[0.2, 0.38], [0.4, 0.1], [-0.05, -0.2], [0.1, -0.5]]) jewel(x, y, 0.036, 0.018)
  for (const [x, y] of [[-0.62, -0.06], [0.6, -0.12], [-0.5, 0.3], [-0.06, 0.46], [0.66, -0.4]]) screw(x, y, 0.07)

  // rotor on the back of the movement, with a snailed finish
  const rotorShape = new THREE.Shape()
  rotorShape.absarc(0, 0, 0.76, 0.15, Math.PI - 0.15, false)
  rotorShape.absarc(0, 0, 0.12, Math.PI - 0.15, 0.15, true)
  const rotor = new THREE.Mesh(exM(rotorShape, 0.025, 0.006), M.brass)
  const rotorG = new THREE.Group()
  rotorG.position.z = -0.1
  rotorG.add(rotor)
  movementG.add(rotorG)

  // ---------- CASEBACK ----------
  const back = new THREE.Mesh(track(lathe([[0.0, -0.2], [0.9, -0.2], [0.93, -0.17], [0.9, -0.15], [0.62, -0.15], [0.62, -0.18], [0, -0.18]], 96)), M.case)
  casebackG.add(back)
  const window_ = new THREE.Mesh(track(new THREE.CircleGeometry(0.62, 96)), M.crystal)
  window_.position.z = -0.149
  casebackG.add(window_)

  // ---------- STRAP ----------
  let strapMeshes = []
  function buildStrap(kind) {
    strapMeshes.forEach((m) => {
      strapG.remove(m)
      m.geometry.dispose()
    })
    strapMeshes = []
    const R = 1.45
    const N = 15
    const start = 1.2
    const dummy = new THREE.Object3D()
    const instanced = (geo, mat, count, place) => {
      const im = new THREE.InstancedMesh(geo, mat, count)
      let n = 0
      for (let i = 0; i < N; i++)
        for (const sign of [1, -1]) {
          place(dummy, strapPose(i, sign, R, start), sign, i)
          dummy.updateMatrix()
          im.setMatrixAt(n++, dummy.matrix)
        }
      im.instanceMatrix.needsUpdate = true
      strapG.add(im)
      strapMeshes.push(im)
    }
    if (kind === 'steel') {
      instanced(new RoundedBoxGeometry(0.3, 0.2, 0.11, 2, 0.035), M.sPolish, N * 2, (d, p) => {
        d.position.set(0, p.y, p.z)
        d.rotation.set(p.rx, 0, 0)
      })
      for (const sx of [-1, 1])
        instanced(new RoundedBoxGeometry(0.33, 0.205, 0.1, 2, 0.03), M.sCase, N * 2, (d, p) => {
          d.position.set(sx * 0.325, p.y, p.z - 0.005)
          d.rotation.set(p.rx, 0, 0)
        })
    } else {
      M.leather.color.set(LEATHER[kind] || '#6a3f26')
      M.stitch.color.set(kind === 'brownLeather' ? '#d8b48b' : '#4d4943')
      instanced(new RoundedBoxGeometry(0.96, 0.225, 0.075, 2, 0.03), M.leather, N * 2, (d, p) => {
        d.position.set(0, p.y, p.z)
        d.rotation.set(p.rx, 0, 0)
      })
      for (const sx of [-1, 1])
        instanced(new THREE.BoxGeometry(0.012, 0.12, 0.08), M.stitch, N * 2, (d, p) => {
          d.position.set(sx * 0.42, p.y, p.z + 0.002)
          d.rotation.set(p.rx, 0, 0)
        })
    }
    // spring-bar block between the lugs
    for (const sy of [-1, 1]) {
      const end = new THREE.Mesh(new RoundedBoxGeometry(0.98, 0.16, kind === 'steel' ? 0.12 : 0.085, 2, 0.04), kind === 'steel' ? M.sCase : M.leather)
      end.position.set(0, sy * 1.12, -0.05)
      strapG.add(end)
      strapMeshes.push(end)
    }
  }

  // ---------- indices (rebuilt per model) ----------
  function buildIndices(model) {
    indexGroup.children.slice().forEach((c) => {
      indexGroup.remove(c)
      c.geometry?.dispose()
    })
    dateGroup.clear()
    const R = 0.84
    const bar = (len, w, r, mat) => new THREE.Mesh(new RoundedBoxGeometry(w, len, 0.025, 2, Math.min(w, len) * 0.3), mat)
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      if (model === 'atlas' && i === 3) continue
      let m
      if (model === 'noir' && i % 3 !== 0) {
        m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.025, 24).rotateX(Math.PI / 2), M.hand)
        m.position.set(Math.sin(a) * (R - 0.13), Math.cos(a) * (R - 0.13), 0.013)
      } else if (model === 'atlas') {
        m = i % 3 === 0 ? bar(0.16, 0.06, 0, M.lume) : new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.025, 24).rotateX(Math.PI / 2), M.lume)
        m.position.set(Math.sin(a) * (R - 0.15), Math.cos(a) * (R - 0.15), 0.013)
        m.rotation.z = -a
      } else {
        const len = model === 'elan' ? (i % 3 === 0 ? 0.2 : 0.14) : i === 0 ? 0.17 : 0.13
        const w = model === 'elan' ? 0.022 : i === 0 ? 0.075 : 0.038
        m = bar(len, w, 0, M.hand)
        m.position.set(Math.sin(a) * (R - 0.08 - len / 2), Math.cos(a) * (R - 0.08 - len / 2), 0.013)
        m.rotation.z = -a
      }
      indexGroup.add(m)
    }
    if (model === 'atlas') {
      const win = new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.12, 0.02, 2, 0.01), M.lume)
      win.position.set(0.6, 0, 0.01)
      dateGroup.add(win)
    }
    insert.visible = model === 'atlas'
    bezelMesh.scale.setScalar(1)
  }

  // ---------- look ----------
  let currentLook = {}
  function setLook(look) {
    const L = { model: 'arc', caseFinish: 'steel', dial: 'ivory', strap: 'steel', ...look }
    const metal = METAL[L.caseFinish] || METAL.steel
    M.case.color.set(metal.color)
    M.case.roughness = L.caseFinish === 'black' ? 0.6 : 0.52
    M.polish.color.set(metal.polish)
    M.sCase.color.set(metal.color)
    M.sCase.roughness = M.case.roughness
    M.sPolish.color.set(metal.polish)
    const handMetal = L.caseFinish === 'champagne' ? METAL.champagne : METAL.steel
    M.hand.color.set(handMetal.polish)
    M.lume.color.set(L.dial === 'ivory' ? '#1d1c1a' : '#f2efe6')
    M.dial.metalness = L.dial === 'ivory' ? 0.25 : 0.6
    if (L.dial !== currentLook.dial || L.model !== currentLook.model) {
      M.dial.map?.dispose()
      M.dial.map = dialTexture(L.dial, L.model)
      M.dial.needsUpdate = true
    }
    if (L.model !== currentLook.model) buildIndices(L.model)
    if (L.strap !== currentLook.strap) buildStrap(L.strap)
    currentLook = L
  }
  setLook(initialLook)

  // ---------- per-frame ----------
  const handTime = { override: null }
  // fly: pushes the front parts (crystal, bezel, hands, dial) toward and past the camera
  const FLY = { crystal: 11, bezel: 10, hands: 9, dial: 8 }
  function update(t, explode = 0, hideStrap = 0, fly = 0) {
    // hands: live time unless overridden
    const now = handTime.override || new Date()
    const s = now.getSeconds() + now.getMilliseconds() / 1000
    const m = now.getMinutes() + s / 60
    const h = (now.getHours() % 12) + m / 60
    hourHand.rotation.z = -(h / 12) * Math.PI * 2
    minuteHand.rotation.z = -(m / 60) * Math.PI * 2
    secondHand.rotation.z = -(s / 60) * Math.PI * 2
    // movement life
    gears.forEach(({ g, speed }) => (g.rotation.z = t * speed))
    balance.rotation.z = Math.sin(t * Math.PI * 2 * 3) * 1.6
    escape.rotation.z = -Math.floor(t * 6) * ((Math.PI * 2) / 15) * 0.5 // steps forward six times a second
    fork.rotation.z = Math.sign(Math.sin(t * Math.PI * 2 * 3)) * 0.12
    rotorG.rotation.z = Math.sin(t * 0.35) * 1.2
    // explode
    for (const k in parts) parts[k].position.z = BASE[k] + EXPLODE[k] * explode + (FLY[k] || 0) * fly
    // fade strap away during the exploded view
    const sv = 1 - hideStrap
    strapG.visible = sv > 0.02
    for (const mat of [M.leather, M.stitch, M.sCase, M.sPolish]) {
      const tr = sv < 1
      if (mat.transparent !== tr) {
        mat.transparent = tr
        mat.needsUpdate = true // switching transparency needs a shader update
      }
      mat.opacity = sv
    }
  }

  // label anchor points (local space of each part)
  const anchors = {
    crystal: new THREE.Vector3(0, 0.86, 0.02),
    bezel: new THREE.Vector3(0, -0.96, 0.14),
    hands: new THREE.Vector3(0, 0.72, 0.03),
    dial: new THREE.Vector3(0, -0.84, 0),
    case: new THREE.Vector3(0, 1.02, 0),
    movement: new THREE.Vector3(0, -0.8, 0),
    caseback: new THREE.Vector3(0, 0.92, -0.17),
  }

  function dispose() {
    disposables.forEach((d) => d.dispose?.())
    M.dial.map?.dispose()
    strapMeshes.forEach((m) => m.geometry.dispose())
    root.traverse((o) => o.geometry?.dispose?.())
  }

  return { root, parts, setLook, update, anchors, handTime, materials: M, dispose }
}
