import { memo, useEffect, useId, useRef } from 'react'

/*
  WatchSVG
  --------
  Every KAIROS watch on the site is drawn here in code (no photos), so the
  visuals are 100% original, sharp at any size and only a few KB.

  Props
    model       'arc' | 'noir' | 'atlas' | 'elan'   (changes bezel + indices)
    caseFinish  'steel' | 'black' | 'champagne'
    dial        'ivory' | 'obsidian' | 'midnight'
    strap       'steel' | 'blackLeather' | 'brownLeather'
    live        true = hands follow the real time (paused when off screen)
    showStrap   false = case only (used for close-ups)
*/

const roseHandsFor = (m) => m === 'void' || m === 'mono'
const CX = 200
const CY = 320

const METALS = {
  steel: { stops: ['#cfd0cc', '#8b8c89', '#c2c3bf', '#5f605d', '#adaeaa'], edge: '#4a4a46', shine: '#e9e9e5' },
  black: { stops: ['#5c5c5f', '#1b1b1c', '#46464a', '#0c0c0d', '#353538'], edge: '#000000', shine: '#8a8a8e' },
  champagne: { stops: ['#dcc9a2', '#977b4e', '#d2bb8d', '#6c5536', '#c2a676'], edge: '#5a462a', shine: '#efe2c4' },
  blue: { stops: ['#6a84b8', '#22355e', '#5872a6', '#14213f', '#3f5789'], edge: '#0c1428', shine: '#9fb3da' },
  gunmetal: { stops: ['#9a9ba0', '#46474b', '#85868b', '#2e2f33', '#6c6d72'], edge: '#1c1d20', shine: '#c3c4c8' },
  rose: { stops: ['#f0c6ae', '#a8664a', '#e3b296', '#7f4a34', '#cf9c80'], edge: '#5a3424', shine: '#ffe2d2' },
}

const DIALS = {
  ivory: { center: '#fbf8f1', edge: '#d9d0bf', text: '#1d1c1a', sub: '#6d675d', track: '#3b3834', sunray: '#ffffff' },
  obsidian: { center: '#2d2d31', edge: '#060607', text: '#ece7dd', sub: '#8f8a82', track: '#bdb7ac', sunray: '#ffffff' },
  midnight: { center: '#2a3e66', edge: '#09111f', text: '#ece7dd', sub: '#9aa6bd', track: '#c7cedb', sunray: '#bcd0ff' },
  slate: { center: '#565c63', edge: '#1b1e22', text: '#ece7dd', sub: '#a3a8ad', track: '#c9ccd0', sunray: '#ffffff' },
}

// strap key -> look. Bracelet and mesh take the case metal.
const STRAP = {
  steel: { type: 'bracelet' },
  mesh: { type: 'mesh' },
  blackLeather: { type: 'leather', a: '#24221f', b: '#0a0a09', stitch: '#5a554d' },
  brownLeather: { type: 'leather', a: '#74462b', b: '#3a2215', stitch: '#d8b48b' },
  tanLeather: { type: 'leather', a: '#8a5d36', b: '#4e321b', stitch: '#e2c79c' },
  navyLeather: { type: 'leather', a: '#26324f', b: '#0f1526', stitch: '#8d98b2' },
  blackRubber: { type: 'rubber', a: '#232323', b: '#0b0b0b', stitch: '#b8352f' },
  navyRubber: { type: 'rubber', a: '#2a3f6b', b: '#121d36', stitch: '#c9ad7c' },
  greyRubber: { type: 'rubber', a: '#666a6f', b: '#33363a', stitch: '#e8e5dd' },
}

// Build one <path> string for many radial lines (much lighter than 60 <line>s)
function radialLines(count, r1, r2, skipEvery = 0) {
  let d = ''
  for (let i = 0; i < count; i++) {
    if (skipEvery && i % skipEvery === 0) continue
    const a = (i / count) * Math.PI * 2
    const s = Math.sin(a)
    const c = -Math.cos(a)
    d += `M${(CX + s * r1).toFixed(2)} ${(CY + c * r1).toFixed(2)}L${(CX + s * r2).toFixed(2)} ${(CY + c * r2).toFixed(2)}`
  }
  return d
}

