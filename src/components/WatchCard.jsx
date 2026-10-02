import WatchSVG from './WatchSVG'
import Photo from './Photo'
import { HeartIcon, ArrowIcon } from './Icons'
import { formatPrice } from '../data/watches'
import { useShop } from '../store'

export default function WatchCard({ watch, index, total = 8, className = '' }) {
  const { wishlist, toggleWish, setDrawer } = useShop()
  const saved = wishlist.includes(watch.id)
  const open = () => setDrawer({ type: 'product', id: watch.id })

  return (
    <article className={`wcard tone-${watch.tone} ${className}`} aria-labelledby={`wc-${watch.id}`} data-reveal>
      <div className="wcard-media" data-cursor="view" onClick={open}>
        {/* campaign photo first; on hover the studio render of the model fades in */}
        <Photo name={watch.id} className="wcard-photo" sizes="(max-width: 1024px) 72vw, 50vw" fallback={null} />
        <div className="wcard-render">
          <span className="wcard-ghost" aria-hidden="true">{watch.short}</span>
          <WatchSVG {...watch.look} title={`${watch.name} studio render`} />
        </div>
        <span className="wcard-hint" aria-hidden="true">Campaign / Render</span>
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
