// Off-line renderer for the PULSE gallery: stills and the feature video.
// Driven by tools/render-pulse.py (Playwright), which calls window.still()
// and window.videoAt(t) and saves each frame. Not part of the site build.
import '@fontsource-variable/manrope'
import '@fontsource-variable/bodoni-moda'
import '@fontsource/mrs-saint-delafield/latin-400.css'
import { createStage } from '../src/three/stage.js'
import { watches } from '../src/data/watches.js'

// fake clock: the screen shows video time, not the (slow) real render time
const RealDate = Date
let fakeNow = new RealDate(2026, 9, 2, 10, 8, 12).getTime()
window.Date = class extends RealDate {
  constructor(...a) {
    if (a.length) super(...a)
    else super(fakeNow)
  }
  static now() {
    return fakeNow
  }
}
const BASE_TIME = fakeNow

const LOOK = { model: 'pulse', caseFinish: 'black', dial: 'obsidian', strap: 'navyRubber' }
const $ = (s) => document.querySelector(s)

const st = createStage($('#c'), { look: LOOK, maxDpr: 1 })
const S = st.state

function pose(p) {
  Object.assign(S, { x: 0, y: 0, rz: 0, maxW: 0.9, explode: 0, hideStrap: 0, ...p })
}
function settle(n = 40, px = -0.45, py = 0.55) {
  for (let i = 0; i < n; i++) {
    st.setPointer(px, py)
    st.frame(i < n - 1)
  }
}

window.ready = (async () => {
  await document.fonts.ready
  await Promise.all([document.fonts.load('600 40px "Manrope Variable"'), document.fonts.load('400 40px "Bodoni Moda Variable"'), document.fonts.load('92px "Mrs Saint Delafield"')])
  st.setScreen('face')
  settle(5)
  return true
})()

// ---------- stills ----------
const STILLS = {
  photo: { screen: 'face', p: { rx: -0.3, ry: -0.5, size: 0.48, x: 0.04, y: 0.02 }, light: [-0.5, 0.6] },
  apps: { screen: 'apps', p: { rx: -0.06, ry: -0.1, size: 0.66 }, light: [-0.3, 0.7] },
  sports: { screen: 'sports', p: { rx: -0.06, ry: 0.1, size: 0.66 }, light: [0.4, 0.7] },
  workout: { screen: 'workout', p: { rx: -0.06, ry: -0.1, size: 0.66 }, light: [-0.3, 0.7] },
  health: { screen: 'health', p: { rx: -0.06, ry: 0.1, size: 0.66 }, light: [0.4, 0.7] },
}
// gallery photo for any watch in the collection (hands read 10:08)
window.photoOf = (id) => {
  const w = watches.find((x) => x.id === id)
  st.setLook(w.look)
  st.setScreen('face')
  pose(STILLS.photo.p)
  settle(60, ...STILLS.photo.light)
  return true
}

// any look, for checking options (e.g. strap types)
window.photoLook = (look, p = STILLS.photo.p) => {
  st.setLook(look)
  st.setScreen('face')
  pose(p)
  settle(60, ...STILLS.photo.light)
  return true
}

window.still = (name) => {
  const s = STILLS[name]
  st.setScreen(s.screen)
  pose(s.p)
  settle(60, ...s.light)
  return true
}

// ---------- feature video ----------
const SIDE = { rx: 0.2, ry: -1.25, size: 0.34, y: 0.1, explode: 1, hideStrap: 1 }
const SCENES = [
  { d: 3.5, screen: 'face', from: { rx: -0.32, ry: -0.75, size: 0.4, y: 0.1 }, to: { rx: -0.28, ry: -0.3, size: 0.44, y: 0.1 }, k: 'Introducing', t: 'KAIROS PULSE', s: 'A smartwatch in a classic round case' },
  { d: 3.4, screen: 'face', to: { rx: -0.05, ry: 0, size: 0.6, y: 0.1 }, k: 'Display', t: '1.43 inch AMOLED', s: '466 x 466 pixels, 1000 nits, always-on' },
  { d: 3.2, screen: 'apps', to: { rx: -0.05, ry: -0.08, size: 0.6, y: 0.1 }, k: 'Wear OS 4', t: 'Your apps on your wrist', s: 'Calls, messages, music, maps and NFC payments' },
  { d: 3.2, screen: 'sports', to: { rx: -0.05, ry: 0.08, size: 0.6, y: 0.1 }, k: 'Sport', t: '100+ sports modes', s: 'Running, cycling, swimming, badminton, skiing' },
  { d: 3.2, screen: 'workout', to: { rx: -0.05, ry: -0.08, size: 0.6, y: 0.1 }, k: 'GPS', t: 'Dual-band L1 + L5', s: 'Accurate routes between tall buildings and trees' },
  { d: 3.2, screen: 'health', to: { rx: -0.05, ry: 0.08, size: 0.6, y: 0.1 }, k: 'Health', t: 'Heart, SpO2, sleep, stress', s: 'Measured all day, shown on one page' },
  { d: 4.4, screen: 'face', to: SIDE, k: 'Inside', t: 'Two chips. 100 hours.', s: 'Snapdragon W5 for smart features, BES2700 for all-day tracking', labels: true },
  { d: 3.4, screen: 'face', to: { rx: -0.28, ry: -0.45, size: 0.44, y: 0.1 }, k: 'Built for every day', t: '5 ATM + IP68', s: 'Swim-proof. 10 minutes of charge lasts a full day' },
  { d: 2.2, end: true },
]
let acc = 0
for (const sc of SCENES) {
  sc.start = acc
  acc += sc.d
}
export const DURATION = acc
window.DURATION = DURATION