// Angles for a given Date (degrees, 0 = 12 o'clock)
export function handAngles(date) {
  const ms = date.getMilliseconds()
  const s = date.getSeconds() + ms / 1000
  const m = date.getMinutes() + s / 60
  const h = (date.getHours() % 12) + m / 60
  return { h: h * 30, m: m * 6, s: s * 6 }
}

// Classic product-shot time: 10:09:30
const DEFAULT_ANGLES = { h: 304.5, m: 57, s: 180 }

function WatchSVG({
  model = 'arc',
  caseFinish = 'steel',
  dial = 'ivory',
  strap = 'blackLeather',
  live = false,
  showStrap = true,
  title,
  className = '',
  style,
  children, // optional extra SVG drawn on top (used for the scroll-story ring)
}) {
  const uid = useId().replace(/:/g, '')
  const id = (n) => `${uid}-${n}`
  const metal = METALS[caseFinish] || METALS.steel
  // Indices and hands use polished steel, except on champagne cases
  const handMetal = roseHandsFor(model) ? METALS.rose : caseFinish === 'champagne' ? METALS.champagne : METALS.steel
  const d = DIALS[dial] || DIALS.ivory
  const isAtlas = model === 'atlas'
  const isApex = model === 'apex'
  const isPulse = model === 'pulse'
  const isVoid = model === 'void'
  const isMono = model === 'mono'
  const hasInsert = isAtlas || isApex
  const dialR = hasInsert ? 103 : 113
  const S = STRAP[strap] || STRAP.blackLeather
  const roseHands = isVoid || isMono

  // ----- live hands -----
  const svgRef = useRef(null)
  const hRef = useRef(null)
  const mRef = useRef(null)
  const sRef = useRef(null)

  useEffect(() => {
    if (!live) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let visible = true
    const set = (el, deg) => el && el.setAttribute('transform', `rotate(${deg.toFixed(2)} ${CX} ${CY})`)
    const tick = () => {
      const a = handAngles(new Date())
      set(hRef.current, a.h)
      set(mRef.current, a.m)
      // reduced motion: tick once per second instead of a smooth sweep
      set(sRef.current, reduce ? Math.floor(a.s / 6) * 6 : a.s)
      if (visible) raf = requestAnimationFrame(tick)
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      cancelAnimationFrame(raf)
      if (visible) raf = requestAnimationFrame(tick)
    })
    if (svgRef.current) io.observe(svgRef.current)
    tick()
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [live])

  const A = DEFAULT_ANGLES
  const rot = (deg) => `rotate(${deg} ${CX} ${CY})`

  // ----- hour indices per model -----
  const indices = []
  for (let i = 0; i < 12; i++) {
    const deg = i * 30
    if (isAtlas && i === 3) continue // date window
    if (isPulse) continue
    if (isApex && i % 3 === 0 && i !== 0) continue // sub-dials at 3, 6, 9
    if (isMono && i === 6) continue // small seconds at 6
    if (isApex || isVoid) {
      indices.push(<rect key={i} x={CX - 2.4} y={CY - dialR + 10} width={4.8} height={isApex ? 16 : 13} rx={1} fill={isApex ? '#f2efe6' : `url(#${id('hm')})`} transform={rot(deg)} />)
      continue
    }
    if (isMono) {
      indices.push(<rect key={i} x={CX - 1.2} y={CY - dialR + 11} width={2.4} height={i % 3 === 0 ? 24 : 16} rx={1} fill={`url(#${id('hm')})`} transform={rot(deg)} />)
      continue
    }
    if (model === 'noir') {
      if (i % 3 === 0) {
        indices.push(<rect key={i} x={CX - 3.2} y={CY - dialR + 12} width={6.4} height={i === 0 ? 22 : 18} rx={1.2} fill={`url(#${id('hm')})`} transform={rot(deg)} />)
      } else {
        indices.push(<circle key={i} cx={CX} cy={CY - dialR + 18} r={4.6} fill={`url(#${id('hm')})`} transform={rot(deg)} />)
      }
    } else if (model === 'elan') {
      indices.push(<rect key={i} x={CX - 1.4} y={CY - dialR + 11} width={2.8} height={i % 3 === 0 ? 26 : 18} rx={1} fill={`url(#${id('hm')})`} transform={rot(deg)} />)
    } else if (isAtlas) {
      if (i === 0) {
        indices.push(<path key={i} d={`M${CX - 9} ${CY - dialR + 10}L${CX + 9} ${CY - dialR + 10}L${CX} ${CY - dialR + 28}Z`} fill="#f2efe6" stroke={`url(#${id('hm')})`} strokeWidth="1.6" />)
      } else if (i % 3 === 0) {
        indices.push(<rect key={i} x={CX - 4} y={CY - dialR + 10} width={8} height={22} rx={1} fill="#f2efe6" stroke={`url(#${id('hm')})`} strokeWidth="1.4" transform={rot(deg)} />)
      } else {
        indices.push(<circle key={i} cx={CX} cy={CY - dialR + 17} r={5.4} fill="#f2efe6" stroke={`url(#${id('hm')})`} strokeWidth="1.4" transform={rot(deg)} />)
      }
    } else {
      // arc: applied bars, doubled at 12
      if (i === 0) {
        indices.push(
          <g key={i}>
            <rect x={CX - 7} y={CY - dialR + 11} width={5} height={22} rx={1} fill={`url(#${id('hm')})`} />
            <rect x={CX + 2} y={CY - dialR + 11} width={5} height={22} rx={1} fill={`url(#${id('hm')})`} />
          </g>
        )
      } else {
        indices.push(<rect key={i} x={CX - 2.6} y={CY - dialR + 11} width={5.2} height={18} rx={1} fill={`url(#${id('hm')})`} transform={rot(deg)} />)
      }
    }
  }

  const handFill = `url(#${id('hm')})`
  const lume = dial === 'ivory' ? '#1d1c1a' : '#f2efe6'

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 400 640"
      className={`watch-svg ${className}`}
      style={style}
      role="img"
      aria-label={title || 'KAIROS watch'}
      focusable="false"
    >
      <defs>
        <linearGradient id={id('metal')} x1="0" y1="0" x2="1" y2="1">
          {metal.stops.map((c, i) => (
            <stop key={i} offset={i / (metal.stops.length - 1)} stopColor={c} />
          ))}
        </linearGradient>
        <linearGradient id={id('metalV')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={metal.stops[3]} />
          <stop offset=".25" stopColor={metal.stops[0]} />
          <stop offset=".5" stopColor={metal.stops[1]} />
          <stop offset=".78" stopColor={metal.stops[2]} />
          <stop offset="1" stopColor={metal.stops[3]} />
        </linearGradient>
        <linearGradient id={id('polish')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={metal.stops[3]} />
          <stop offset=".2" stopColor={metal.stops[2]} />
          <stop offset=".42" stopColor={metal.shine} />
          <stop offset=".6" stopColor={metal.stops[1]} />
          <stop offset=".85" stopColor={metal.stops[0]} />
          <stop offset="1" stopColor={metal.stops[3]} />
        </linearGradient>
        <linearGradient id={id('hm')} x1="0" y1="0" x2="1" y2="1">
          {handMetal.stops.map((c, i) => (
            <stop key={i} offset={i / (handMetal.stops.length - 1)} stopColor={c} />
          ))}
        </linearGradient>
        <radialGradient id={id('dial')} cx=".42" cy=".38" r=".75">
          <stop offset="0" stopColor={d.center} />
          <stop offset="1" stopColor={d.edge} />
        </radialGradient>
        <radialGradient id={id('glare')} cx=".3" cy=".2" r=".7">
          <stop offset="0" stopColor="#fff" stopOpacity=".38" />
          <stop offset=".45" stopColor="#fff" stopOpacity=".06" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('shadow')} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#000" stopOpacity=".55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        {S.a && (
          <linearGradient id={id('leather')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={S.b} />
            <stop offset=".35" stopColor={S.a} />
            <stop offset=".65" stopColor={S.a} />
            <stop offset="1" stopColor={S.b} />
          </linearGradient>
        )}
        {S.type === 'mesh' && (
          <pattern id={id('mesh')} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="5" height="5" fill={metal.stops[1]} />
            <path d="M0 0V5" stroke={metal.stops[0]} strokeWidth="1.6" />
            <path d="M0 0H5" stroke={metal.stops[3]} strokeWidth=".8" opacity=".7" />
          </pattern>
        )}
        {/* straps fade out at both ends, like a studio product shot */}
        <linearGradient id={id('fade')} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="640">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".17" stopColor="#fff" stopOpacity="1" />
          <stop offset=".83" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={id('strapMask')} maskUnits="userSpaceOnUse" x="0" y="-40" width="400" height="720">
          <rect x="0" y="-40" width="400" height="720" fill={`url(#${id('fade')})`} />
        </mask>
        <clipPath id={id('dialClip')}>
          <circle cx={CX} cy={CY} r={dialR} />
        </clipPath>
      </defs>

      {/* soft floor shadow */}
      <ellipse cx={CX + 10} cy={CY + 18} rx="170" ry="190" fill={`url(#${id('shadow')})`} opacity=".55" />

      {/* ---------- STRAP ---------- */}
      {showStrap && (
        <g mask={`url(#${id('strapMask')})`}>
          {S.type === 'bracelet' ? <Bracelet id={id} /> : S.type === 'mesh' ? <Mesh id={id} /> : <Leather id={id} stitch={S.stitch} rubber={S.type === 'rubber'} />}
        </g>
      )}

      {/* ---------- LUGS ---------- */}
      <g fill={`url(#${id('metalV')})`} stroke={metal.edge} strokeWidth=".8">
        <path d="M120 236C118 210 122 188 130 168L160 168C155 190 153 212 156 236Z" />
        <path d="M280 236C282 210 278 188 270 168L240 168C245 190 247 212 244 236Z" />
        <path d="M120 404C118 430 122 452 130 472L160 472C155 450 153 428 156 404Z" />
        <path d="M280 404C282 430 278 452 270 472L240 472C245 450 247 428 244 404Z" />
      </g>

      {/* ---------- CROWN ---------- */}
      {isAtlas && <path d="M326 296L338 300L338 340L326 344Z" fill={`url(#${id('metal')})`} stroke={metal.edge} strokeWidth=".6" />}
      <rect x="330" y="306" width="22" height="28" rx="4" fill={`url(#${id('metalV')})`} stroke={metal.edge} strokeWidth=".8" />
      <path d="M336 308V332M341 308V332M346 308V332" stroke={metal.edge} strokeWidth="1" opacity=".55" />

      {(isApex || isPulse) && (
        <g fill={`url(#${id('metalV')})`} stroke={metal.edge} strokeWidth=".8">
          <rect x="300" y="226" width="16" height="22" rx="3" transform="rotate(38 308 237)" />
          <rect x="300" y="392" width="16" height="22" rx="3" transform="rotate(-38 308 403)" />
        </g>
      )}
      {/* ---------- CASE ---------- */}
      <circle cx={CX} cy={CY} r="134" fill={`url(#${id('metal')})`} stroke={metal.edge} strokeWidth="1" />
      <circle cx={CX} cy={CY} r="128" fill="none" stroke={metal.shine} strokeOpacity=".35" strokeWidth="1.2" />

      {/* ---------- BEZEL ---------- */}
      {isApex ? (
        <g>
          <circle cx={CX} cy={CY} r="125" fill="#16171a" />
          <circle cx={CX} cy={CY} r="107" fill="none" stroke={`url(#${id('metal')})`} strokeWidth="2.5" />
          <path d={radialLines(60, 123, 118, 0)} stroke="#d8d6cf" strokeWidth="1" />
          <path d={radialLines(15, 122, 112, 0)} stroke="#c9ad7c" strokeWidth="2" />
          <text x={CX} y={CY + 119} fontSize="7" letterSpacing="2.5" fill="#c9ad7c" textAnchor="middle" fontFamily="Manrope Variable, sans-serif" fontWeight="700">TACHYMETRE</text>
        </g>
      ) : isAtlas ? (
        <g>
          <circle cx={CX} cy={CY} r="125" fill="#121418" />
          <circle cx={CX} cy={CY} r="107" fill="none" stroke={`url(#${id('metal')})`} strokeWidth="2.5" />
          <path d={radialLines(60, 121, 114, 5)} stroke="#d8d6cf" strokeWidth="1.2" />
          <path d={radialLines(12, 123, 111, 0).replace(/^M[^M]*/, '')} stroke="#ece9e1" strokeWidth="3" />
          <path d={`M${CX - 7} ${CY - 123}L${CX + 7} ${CY - 123}L${CX} ${CY - 111}Z`} fill="#c9ad7c" />
          {[15, 30, 45].map((n) => {
            const a = (n / 60) * Math.PI * 2
            return (
              <text key={n} x={CX + Math.sin(a) * 116} y={CY - Math.cos(a) * 116 + 4} fontSize="11" fill="#ece9e1" textAnchor="middle" fontFamily="Manrope Variable, sans-serif" fontWeight="600" transform={`rotate(${(n / 60) * 360} ${CX + Math.sin(a) * 116} ${CY - Math.cos(a) * 116})`}>
                {n}
              </text>
            )
          })}
        </g>
      ) : (
        <g>
          <circle cx={CX} cy={CY} r="122" fill={`url(#${id('metalV')})`} />
          <circle cx={CX} cy={CY} r="117" fill={metal.edge} opacity=".55" />
        </g>
      )}

      {/* ---------- DIAL ---------- */}
      <circle cx={CX} cy={CY} r={dialR} fill={`url(#${id('dial')})`} />
      <g clipPath={`url(#${id('dialClip')})`}>
        {/* sunray brushing */}
        <path d={radialLines(180, 6, dialR)} stroke={d.sunray} strokeOpacity={dial === 'ivory' ? 0.05 : 0.045} strokeWidth=".7" />
      </g>
      {/* minute track */}
      <path d={radialLines(60, dialR - 3, dialR - 8, 5)} stroke={d.track} strokeWidth="1" opacity=".7" />
      <circle cx={CX} cy={CY} r={dialR - 9} fill="none" stroke={d.track} strokeOpacity=".2" strokeWidth=".6" />
      {indices}

      {/* VOID: open centre shows the movement */}
      {isVoid && (
        <g>
          <circle cx={CX} cy={CY} r="76" fill="#8f908c" />
          <path d={radialLines(40, 0, 76)} stroke="#b9bab6" strokeOpacity=".25" strokeWidth="5" />
          {[[-22, -18, 30, '#b8995e'], [26, -34, 18, '#b8995e'], [30, 14, 13, '#b8995e'], [10, 38, 20, '#c9ad7c']].map(([x, y, r, c], k) => (
            <g key={k}>
              <circle cx={CX + x} cy={CY + y} r={r} fill="none" stroke={c} strokeWidth="5" strokeDasharray="2 1.6" />
              <circle cx={CX + x} cy={CY + y} r={r - 4} fill={c} opacity=".85" />
              <circle cx={CX + x} cy={CY + y} r="2.6" fill="#7a0d20" />
            </g>
          ))}
          <path d={`M${CX - 70} ${CY + 6}C${CX - 30} ${CY - 10} ${CX + 20} ${CY + 18} ${CX + 70} ${CY - 6}`} stroke="#c6c7c3" strokeWidth="12" fill="none" strokeLinecap="round" />
          <circle cx={CX} cy={CY} r="76" fill="none" stroke={d.edge} strokeWidth="2" />
        </g>
      )}
      {/* APEX: three sub-dials */}
      {isApex &&
        [[46, 0], [0, 46], [-46, 0]].map(([x, y], k) => (
          <g key={k}>
            <circle cx={CX + x} cy={CY + y} r="23" fill="#000" opacity=".28" stroke={d.text} strokeOpacity=".7" strokeWidth="1" />
            <line x1={CX + x} y1={CY + y} x2={CX + x + Math.sin(k * 2.1) * 17} y2={CY + y - Math.cos(k * 2.1) * 17} stroke="#d9c08a" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx={CX + x} cy={CY + y} r="2" fill="#d9c08a" />
          </g>
        ))}
      {/* MONO: small seconds at 6 */}
      {isMono && (
        <g>
          <circle cx={CX} cy={CY + 48} r="22" fill="#000" opacity=".25" stroke={d.text} strokeOpacity=".55" strokeWidth=".8" />
          <line x1={CX} y1={CY + 48} x2={CX + 10} y2={CY + 34} stroke={`url(#${id('hm')})`} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx={CX} cy={CY + 48} r="1.8" fill={`url(#${id('hm')})`} />
        </g>
      )}
      {/* PULSE: the AMOLED screen */}
      {isPulse && <PulseScreen r={dialR} />}

      {/* date window for ATLAS */}
      {isAtlas && (
        <g>
          <rect x={CX + 66} y={CY - 9} width="22" height="18" rx="1.5" fill="#f2efe6" stroke={`url(#${id('hm')})`} strokeWidth="1.6" />
          <text x={CX + 77} y={CY + 4.5} fontSize="11" textAnchor="middle" fill="#1d1c1a" fontFamily="Manrope Variable, sans-serif" fontWeight="700">
            {new Date().getDate()}
          </text>
        </g>
      )}

      {/* dial text */}
      {!isPulse && (
      <g fontFamily="Manrope Variable, sans-serif" textAnchor="middle" transform={isVoid ? `translate(0 -20)` : undefined}>
        {/* small K mark (the logo's stem + two hands) */}
        <path d={`M${CX - 3} ${CY - 71}V${CY - 58}M${CX - 3} ${CY - 64.5}L${CX + 2.6} ${CY - 71}M${CX - 3} ${CY - 64.5}L${CX + 3.6} ${CY - 57.6}`} fill="none" stroke={d.text} strokeWidth="1.2" strokeLinecap="round" opacity=".85" />
        <text x={CX} y={CY - 44} fontSize="12.5" letterSpacing="4.5" fill={d.text} fontWeight="600">
          KAIROS
        </text>
        {!isVoid && (
          <text x={CX} y={isMono ? CY - 32 : isApex ? CY + 76 : CY + 50} fontSize="6.6" letterSpacing="2.4" fill={d.sub} fontWeight="600">
            {isAtlas ? 'AUTOMATIC · 200M' : model === 'elan' ? 'ÉLAN · AUTOMATIC' : isApex ? 'CHRONOGRAPH' : 'AUTOMATIC'}
          </text>
        )}
        {!isVoid && !isMono && !isApex && (
          <text x={CX} y={CY + 62} fontSize="5.4" letterSpacing="1.6" fill={d.sub} opacity=".8">
            {model === 'noir' ? 'NOIR · CALIBRE K-01' : isAtlas ? 'CALIBRE K-02' : 'CALIBRE K-01'}
          </text>
        )}
      </g>
      )}

      {/* ---------- HANDS ---------- */}
      <g style={isPulse ? { display: 'none' } : undefined}>
      <g ref={hRef} transform={rot(A.h)}>
        <path d={`M${CX - 4.5} ${CY + 14}L${CX - 5.5} ${CY - 54}L${CX} ${CY - 64}L${CX + 5.5} ${CY - 54}L${CX + 4.5} ${CY + 14}Z`} fill={handFill} stroke={metal.edge} strokeWidth=".5" />
        <path d={`M${CX} ${CY - 24}L${CX} ${CY - 56}`} stroke={lume} strokeWidth="2.4" strokeLinecap="round" opacity=".85" />
      </g>
      <g ref={mRef} transform={rot(A.m)}>
        <path d={`M${CX - 3.6} ${CY + 18}L${CX - 4.2} ${CY - 90}L${CX} ${CY - 100}L${CX + 4.2} ${CY - 90}L${CX + 3.6} ${CY + 18}Z`} fill={handFill} stroke={metal.edge} strokeWidth=".5" />
        <path d={`M${CX} ${CY - 30}L${CX} ${CY - 92}`} stroke={lume} strokeWidth="1.8" strokeLinecap="round" opacity=".85" />
      </g>
      <g ref={sRef} transform={rot(A.s)} style={isMono ? { display: 'none' } : undefined}>
        <path d={`M${CX} ${CY + 26}L${CX} ${CY - (dialR - 6)}`} stroke="#c9ad7c" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx={CX} cy={CY + 20} r="3.6" fill="#c9ad7c" />
      </g>
      <circle cx={CX} cy={CY} r="5.5" fill="#c9ad7c" />
      <circle cx={CX} cy={CY} r="2" fill={metal.edge} />
      </g>

      {/* ---------- SAPPHIRE GLARE ---------- */}
      <circle cx={CX} cy={CY} r={hasInsert ? 106 : 117} fill={`url(#${id('glare')})`} pointerEvents="none" />
      <path d={`M${CX - 92} ${CY - 40}A100 100 0 0 1 ${CX - 30} ${CY - 98}`} stroke="#fff" strokeOpacity=".28" strokeWidth="2" fill="none" strokeLinecap="round" />
      {children}
    </svg>
  )
}

