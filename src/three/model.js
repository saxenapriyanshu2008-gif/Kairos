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
  blackLeather: { type: 'leather', color: '#151413', stitch: '#b9b4aa' },
  brownLeather: { type: 'leather', color: '#4f2c1a', stitch: '#d8b48b' },
  tanLeather: { type: 'leather', color: '#9a6a3c', stitch: '#f0dfc2' },
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
  // Milanese weave: bright steel wires crossing at an angle, with dark gaps between
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = '#5a5a58'
  g.fillRect(0, 0, 128, 128)
  for (const [dir, col, lw] of [[1, '#f4f4f0', 3.2], [-1, '#c9c9c5', 2.6]]) {
    g.strokeStyle = col
    g.lineWidth = lw
    for (let i = -128; i < 256; i += 8) {
      g.beginPath()
      if (dir > 0) {
        g.moveTo(i, 0)
        g.lineTo(i + 128, 128)
      } else {
        g.moveTo(i + 128, 0)
        g.lineTo(i, 128)
      }
      g.stroke()
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(3, 2)
  return t
}

// Leather grain: soft pebbled bumps, used as bump and roughness map
function leatherGrainTexture() {
  const S = 256
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')
  g.fillStyle = 'rgb(128,128,128)'
  g.fillRect(0, 0, S, S)
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 2600; i++) {
    const x = rnd() * S
    const y = rnd() * S
    const r = 1.2 + rnd() * 3.2
    const v = 90 + rnd() * 120
    const grd = g.createRadialGradient(x, y, 0, x, y, r)
    grd.addColorStop(0, `rgba(${v},${v},${v},0.9)`)
    grd.addColorStop(1, 'rgba(128,128,128,0)')
    g.fillStyle = grd
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(3, 2)
  return t
}

// Rubber strap: deep horizontal grooves (bump map)
function rubberGrooveTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, 128, 128)
  for (let y = 0; y < 128; y += 32) {
    const grd = g.createLinearGradient(0, y, 0, y + 14)
    grd.addColorStop(0, '#ffffff')
    grd.addColorStop(0.5, '#202020')
    grd.addColorStop(1, '#ffffff')
    g.fillStyle = grd
    g.fillRect(22, y, 84, 14)
  }
  const t = new THREE.CanvasTexture(c)
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

// ---------- caseback artwork ----------
// What each model has engraved on its back
const BACK_INFO = {
  arc: { name: 'ARC', cal: 'AUTOMATIC CALIBRE K-01', water: '100 M', size: '39 MM', no: '0427' },
  noir: { name: 'NOIR', cal: 'AUTOMATIC CALIBRE K-01', water: '100 M', size: '41 MM', no: '0118' },
  atlas: { name: 'ATLAS', cal: 'AUTOMATIC CALIBRE K-02', water: '200 M', size: '42 MM', no: '0356' },
  elan: { name: 'ÉLAN', cal: 'AUTOMATIC CALIBRE K-01 SLIM', water: '50 M', size: '38 MM', no: '0072' },
  void: { name: 'VOID', cal: 'SKELETON CALIBRE K-01', water: '50 M', size: '42 MM', no: '0241' },
  apex: { name: 'APEX', cal: 'CHRONOGRAPH CALIBRE K-03', water: '100 M', size: '44 MM', no: '0503' },
  pulse: { name: 'PULSE', cal: 'SNAPDRAGON W5 + BES2700', water: '5 ATM · IP68', size: '47 MM ALUMINIUM', no: '1931' },
  mono: { name: 'MONO', cal: 'AUTOMATIC CALIBRE K-01', water: '50 M', size: '40 MM', no: '0614' },
}
export const FOUNDER = 'Priyanshu Saxena'

// text written around a circle (clockwise, centred on angle a0)
function arcText(g, text, r, a0, size, spacing, inward = false) {
  g.save()
  g.font = `700 ${size}px "Manrope Variable", Arial, sans-serif`
  const chars = [...text]
  const widths = chars.map((c) => g.measureText(c).width + spacing)
  const total = widths.reduce((a, b) => a + b, 0)
  let a = a0 - (inward ? -1 : 1) * (total / r) / 2
  chars.forEach((c, i) => {
    const w = widths[i]
    const mid = a + ((inward ? -1 : 1) * (w / 2)) / r
    g.save()
    g.rotate(mid)
    g.translate(0, inward ? r : -r)
    if (inward) g.rotate(Math.PI)
    g.fillText(c, -(w - spacing) / 2, size * 0.35)
    g.restore()
    a += ((inward ? -1 : 1) * w) / r
  })
  g.restore()
}

