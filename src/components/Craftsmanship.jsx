import { CraftArt } from './Art'
import Photo from './Photo'

const ITEMS = [
  {
    kind: 'sapphire',
    title: 'Sapphire Crystal',
    line: 'Clarity designed to last.',
    detail: 'Synthetic sapphire, 9 on the Mohs scale, with anti-reflective coating on the inside so the dial reads clearly at any angle.',
  },
  {
    kind: 'steel',
    title: '316L Steel',
    line: 'Precision-machined and carefully finished.',
    detail: 'A low-carbon steel chosen for corrosion resistance. Each case alternates brushed flanks with a polished bevel.',
  },
  {
    kind: 'movement',
    photo: 'gears',
    title: 'Automatic Movement',
    line: 'Mechanical engineering at the heart of every KAIROS.',
    detail: 'Calibre K-01: 28,800 vibrations per hour, 25 jewels and a 42-hour power reserve, wound by the motion of your wrist.',
  },
  {
    kind: 'hand',
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
          <li key={it.kind} className={`craft-card k${i + 1}`} data-reveal>
            {/* tabIndex lets keyboard users reveal the detail panel too */}
            <article tabIndex={0} aria-labelledby={`craft-${it.kind}`} data-cursor="discover">
              <div className="craft-media" data-reveal-img>
                {it.photo ? (
                  <Photo name={it.photo} className="craft-art" sizes="(max-width: 768px) 92vw, 25vw" fallback={<CraftArt kind={it.kind} />} />
                ) : (
                  <CraftArt kind={it.kind} />
                )}
              </div>
              <div className="craft-info">
                <span className="craft-num">0{i + 1}</span>
                <h3 id={`craft-${it.kind}`}>{it.title}</h3>
                <p className="craft-line">{it.line}</p>
                <p className="craft-detail">{it.detail}</p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
