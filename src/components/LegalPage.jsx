import { useEffect } from 'react'
import { legalPages, getLegal, LEGAL_UPDATED } from '../data/legal'
import { linkTo } from '../lib/router'

/*
  One template for every legal page (#/legal/<slug>).
  Left: links to the other legal pages and Assets & Credits.
  Right: the page, with a short contents list that jumps to each section.
*/
export default function LegalPage({ slug }) {
  const page = getLegal(slug) || legalPages[0]

  useEffect(() => {
    document.title = `${page.title} | KAIROS`
    return () => {
      document.title = 'KAIROS | The Moment Matters'
    }
  }, [page.title])

  const jump = (e, id) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main id="main" className="credits legal theme-light">
      <div className="legal-inner">
        <aside className="legal-side">
          <a href="#" className="btn-link credits-back" onClick={linkTo('')}>
            ← Back to KAIROS
          </a>
          <nav aria-label="Legal pages">
            <p className="eyebrow">Legal</p>
            <ul>
              {legalPages.map((p) => (
                <li key={p.slug}>
                  <a href={`#/legal/${p.slug}`} onClick={linkTo(`legal/${p.slug}`)} aria-current={p.slug === page.slug ? 'page' : undefined}>
                    {p.title}
                  </a>
                </li>
              ))}
              <li>
                <a href="#/credits" onClick={linkTo('credits')}>
                  Assets &amp; Credits
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        <article className="legal-body">
          <p className="eyebrow">Legal &nbsp;/&nbsp; {page.short}</p>
          <h1 className="display-l">{page.title}</h1>
          <p className="legal-updated">Last updated {LEGAL_UPDATED}</p>
          <p className="lede">{page.intro}</p>

          <nav className="legal-toc" aria-label="On this page">
            <ol>
              {page.sections.map((s, i) => (
                <li key={s.h}>
                  <a href={`#s-${i}`} onClick={(e) => jump(e, `${page.slug}-s-${i}`)}>
                    {s.h}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {page.sections.map((s, i) => (
            <section key={s.h} id={`${page.slug}-s-${i}`} className="legal-section" aria-labelledby={`${page.slug}-h-${i}`}>
              <h2 id={`${page.slug}-h-${i}`}>
                <span>{String(i + 1).padStart(2, '0')}</span> {s.h}
              </h2>
              {s.p?.map((t) => <p key={t}>{t}</p>)}
              {s.list && (
                <ul>
                  {s.list.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <p className="legal-note">
            KAIROS is a concept brand made for a web development competition. These pages show how a real watch store would handle each topic.
            They are not legal advice.
          </p>
        </article>
      </div>
    </main>
  )
}
