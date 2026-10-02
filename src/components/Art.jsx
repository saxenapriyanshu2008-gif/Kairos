import { memo, useId } from 'react'

/*
  Original illustrations drawn in SVG.
  - MovementSVG   : the K-01 calibre seen through an exhibition caseback
  - CraftArt      : four "macro" close-ups for the craftsmanship cards
  - JournalArt    : editorial covers for the journal cards
*/

const C = 200 // centre of 400x400 artboards

function gearPath(cx, cy, r, teeth, depth = 4) {
  let d = ''
  const steps = teeth * 2
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const rr = i % 2 === 0 ? r : r - depth
    const x = cx + Math.cos(a) * rr
    const y = cy + Math.sin(a) * rr
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1)
  }
  return d + 'Z'
}

function stripes(gap = 9) {
  // Côtes de Genève: diagonal stripes across the plate
  let d = ''
  for (let x = -400; x < 800; x += gap) d += `M${x} 0L${x + 400} 400`
  return d
}

function perlage(cx, cy, w, h, step = 14) {
  const out = []
  for (let y = cy; y < cy + h; y += step * 0.8)
    for (let x = cx + ((y / step) % 2 ? step / 2 : 0); x < cx + w; x += step) out.push([x, y])
  return out
}

export const MovementSVG = memo(function MovementSVG({ className = '', animate = true }) {
  const u = useId().replace(/:/g, '')
  const id = (n) => `${u}-${n}`
  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-label="The KAIROS K-01 automatic movement, seen through the caseback">
      <defs>
        <radialGradient id={id('plate')} cx=".4" cy=".35" r=".8">
          <stop offset="0" stopColor="#d9d8d3" />
          <stop offset=".6" stopColor="#8e8d88" />
          <stop offset="1" stopColor="#3d3c39" />
        </radialGradient>
        <linearGradient id={id('bridge')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#efeee9" />
          <stop offset=".5" stopColor="#9c9b96" />
          <stop offset="1" stopColor="#d7d6d1" />
        </linearGradient>
        <linearGradient id={id('rotor')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2deb6" />
          <stop offset=".5" stopColor="#a3865a" />
          <stop offset="1" stopColor="#e2c899" />
        </linearGradient>
        <linearGradient id={id('wheel')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2deb6" />
          <stop offset="1" stopColor="#9d7f50" />
        </linearGradient>
        <clipPath id={id('clip')}>
          <circle cx={C} cy={C} r="176" />
        </clipPath>
      </defs>

      <circle cx={C} cy={C} r="196" fill="#1a1918" />
      <circle cx={C} cy={C} r="188" fill="none" stroke="#6d6c68" strokeWidth="6" />
      <g clipPath={`url(#${id('clip')})`}>
        <circle cx={C} cy={C} r="176" fill={`url(#${id('plate')})`} />
        <path d={stripes()} stroke="#ffffff" strokeOpacity=".09" strokeWidth="4" />

        {/* gear train */}
        <g className={animate ? 'spin-slow' : ''} style={{ transformOrigin: '150px 150px' }}>
          <path d={gearPath(150, 150, 46, 40, 3)} fill={`url(#${id('wheel')})`} />
          <circle cx="150" cy="150" r="32" fill="#5c5040" opacity=".35" />
          <path d="M150 118V182M118 150H182" stroke={`url(#${id('wheel')})`} strokeWidth="6" />
        </g>
        <g className={animate ? 'spin-rev' : ''} style={{ transformOrigin: '228px 120px' }}>
          <path d={gearPath(228, 120, 30, 28, 3)} fill={`url(#${id('wheel')})`} />
          <circle cx="228" cy="120" r="19" fill="#5c5040" opacity=".35" />
        </g>
        <g className={animate ? 'spin-slow' : ''} style={{ transformOrigin: '120px 238px' }}>
          <path d={gearPath(120, 238, 26, 24, 3)} fill={`url(#${id('wheel')})`} />
        </g>

        {/* bridges with polished bevel */}
        <path d="M60 300C110 250 170 230 230 236C260 240 290 260 300 300L280 340C240 300 190 290 140 310Z" fill={`url(#${id('bridge')})`} stroke="#ffffff" strokeOpacity=".7" strokeWidth="1.5" />
        <path d="M250 60C300 80 340 130 344 190L300 200C292 160 270 128 240 110Z" fill={`url(#${id('bridge')})`} stroke="#ffffff" strokeOpacity=".7" strokeWidth="1.5" />
        <path d={stripes(10)} stroke="#000" strokeOpacity=".05" strokeWidth="3" clipPath={`url(#${id('clip')})`} />

        {/* balance wheel */}
        <g className={animate ? 'balance' : ''} style={{ transformOrigin: '284px 262px' }}>
          <circle cx="284" cy="262" r="40" fill="none" stroke={`url(#${id('wheel')})`} strokeWidth="6" />
          <path d="M244 262H324M284 222V302" stroke={`url(#${id('wheel')})`} strokeWidth="3" />
          <path d="M284 262m-22 0a22 22 0 1 0 44 0a22 22 0 1 0 -44 0" fill="none" stroke="#2b4f8f" strokeWidth="1.2" opacity=".8" />
        </g>
        <path d="M250 228L318 296" stroke={`url(#${id('bridge')})`} strokeWidth="14" strokeLinecap="round" />

        {/* jewels and blued screws */}
        {[[150, 150], [228, 120], [120, 238], [284, 262], [200, 270], [310, 160]].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="5.5" fill="#d8d6cf" />
            <circle cx={x} cy={y} r="3.6" fill="#9b1b30" />
            <circle cx={x - 1} cy={y - 1} r="1.1" fill="#ffb3c0" />
          </g>
        ))}
        {[[96, 300], [262, 318], [322, 182], [262, 90]].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="7" fill="#1f3c74" stroke="#d8d6cf" strokeWidth="1.5" />
            <path d={`M${x - 5} ${y - 2}L${x + 5} ${y + 2}`} stroke="#0b1530" strokeWidth="1.6" />
          </g>
        ))}

        {/* rotor, half visible */}
        <g className={animate ? 'rotor' : ''} style={{ transformOrigin: '200px 200px' }}>
          <path d="M200 200L36 140A176 176 0 0 1 120 46Z" fill={`url(#${id('rotor')})`} opacity=".92" />
          <circle cx="200" cy="200" r="16" fill={`url(#${id('rotor')})`} stroke="#5f4b2c" />
          <text x="100" y="118" fontSize="9" letterSpacing="2.4" fill="#4a3a20" fontFamily="Manrope Variable, sans-serif" fontWeight="700" transform="rotate(-38 100 118)">
            KAIROS · K-01
          </text>
        </g>
      </g>
    </svg>
  )
})