// Static AMOLED face for PULSE (time is taken when the card renders)
function PulseScreen({ r }) {
  const now = new Date()
  const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const arc = (rr, frac) => {
    const a = frac * Math.PI * 2
    const x = CX + Math.sin(a) * rr
    const y = CY - Math.cos(a) * rr
    return `M${CX} ${CY - rr}A${rr} ${rr} 0 ${frac > 0.5 ? 1 : 0} 1 ${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return (
    <g fontFamily="Manrope Variable, sans-serif" textAnchor="middle">
      <circle cx={CX} cy={CY} r={r} fill="#050506" />
      <circle cx={CX} cy={CY} r={r - 9} fill="none" stroke="#ffffff" strokeOpacity=".08" strokeWidth="5" />
      <path d={arc(r - 9, 0.72)} fill="none" stroke="#c9ad7c" strokeWidth="5" strokeLinecap="round" />
      <path d={arc(r - 18, 0.62)} fill="none" stroke="#efe9de" strokeWidth="3" strokeLinecap="round" opacity=".8" />
      <text x={CX} y={CY - 32} fontSize="9" fill="#c9ad7c" fontWeight="600" letterSpacing="1">
        {days[now.getDay()]} {String(now.getDate()).padStart(2, '0')}
      </text>
      <text x={CX} y={CY + 16} fontSize="44" fill="#efe9de" fontWeight="300">
        {t}
      </text>
      <text x={CX} y={CY + 40} fontSize="8" fill="#a8a39a">♥ 72 · 9,184 steps</text>
      <text x={CX} y={CY + 58} fontSize="6.5" fill="#c9ad7c" fontWeight="700" letterSpacing="1.4">KAIROS PULSE</text>
    </g>
  )
}

function Mesh({ id }) {
  return (
    <g stroke="#000" strokeOpacity=".3" strokeWidth=".8">
      <path d="M144 -10L256 -10L260 178L140 178Z" fill={`url(#${id('mesh')})`} />
      <path d="M140 462L260 462L256 650L144 650Z" fill={`url(#${id('mesh')})`} />
      <rect x="140" y="560" width="120" height="22" rx="3" fill={`url(#${id('metalV')})`} />
    </g>
  )
}

function Leather({ id, stitch, rubber = false }) {
  if (rubber) {
    const ribs = []
    for (let y = 0; y < 170; y += 12) ribs.push(y)
    for (let y = 476; y < 650; y += 12) ribs.push(y)
    return (
      <g>
        <path d="M144 -10L256 -10L262 178L138 178Z" fill={`url(#${id('leather')})`} />
        <path d="M138 462L262 462L256 650L144 650Z" fill={`url(#${id('leather')})`} />
        <path d={ribs.map((y) => `M156 ${y}H244`).join('')} stroke="#000" strokeOpacity=".35" strokeWidth="3" />
        <path d="M150 -10L154 172M250 -10L246 172M154 468L150 650M246 468L250 650" stroke={stitch} strokeOpacity=".7" strokeWidth="1.2" strokeDasharray="5 4" />
      </g>
    )
  }
  return (
    <g>
      {/* top strap, slightly tapered */}
      <path d="M146 -10L254 -10L262 176L138 176Z" fill={`url(#${id('leather')})`} />
      <path d="M154 -10L160 168M246 -10L240 168" stroke={stitch} strokeOpacity=".55" strokeWidth="1.2" strokeDasharray="5 4" />
      {/* bottom strap */}
      <path d="M138 464L262 464L254 650L146 650Z" fill={`url(#${id('leather')})`} />
      <path d="M160 472L154 650M240 472L246 650" stroke={stitch} strokeOpacity=".55" strokeWidth="1.2" strokeDasharray="5 4" />
      {/* keeper loop */}
      <rect x="140" y="560" width="120" height="16" rx="3" fill={`url(#${id('leather')})`} stroke="#000" strokeOpacity=".35" />
    </g>
  )
}

function Bracelet({ id }) {
  const rows = []
  const linkH = 27
  for (let y = -20; y < 180; y += linkH) rows.push(y)
  for (let y = 462; y < 660; y += linkH) rows.push(y)
  return (
    <g stroke="#000" strokeOpacity=".28" strokeWidth=".8">
      {rows.map((y) => (
        <g key={y}>
          <rect x="140" y={y} width="34" height={linkH - 2} rx="2" fill={`url(#${id('metalV')})`} />
          <rect x="176" y={y} width="48" height={linkH - 2} rx="2" fill={`url(#${id('polish')})`} />
          <rect x="226" y={y} width="34" height={linkH - 2} rx="2" fill={`url(#${id('metalV')})`} />
        </g>
      ))}
    </g>
  )
}

export default memo(WatchSVG)
