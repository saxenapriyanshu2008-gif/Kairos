import { CraftArt } from './Art'

const BASE = import.meta.env.BASE_URL

/*
  Craft: four close-ups rendered from our own 3D watch (tools/render-pulse.py),
  shown as clean catalogue images with the caption underneath.
  The old SVG drawings stay only as a fallback if an image fails to load.
*/

const ITEMS = [
  {
    kind: 'sapphire',
    alt: 'Close-up of a sapphire crystal over a midnight-blue sunray dial, catching the light',
    title: 'Sapphire Crystal',
    line: 'Clarity designed to last.',
    detail: 'Synthetic sapphire, 9 on the Mohs scale, with anti-reflective coating on the inside so the dial reads clearly at any angle.',
  },
  {
    kind: 'steel',
    alt: 'Close-up of a brushed and polished 316L steel case and screw-down crown',
    title: '316L Steel',
    line: 'Precision-machined and carefully finished.',
    detail: 'A low-carbon steel chosen for corrosion resistance. Each case alternates brushed flanks with a polished bevel.',
  },
  {
    kind: 'movement',
    alt: 'Close-up of the K-01 movement: gilt wheels, ruby jewels, blued screws and the balance wheel',
    title: 'Automatic Movement',
    line: 'Mechanical engineering at the heart of every KAIROS.',
    detail: 'Calibre K-01: 28,800 vibrations per hour, 25 jewels and a 42-hour power reserve, wound by the motion of your wrist.',
  },
  {
    kind: 'hand',
    alt: 'Close-up of hand-polished gold hands over a black sunray dial',
    title: 'Hand-Finished Details',
    line: 'Small refinements that reveal themselves over time.',
    detail: 'Perlage on the main plate, heat-blued screws and diamond-cut hands, finished by hand and almost never seen.',
  },
]

export default function Craftsmanship() {
  return (
    <section id="craft" className="section craft theme-light" aria-labelledby="craft-title">
      <header className="section-head craft-head">
        <p className="eyebrow" data-reveal>Chapter IV &nbsp;/&nbsp; Craft</p>
        <h2 id="craft-title" className="display-l" data-split>
          Details that deserve <em>a closer look.</em>
        </h2>
      </header>

      <ul className="craft-grid">
        {ITEMS.map((it, i) => (
          <li key={it.kind} className="craft-card" data-reveal>
            <figure aria-labelledby={`craft-${it.kind}`}>
              <div className="craft-media" data-reveal-img>
                <img
                  className="craft-img"
                  src={`${BASE}media/craft-${it.kind}.webp`}
                  alt={it.alt}
                  loading="lazy"
                  decoding="async"
                  width="900"
                  height="1200"
                  onError={(e) => e.currentTarget.parentElement.classList.add('is-fallback')}
                />
                <div className="craft-fallback" aria-hidden="true">
                  <CraftArt kind={it.kind} />
                </div>
              </div>
              <figcaption className="craft-info">
                <span className="craft-num">0{i + 1}</span>
                <h3 id={`craft-${it.kind}`}>{it.title}</h3>
                <p className="craft-line">{it.line}</p>
                <p className="craft-detail">{it.detail}</p>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  )
}
