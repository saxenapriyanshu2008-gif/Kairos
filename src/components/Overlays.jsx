import { useEffect, useMemo, useRef, useState } from 'react'
import WatchSVG from './WatchSVG'
import JournalImage from './JournalImage'
import Photo from './Photo'
import { CloseIcon, HeartIcon, SearchIcon } from './Icons'
import { watches, getWatch, formatPrice } from '../data/watches'
import { articles } from '../data/journal'
import { scrollToId, useShop } from '../store'
import { gsap, prefersReducedMotion } from '../lib/gsap'

/*
  Drawer (product / bag / wishlist / article), Search and Toast.
  Both dialogs: role="dialog", aria-modal, Escape to close, focus moves in on
  open and returns to the button that opened it on close, Tab stays inside.
*/

export function useDialog(open, onClose, panelRef) {
  const lastFocus = useRef(null)
  useEffect(() => {
    if (!open) return
    lastFocus.current = document.activeElement
    document.body.classList.add('no-scroll')
    const panel = panelRef.current
    requestAnimationFrame(() => panel?.querySelector('[data-autofocus], button, a, input')?.focus())
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && panel) {
        const f = panel.querySelectorAll('button, a[href], input, textarea, [tabindex]:not([tabindex="-1"])')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
      lastFocus.current?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
}

export function Drawer() {
  const { drawer, setDrawer, wishlist, toggleWish, bag, addToBag, removeFromBag } = useShop()
  const panel = useRef(null)
  const open = !!drawer && drawer.type !== 'product' // products open in the full-screen studio
  const close = () => setDrawer(null)
  useDialog(open, close, panel)

  useEffect(() => {
    if (!open || prefersReducedMotion()) return
    gsap.fromTo(panel.current.querySelectorAll('[data-stagger]'), { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.7, delay: 0.15 })
  }, [open, drawer])

  let title = ''
  let body = null
  void title

  if (drawer?.type === 'product') {
    const w = getWatch(drawer.id)
    const saved = wishlist.includes(w.id)
    title = w.name
    body = (
      <div className="dw-product">
        <div className="dw-photo" data-stagger>
          <Photo name={w.id} sizes="(max-width: 600px) 100vw, 560px" eager fallback={<div className={`dw-visual tone-${w.tone}`}><WatchSVG {...w.look} title={w.name} /></div>} />
        </div>
        <div className={`dw-visual tone-${w.tone}`} data-stagger>
          <WatchSVG {...w.look} title={`${w.name} studio render`} />
        </div>
        <p className="eyebrow" data-stagger>{w.category}</p>
        <h2 className="display-m" id="drawer-title" data-stagger>{w.name}</h2>
        <p className="dw-price" data-stagger>{formatPrice(w.price)}</p>
        <p className="dw-text" data-stagger>{w.long}</p>
        <dl className="specs specs-compact" data-stagger>
          {Object.entries(w.specs).map(([k, v]) => (
            <div className="spec" key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
        <div className="dw-actions" data-stagger>
          <button className="btn btn-dark" onClick={() => addToBag({ id: w.id, name: w.name, price: w.price, look: w.look, note: w.category })}>
            <span>Add to bag</span>
          </button>
          <button className={`icon-btn wish ${saved ? 'is-on' : ''}`} aria-pressed={saved} aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'} onClick={() => toggleWish(w.id)}>
            <HeartIcon filled={saved} />
          </button>
        </div>
        <button className="btn-link" onClick={() => { close(); setTimeout(() => scrollToId('configure'), 50) }} data-stagger>
          Make it yours in the configurator
        </button>
      </div>
    )
  }

  if (drawer?.type === 'article') {
    const a = articles.find((x) => x.id === drawer.id)
    title = a.title
    body = (
      <article className="dw-article">
        <div className="dw-art" data-stagger>
          <JournalImage a={a} className="" eager />
        </div>
        <p className="eyebrow" data-stagger>{a.category} &nbsp;/&nbsp; {a.date} &nbsp;/&nbsp; {a.read}</p>
        <h2 className="display-m" id="drawer-title" data-stagger>{a.title}</h2>
        <p className="dw-lede" data-stagger>{a.excerpt}</p>
        {a.body.map((p, i) => <p key={i} className="dw-text" data-stagger>{p}</p>)}
      </article>
    )
  }

  if (drawer?.type === 'bag' || drawer?.type === 'wishlist') {
    const isBag = drawer.type === 'bag'
    const items = isBag ? bag : wishlist.map((id) => ({ ...getWatch(id), key: id }))
    const total = bag.reduce((s, i) => s + i.price, 0)
    title = isBag ? 'Your bag' : 'Your wishlist'
    body = (
      <div className="dw-list">
        <h2 className="display-m" id="drawer-title" data-stagger>{title}</h2>
        {items.length === 0 ? (
          <p className="dw-empty" data-stagger>
            {isBag ? 'Your bag is empty. Every collection starts with one moment.' : 'Nothing saved yet. Tap the heart on any watch to keep it here.'}
          </p>
        ) : (
          <ul>
            {items.map((it) => (
              <li key={it.key} className="dw-item" data-stagger>
                <div className="dw-thumb"><WatchSVG {...it.look} showStrap={false} title={it.name} /></div>
                <div className="dw-item-info">
                  <p className="dw-item-name">{it.name}</p>
                  <p className="dw-item-note">{it.note || it.category}</p>
                  <p className="dw-item-price">{formatPrice(it.price)}</p>
                </div>
                <button className="icon-btn" aria-label={`Remove ${it.name}`} onClick={() => (isBag ? removeFromBag(it.key) : toggleWish(it.id))}>
                  <CloseIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
        {isBag && items.length > 0 && (
          <div className="dw-total" data-stagger>
            <span>Total</span>
            <span>{formatPrice(total)}</span>
            <button className="btn btn-dark" onClick={() => { close(); setTimeout(() => scrollToId('contact'), 50) }}>
              <span>Request a private viewing</span>
            </button>
            <p className="cfg-note">Online checkout is not part of this concept.</p>
          </div>
        )}
        {!isBag && items.length === 0 && (
          <button className="btn btn-dark" onClick={() => { close(); setTimeout(() => scrollToId('collection'), 50) }} data-stagger>
            <span>Browse the collection</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`drawer-root ${open ? 'is-open' : ''}`} aria-hidden={!open} inert={open ? undefined : ''}>
      <div className="drawer-scrim" onClick={close} />
      <div ref={panel} className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <button className="icon-btn drawer-close" onClick={close} aria-label="Close panel" data-autofocus>
          <CloseIcon />
        </button>
        <div className="drawer-body">{body}</div>
      </div>
    </div>
  )
}

const SECTIONS = [
  { id: 'collection', label: 'The Collection' },
  { id: 'configure', label: 'Build your KAIROS' },
  { id: 'craft', label: 'Craftsmanship' },
  { id: 'story', label: 'The Story' },
  { id: 'moment', label: 'The Moment' },
  { id: 'journal', label: 'Journal' },
  { id: 'contact', label: 'Contact' },
]

export function Search() {
  const { searchOpen, setSearchOpen, setDrawer } = useShop()
  const [q, setQ] = useState('')
  const panel = useRef(null)
  const close = () => setSearchOpen(false)
  useDialog(searchOpen, close, panel)
  useEffect(() => { if (!searchOpen) setQ('') }, [searchOpen])

  const results = useMemo(() => {
    const t = q.trim().toLowerCase()
    const match = (...s) => !t || s.join(' ').toLowerCase().includes(t)
    return [
      ...watches.filter((w) => match(w.name, w.category, w.description)).map((w) => ({ key: w.id, kind: 'Watch', label: w.name, sub: `${w.category} / ${formatPrice(w.price)}`, go: () => setDrawer({ type: 'product', id: w.id }) })),
      ...articles.filter((a) => match(a.title, a.excerpt, a.category)).map((a) => ({ key: a.id, kind: 'Journal', label: a.title, sub: a.category, go: () => setDrawer({ type: 'article', id: a.id }) })),
      ...SECTIONS.filter((s) => t && match(s.label)).map((s) => ({ key: s.id, kind: 'Page', label: s.label, sub: 'Jump to section', go: () => setTimeout(() => scrollToId(s.id), 50) })),
    ]
  }, [q, setDrawer])

  return (
    <div className={`search-root ${searchOpen ? 'is-open' : ''}`} aria-hidden={!searchOpen} inert={searchOpen ? undefined : ''}>
      <div className="drawer-scrim" onClick={close} />
      <div ref={panel} className="search" role="dialog" aria-modal="true" aria-label="Search KAIROS">
        <div className="search-bar">
          <SearchIcon />
          <label htmlFor="search-input" className="sr-only">Search watches, stories and pages</label>
          <input id="search-input" data-autofocus type="search" placeholder="Search watches, stories, pages" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
          <button className="icon-btn" onClick={close} aria-label="Close search"><CloseIcon /></button>
        </div>
        <p className="sr-only" aria-live="polite">{results.length} results</p>
        <ul className="search-results">
          {results.map((r) => (
            <li key={r.kind + r.key}>
              <button onClick={() => { close(); r.go() }}>
                <span className="sr-kind">{r.kind}</span>
                <span className="sr-label">{r.label}</span>
                <span className="sr-sub">{r.sub}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="search-empty">No results for “{q}”. Try “steel”, “dress” or “movement”.</li>}
        </ul>
      </div>
    </div>
  )
}

export function Toast() {
  const { toast } = useShop()
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!toast) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 2600)
    return () => clearTimeout(t)
  }, [toast])
  return (
    <div className={`toast ${visible ? 'is-on' : ''}`} role="status" aria-live="polite">
      {toast?.msg}
    </div>
  )
}