/* ---------------- Craftsmanship macros ---------------- */

export const CraftArt = memo(function CraftArt({ kind }) {
  const u = useId().replace(/:/g, '')
  const id = (n) => `${u}-${n}`
  const common = { viewBox: '0 0 400 500', preserveAspectRatio: 'xMidYMid slice', className: 'craft-art', 'aria-hidden': true }

  if (kind === 'sapphire') {
    return (
      <svg {...common}>
        <defs>
          <radialGradient id={id('g')} cx=".35" cy=".3" r=".9">
            <stop offset="0" stopColor="#3a4258" />
            <stop offset=".6" stopColor="#11141c" />
            <stop offset="1" stopColor="#050608" />
          </radialGradient>
          <linearGradient id={id('prism')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#c9ad7c" stopOpacity="0" />
            <stop offset=".4" stopColor="#efe9de" stopOpacity=".5" />
            <stop offset=".6" stopColor="#9fb6dd" stopOpacity=".35" />
            <stop offset="1" stopColor="#c9ad7c" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="400" height="500" fill={`url(#${id('g')})`} />
        {[260, 230, 200, 170, 140].map((r, i) => (
          <circle key={r} cx="250" cy="300" r={r} fill="none" stroke="#efe9de" strokeOpacity={0.05 + i * 0.03} strokeWidth="1" />
        ))}
        <circle cx="250" cy="300" r="200" fill="none" stroke="#efe9de" strokeOpacity=".5" strokeWidth="2.5" />
        <path d="M70 230A200 200 0 0 1 180 115" stroke={`url(#${id('prism')})`} strokeWidth="26" fill="none" strokeLinecap="round" />
        <path d="M110 330A150 150 0 0 1 150 190" stroke="#fff" strokeOpacity=".25" strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="150" cy="160" rx="70" ry="22" fill="#fff" opacity=".08" transform="rotate(-35 150 160)" />
      </svg>
    )
  }

  if (kind === 'steel') {
    let brushed = ''
    for (let y = 0; y < 500; y += 3) brushed += `M0 ${y}L400 ${y + 40}`
    return (
      <svg {...common}>
        <defs>
          <linearGradient id={id('m')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f2f2ef" />
            <stop offset=".35" stopColor="#8d8d8a" />
            <stop offset=".55" stopColor="#e2e2de" />
            <stop offset="1" stopColor="#4a4a47" />
          </linearGradient>
        </defs>
        <rect width="400" height="500" fill="#151514" />
        <path d="M-40 520C40 300 180 160 440 90L440 520Z" fill={`url(#${id('m')})`} />
        <path d={brushed} stroke="#000" strokeOpacity=".06" strokeWidth="1" />
        <path d="M-40 520C40 300 180 160 440 90" stroke="#fff" strokeOpacity=".9" strokeWidth="3" fill="none" />
        <path d="M-40 560C60 360 200 230 440 170" stroke="#fff" strokeOpacity=".2" strokeWidth="1.5" fill="none" />
        <text x="250" y="440" fontSize="15" letterSpacing="5" fill="#2a2927" fontFamily="Manrope Variable, sans-serif" fontWeight="700" opacity=".6">316L</text>
      </svg>
    )
  }

  if (kind === 'movement') {
    return (
      <svg {...common} viewBox="60 40 300 375">
        <rect x="0" y="0" width="400" height="500" fill="#151514" />
        <g>
          <MovementInner id={id} />
        </g>
      </svg>
    )
  }

  // hand-finished: perlage + bevelled hand
  const dots = perlage(-10, -10, 430, 530, 22)
  return (
    <svg {...common}>
      <defs>
        <radialGradient id={id('p')} cx=".4" cy=".4" r=".6">
          <stop offset="0" stopColor="#f0efea" />
          <stop offset=".7" stopColor="#a5a49f" />
          <stop offset="1" stopColor="#6f6e6a" />
        </radialGradient>
        <linearGradient id={id('hand')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7a6240" />
          <stop offset=".48" stopColor="#f3e3c3" />
          <stop offset=".52" stopColor="#9a7f52" />
          <stop offset="1" stopColor="#e2c899" />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="#7d7c78" />
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="14" fill={`url(#${id('p')})`} stroke="#5d5c58" strokeOpacity=".4" />
      ))}
      <path d="M80 470L180 70L204 60L214 84L120 480Z" fill={`url(#${id('hand')})`} stroke="#4e3d22" strokeWidth="1" />
      <circle cx="96" cy="470" r="30" fill={`url(#${id('hand')})`} stroke="#4e3d22" />
      <circle cx="96" cy="470" r="9" fill="#9b1b30" />
    </svg>
  )
})

