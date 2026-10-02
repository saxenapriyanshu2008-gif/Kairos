// KAIROS mark: a clock face that spells a K.
// The stem of the K is the 12-to-6 line. The hour hand points between 12 and 3
// and the minute hand between 3 and 6, so together they form the two arms.
// The time it shows is 1:22:30, a real position for both hands, and the gold
// pivot marks "the moment" where the arms meet the stem.

// Hand angles in degrees from 12 o'clock (clockwise)
export const LOGO_TIME = { hour: 41.25, minute: 135 }

const C = 16
const pt = (deg, len) => {
  const a = (deg * Math.PI) / 180
  return [(C + Math.sin(a) * len).toFixed(2), (C - Math.cos(a) * len).toFixed(2)]
}

export function LogoMark({ size = 22, className = '' }) {
  const [hx, hy] = pt(LOGO_TIME.hour, 8.4)
  const [mx, my] = pt(LOGO_TIME.minute, 10.4)
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={`logo-mark ${className}`} aria-hidden="true">
      <circle cx="16" cy="16" r="13.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      {/* stem of the K: the 12 to 6 line */}
      <path d="M16 6.2V25.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      {/* hour hand: between 12 and 3 */}
      <path d={`M16 16L${hx} ${hy}`} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      {/* minute hand: between 3 and 6 */}
      <path d={`M16 16L${mx} ${my}`} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16" cy="16" r="1.9" fill="var(--gold)" />
    </svg>
  )
}

export default function Logo({ withMark = true, className = '' }) {
  return (
    <span className={`logo ${className}`}>
      {withMark && <LogoMark />}
      <span className="logo-word">KAIROS</span>
    </span>
  )
}
