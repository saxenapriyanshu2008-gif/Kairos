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
export const METAL = {
  steel: { color: '#a9aaa7', polish: '#c2c3c0' },
  black: { color: '#2b2c31', polish: '#3a3c42' },
  champagne: { color: '#b49a6c', polish: '#c9ad7c' },
  blue: { color: '#2c4170', polish: '#3b5487' },
  gunmetal: { color: '#55565b', polish: '#6a6b70' },
}
const DIALS = {
  ivory: { a: '#f8f4ec', b: '#d8cfbd', ink: '#1d1c1a', sub: '#6d675d', ray: 'rgba(255,255,255,0.06)' },
  obsidian: { a: '#2d2d31', b: '#060607', ink: '#ece7dd', sub: '#8f8a82', ray: 'rgba(255,255,255,0.05)' },
  midnight: { a: '#2c4170', b: '#08101e', ink: '#ece7dd', sub: '#9aa6bd', ray: 'rgba(190,210,255,0.06)' },
  slate: { a: '#4a4f55', b: '#1b1e22', ink: '#ece7dd', sub: '#a3a8ad', ray: 'rgba(255,255,255,0.05)' },
}
// Every strap key = one type + one colour. Metal straps take the case colour.
export const STRAPS = {
  steel: { type: 'bracelet' },
  mesh: { type: 'mesh' },
  blackLeather: { type: 'leather', color: '#151413', stitch: '#4d4943' },
  brownLeather: { type: 'leather', color: '#6a3f26', stitch: '#d8b48b' },
  tanLeather: { type: 'leather', color: '#5c3d22', stitch: '#e2c79c' },
  navyLeather: { type: 'leather', color: '#1d2840', stitch: '#8d98b2' },
  blackRubber: { type: 'rubber', color: '#141414', stitch: '#b8352f' },
  navyRubber: { type: 'rubber', color: '#1f3157', stitch: '#c9ad7c' },
  greyRubber: { type: 'rubber', color: '#55585c', stitch: '#e8e5dd' },
}
const ROSE = '#c99273'

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
  // sub-dials (chronograph at 3, 6, 9; small seconds at 6)
  const sub = (x, y, r, ticks) => {
    const gr = g.createRadialGradient(R + x, R + y, 4, R + x, R + y, r)
    gr.addColorStop(0, 'rgba(0,0,0,0.35)')
    gr.addColorStop(1, 'rgba(0,0,0,0.12)')
    g.fillStyle = gr
    g.beginPath()
    g.arc(R + x, R + y, r, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = d.ink
    g.globalAlpha = 0.85
    g.lineWidth = 2.5
    g.stroke()
    for (let i = 0; i < ticks; i++) {
      const a = (i / ticks) * Math.PI * 2
      const big = i % (ticks / 4) === 0
      g.lineWidth = big ? 4 : 2
      g.beginPath()
      g.moveTo(R + x + Math.sin(a) * (r - 4), R + y - Math.cos(a) * (r - 4))
      g.lineTo(R + x + Math.sin(a) * (r - (big ? 22 : 13)), R + y - Math.cos(a) * (r - (big ? 22 : 13)))
      g.stroke()
    }
    g.globalAlpha = 1
    g.fillStyle = d.ink
  }
  if (model === 'apex') {
    const P = 0.4 * (R / 0.84)
    sub(P, 0, 120, 60)
    sub(0, P, 120, 30)
    sub(-P, 0, 120, 60)
  }
  if (model === 'mono') sub(0, 0.42 * (R / 0.84), 105, 60)
  g.font = '600 50px "Manrope Variable", Arial, sans-serif'
  g.letterSpacing = '18px'
  if (model === 'void') {
    // skeleton: only the outer chapter ring is printed, the centre is open
    g.font = '600 30px "Manrope Variable", Arial, sans-serif'
    g.letterSpacing = '12px'
    g.fillText('KAIROS', R + 6, R - 392)
    g.font = '600 20px "Manrope Variable", Arial, sans-serif'
    g.letterSpacing = '8px'
    g.fillStyle = d.sub
    g.fillText('VOID · SKELETON AUTOMATIC', R + 4, R + 412)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    return tex
  }
  g.fillText('KAIROS', R + 9, model === 'apex' ? R - 250 : R - 200)
  g.font = '600 24px "Manrope Variable", Arial, sans-serif'
  g.letterSpacing = '9px'
  g.fillStyle = d.sub
  const line1 = { atlas: 'AUTOMATIC · 200M', apex: 'CHRONOGRAPH', mono: 'AUTOMATIC' }[model] || 'AUTOMATIC'
  const line2 = { atlas: 'CALIBRE K-02', apex: 'CALIBRE K-03 · TACHY', mono: '' }[model] ?? 'CALIBRE K-01'
  const y1 = model === 'apex' ? R + 150 : model === 'mono' ? R - 150 : R + 230
  g.fillText(line1, R + 4, y1)
  g.font = '500 19px "Manrope Variable", Arial, sans-serif'
  g.letterSpacing = '6px'
  if (line2) g.fillText(line2, R + 3, y1 + 38)
  // small K mark: the logo's stem plus the two hands
  const ky = model === 'apex' ? -50 : 0
  g.strokeStyle = d.ink
  g.lineWidth = 5
  g.lineCap = 'round'
  g.beginPath()
  g.moveTo(R - 10, R - 312 + ky)
  g.lineTo(R - 10, R - 262 + ky)
  g.moveTo(R - 10, R - 287 + ky)
  g.lineTo(R + 12, R - 312 + ky)
  g.moveTo(R - 10, R - 287 + ky)
  g.lineTo(R + 15, R - 260 + ky)
  g.stroke()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

function tachyTexture() {
  const S = 1024
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')
  const R = S / 2
  g.fillStyle = '#16171a'
  g.fillRect(0, 0, S, S)
  g.strokeStyle = '#e8e5dd'
  g.fillStyle = '#e8e5dd'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = '700 30px "Manrope Variable", Arial, sans-serif'
  const marks = [500, 400, 300, 250, 200, 170, 150, 130, 120, 110, 100, 90, 80, 70, 60]
  marks.forEach((v) => {
    const sec = 3600 / v
    const a = (sec / 60) * Math.PI * 2
    g.save()
    g.translate(R + Math.sin(a) * (R - 46), R - Math.cos(a) * (R - 46))
    g.rotate(a)
    g.fillText(String(v), 0, 0)
    g.restore()
  })
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2
    g.lineWidth = 3
    g.beginPath()
    g.moveTo(R + Math.sin(a) * (R - 6), R - Math.cos(a) * (R - 6))
    g.lineTo(R + Math.sin(a) * (R - 16), R - Math.cos(a) * (R - 16))
    g.stroke()
  }
  g.font = '700 22px "Manrope Variable", Arial, sans-serif'
  g.fillStyle = '#c9ad7c'
  g.fillText('TACHYMETRE', R, R + R - 46)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
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

// Smartwatch screen, redrawn once a second with the real time.
function drawFace(g, now, accent) {
  const S = g.canvas.width
  const R = S / 2
  g.clearRect(0, 0, S, S)
  g.fillStyle = '#050506'
  g.fillRect(0, 0, S, S)
  const ring = (r, frac, col, w) => {
    g.strokeStyle = 'rgba(255,255,255,0.08)'
    g.lineWidth = w
    g.beginPath()
    g.arc(R, R, r, 0, Math.PI * 2)
    g.stroke()
    g.strokeStyle = col
    g.lineCap = 'round'
    g.beginPath()
    g.arc(R, R, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac)
    g.stroke()
  }
  const steps = 8412 + Math.floor((now.getHours() * 60 + now.getMinutes()) * 1.3)
  ring(R - 40, Math.min(1, steps / 12000), accent, 22)
  ring(R - 78, 0.62, '#efe9de', 14)
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillStyle = '#efe9de'
  g.font = '300 230px "Manrope Variable", Arial, sans-serif'
  g.fillText(`${hh}:${mm}`, R, R - 10)
  g.font = '600 46px "Manrope Variable", Arial, sans-serif'
  g.fillStyle = accent
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const mons = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  g.fillText(`${days[now.getDay()]} ${String(now.getDate()).padStart(2, '0')} ${mons[now.getMonth()]}`, R, R - 200)
  g.font = '500 40px "Manrope Variable", Arial, sans-serif'
  g.fillStyle = '#a8a39a'
  g.fillText(`♥ ${68 + (now.getSeconds() % 7)}  ·  ${steps.toLocaleString('en-IN')} steps`, R, R + 175)
  g.font = '600 30px "Manrope Variable", Arial, sans-serif'
  g.fillStyle = '#efe9de'
  g.fillText(`:${String(now.getSeconds()).padStart(2, '0')}`, R + 290, R - 10)
  g.font = '700 30px "Manrope Variable", Arial, sans-serif'
  g.fillStyle = accent
  g.fillText('KAIROS PULSE', R, R + 260)
}

// ---------- PULSE screen pages ----------
// Simple line icons drawn on the canvas (original KAIROS set)
const ICONS = {
  run: (g) => { g.beginPath(); g.arc(4, -12, 4, 0, 7); g.moveTo(2, -6); g.lineTo(-2, 4); g.lineTo(-10, 12); g.moveTo(-2, 4); g.lineTo(6, 6); g.lineTo(8, 14); g.moveTo(0, -4); g.lineTo(-8, -2); g.moveTo(0, -4); g.lineTo(8, 0); g.stroke() },
  bike: (g) => { g.beginPath(); g.arc(-9, 6, 7, 0, 7); g.moveTo(16, 6); g.arc(9, 6, 7, 0, 7); g.moveTo(-9, 6); g.lineTo(-2, -6); g.lineTo(9, 6); g.moveTo(-2, -6); g.lineTo(6, -6); g.stroke() },
  swim: (g) => { g.beginPath(); for (const y of [4, 12]) { g.moveTo(-14, y); for (let x = -14; x <= 14; x += 7) g.quadraticCurveTo(x + 3.5, y - 4, x + 7, y) } g.arc(6, -10, 4, 0, 7); g.moveTo(-8, -2); g.lineTo(2, -6); g.stroke() },
  heart: (g) => { g.beginPath(); g.moveTo(0, 12); g.bezierCurveTo(-18, 0, -10, -16, 0, -6); g.bezierCurveTo(10, -16, 18, 0, 0, 12); g.stroke() },
  moon: (g) => { g.beginPath(); g.arc(0, 0, 12, 0.6, 5.7); g.arc(6, -3, 9, 5.2, 1.1, true); g.stroke() },
  wind: (g) => { g.beginPath(); g.moveTo(-14, -4); g.lineTo(6, -4); g.arc(6, -9, 5, 1.57, -1.2, true); g.moveTo(-14, 4); g.lineTo(10, 4); g.arc(10, 9, 5, -1.57, 1.2); g.stroke() },
  music: (g) => { g.beginPath(); g.moveTo(-4, 8); g.lineTo(-4, -12); g.lineTo(10, -15); g.lineTo(10, 5); g.stroke(); g.beginPath(); g.arc(-8, 8, 4, 0, 7); g.arc(6, 5, 4, 0, 7); g.fill() },
  map: (g) => { g.beginPath(); g.moveTo(0, 14); g.bezierCurveTo(-14, -2, -10, -14, 0, -14); g.bezierCurveTo(10, -14, 14, -2, 0, 14); g.moveTo(4, -5); g.arc(0, -5, 4, 0, 7); g.stroke() },
  sun: (g) => { g.beginPath(); g.arc(0, 0, 6, 0, 7); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.moveTo(Math.cos(a) * 10, Math.sin(a) * 10); g.lineTo(Math.cos(a) * 14, Math.sin(a) * 14) } g.stroke() },
  timer: (g) => { g.beginPath(); g.arc(0, 2, 11, 0, 7); g.moveTo(0, 2); g.lineTo(0, -5); g.moveTo(-4, -13); g.lineTo(4, -13); g.stroke() },
  bell: (g) => { g.beginPath(); g.moveTo(-10, 6); g.lineTo(-8, -4); g.bezierCurveTo(-8, -14, 8, -14, 8, -4); g.lineTo(10, 6); g.closePath(); g.moveTo(-3, 10); g.lineTo(3, 10); g.stroke() },
  phone: (g) => { g.beginPath(); g.moveTo(-10, -12); g.lineTo(-4, -12); g.lineTo(-2, -5); g.lineTo(-6, -2); g.quadraticCurveTo(-2, 6, 3, 7); g.lineTo(6, 3); g.lineTo(12, 5); g.lineTo(12, 11); g.quadraticCurveTo(-12, 12, -10, -12); g.stroke() },
  chat: (g) => { g.beginPath(); g.moveTo(-13, -10); g.lineTo(13, -10); g.lineTo(13, 6); g.lineTo(-2, 6); g.lineTo(-9, 13); g.lineTo(-8, 6); g.lineTo(-13, 6); g.closePath(); g.stroke() },
  wallet: (g) => { g.beginPath(); g.rect(-13, -9, 26, 19); g.moveTo(13, -2); g.lineTo(5, -2); g.lineTo(5, 4); g.lineTo(13, 4); g.stroke() },
  gear: (g) => { g.beginPath(); for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI * 2; const r = i % 2 ? 9 : 13; i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(r, 0) } g.moveTo(4, 0); g.arc(0, 0, 4, 0, 7); g.stroke() },
  ski: (g) => { g.beginPath(); g.arc(6, -12, 4, 0, 7); g.moveTo(4, -6); g.lineTo(-2, 2); g.lineTo(6, 8); g.moveTo(-14, 6); g.lineTo(14, 14); g.moveTo(-4, -2); g.lineTo(-10, -6); g.stroke() },
  racket: (g) => { g.beginPath(); g.ellipse(-3, -5, 8, 10, -0.6, 0, 7); g.moveTo(3, 3); g.lineTo(12, 13); g.stroke(); g.beginPath(); g.arc(10, -12, 2.5, 0, 7); g.fill() },
  yoga: (g) => { g.beginPath(); g.arc(0, -12, 4, 0, 7); g.moveTo(0, -7); g.lineTo(0, 5); g.moveTo(-14, -4); g.lineTo(14, -4); g.moveTo(0, 5); g.lineTo(-10, 13); g.moveTo(0, 5); g.lineTo(10, 13); g.stroke() },
}
function icon(g, name, x, y, r, bg, fg = '#0b0b0c', scale = 1) {
  g.save()
  g.translate(x, y)
  g.fillStyle = bg
  g.beginPath()
  g.arc(0, 0, r, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = fg
  g.fillStyle = fg
  g.lineWidth = 2.6
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.scale((r / 26) * scale, (r / 26) * scale)
  ICONS[name]?.(g)
  g.restore()
}

export const SCREENS = ['face', 'apps', 'sports', 'workout', 'health']

function drawScreen(g, now, accent, page = 'face') {
  if (page === 'face') return drawFace(g, now, accent)
  const S = g.canvas.width
  const R = S / 2
  g.clearRect(0, 0, S, S)
  g.fillStyle = '#050506'
  g.fillRect(0, 0, S, S)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const small = (t, y, col = '#a8a39a', size = 34, w = 600) => {
    g.font = `${w} ${size}px "Manrope Variable", Arial, sans-serif`
    g.fillStyle = col
    g.fillText(t, R, y)
  }
  small(`${hh}:${mm}`, 92, '#efe9de', 34, 600)

  if (page === 'apps') {
    // honeycomb app launcher, centre app highlighted
    const apps = [
      ['run', '#c9ad7c'], ['heart', '#e0565b'], ['moon', '#6f7fd8'], ['music', '#e8e5dd'], ['map', '#58b37a'], ['sun', '#f0b450'], ['wind', '#7cc6d9'],
      ['timer', '#efe9de'], ['bell', '#efe9de'], ['phone', '#58b37a'], ['chat', '#6f9be0'], ['wallet', '#c9ad7c'], ['gear', '#8f8a82'], ['bike', '#c9ad7c'],
      ['swim', '#7cc6d9'], ['yoga', '#d08cc1'], ['ski', '#efe9de'], ['racket', '#f0b450'], ['heart', '#e0565b'],
    ]
    const pts = [[0, 0]]
    for (let k = 0; k < 6; k++) pts.push([Math.cos((k / 6) * Math.PI * 2) * 150, Math.sin((k / 6) * Math.PI * 2) * 150])
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2 + Math.PI / 12
      pts.push([Math.cos(a) * 290, Math.sin(a) * 290])
    }
    pts.forEach(([x, y], i) => {
      const d = Math.hypot(x, y)
      const r = i === 0 ? 74 : d < 200 ? 60 : 44
      const fade = d > 260 ? 0.55 : 1
      g.globalAlpha = fade
      icon(g, apps[i % apps.length][0], R + x, R + y + 20, r, apps[i % apps.length][1])
    })
    g.globalAlpha = 1
    small('Workout', S - 110, '#efe9de', 38, 700)
    return
  }

  if (page === 'sports') {
    small('Sports', 150, '#efe9de', 46, 700)
    const rows = [['run', 'Outdoor run', '#c9ad7c'], ['bike', 'Outdoor cycling', '#e8e5dd'], ['swim', 'Pool swim', '#7cc6d9'], ['racket', 'Badminton', '#f0b450'], ['ski', 'Skiing', '#efe9de']]
    rows.forEach(([ic, name, col], i) => {
      const y = 260 + i * 132
      const sel = i === 0
      g.fillStyle = sel ? '#1c1b19' : '#111112'
      g.beginPath()
      g.roundRect(170, y - 54, S - 340, 108, 54)
      g.fill()
      if (sel) {
        g.strokeStyle = '#c9ad7c'
        g.lineWidth = 3
        g.stroke()
      }
      icon(g, ic, 240, y, 40, col)
      g.textAlign = 'left'
      g.font = '600 40px "Manrope Variable", Arial, sans-serif'
      g.fillStyle = '#efe9de'
      g.fillText(name, 300, y + 2)
      g.textAlign = 'center'
    })
    small('100+ modes', S - 90, '#c9ad7c', 32, 700)
    return
  }

  if (page === 'workout') {
    // live outdoor run
    const el = (now.getMinutes() % 30) * 60 + now.getSeconds() + 840
    const t = `${String(Math.floor(el / 3600)).padStart(2, '0')}:${String(Math.floor(el / 60) % 60).padStart(2, '0')}:${String(el % 60).padStart(2, '0')}`
    const hr = 142 + Math.round(Math.sin(now.getSeconds() / 4) * 6)
    // heart-rate zone arc
    const zones = ['#6f9be0', '#58b37a', '#f0b450', '#e8833a', '#e0565b']
    zones.forEach((c, i) => {
      g.strokeStyle = c
      g.globalAlpha = i === 3 ? 1 : 0.35
      g.lineWidth = 26
      g.lineCap = 'butt'
      g.beginPath()
      const a0 = Math.PI * 0.8 + i * (Math.PI * 1.4) / 5 + 0.03
      g.arc(R, R, R - 40, a0, a0 + (Math.PI * 1.4) / 5 - 0.06)
      g.stroke()
    })
    g.globalAlpha = 1
    icon(g, 'run', R, 165, 32, '#c9ad7c')
    small('OUTDOOR RUN', 230, '#a8a39a', 28, 700)
    g.font = '300 150px "Manrope Variable", Arial, sans-serif'
    g.fillStyle = '#efe9de'
    g.fillText(t, R, 360)
    const stat = (label, val, x, y, col = '#efe9de') => {
      g.font = `600 64px "Manrope Variable", Arial, sans-serif`
      g.fillStyle = col
      g.fillText(val, x, y)
      g.font = '600 26px "Manrope Variable", Arial, sans-serif'
      g.fillStyle = '#8f8a82'
      g.fillText(label, x, y + 52)
    }
    stat('KM', ((el / 60) * 0.19).toFixed(2), R - 170, 520)
    stat("PACE /KM", `5'12"`, R + 170, 520)
    stat('BPM · ZONE 4', `${hr}`, R, 680, '#e8833a')
    small('GPS L1 + L5', S - 110, '#58b37a', 26, 700)
    return
  }

  if (page === 'health') {
    small('Health', 150, '#efe9de', 46, 700)
    // heart-rate line chart
    g.strokeStyle = '#e0565b'
    g.lineWidth = 6
    g.lineJoin = 'round'
    g.beginPath()
    for (let i = 0; i <= 40; i++) {
      const x = 200 + i * 15.5
      const y = 330 - (Math.sin(i * 0.5 + now.getSeconds() * 0.1) * 30 + Math.sin(i * 1.7) * 14 + (i > 26 && i < 31 ? 50 : 0))
      i ? g.lineTo(x, y) : g.moveTo(x, y)
    }
    g.stroke()
    g.font = '600 72px "Manrope Variable", Arial, sans-serif'
    g.fillStyle = '#efe9de'
    g.fillText(`${68 + (now.getSeconds() % 6)}`, R - 40, 440)
    g.font = '600 30px "Manrope Variable", Arial, sans-serif'
    g.fillStyle = '#e0565b'
    g.fillText('BPM', R + 70, 448)
    const tiles = [['SpO2', '98%', '#7cc6d9'], ['Sleep', '7h 24m', '#6f7fd8'], ['Stress', '32 · Low', '#58b37a']]
    tiles.forEach(([k, v, c], i) => {
      const x = R + (i - 1) * 205
      g.fillStyle = '#121214'
      g.beginPath()
      g.roundRect(x - 92, 520, 184, 170, 30)
      g.fill()
      g.font = '600 26px "Manrope Variable", Arial, sans-serif'
      g.fillStyle = c
      g.fillText(k, x, 565)
      g.font = '600 40px "Manrope Variable", Arial, sans-serif'
      g.fillStyle = '#efe9de'
      g.fillText(v, x, 630)
    })
    small('VO2 max 46 · Good', S - 140, '#a8a39a', 30, 600)
  }
}