// Re-usable inner movement for the craft close-up (no outer ring)
function MovementInner({ id }) {
  return (
    <>
      <defs>
        <linearGradient id={id('w')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2deb6" />
          <stop offset="1" stopColor="#9d7f50" />
        </linearGradient>
        <radialGradient id={id('pl')} cx=".4" cy=".35" r=".8">
          <stop offset="0" stopColor="#d9d8d3" />
          <stop offset="1" stopColor="#4a4946" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="400" height="500" fill={`url(#${id('pl')})`} />
      <path d={stripes(12)} stroke="#fff" strokeOpacity=".1" strokeWidth="5" />
      <g className="spin-slow" style={{ transformOrigin: '170px 170px' }}>
        <path d={gearPath(170, 170, 70, 54, 4)} fill={`url(#${id('w')})`} />
        <circle cx="170" cy="170" r="50" fill="#5c5040" opacity=".35" />
        <path d="M170 120V220M120 170H220" stroke={`url(#${id('w')})`} strokeWidth="8" />
      </g>
      <g className="balance" style={{ transformOrigin: '270px 320px' }}>
        <circle cx="270" cy="320" r="56" fill="none" stroke={`url(#${id('w')})`} strokeWidth="8" />
        <path d="M214 320H326M270 264V376" stroke={`url(#${id('w')})`} strokeWidth="4" />
      </g>
      <circle cx="170" cy="170" r="8" fill="#d8d6cf" />
      <circle cx="170" cy="170" r="5.5" fill="#9b1b30" />
      <circle cx="270" cy="320" r="8" fill="#d8d6cf" />
      <circle cx="270" cy="320" r="5.5" fill="#9b1b30" />
      <circle cx="110" cy="330" r="10" fill="#1f3c74" stroke="#d8d6cf" strokeWidth="2" />
      <path d="M103 327L117 333" stroke="#0b1530" strokeWidth="2" />
    </>
  )
}

/* ---------------- Journal covers ---------------- */

export const JournalArt = memo(function JournalArt({ kind }) {
  const u = useId().replace(/:/g, '')
  const id = (n) => `${u}-${n}`
  const line = { fill: 'none', stroke: '#efe9de', strokeWidth: 1 }

  return (
    <svg viewBox="0 0 600 420" preserveAspectRatio="xMidYMid slice" className="journal-art" aria-hidden="true">
      <defs>
        <radialGradient id={id('bg')} cx=".65" cy=".4" r=".9">
          <stop offset="0" stopColor={kind === 'wrist' ? '#5a4632' : kind === 'gear' ? '#3b3a37' : '#2a3242'} />
          <stop offset="1" stopColor="#0c0b0a" />
        </radialGradient>
        <pattern id={id('grid')} width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="#efe9de" strokeOpacity=".07" />
        </pattern>
      </defs>
      <rect width="600" height="420" fill={`url(#${id('bg')})`} />

      {kind === 'anatomy' && (
        <g>
          {/* exploded view: crystal, bezel, dial, movement, caseback */}
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i} transform={`translate(${150 + i * 58} ${310 - i * 48})`}>
              <ellipse rx="96" ry="30" {...line} strokeOpacity={0.35 + i * 0.12} />
              <ellipse rx="96" ry="30" fill="#efe9de" opacity={0.02 + i * 0.012} />
            </g>
          ))}
          <path d="M150 310L382 118" {...line} strokeDasharray="3 5" strokeOpacity=".4" />
          {['CASEBACK', 'MOVEMENT', 'DIAL', 'BEZEL', 'CRYSTAL'].map((t, i) => (
            <text key={t} x={252 + i * 58 + 8} y={314 - i * 48} fontSize="10" letterSpacing="2.5" fill="#c9ad7c" fontFamily="Manrope Variable, sans-serif" fontWeight="600">
              {t}
            </text>
          ))}
        </g>
      )}

      {kind === 'gear' && (
        <g>
          <path d={gearPath(300, 210, 150, 60, 8)} fill="none" stroke="#c9ad7c" strokeOpacity=".75" strokeWidth="1.5" />
          <path d={gearPath(300, 210, 120, 48, 6)} fill="none" stroke="#efe9de" strokeOpacity=".2" />
          <path d={gearPath(470, 90, 60, 24, 6)} fill="none" stroke="#efe9de" strokeOpacity=".5" strokeWidth="1.2" />
          <path d="M300 60V360M150 210H450M194 104L406 316M406 104L194 316" stroke="#efe9de" strokeOpacity=".15" />
          <circle cx="300" cy="210" r="16" fill="#9b1b30" />
          <circle cx="300" cy="210" r="30" {...line} strokeOpacity=".6" />
        </g>
      )}

      {kind === 'wrist' && (
        <g>
          {/* abstract wrist line with a watch resting on it */}
          <path d="M-20 330C120 280 240 260 360 268C460 274 540 300 640 340L640 440L-20 440Z" fill="#1b1612" />
          <path d="M-20 330C120 280 240 260 360 268C460 274 540 300 640 340" fill="none" stroke="#c9ad7c" strokeOpacity=".6" />
          <rect x="262" y="120" width="96" height="160" rx="10" fill="#14110e" />
          <circle cx="310" cy="200" r="64" fill="#efe9de" />
          <circle cx="310" cy="200" r="54" fill="#f8f4ec" stroke="#b7b2a6" />
          <path d="M310 200L310 158M310 200L342 214" stroke="#1d1c1a" strokeWidth="4" strokeLinecap="round" />
          <circle cx="310" cy="200" r="4" fill="#c9ad7c" />
          <circle cx="470" cy="110" r="90" fill="#c9ad7c" opacity=".08" />
        </g>
      )}

      {kind === 'blueprint' && (
        <g>
          <rect width="600" height="420" fill={`url(#${id('grid')})`} />
          <circle cx="300" cy="210" r="140" {...line} strokeOpacity=".7" />
          <circle cx="300" cy="210" r="112" {...line} strokeOpacity=".4" strokeDasharray="4 4" />
          <path d="M300 50V370M140 210H460" {...line} strokeOpacity=".3" />
          <path d="M160 384H440M160 378V390M440 378V390" {...line} stroke="#c9ad7c" />
          <text x="300" y="404" textAnchor="middle" fontSize="11" letterSpacing="3" fill="#c9ad7c" fontFamily="Manrope Variable, sans-serif">Ø 39.00 MM</text>
          <path d="M300 210L300 112M300 210L372 248" stroke="#efe9de" strokeWidth="2" />
          <rect x="440" y="196" width="22" height="28" {...line} />
          <text x="40" y="44" fontSize="10" letterSpacing="2.5" fill="#efe9de" opacity=".6" fontFamily="Manrope Variable, sans-serif">KRS / ARC / DWG 0147</text>
        </g>
      )}
    </svg>
  )
})
