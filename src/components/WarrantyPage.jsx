import { useEffect } from 'react'
import { linkTo, navigate } from '../lib/router'
import { WARRANTY_UPDATED, highlights, covered, notCovered, components, steps, needs, notes, faqs } from '../data/warranty'

import { mediaUrl } from '../lib/media'

/*
  WARRANTY page (#/warranty).
  Dark hero with a warranty seal and the caseback render, then the coverage
  (covered / not covered), a component table, how to claim, what you need,
  care notes and FAQs. Content lives in src/data/warranty.js.
*/

function Seal() {
  const text = 'TWO-YEAR INTERNATIONAL WARRANTY · KAIROS · '
  return (
    <svg className="wty-seal" viewBox="0 0 200 200" role="img" aria-label="Two-year international warranty seal">
      <defs>
        <path id="wty-arc" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
      </defs>
      <circle cx="100" cy="100" r="96" className="wty-seal-ring" />
      <circle cx="100" cy="100" r="62" className="wty-seal-ring" />
      <text className="wty-seal-arc">
        <textPath href="#wty-arc" textLength="486">{text}</textPath>
      </text>
      <text x="100" y="112" textAnchor="middle" className="wty-seal-num">2</text>
      <text x="100" y="136" textAnchor="middle" className="wty-seal-unit">YEARS</text>
    </svg>
  )
}

const Check = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true" className="wty-ico wty-ico-yes"><path d="M5 10.5l3.2 3.2L15 6.5" /></svg>
)
const Cross = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true" className="wty-ico wty-ico-no"><path d="M6 6l8 8M14 6l-8 8" /></svg>
)

export default function WarrantyPage() {
  useEffect(() => {
    document.title = 'Warranty | KAIROS'
    return () => {
      document.title = 'KAIROS | The Moment Matters'
    }
  }, [])

  // go to the contact form on the home page, with a claim message ready to fill in
  const startClaim = (e) => {
    e.preventDefault()
    navigate('')
    const text = 'Warranty claim\nModel: \nSerial number (on the caseback): \nDate of purchase: \nWhat is wrong with the watch: '
    let tries = 0
    const t = setInterval(() => {
      const el = document.getElementById('contact')
      if (el || ++tries > 40) {
        clearInterval(t)
        if (!el) return
        window.dispatchEvent(new CustomEvent('kairos:prefill', { detail: text }))
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  return (
    <main id="main" className="wty">
      <section className="wty-hero" aria-labelledby="wty-title">
        <div className="wty-hero-inner">
          <div className="wty-hero-copy">
            <a href="#" className="btn-link wty-back" onClick={linkTo('')}>
              ← Back to KAIROS
            </a>
            <p className="eyebrow">
              <span className="dot" /> Client service &nbsp;/&nbsp; Warranty
            </p>
            <h1 id="wty-title" className="display-l">
              Two years.
              <br />
              <em>Every KAIROS.</em>
            </h1>
            <p className="lede">
              Every KAIROS watch comes with a two-year international warranty against defects in materials and workmanship. If something is
              not right, we repair it, or replace it, at no cost to you.
            </p>
            <div className="wty-hero-actions">
              <a href="#contact" className="btn btn-solid" onClick={startClaim} data-cursor="open">
                <span>Start a warranty claim</span>
              </a>
              <a href="#wty-covered" className="btn btn-ghost" onClick={(e) => (e.preventDefault(), document.getElementById('wty-covered')?.scrollIntoView({ behavior: 'smooth' }))} data-cursor="open">
                <span>What is covered</span>
              </a>
            </div>
          </div>
          <div className="wty-hero-visual">
            <img src={mediaUrl('warranty-back.webp')} alt="The caseback of a KAIROS ARC, engraved with its serial number and the founder's signature" width="1100" height="1100" />
            <Seal />
          </div>
        </div>

        <dl className="wty-highlights">
          {highlights.map((h) => (
            <div key={h.k}>
              <dt>{h.k}</dt>
              <dd>{h.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="wty-body theme-light">
        <section id="wty-covered" className="wty-section" aria-labelledby="wty-cov-title">
          <header className="wty-head">
            <p className="eyebrow">01 &nbsp;/&nbsp; Coverage</p>
            <h2 id="wty-cov-title" className="display-m">What the warranty covers</h2>
          </header>
          <div className="wty-cover">
            <div className="wty-card wty-card-yes">
              <h3>
                <Check /> Covered
              </h3>
              <ul>
                {covered.map((c) => (
                  <li key={c}>
                    <Check />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="wty-card wty-card-no">
              <h3>
                <Cross /> Not covered
              </h3>
              <ul>
                {notCovered.map((c) => (
                  <li key={c}>
                    <Cross />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="wty-section" aria-labelledby="wty-parts-title">
          <header className="wty-head">
            <p className="eyebrow">02 &nbsp;/&nbsp; Part by part</p>
            <h2 id="wty-parts-title" className="display-m">Coverage at a glance</h2>
          </header>
          <div className="wty-table-wrap">
            <table className="wty-table">
              <thead>
                <tr>
                  <th scope="col">Part</th>
                  <th scope="col">Includes</th>
                  <th scope="col">Covered for</th>
                </tr>
              </thead>
              <tbody>
                {components.map(([p, i, d]) => (
                  <tr key={p}>
                    <th scope="row">{p}</th>
                    <td>{i}</td>
                    <td>
                      <span className={`wty-pill ${d.startsWith('24') ? '' : 'is-short'}`}>{d}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="wty-section" aria-labelledby="wty-claim-title">
          <header className="wty-head">
            <p className="eyebrow">03 &nbsp;/&nbsp; Claims</p>
            <h2 id="wty-claim-title" className="display-m">How to make a claim</h2>
          </header>
          <ol className="wty-steps">
            {steps.map((s, i) => (
              <li key={s.t}>
                <span className="wty-step-no">{String(i + 1).padStart(2, '0')}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="wty-needs">
            <h3>What you need</h3>
            <dl>
              {needs.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="wty-section" aria-labelledby="wty-notes-title">
          <header className="wty-head">
            <p className="eyebrow">04 &nbsp;/&nbsp; Good to know</p>
            <h2 id="wty-notes-title" className="display-m">Important notes</h2>
          </header>
          <div className="wty-notes">
            {notes.map(([t, d]) => (
              <article key={t}>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="wty-section" aria-labelledby="wty-faq-title">
          <header className="wty-head">
            <p className="eyebrow">05 &nbsp;/&nbsp; Questions</p>
            <h2 id="wty-faq-title" className="display-m">Frequently asked</h2>
          </header>
          <div className="wty-faq">
            {faqs.map(([q, a]) => (
              <details key={q}>
                <summary>
                  <span>{q}</span>
                  <i aria-hidden="true" />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="wty-cta" aria-label="Contact client service">
          <div>
            <h2 className="display-m">Need help with your watch?</h2>
            <p>Our client service team replies within one working day.</p>
          </div>
          <a href="#contact" className="btn btn-solid" onClick={startClaim} data-cursor="open">
            <span>Contact client service</span>
          </a>
        </section>

        <p className="wty-legal">
          Last updated {WARRANTY_UPDATED}. This warranty is in addition to your rights under consumer law, which it does not limit. KAIROS is a
          concept brand made for a web development competition, so this page shows how a real KAIROS warranty would work. It is not a legal
          document.
        </p>
      </div>
    </main>
  )
}