// text along the bottom of a circle, upright and reading left to right
function arcTextBottom(g, text, r, size, spacing) {
  g.save()
  g.font = `700 ${size}px "Manrope Variable", Arial, sans-serif`
  const chars = [...text]
  const widths = chars.map((c) => g.measureText(c).width + spacing)
  const total = widths.reduce((a, b) => a + b, 0)
  let th = Math.PI + total / r / 2
  chars.forEach((c, i) => {
    const w = widths[i]
    const mid = th - w / 2 / r
    g.save()
    g.translate(Math.sin(mid) * r, -Math.cos(mid) * r)
    g.rotate(mid - Math.PI)
    g.fillText(c, -(w - spacing) / 2, size * 0.35)
    g.restore()
    th -= w / r
  })
  g.restore()
}

// the K-clock mark, drawn small (hour hand 41.25 deg, minute hand 135 deg)
function kMark(g, x, y, r, col, lw) {
  g.save()
  g.translate(x, y)
  g.strokeStyle = col
  g.lineWidth = lw
  g.lineCap = 'round'
  g.beginPath()
  g.arc(0, 0, r, 0, Math.PI * 2)
  g.moveTo(0, -r * 0.8)
  g.lineTo(0, r * 0.8)
  const hand = (deg, len) => {
    const a = (deg * Math.PI) / 180
    g.moveTo(0, 0)
    g.lineTo(Math.sin(a) * len, -Math.cos(a) * len)
  }
  hand(41.25, r * 0.7)
  hand(135, r * 0.85)
  g.stroke()
  g.restore()
}

// Engraved steel ring around the window: model, calibre, materials, serial,
// the K-clock mark and the screw-down notches. Light engraving on dark cases.
function casebackRingTexture(model, light) {
  const S = 1024
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')
  const info = BACK_INFO[model] || BACK_INFO.arc
  const ink = light ? 'rgba(246,244,238,0.98)' : 'rgba(14,14,16,0.95)'
  const hi = light ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.5)' // engraving edge
  g.translate(S / 2, S / 2)
  const R = S / 2 // = 0.9 world units
  const px = (u) => (u / 0.9) * R
  const draw = (fn) => {
    g.save()
    g.translate(1, 1)
    g.fillStyle = hi
    g.strokeStyle = hi
    fn()
    g.restore()
    g.fillStyle = ink
    g.strokeStyle = ink
    fn()
  }
  draw(() => {
    g.lineWidth = 3
    for (const r of [px(0.625), px(0.865)]) {
      g.beginPath()
      g.arc(0, 0, r, 0, Math.PI * 2)
      g.stroke()
    }
    // outer line of text all the way round
    arcText(g, `KAIROS ${info.name}  ·  ${info.cal}  ·  ${model === 'pulse' ? 'TOUGHENED GLASS' : 'SAPPHIRE CRYSTAL'}  ·  ${model === 'pulse' ? '' : '316L STAINLESS STEEL  ·  '}WATER RESISTANT ${info.water}  ·  ${info.size}  ·  `, px(0.79), 0, 29, 3)
    // inner line: serial at the bottom, swiss-style details at the top
    arcTextBottom(g, `N° ${info.no} / 1000`, px(0.705), 36, 7)
    if (model === 'pulse') {
      // PULSE has no window, so the founder's signature is engraved here instead
      g.save()
      g.textAlign = 'center'
      g.font = '62px "Mrs Saint Delafield", "Brush Script MT", cursive'
      g.fillText(FOUNDER, 0, -px(0.652))
      g.restore()
    } else arcText(g, 'SCREW-DOWN CASEBACK', px(0.705), 0, 26, 5)
    // screw-down notches on the rim
    for (let i = 0; i < 6; i++) {
      g.save()
      g.rotate((i / 6) * Math.PI * 2 + Math.PI / 6)
      g.fillRect(-14, -px(0.9), 28, px(0.035))
      g.restore()
    }
  })
  // the K mark at the top, between the two text rows
  kMark(g, px(0.705) * Math.sin(-0.66), -px(0.705) * Math.cos(-0.66), 24, ink, 3.4)
  kMark(g, px(0.705) * Math.sin(0.66), -px(0.705) * Math.cos(0.66), 24, ink, 3.4)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