const LABS = [
  ['crystal', 'Glass'],
  ['dial', 'AMOLED'],
  ['case', 'Aluminium case'],
  ['movement', 'Dual chips + 500 mAh'],
  ['caseback', 'Sensors'],
]
$('#labs').innerHTML = LABS.map(([, n]) => `<div class="lab"><i></i><b>${n}</b></div>`).join('')
const labEls = [...document.querySelectorAll('.lab')]

const KEYS = ['rx', 'ry', 'size', 'y', 'explode', 'hideStrap']
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const DEF = { explode: 0, hideStrap: 0 }

window.videoAt = (t) => {
  fakeNow = BASE_TIME + t * 1000
  for (const id of ['#brand', '#step', '#cap', '#bar']) $(id).hidden = false
  let i = SCENES.findIndex((sc) => t < sc.start + sc.d)
  if (i < 0) i = SCENES.length - 1
  const sc = SCENES[i]
  const local = t - sc.start
  // end card
  const endSc = SCENES[SCENES.length - 1]
  $('#end').style.opacity = t > endSc.start ? Math.min(1, (t - endSc.start) / 0.6) : 0
  const real = sc.end ? SCENES[i - 1] : sc
  if (!sc.end) {
    const prev = i === 0 ? { ...DEF, ...sc.from } : { ...DEF, ...SCENES[i - 1].to }
    const k = i === 0 ? ease(Math.min(1, local / sc.d)) : ease(Math.min(1, local / 1.1))
    const to = { ...DEF, ...sc.to }
    const p = {}
    for (const key of KEYS) p[key] = prev[key] + (to[key] - prev[key]) * k
    // gentle drift so the frame is never fully still
    p.ry += Math.sin(t * 0.6) * 0.04
    pose(p)
    st.setScreen(sc.screen)
  }
  st.setPointer(Math.sin(t * 0.5) * 0.6, 0.45 + Math.cos(t * 0.4) * 0.15)
  st.frame()
  // captions fade in and out inside each scene
  const fade = sc.end ? 0 : Math.min(1, Math.max(0, (local - 0.35) / 0.4)) * Math.min(1, Math.max(0, (sc.d - local) / 0.35))
  const cap = $('#cap')
  cap.style.opacity = fade
  cap.style.transform = `translateY(${(1 - fade) * 14}px)`
  cap.querySelector('.k').textContent = real.k
  cap.querySelector('.t').textContent = real.t
  cap.querySelector('.s').textContent = real.s
  $('#step').textContent = `${String(Math.min(i + 1, SCENES.length - 1)).padStart(2, '0')} / ${String(SCENES.length - 1).padStart(2, '0')}`
  $('#bar').style.width = `${(t / DURATION) * 100}%`
  // part labels in the exploded scene
  const lv = sc.labels ? Math.min(1, Math.max(0, (local - 1.3) / 0.5)) * Math.min(1, Math.max(0, (sc.d - local - 0.2) / 0.5)) : 0
  LABS.forEach(([part], j) => {
    const el = labEls[j]
    const pr = lv > 0 ? st.project(part) : null
    el.style.opacity = pr ? lv : 0
    el.style.setProperty('--o', `${(j % 2 ? 110 : 70) * (innerHeight / 960)}px`)
    if (pr) el.style.transform = `translate(${pr.x}px, ${pr.y}px)`
  })
  return true
}
