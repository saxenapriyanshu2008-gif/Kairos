// Sample: turn first, then explode evenly to both sides. Not part of the site.
import '@fontsource-variable/manrope'
import { createStage } from '../src/three/stage.js'

const RealDate = Date
// the clock follows video time, so the second hand keeps sweeping in every frame
const START = new RealDate(2026, 9, 2, 10, 8, 30).getTime()
let now = START
window.Date = class extends RealDate {
  constructor(...a) { a.length ? super(...a) : super(now) }
  static now() { return now }
}

const st = createStage(document.querySelector('#c'), { look: { model: 'arc', caseFinish: 'black', dial: 'midnight', strap: 'steel' }, maxDpr: 1 })
const S = st.state
const EXPLODE_FRONT = 1.55 // crystal
const EXPLODE_BACK = 1.05 // caseback
const MID = (EXPLODE_FRONT - EXPLODE_BACK) / 2 // shift that centres the spread on the case

const VIEW = { rx: -0.28, ry: -0.45, size: 0.62 }
const SIDE = { rx: 0.16, ry: -1.32, size: 0.62 }
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const seg = (t, a, b) => ease((t - a) / (b - a))
const lerp = (a, b, k) => a + (b - a) * k

// timeline (seconds)
export const DURATION = 10.4
window.DURATION = DURATION
const T = { turn: [0.6, 2.2], strap: [1.5, 2.4], open: [2.5, 4.6], close: [6.8, 8.6], back: [8.6, 10.0] }

const LABS = [
  ['crystal', '01', 'Sapphire crystal', 'up'],
  ['bezel', '02', 'Bezel', 'down'],
  ['hands', '03', 'Hands', 'up'],
  ['dial', '04', 'Dial', 'down'],
  ['case', '05', 'Case', 'up'],
  ['movement', '06', 'Calibre K-01', 'down'],
  ['caseback', '07', 'Caseback', 'up'],
]
document.querySelector('#labs').innerHTML = LABS.map(([, n, name, d]) => `<div class="lab ${d}"><i></i><b><em>${n}</em>${name}</b></div>`).join('')
const labEls = [...document.querySelectorAll('.lab')]

window.ready = document.fonts.ready.then(() => true)

window.at = (t) => {
  now = START + t * 1000
  // 1. turn to the side while closed, 2. open, 3. hold, 4. close, 5. turn back
  const turn = seg(t, ...T.turn) * (1 - seg(t, ...T.back))
  const open = seg(t, ...T.open) * (1 - seg(t, ...T.close))
  const strapOff = Math.max(seg(t, ...T.strap) * (1 - seg(t, T.close[1], T.back[1])), open)
  S.rx = lerp(VIEW.rx, SIDE.rx, turn)
  S.ry = lerp(VIEW.ry, SIDE.ry, turn) + Math.sin(t * 0.5) * 0.02
  S.rz = 0
  S.explode = open
  S.hideStrap = strapOff
  S.size = lerp(lerp(VIEW.size, SIDE.size, turn), 0.5, open)
  S.maxW = 2
  // keep the opened watch centred: shift by half the difference between front and back travel
  const halfH = Math.tan((14 * Math.PI) / 180) * 10
  const halfW = halfH * (innerWidth / innerHeight)
  const s = Math.min(S.size * halfH, S.maxW * halfW)
  const dirX = Math.sin(S.ry) * Math.cos(S.rx) // where the watch's own z axis points on screen
  S.x = (-dirX * MID * open * s) / halfW
  S.y = 0.02
  st.setPointer(Math.sin(t * 0.4) * 0.6, 0.5)
  st.frame()
  // labels after the parts have spread
  const lv = Math.min(1, Math.max(0, (t - 4.5) / 0.5)) * Math.min(1, Math.max(0, (6.8 - t) / 0.4))
  LABS.forEach(([part], i) => {
    const el = labEls[i]
    const p = lv > 0 ? st.project(part) : null
    el.style.opacity = p ? lv : 0
    el.style.setProperty('--o', `${(i % 4 < 2 ? 70 : 110) * (innerHeight / 720)}px`)
    if (p) el.style.transform = `translate(${p.x}px, ${p.y}px)`
  })
  const step = t < T.turn[1] ? 'Turn' : t < T.open[1] ? 'Open' : t < T.close[0] ? 'Hold' : t < T.close[1] ? 'Close' : 'Turn back'
  document.querySelector('#cap').innerHTML = `Explode sample &nbsp;/&nbsp; <b>${step}</b>`
  return true
}