// Fine woven texture for the mesh bracelet
function meshTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = '#8a8a88'
  g.fillRect(0, 0, 128, 128)
  g.strokeStyle = '#d6d6d2'
  g.lineWidth = 2
  for (let i = -128; i < 256; i += 8) {
    g.beginPath()
    g.moveTo(i, 0)
    g.lineTo(i + 128, 128)
    g.stroke()
  }
  g.strokeStyle = '#4a4a48'
  g.lineWidth = 1.4
  for (let i = -128; i < 256; i += 8) {
    g.beginPath()
    g.moveTo(i + 128, 0)
    g.lineTo(i, 128)
    g.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(6, 2)
  return t
}

// Rubber strap: soft horizontal ribs
function rubberTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, 128, 128)
  g.fillStyle = '#c4c4c4'
  for (let y = 0; y < 128; y += 16) g.fillRect(14, y, 100, 6)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
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
    bezelInsert: track(new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.2, map: null })),
    mesh: track(new THREE.MeshStandardMaterial({ color: '#a9aaa7', metalness: 1, roughness: 0.45, map: track(meshTexture()), envMapIntensity: 0.8 })),
    rubber: track(new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.88, metalness: 0, map: track(rubberTexture()) })),
    accent: track(metalMat('#c99273', 0.28)),
    board: track(new THREE.MeshStandardMaterial({ color: '#13261d', roughness: 0.6, metalness: 0.2 })),
    chip: track(new THREE.MeshStandardMaterial({ color: '#111114', roughness: 0.35, metalness: 0.4 })),
    copper: track(metalMat('#b87333', 0.35)),
    crystal: track(new THREE.MeshPhysicalMaterial({ color: '#dfe6f2', metalness: 0, roughness: 0.03, transparent: true, opacity: 0.14, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.1, depthWrite: false })),
    leather: track(new THREE.MeshStandardMaterial({ color: '#6a3f26', roughness: 0.75, metalness: 0 })),
    stitch: track(new THREE.MeshStandardMaterial({ color: '#d8b48b', roughness: 0.8 })),
  }
  // the bracelet gets its own copies so it can fade out without fading the case
  M.sCase = track(M.case.clone())
  M.sPolish = track(M.polish.clone())
  const TEX = { diver: track(bezelTexture()), tachy: track(tachyTexture()) }
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

  // chronograph / smartwatch pushers at 2 and 4 o'clock
  const pushers = new THREE.Group()
  for (const a of [-0.55, 0.55]) {
    const p = new THREE.Mesh(track(new THREE.CylinderGeometry(0.065, 0.065, 0.16, 28).rotateZ(Math.PI / 2)), M.polish)
    p.position.set(Math.cos(a) * 1.07, Math.sin(a) * 1.07, -0.03)
    p.rotation.z = a
    pushers.add(p)
  }
  caseG.add(pushers)

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
  // skeleton: only the outer chapter ring, so the movement shows through
  const dialRing = new THREE.Mesh(track(new THREE.RingGeometry(0.6, 0.84, 128, 1)), M.dial)
  dialG.add(dialRing)
  // smartwatch screen
  const screenCanvas = document.createElement('canvas')
  screenCanvas.width = screenCanvas.height = 1024
  const screenTex = track(new THREE.CanvasTexture(screenCanvas))
  screenTex.colorSpace = THREE.SRGBColorSpace
  const screenMat = track(new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }))
  const screen = new THREE.Mesh(track(new THREE.CircleGeometry(0.84, 128)), screenMat)
  screen.position.z = 0.002
  dialG.add(screen)
  let screenSecond = -1
  let screenPage = 'face'
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
  // small hands for sub-dials (chronograph at 3/6/9, small seconds at 6)
  const subHands = []
  const subHand = (x, y, len) => {
    const g = new THREE.Group()
    g.position.set(x, y, -0.02)
    const m = new THREE.Mesh(track(new THREE.BoxGeometry(0.014, len, 0.006)), M.hand)
    m.position.y = len / 2 - 0.02
    const c = new THREE.Mesh(track(new THREE.CylinderGeometry(0.02, 0.02, 0.012, 16).rotateX(Math.PI / 2)), M.hand)
    g.add(m, c)
    handsG.add(g)
    subHands.push(g)
    return g
  }
  const subA = subHand(0.4, 0, 0.13)
  const subB = subHand(0, -0.4, 0.13)
  const subC = subHand(-0.4, 0, 0.13)
  const subSmall = subHand(0, -0.42, 0.12)

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

  // keep the mechanical calibre in its own group so the smartwatch can swap it
  const mechG = new THREE.Group()
  movementG.children.slice().forEach((c) => mechG.add(c))
  movementG.add(mechG)
  // smartwatch electronics: board, chips, battery, haptic motor
  const elecG = new THREE.Group()
  {
    const board = new THREE.Mesh(track(new THREE.CylinderGeometry(0.78, 0.78, 0.03, 96).rotateX(Math.PI / 2)), M.board)
    board.position.z = -0.02
    elecG.add(board)
    const battery = new THREE.Mesh(track(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 64).rotateX(Math.PI / 2)), M.polish)
    battery.position.set(-0.12, 0.08, 0.03)
    elecG.add(battery)
    for (const [x, y, w, h] of [[0.42, 0.3, 0.22, 0.18], [0.45, -0.18, 0.16, 0.16], [-0.1, -0.52, 0.3, 0.12], [0.2, -0.45, 0.1, 0.1]]) {
      const chip = new THREE.Mesh(track(new RoundedBoxGeometry(w, h, 0.03, 2, 0.008)), M.chip)
      chip.position.set(x, y, 0.015)
      elecG.add(chip)
    }
    const coil = new THREE.Mesh(track(new THREE.TorusGeometry(0.6, 0.02, 8, 96)), M.copper)
    coil.position.z = -0.005
    elecG.add(coil)
  }
  movementG.add(elecG)

  // ---------- CASEBACK ----------
  const back = new THREE.Mesh(track(lathe([[0.0, -0.2], [0.9, -0.2], [0.93, -0.17], [0.9, -0.15], [0.62, -0.15], [0.62, -0.18], [0, -0.18]], 96)), M.case)
  casebackG.add(back)
  const window_ = new THREE.Mesh(track(new THREE.CircleGeometry(0.62, 96)), M.crystal)
  window_.position.z = -0.149
  casebackG.add(window_)

  // ---------- STRAP ----------
  let strapMeshes = []
  function buildStrap(kind) {
    const spec = STRAPS[kind] || STRAPS.blackLeather
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
    if (spec.type === 'bracelet') {
      instanced(new RoundedBoxGeometry(0.3, 0.2, 0.11, 2, 0.035), M.sPolish, N * 2, (d, p) => {
        d.position.set(0, p.y, p.z)
        d.rotation.set(p.rx, 0, 0)
      })
      for (const sx of [-1, 1])
        instanced(new RoundedBoxGeometry(0.33, 0.205, 0.1, 2, 0.03), M.sCase, N * 2, (d, p) => {
          d.position.set(sx * 0.325, p.y, p.z - 0.005)
          d.rotation.set(p.rx, 0, 0)
        })
    } else if (spec.type === 'mesh') {
      instanced(new RoundedBoxGeometry(0.94, 0.26, 0.045, 1, 0.006), M.mesh, N * 2, (d, p) => {
        d.position.set(0, p.y, p.z)
        d.rotation.set(p.rx, 0, 0)
      })
    } else {
      const strapMat = spec.type === 'rubber' ? M.rubber : M.leather
      strapMat.color.set(spec.color)
      M.stitch.color.set(spec.stitch)
      instanced(new RoundedBoxGeometry(0.96, 0.26, spec.type === 'rubber' ? 0.09 : 0.075, 1, 0.008), strapMat, N * 2, (d, p) => {
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
      const endMat = spec.type === 'bracelet' ? M.sCase : spec.type === 'mesh' ? M.mesh : spec.type === 'rubber' ? M.rubber : M.leather
      const end = new THREE.Mesh(new RoundedBoxGeometry(0.98, 0.16, spec.type === 'bracelet' ? 0.12 : 0.085, 2, 0.04), endMat)
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
      if (model === 'pulse') continue
      if (model === 'apex' && (i === 3 || i === 6 || i === 9)) continue
      if (model === 'mono' && i === 6) continue
      let m
      if (model === 'noir' && i % 3 !== 0) {
        m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.025, 24).rotateX(Math.PI / 2), M.hand)
        m.position.set(Math.sin(a) * (R - 0.13), Math.cos(a) * (R - 0.13), 0.013)
      } else if (model === 'apex') {
        m = bar(0.14, 0.05, 0, M.lume)
        m.position.set(Math.sin(a) * (R - 0.14), Math.cos(a) * (R - 0.14), 0.013)
        m.rotation.z = -a
      } else if (model === 'void') {
        m = bar(0.12, 0.03, 0, M.accent)
        m.position.set(Math.sin(a) * (R - 0.12), Math.cos(a) * (R - 0.12), 0.013)
        m.rotation.z = -a
      } else if (model === 'atlas') {
        m = i % 3 === 0 ? bar(0.16, 0.06, 0, M.lume) : new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.025, 24).rotateX(Math.PI / 2), M.lume)
        m.position.set(Math.sin(a) * (R - 0.15), Math.cos(a) * (R - 0.15), 0.013)
        m.rotation.z = -a
      } else {
        const thin = model === 'elan' || model === 'mono'
        const len = thin ? (i % 3 === 0 ? 0.2 : 0.14) : i === 0 ? 0.17 : 0.13
        const w = thin ? 0.022 : i === 0 ? 0.075 : 0.038
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
    insert.visible = model === 'atlas' || model === 'apex'
    M.bezelInsert.map = model === 'apex' ? TEX.tachy : TEX.diver
    M.bezelInsert.needsUpdate = true
    // which dial / hands / movement parts this model shows
    const isPulse = model === 'pulse'
    dialMesh.visible = model !== 'void' && !isPulse
    dialRing.visible = model === 'void'
    screen.visible = isPulse
    for (const h of [hourHand, minuteHand, secondHand, cap]) h.visible = !isPulse
    secondHand.visible = !isPulse && model !== 'mono'
    subA.visible = subB.visible = subC.visible = model === 'apex'
    subSmall.visible = model === 'mono'
    pushers.visible = model === 'apex' || isPulse
    mechG.visible = !isPulse
    elecG.visible = isPulse
    window_.visible = !isPulse
    bezelMesh.scale.setScalar(1)
  }

  // ---------- look ----------
  let currentLook = {}
  function setLook(look) {
    const L = { model: 'arc', caseFinish: 'steel', dial: 'ivory', strap: 'steel', ...look }
    if (!DIALS[L.dial]) L.dial = 'obsidian'
    const metal = METAL[L.caseFinish] || METAL.steel
    M.case.color.set(metal.color)
    M.case.roughness = L.caseFinish === 'black' ? 0.6 : 0.52
    M.polish.color.set(metal.polish)
    M.sCase.color.set(metal.color)
    M.sCase.roughness = M.case.roughness
    M.sPolish.color.set(metal.polish)
    const handMetal = L.caseFinish === 'champagne' ? METAL.champagne : METAL.steel
    // rose-gold hands on VOID and MONO, gold accents on APEX
    M.hand.color.set(L.model === 'void' || L.model === 'mono' ? ROSE : L.model === 'apex' ? '#d9c08a' : handMetal.polish)
    M.mesh.color.set(metal.color)
    M.mesh.roughness = L.caseFinish === 'black' ? 0.55 : 0.42
    M.lume.color.set(L.dial === 'ivory' ? '#1d1c1a' : '#f2efe6')
    M.dial.metalness = L.dial === 'ivory' ? 0.25 : 0.6
    if (L.dial !== currentLook.dial || L.model !== currentLook.model) {
      M.dial.map?.dispose()
      M.dial.map = dialTexture(L.dial, L.model)
      M.dial.needsUpdate = true
    }
    if (L.model !== currentLook.model) buildIndices(L.model)
    if (L.strap !== currentLook.strap) buildStrap(L.strap)
    screenSecond = -1
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
    subSmall.rotation.z = subC.rotation.z = -(Math.floor(s) / 60) * Math.PI * 2
    subA.rotation.z = -(m / 30) * Math.PI * 2
    subB.rotation.z = -(h / 12) * Math.PI * 2
    if (screen.visible && now.getSeconds() !== screenSecond) {
      screenSecond = now.getSeconds()
      drawScreen(screenCanvas.getContext('2d'), now, '#c9ad7c', screenPage)
      screenTex.needsUpdate = true
    }
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
    for (const mat of [M.leather, M.stitch, M.sCase, M.sPolish, M.mesh, M.rubber]) {
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

  // switch the smartwatch screen page (face, apps, sports, workout, health)
  function setScreen(page) {
    screenPage = SCREENS.includes(page) ? page : 'face'
    screenSecond = -1
  }

  return { root, parts, setLook, setScreen, update, anchors, handTime, materials: M, dispose }
}
