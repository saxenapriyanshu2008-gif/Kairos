import { useRef, useState } from 'react'
import WatchCard from './WatchCard'
import { watches } from '../data/watches'

/*
  Editorial, asymmetric layout on desktop (cards of different sizes and offsets).
  On tablets and phones it becomes a horizontal, snap-scrolling rail.
*/
export default function Collection() {
  const rail = useRef(null)
  const [progress, setProgress] = useState(0)

  const onScroll = () => {
    const el = rail.current
    const max = el.scrollWidth - el.clientWidth
    setProgress(max > 0 ? el.scrollLeft / max : 0)
  }

  return (
    <section id="collection" className="section collection theme-light" aria-labelledby="collection-title">
      <header className="section-head">
        <p className="eyebrow" data-reveal>Chapter II &nbsp;/&nbsp; Four models</p>
        <h2 id="collection-title" className="display-l" data-split>
          The Collection
        </h2>
        <p className="lede" data-reveal>Four interpretations of time. One KAIROS philosophy.</p>
      </header>

      <div className="coll-grid" ref={rail} onScroll={onScroll} tabIndex={0} aria-label="KAIROS models, scroll sideways on small screens">
        {watches.map((w, i) => (
          <WatchCard key={w.id} watch={w} index={i} className={`c${i + 1}`} />
        ))}
      </div>
      <div className="coll-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${0.25 + progress * 0.75})` }} />
      </div>
    </section>
  )
}