// Gold printing on the sapphire window: wordmark, K mark and the founder's signature
function sapphirePrintTexture() {
  const S = 1024
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')
  g.translate(S / 2, S / 2)
  const gold = '#f0d49a'
  // smoked tint behind the printing (real backs often have a tinted print zone)
  for (const [y, h] of [[-300, 150], [300, 190]]) {
    const grd = g.createLinearGradient(0, y - h / 2, 0, y + h / 2)
    grd.addColorStop(0, 'rgba(8,8,10,0)')
    grd.addColorStop(0.5, 'rgba(8,8,10,0.62)')
    grd.addColorStop(1, 'rgba(8,8,10,0)')
    g.fillStyle = grd
    g.fillRect(-420, y - h / 2, 840, h)
  }
  g.fillStyle = gold
  g.textAlign = 'center'
  kMark(g, 0, -345, 40, gold, 5)
  g.font = '700 50px "Manrope Variable", Arial, sans-serif'
  g.letterSpacing = '18px'
  g.fillText('KAIROS', 9, -260)
  g.letterSpacing = '0px'
  g.font = '150px "Mrs Saint Delafield", "Brush Script MT", cursive'
  g.lineWidth = 2.2
  g.strokeStyle = gold
  g.fillText(FOUNDER, 0, 292)
  g.strokeText(FOUNDER, 0, 292) // a slightly heavier pen line
  g.strokeStyle = gold
  g.lineWidth = 3
  g.beginPath()
  g.moveTo(-260, 326)
  g.quadraticCurveTo(0, 308, 280, 320)
  g.stroke()
  g.font = '700 28px "Manrope Variable", Arial, sans-serif'
  g.letterSpacing = '10px'
  g.fillText('FOUNDER', 5, 376)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
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
    mesh: track(new THREE.MeshStandardMaterial({ color: '#a9aaa7', metalness: 1, roughness: 0.36, map: track(meshTexture()), bumpMap: null, envMapIntensity: 1.4 })),
    rubber: track(new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.92, metalness: 0, bumpMap: track(rubberGrooveTexture()), bumpScale: 2.2 })),
    accent: track(metalMat('#c99273', 0.28)),
    board: track(new THREE.MeshStandardMaterial({ color: '#13261d', roughness: 0.6, metalness: 0.2 })),
    chip: track(new THREE.MeshStandardMaterial({ color: '#111114', roughness: 0.35, metalness: 0.4 })),
    copper: track(metalMat('#b87333', 0.35)),
    crystal: track(new THREE.MeshPhysicalMaterial({ color: '#dfe6f2', metalness: 0, roughness: 0.03, transparent: true, opacity: 0.14, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.1, depthWrite: false })),
    leather: track(new THREE.MeshPhysicalMaterial({ color: '#6a3f26', roughness: 0.62, metalness: 0, bumpMap: track(leatherGrainTexture()), bumpScale: 1.4, sheen: 0.35, sheenRoughness: 0.6, sheenColor: new THREE.Color('#8a6a52'), clearcoat: 0.15, clearcoatRoughness: 0.6 })),
    stitch: track(new THREE.MeshStandardMaterial({ color: '#d8b48b', roughness: 0.8 })),
    strapHole: track(new THREE.MeshStandardMaterial({ color: '#050505', roughness: 1 })),
  }
  // the bracelet gets its own copies so it can fade out without fading the case
  M.sCase = track(M.case.clone())
  M.sPolish = track(M.polish.clone())
  M.mesh.bumpMap = M.mesh.map // the weave also catches light as relief
  M.mesh.bumpScale = 1.2
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
  // Layout: a classic three-quarter plate calibre. Four bridges cover almost the
  // whole plate (barrel bridge, train bridge, fourth-wheel bridge and the balance
  // cock), with thin gaps between them, so the only open area is the balance and
  // escapement corner. Two big steel wheels with circular graining sit on the
  // barrel bridge, gilt wheels sit on the train side, and blued screws and rubies
  // in gold settings are spread over every bridge.
  const deg = (d) => (d * Math.PI) / 180
  const P = (r, d) => [Math.cos(deg(d)) * r, Math.sin(deg(d)) * r]
  const BAL = P(0.44, 292) // balance centre

  // recess in the plate under the balance
  {
    const ring = new THREE.Mesh(track(new THREE.RingGeometry(0.262, 0.274, 72)), M.anglage)
    ring.position.set(BAL[0], BAL[1], -0.004)
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
  let screwSeed = 0.37
  const screw = (x, y, z, r = 0.03, mat = M.blued) => {
    const head = new THREE.Mesh(track(new THREE.CylinderGeometry(r, r * 1.05, 0.022, 28).rotateX(Math.PI / 2)), mat)
    head.position.set(x, y, z)
    const sl = new THREE.Mesh(track(new THREE.BoxGeometry(r * 1.75, r * 0.26, 0.012)), M.slot)
    sl.position.set(x, y, z + 0.011)
    screwSeed = (screwSeed * 9301 + 0.4927) % 1 // fixed "random" slot angles
    sl.rotation.z = screwSeed * Math.PI
    movementG.add(head, sl)
  }

  const gears = []
  const addGear = (x, y, r, teeth, speed, z = 0, spokes = 5, mat = M.brass) => {
    const geo = exM(gearShape(r, teeth, r * 0.07, 0.25, spokes), 0.016, 0.003)
    const m = new THREE.Mesh(geo, mat)
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

  // a bridge cut from the plate disc: an arc on the rim and a rounded tip near the centre
  const bridgeMesh = (a0, a1, tip, z, r = 0.765, depth = 0.026) => {
    const sh = new THREE.Shape()
    sh.moveTo(tip[0], tip[1])
    const [x0, y0] = P(r, a0)
    sh.lineTo(x0, y0)
    sh.absarc(0, 0, r, deg(a0), deg(a1), false)
    sh.closePath()
    const m = new THREE.Mesh(exM(sh, depth, 0.008), [M.plate, M.anglage])
    m.position.z = z
    movementG.add(m)
    return m
  }

  // wheels that run under the bridges (seen through the gaps)
  addGear(-0.12, -0.08, 0.17, 44, 0.6, -0.002, 5)

  // 1. barrel bridge (upper right) with ratchet wheel and crown wheel on top
  bridgeMesh(-28, 98, [0.05, 0.03], 0.03)
  const steel = track(M.brass.clone())
  steel.color = new THREE.Color('#c7c8c4')
  steel.roughness = 0.34
  const ratchet = addGear(...P(0.4, 38), 0.27, 64, 0.03, 0.068, 0, steel)
  {
    // snailed disc under the teeth, and a big polished screw in the centre
    const disc = new THREE.Mesh(track(new THREE.CylinderGeometry(0.235, 0.235, 0.012, 96).rotateX(Math.PI / 2)), steel)
    disc.position.z = 0.012
    ratchet.add(disc)
  }
  screw(...P(0.4, 38), 0.1, 0.05, M.anglage)
  const crownW = addGear(...P(0.56, 88), 0.15, 40, -0.07, 0.068, 0, steel)
  {
    const disc = new THREE.Mesh(track(new THREE.CylinderGeometry(0.125, 0.125, 0.012, 72).rotateX(Math.PI / 2)), steel)
    disc.position.z = 0.012
    crownW.add(disc)
  }
  screw(...P(0.56, 88), 0.1, 0.034, M.anglage)
  // click spring and click beside the ratchet wheel
  {
    const pts = []
    for (let i = 0; i <= 40; i++) {
      const a = deg(8 + i * 1.5)
      const r = 0.7 - i * 0.0015
      pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0.068))
    }
    movementG.add(new THREE.Mesh(track(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.007, 6, false)), M.anglage))
  }

  // 2. train bridge (left), with the third wheel riding on top, like the reference
  bridgeMesh(104, 206, [-0.02, 0.04], 0.03)
  addGear(...P(0.4, 152), 0.22, 60, -0.12, 0.068, 5)
  jewel(...P(0.4, 152), 0.104, 0.02)

  // 3. fourth-wheel bridge (lower left), with the seconds wheel on top
  bridgeMesh(212, 252, [-0.06, -0.1], 0.03)
  addGear(...P(0.48, 230), 0.13, 36, 0.45, 0.068, 5)
  jewel(...P(0.48, 230), 0.104, 0.016)

  // engraving across the train and barrel bridges
  const engr = new THREE.Mesh(track(new THREE.PlaneGeometry(0.42, 0.105)), M.engrave)
  engr.position.set(-0.3, 0.52, 0.066)
  engr.rotation.z = 0.5
  movementG.add(engr)

  // 4. escapement in the open corner: escape wheel and pallet fork
  const escShape = new THREE.Shape()
  for (let i = 0; i <= 30; i++) {
    const a = (i / 30) * Math.PI * 2
    const rr = i % 2 === 0 ? 0.095 : 0.068
    const aa = a + (i % 2 === 0 ? 0.08 : 0)
    i === 0 ? escShape.moveTo(Math.cos(aa) * rr, Math.sin(aa) * rr) : escShape.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr)
  }
  const escHole = new THREE.Path()
  escHole.absarc(0, 0, 0.045, 0, Math.PI * 2, true)
  escShape.holes.push(escHole)
  const ESC = P(0.3, 262)
  const escape = new THREE.Group()
  escape.position.set(ESC[0], ESC[1], 0.004)
  escape.add(new THREE.Mesh(exM(escShape, 0.012, 0.002), M.brass))
  movementG.add(escape)
  // pallet fork (points from the escape wheel to the balance)
  const forkShape = new THREE.Shape()
  forkShape.moveTo(-0.08, -0.012)
  forkShape.lineTo(0.12, -0.008)
  forkShape.lineTo(0.12, 0.008)
  forkShape.lineTo(-0.08, 0.012)
  forkShape.closePath()
  const fork = new THREE.Group()
  const FK = [(ESC[0] + BAL[0]) / 2, (ESC[1] + BAL[1]) / 2]
  fork.position.set(FK[0], FK[1], 0.02)
  const forkMesh = new THREE.Mesh(exM(forkShape, 0.01, 0.002), M.anglage)
  forkMesh.rotation.z = Math.atan2(BAL[1] - ESC[1], BAL[0] - ESC[0])
  fork.add(forkMesh)
  for (const px of [-0.05, 0.0]) {
    const stone = new THREE.Mesh(track(new THREE.BoxGeometry(0.012, 0.03, 0.012)), M.ruby)
    stone.position.set(px * Math.cos(forkMesh.rotation.z), px * Math.sin(forkMesh.rotation.z) - 0.018, 0.006)
    fork.add(stone)
  }
  movementG.add(fork)
  // small pallet bridge over the fork
  {
    const sh = new THREE.Shape()
    sh.moveTo(-0.03, -0.035)
    sh.lineTo(0.2, -0.03)
    sh.quadraticCurveTo(0.24, 0, 0.2, 0.03)
    sh.lineTo(-0.03, 0.035)
    sh.absarc(-0.03, 0, 0.035, Math.PI / 2, -Math.PI / 2, false)
    const pb = new THREE.Mesh(exM(sh, 0.016, 0.005), [M.plate, M.anglage])
    pb.position.set(ESC[0], ESC[1], 0.05)
    pb.rotation.z = deg(195)
    movementG.add(pb)
    jewel(ESC[0], ESC[1], 0.082, 0.014)
    const [sx, sy] = [ESC[0] + Math.cos(deg(195)) * 0.17, ESC[1] + Math.sin(deg(195)) * 0.17]
    screw(sx, sy, 0.08, 0.022)
  }

  // 5. balance wheel (beats 6 times a second) under its cock
  const balance = new THREE.Group()
  balance.position.set(BAL[0], BAL[1], 0.045)
  balance.add(new THREE.Mesh(track(new THREE.TorusGeometry(0.2, 0.016, 14, 96)), M.brass))
  for (let k = 0; k < 2; k++) {
    const sp = new THREE.Mesh(track(new THREE.BoxGeometry(0.4, 0.018, 0.01)), M.brass)
    sp.rotation.z = (k * Math.PI) / 2
    balance.add(sp)
  }
  // timing screws around the rim
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2
    const ts = new THREE.Mesh(track(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 10)), M.chaton)
    ts.position.set(Math.cos(a) * 0.215, Math.sin(a) * 0.215, 0)
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
  // balance cock: foot on the rim, arm over the balance, with a regulator index
  const cockShape = new THREE.Shape()
  cockShape.moveTo(0.02, -0.055)
  cockShape.lineTo(0.3, -0.1)
  cockShape.quadraticCurveTo(0.36, 0, 0.3, 0.1)
  cockShape.lineTo(0.02, 0.055)
  cockShape.absarc(0, 0, 0.06, Math.PI / 2, -Math.PI / 2, false)
  const cock = new THREE.Mesh(exM(cockShape, 0.02, 0.006), [M.plate, M.anglage])
  cock.position.set(BAL[0], BAL[1], 0.07)
  cock.rotation.z = deg(292)
  movementG.add(cock)
  jewel(BAL[0], BAL[1], 0.1, 0.026)
  {
    const idx = new THREE.Mesh(track(new THREE.BoxGeometry(0.2, 0.012, 0.008)), M.anglage)
    idx.geometry.translate(0.1, 0, 0)
    idx.position.set(BAL[0], BAL[1], 0.098)
    idx.rotation.z = deg(150)
    movementG.add(idx)
    const [cx, cy] = [BAL[0] + Math.cos(deg(292)) * 0.25, BAL[1] + Math.sin(deg(292)) * 0.25]
    screw(cx, cy, 0.095, 0.028)
  }

  // jewels and screws spread over the bridges
  for (const [r, d] of [[0.2, 60], [0.2, 128], [0.28, 200]]) jewel(...P(r, d), 0.064, 0.017)
  for (const [r, d] of [[0.7, -20], [0.7, 18], [0.7, 64], [0.7, 96], [0.7, 110], [0.68, 178], [0.7, 200], [0.7, 216], [0.7, 246], [0.24, 20], [0.3, 110]])
    screw(...P(r, d), 0.066)

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
  // Screw-down steel back with an exhibition window. The ring carries engraved
  // details; the sapphire carries gold printing and the founder's signature.
  // PULSE swaps the window for a domed sensor module.
  const back = new THREE.Mesh(track(lathe([[0.6, -0.2], [0.9, -0.2], [0.93, -0.17], [0.9, -0.15], [0.62, -0.15], [0.6, -0.17], [0.6, -0.2]], 96)), M.case)
  casebackG.add(back)
  const window_ = new THREE.Mesh(track(new THREE.CircleGeometry(0.6, 96)), M.crystal)
  window_.rotation.y = Math.PI // faces out of the back
  window_.position.z = -0.192
  casebackG.add(window_)
  const backRingMat = track(new THREE.MeshStandardMaterial({ transparent: true, metalness: 0.35, roughness: 0.55, emissive: '#ffffff', emissiveIntensity: 0.18, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }))
  const backRing = new THREE.Mesh(track(new THREE.RingGeometry(0.6, 0.9, 96, 1)), backRingMat)
  backRing.rotation.y = Math.PI
  backRing.position.z = -0.2015
  casebackG.add(backRing)
  const printMat = track(new THREE.MeshStandardMaterial({ map: null, transparent: true, metalness: 0.45, roughness: 0.35, emissive: '#ffffff', emissiveIntensity: 0.32, depthWrite: false }))
  const print = new THREE.Mesh(track(new THREE.CircleGeometry(0.6, 96)), printMat)
  print.rotation.y = Math.PI
  print.position.z = -0.194
  casebackG.add(print)
  // fonts may still be loading: draw now and again once they are ready
  const drawPrint = () => {
    printMat.map?.dispose()
    printMat.map = track(sapphirePrintTexture())
    printMat.emissiveMap = printMat.map
    printMat.needsUpdate = true
  }
  drawPrint()
  let backKey = ''
  const drawBackRing = (model, finish) => {
    backKey = model + finish
    backRingMat.map?.dispose()
    backRingMat.map = track(casebackRingTexture(model, finish !== 'steel' && finish !== 'champagne'))
    backRingMat.emissiveMap = backRingMat.map
    backRingMat.needsUpdate = true
  }
  document.fonts?.load?.('92px "Mrs Saint Delafield"').then(() => {
    drawPrint()
    if (currentLook) drawBackRing(currentLook.model, currentLook.caseFinish)
  })

  // PULSE sensor back: black glass dome, green heart-rate LEDs, red/IR LEDs,
  // photodiodes, Fresnel rings and two gold charging contacts
  const sensorG = new THREE.Group()
  const glass = track(new THREE.MeshPhysicalMaterial({ color: '#0a0a0b', roughness: 0.12, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.2, side: THREE.DoubleSide }))
  sensorG.add(new THREE.Mesh(track(lathe([[0.6, -0.19], [0.58, -0.205], [0.5, -0.225], [0.3, -0.24], [0, -0.245]], 96)), glass))
  const ledGreen = track(new THREE.MeshStandardMaterial({ color: '#0c3a1a', emissive: '#2cff6e', emissiveIntensity: 0.8, roughness: 0.3 }))
  const ledRed = track(new THREE.MeshStandardMaterial({ color: '#3a0c0c', emissive: '#ff3b30', emissiveIntensity: 0.45, roughness: 0.3 }))
  const diode = track(new THREE.MeshStandardMaterial({ color: '#1d2230', roughness: 0.25, metalness: 0.4 }))
  const ringMat = track(new THREE.MeshStandardMaterial({ color: '#2a2a2e', roughness: 0.4, metalness: 0.5 }))
  // height of the dome surface at radius r (same profile as the lathe), just outside it
  const DOME = [[0, -0.245], [0.3, -0.24], [0.5, -0.225], [0.58, -0.205], [0.6, -0.19]]
  const domeZ = (r) => {
    for (let i = 1; i < DOME.length; i++)
      if (r <= DOME[i][0]) {
        const [r0, z0] = DOME[i - 1]
        const [r1, z1] = DOME[i]
        return z0 + ((r - r0) / (r1 - r0)) * (z1 - z0) - 0.0018
      }
    return -0.19
  }
  const putBack = (mesh, x, y, z) => {
    mesh.position.set(x, y, z)
    mesh.rotation.y = Math.PI
    sensorG.add(mesh)
  }
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4
    putBack(new THREE.Mesh(track(new THREE.CircleGeometry(0.03, 24)), ledGreen), Math.cos(a) * 0.09, Math.sin(a) * 0.09, domeZ(0.09))
  }
  for (const x of [-0.04, 0.04]) putBack(new THREE.Mesh(track(new THREE.CircleGeometry(0.018, 20)), ledRed), x, 0, domeZ(0.04) - 0.0002)
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2
    putBack(new THREE.Mesh(track(new THREE.PlaneGeometry(0.075, 0.075)), diode), Math.cos(a) * 0.24, Math.sin(a) * 0.24, domeZ(0.24))
  }
  for (const r of [0.16, 0.32, 0.44]) {
    const ring = new THREE.Mesh(track(new THREE.RingGeometry(r - 0.004, r, 96)), ringMat)
    putBack(ring, 0, 0, domeZ(r))
  }
  for (const a of [-2.4, -0.74]) {
    const pin = new THREE.Mesh(track(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 20).rotateX(Math.PI / 2)), M.chaton)
    pin.position.set(Math.cos(a) * 0.38, Math.sin(a) * 0.38, domeZ(0.38) - 0.006)
    sensorG.add(pin)
  }
  casebackG.add(sensorG)

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
    } else {
      // leather, rubber and mesh are one continuous strap per side (not segments),
      // so they bend smoothly like the real thing instead of looking like links
      const type = spec.type
      const mat = type === 'mesh' ? M.mesh : type === 'rubber' ? M.rubber : M.leather
      if (type !== 'mesh') mat.color.set(spec.color)
      // leather sheen in its own colour (a brown sheen made black leather look brown)
      if (type === 'leather') M.leather.sheenColor.set(spec.color).lerp(new THREE.Color('#ffffff'), 0.12)
      M.stitch.color.set(spec.stitch || '#888')
      const aMax = (N * 0.215) / R
      // width tapers towards the tip; leather is padded in the middle
      const widthAt = (k) => (type === 'mesh' ? 0.94 : type === 'rubber' ? 0.96 - 0.06 * k : 0.96 - 0.14 * k)
      const thick = type === 'mesh' ? 0.045 : type === 'rubber' ? 0.11 : 0.07
      const pad = type === 'leather' ? 0.035 : type === 'rubber' ? 0.012 : 0
      const topAt = (x, w) => {
        const q = Math.min(1, Math.abs((2 * x) / w))
        // rounded edge + padded middle
        const edge = Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, q - 0.86) / 0.14, 2)))
        return thick * 0.5 * edge + pad * (1 - q * q) * edge
      }
      const frame = (a, sign) => {
        const p = new THREE.Vector3(0, sign * (start + R * Math.sin(a)), -R + R * Math.cos(a) - 0.06)
        const n = new THREE.Vector3(0, sign * Math.sin(a), Math.cos(a))
        return { p, n }
      }
      const STEPS = 90
      const COLS = 18
      for (const sign of [1, -1]) {
        const pos = []
        const uv = []
        const idx = []
        const ring = 2 * (COLS + 1)
        for (let i = 0; i <= STEPS; i++) {
          const k = i / STEPS
          const a = k * aMax
          const { p, n } = frame(a, sign)
          const w = widthAt(k)
          // top surface left->right, then bottom surface right->left
          for (let j = 0; j <= COLS; j++) {
            const x = -w / 2 + (w * j) / COLS
            const h = topAt(x, w)
            pos.push(x, p.y + n.y * h, p.z + n.z * h)
            uv.push(j / COLS, a * R * 1.6)
          }
          for (let j = COLS; j >= 0; j--) {
            const x = -w / 2 + (w * j) / COLS
            const h = -thick * 0.5 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, Math.abs((2 * x) / w) - 0.86) / 0.14, 2)))
            pos.push(x, p.y + n.y * h, p.z + n.z * h)
            uv.push(j / COLS, a * R * 1.6)
          }
        }
        for (let i = 0; i < STEPS; i++)
          for (let j = 0; j < ring; j++) {
            const a0 = i * ring + j
            const a1 = i * ring + ((j + 1) % ring)
            const b0 = a0 + ring
            const b1 = a1 + ring
            if (sign > 0) idx.push(a0, b0, a1, a1, b0, b1)
            else idx.push(a0, a1, b0, a1, b1, b0)
          }
        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
        geo.setIndex(idx)
        geo.computeVertexNormals()
        const m = new THREE.Mesh(geo, mat)
        strapG.add(m)
        strapMeshes.push(m)
      }
      // mesh: polished rolled edges along both sides, like a Milanese strap
      if (type === 'mesh') {
        for (const sign of [1, -1])
          for (const sx of [-1, 1]) {
            const pts = []
            for (let i = 0; i <= 40; i++) {
              const { p } = frame((i / 40) * aMax, sign)
              pts.push(new THREE.Vector3(sx * (widthAt(0) / 2), p.y, p.z))
            }
            const edge = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.03, 10, false), M.sPolish)
            strapG.add(edge)
            strapMeshes.push(edge)
          }
      }
      // leather: contrast stitching running along both edges
      if (type === 'leather') {
        const per = 34
        const im = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.008, 0.03, 2, 6), M.stitch, per * 2 * 2)
        let c = 0
        for (const sign of [1, -1])
          for (const sx of [-1, 1])
            for (let i = 0; i < per; i++) {
              const k = (i + 0.5) / per
              const a = k * aMax * 0.97
              const { p, n } = frame(a, sign)
              const w = widthAt(k)
              const x = sx * (w / 2 - 0.055)
              const h = topAt(x, w) + 0.003
              dummy.position.set(x, p.y + n.y * h, p.z + n.z * h)
              dummy.rotation.set(-sign * a, 0, 0)
              dummy.updateMatrix()
              im.setMatrixAt(c++, dummy.matrix)
            }
        im.instanceMatrix.needsUpdate = true
        strapG.add(im)
        strapMeshes.push(im)
      }
      // leather and rubber: a keeper loop on one side and adjustment holes on the other
      if (type !== 'mesh') {
        const kA = 0.62
        const { p, n } = frame(kA, 1)
        const keeper = new THREE.Mesh(new RoundedBoxGeometry(widthAt(kA / aMax) + 0.05, 0.1, thick + pad + 0.07, 2, 0.03), mat)
        keeper.position.set(0, p.y + n.y * 0.01, p.z + n.z * 0.01)
        keeper.rotation.x = -kA
        strapG.add(keeper)
        strapMeshes.push(keeper)
        const holes = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.035, 0.01, 18), M.strapHole, 5)
        for (let i = 0; i < 5; i++) {
          const a = 0.7 + i * 0.16
          const { p: hp, n: hn } = frame(a, -1)
          const h = topAt(0, widthAt(a / aMax)) + 0.002
          dummy.position.set(0, hp.y + hn.y * h, hp.z + hn.z * h)
          dummy.rotation.set(Math.PI / 2 + a, 0, 0)
          dummy.updateMatrix()
          holes.setMatrixAt(i, dummy.matrix)
        }
        holes.instanceMatrix.needsUpdate = true
        strapG.add(holes)
        strapMeshes.push(holes)
      }
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
    M.mesh.roughness = L.caseFinish === 'black' ? 0.45 : 0.36
    M.lume.color.set(L.dial === 'ivory' ? '#1d1c1a' : '#f2efe6')
    M.dial.metalness = L.dial === 'ivory' ? 0.25 : 0.6
    if (L.dial !== currentLook.dial || L.model !== currentLook.model) {
      M.dial.map?.dispose()
      M.dial.map = dialTexture(L.dial, L.model)
      M.dial.needsUpdate = true
    }
    if (L.model !== currentLook.model) buildIndices(L.model)
    if (L.strap !== currentLook.strap) buildStrap(L.strap)
    if (backKey !== L.model + L.caseFinish) drawBackRing(L.model, L.caseFinish)
    const pulseBack = L.model === 'pulse'
    sensorG.visible = pulseBack
    print.visible = !pulseBack
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
    // PULSE sensor LEDs flash with a heartbeat
    if (sensorG.visible) {
      const beat = (t * 1.15) % 1
      ledGreen.emissiveIntensity = 0.35 + 1.4 * Math.exp(-beat * 9) + 0.6 * Math.exp(-Math.abs(beat - 0.18) * 30)
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
    for (const mat of [M.leather, M.stitch, M.sCase, M.sPolish, M.mesh, M.rubber, M.strapHole]) {
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
