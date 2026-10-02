import { JournalArt } from './Art'
import Photo from './Photo'
import { ArrowIcon } from './Icons'
import { articles } from '../data/journal'
import { useShop } from '../store'

export default function Journal() {
  const { setDrawer } = useShop()
  return (
    <section id="journal" className="section journal theme-light" aria-labelledby="journal-title">
      <header className="section-head journal-head">
        <p className="eyebrow" data-reveal>Chapter VI &nbsp;/&nbsp; Journal</p>
        <h2 id="journal-title" className="display-l" data-split>
          The KAIROS Journal
        </h2>
      </header>

      <ul className="journal-grid">
        {articles.map((a, i) => (
          <li key={a.id} className={`jcard j${i + 1}`} data-reveal>
            <a
              href={`#journal-${a.id}`}
              className="jcard-btn"
              onClick={(e) => {
                e.preventDefault()
                setDrawer({ type: 'article', id: a.id })
              }}
              data-cursor="discover"
            >
              <div className="jcard-media">
                {a.photo ? (
                  <Photo name={a.photo} sizes="(max-width: 1024px) 92vw, 55vw" fallback={<JournalArt kind={a.art} />} className="journal-art" />
                ) : (
                  <JournalArt kind={a.art} />
                )}
              </div>
              <div className="jcard-meta">
                <span className="jcard-cat">{a.category}</span>
                <span>{a.date}</span>
                <span>{a.read}</span>
              </div>
              <h3 className="jcard-title">
                <span>{a.title}</span>
              </h3>
              <p className="jcard-excerpt">{a.excerpt}</p>
              <span className="jcard-more" aria-hidden="true">
                Read the story <ArrowIcon />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
