import { useState } from 'react'
import WatchSVG from './WatchSVG'
import { mediaUrl } from '../lib/media'
import { HeartIcon, ArrowIcon } from './Icons'
import { formatPrice } from '../data/watches'
import { useShop } from '../store'

export default function WatchCard({ watch, index, total = 12, className = '', near = true }) {
  const { wishlist, toggleWish, setDrawer } = useShop()
  const saved = wishlist.includes(watch.id)
  const open = () => setDrawer({ type: 'product', id: watch.id })
  // cover: a render of the 3D model (public/media/<id>-card.webp, transparent
  // background); the drawn SVG is only used if the render cannot load
  const [failed, setFailed] = useState(false)

  return (
    <article className={`wcard tone-${watch.tone} ${className}`} aria-labelledby={`wc-${watch.id}`} data-reveal>
      <div className="wcard-media" data-cursor="view" onClick={open}>
        <div className="wcard-render">
          <span className="wcard-ghost" aria-hidden="true">{watch.short}</span>
          {near &&
            (failed ? (
              <WatchSVG {...watch.look} title={`${watch.name} studio render`} />
            ) : (
              <img
                className="wcard-img"
                src={mediaUrl(`${watch.id}-card.webp`)}
                alt={`${watch.name}, ${watch.category.toLowerCase()}`}
                width="800"
                height="1000"
                loading="lazy"
                decoding="async"
                onError={() => setFailed(true)}
              />
            ))}
        </div>
      </div>

      <div className="wcard-body">
        <div className="wcard-top">
          <span className="wcard-index">{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
          <span className="wcard-cat">{watch.category}</span>
        </div>
        <h3 id={`wc-${watch.id}`} className="wcard-name">{watch.name}</h3>
        <p className="wcard-desc">{watch.description}</p>
        <div className="wcard-foot">
          <span className="wcard-price">{formatPrice(watch.price)}</span>
          <div className="wcard-actions">
            <button
              className={`icon-btn wish ${saved ? 'is-on' : ''}`}
              aria-pressed={saved}
              aria-label={saved ? `Remove ${watch.name} from wishlist` : `Save ${watch.name} to wishlist`}
              onClick={() => toggleWish(watch.id)}
            >
              <HeartIcon filled={saved} />
            </button>
            <button className="btn-link" onClick={open} data-cursor="open" aria-label={`Explore ${watch.name}`}>
              Explore <ArrowIcon />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
