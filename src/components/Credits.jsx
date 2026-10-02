import { useEffect } from 'react'
import { photos } from '../data/photos'

/*
  ASSETS & CREDITS page (shown at #/credits).
  Every visual on the site (watches, movement, craft close-ups, journal covers,
  logo, favicon) is original SVG drawn in code for this project, so no photo
  or video licences are needed. Third-party code and fonts are listed below.
*/

export const CREDITS = [
  { asset: 'Bodoni Moda (display typeface)', creator: 'Owen Earl (indestructible type*)', source: 'Google Fonts, via Fontsource', license: 'SIL Open Font License 1.1', url: 'https://fonts.google.com/specimen/Bodoni+Moda' },
  { asset: 'Manrope (UI typeface)', creator: 'Mikhail Sharanda', source: 'Google Fonts, via Fontsource', license: 'SIL Open Font License 1.1', url: 'https://fonts.google.com/specimen/Manrope' },
  { asset: 'GSAP + ScrollTrigger', creator: 'GreenSock / Webflow', source: 'npm: gsap', license: 'GSAP Standard License (free)', url: 'https://gsap.com/licensing/' },
  { asset: 'Three.js (3D rendering)', creator: 'three.js authors', source: 'npm: three', license: 'MIT', url: 'https://github.com/mrdoob/three.js' },
  { asset: 'React and React DOM', creator: 'Meta Platforms and contributors', source: 'npm: react', license: 'MIT', url: 'https://github.com/facebook/react' },
  { asset: 'Vite', creator: 'Evan You and contributors', source: 'npm: vite', license: 'MIT', url: 'https://github.com/vitejs/vite' },
  { asset: 'Fontsource packaging', creator: 'Fontsource contributors', source: 'npm: @fontsource-variable', license: 'MIT (fonts keep their own OFL)', url: 'https://fontsource.org/' },
  ...Object.entries(photos).map(([key, p]) => ({
    asset: `Photo: ${p.alt} (${key})`,
    creator: p.creator,
    source: 'Unsplash',
    license: 'Unsplash License (free to use)',
    url: p.page,
  })),
  { asset: 'Watch renders, configurator, movement, craft and blueprint illustrations, logo and favicon', creator: 'KAIROS project author (original work)', source: 'Drawn as SVG in /src/components', license: 'Original, created for this project', url: null },
]

export default function Credits() {
  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Assets & Credits | KAIROS'
    return () => {
      document.title = 'KAIROS | The Moment Matters'
    }
  }, [])

  return (
    <main id="main" className="credits theme-light">
      <div className="credits-inner">
        <a href="#" className="btn-link credits-back">← Back to KAIROS</a>
        <p className="eyebrow">Legal &nbsp;/&nbsp; Resources</p>
        <h1 className="display-l">Assets &amp; Credits</h1>
        <p className="lede">
          KAIROS is a fictional concept brand built for a web development competition. It does not use photography, video or artwork taken from
          any watch brand's website. Campaign photographs are free Unsplash photos, credited below. Every KAIROS product render, including the
          3D watch in the hero, scroll story and configurator, is original: modelled in code with Three.js or drawn in SVG. Fonts and libraries are free and used under their
          licences.
        </p>

        <div className="credits-table-wrap" tabIndex={0} aria-label="Credits table, scrolls sideways on small screens">
          <table className="credits-table">
            <thead>
              <tr>
                <th scope="col">Asset</th>
                <th scope="col">Creator</th>
                <th scope="col">Source</th>
                <th scope="col">License</th>
                <th scope="col">Source URL</th>
              </tr>
            </thead>
            <tbody>
              {CREDITS.map((c) => (
                <tr key={c.asset}>
                  <th scope="row">{c.asset}</th>
                  <td>{c.creator}</td>
                  <td>{c.source}</td>
                  <td>{c.license}</td>
                  <td>{c.url ? <a href={c.url} target="_blank" rel="noreferrer">{c.url.replace('https://', '')}</a> : 'Not applicable'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="credits-legal" aria-label="Legal notes">
          <div>
            <h2>Privacy</h2>
            <p>This concept site has no backend. Forms do not send or store data. Your saved watch configuration lives only in your own browser storage.</p>
          </div>
          <div>
            <h2>Terms</h2>
            <p>KAIROS, its products, prices and studio details are fictional and shown for demonstration only. Nothing here is an offer for sale.</p>
          </div>
          <div>
            <h2>Shipping</h2>
            <p>No products are sold or shipped. The bag and wishlist show how a real store would behave.</p>
          </div>
        </section>
      </div>
    </main>
  )
}
