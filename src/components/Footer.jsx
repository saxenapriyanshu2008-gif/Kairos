import { useState } from 'react'
import Logo from './Logo'
import LineLogo from './LineLogo'
import { scrollToId } from '../store'
import { legalPages } from '../data/legal'
import { linkTo } from '../lib/router'

const LINKS = [
  ['collection', 'Collection'],
  ['craft', 'Craft'],
  ['story', 'The Story'],
  ['journal', 'Journal'],
  ['contact', 'Contact'],
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState(null) // null | 'error' | 'ok'

  const subscribe = (e) => {
    e.preventDefault()
    setState(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) ? 'ok' : 'error')
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) setEmail('')
  }

  const go = (e, id) => {
    e.preventDefault()
    scrollToId(id)
  }

  return (
    <footer className="footer theme-dark">
      <div className="footer-top">
        <div className="footer-brand">
          <Logo />
          <p className="footer-tag">The moment matters.</p>
        </div>

        <form className="newsletter" onSubmit={subscribe} noValidate>
          <label htmlFor="nl-email" className="newsletter-title">A moment worth knowing.</label>
          <p className="newsletter-sub">New models, journal stories and studio events. Rarely, and only when it matters.</p>
          <div className="newsletter-row">
            <input
              id="nl-email"
              type="email"
              placeholder="Your email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setState(null) }}
              aria-invalid={state === 'error'}
              aria-describedby="nl-status"
            />
            <button type="submit" className="btn btn-solid" data-cursor="open">
              <span>Subscribe</span>
            </button>
          </div>
          <p id="nl-status" className="newsletter-status" role="status" aria-live="polite">
            {state === 'error' && 'Please enter a valid email address.'}
            {state === 'ok' && 'Thank you. (Concept site: no email was stored.)'}
          </p>
        </form>
      </div>

      <div className="footer-cols">
        <nav aria-label="Footer">
          <h3>Explore</h3>
          <ul>
            {LINKS.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} onClick={(e) => go(e, id)}>{label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h3>Legal</h3>
          <ul>
            {legalPages.map((p) => (
              <li key={p.slug}>
                <a href={`#/legal/${p.slug}`} onClick={linkTo(`legal/${p.slug}`)}>{p.title}</a>
              </li>
            ))}
            <li><a href="#/credits" onClick={linkTo('credits')}>Assets &amp; Credits</a></li>
          </ul>
        </div>
        <div>
          <h3>Social</h3>
          <ul>
            <li><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram <span className="sr-only">(opens in new tab)</span></a></li>
            <li><a href="https://www.youtube.com/" target="_blank" rel="noreferrer">YouTube <span className="sr-only">(opens in new tab)</span></a></li>
            <li><a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn <span className="sr-only">(opens in new tab)</span></a></li>
          </ul>
        </div>
      </div>

      <div className="footer-mark" aria-hidden="true">
        <LineLogo className="footer-line-logo" tone="dark" />
        <div className="footer-word">KAIROS</div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 KAIROS. Concept brand for development project.</p>
        <a href="#top" onClick={(e) => go(e, 'top')}>Back to top ↑</a>
      </div>
    </footer>
  )
}
