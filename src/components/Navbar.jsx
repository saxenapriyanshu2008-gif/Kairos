import { useEffect, useRef, useState } from 'react'
import Logo from './Logo'
import { SearchIcon, HeartIcon, BagIcon } from './Icons'
import { scrollToId, useShop } from '../store'
import { gsap, prefersReducedMotion } from '../lib/gsap'

export const NAV_LINKS = [
  { id: 'collection', label: 'Collection' },
  { id: 'craft', label: 'Craft' },
  { id: 'story', label: 'The Story' },
  { id: 'journal', label: 'Journal' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')
  const { wishlist, bag, setDrawer, setSearchOpen } = useShop()
  const menuRef = useRef(null)
  const toggleRef = useRef(null)

  // compact navbar after a little scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // highlight the section in view
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' }
    )
    NAV_LINKS.forEach((l) => {
      const el = document.getElementById(l.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  // mobile menu: lock scroll, animate links, close on Escape
  useEffect(() => {
    document.body.classList.toggle('no-scroll', open)
    if (!open) return
    const links = menuRef.current.querySelectorAll('.mm-link, .mm-foot')
    if (!prefersReducedMotion()) gsap.fromTo(links, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.06, duration: 0.7, delay: 0.15 })
    menuRef.current.querySelector('a')?.focus()
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => {
    setOpen(false)
    toggleRef.current?.focus()
  }

  const go = (e, id) => {
    e.preventDefault()
    setOpen(false)
    // wait one frame so the scroll lock is released first
    requestAnimationFrame(() => scrollToId(id))
  }

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <header className={`nav ${scrolled ? 'is-scrolled' : ''} ${open ? 'menu-open' : ''}`}>
        <div className="nav-inner">
          <a href="#top" className="nav-logo" aria-label="KAIROS, back to top" onClick={(e) => go(e, 'top')} data-cursor="open">
            <Logo />
          </a>

          <nav className="nav-links" aria-label="Main">
            <ul>
              {NAV_LINKS.map((l) => (
                <li key={l.id}>
                  <a href={`#${l.id}`} onClick={(e) => go(e, l.id)} aria-current={active === l.id ? 'true' : undefined} className={active === l.id ? 'is-active' : ''}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="nav-actions">
            <button className="icon-btn" aria-label="Search" onClick={() => setSearchOpen(true)}>
              <SearchIcon />
            </button>
            <button className="icon-btn" aria-label={`Wishlist, ${wishlist.length} items`} onClick={() => setDrawer({ type: 'wishlist' })}>
              <HeartIcon />
              {wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
            </button>
            <button className="icon-btn" aria-label={`Bag, ${bag.length} items`} onClick={() => setDrawer({ type: 'bag' })}>
              <BagIcon />
              {bag.length > 0 && <span className="badge">{bag.length}</span>}
            </button>
            <button
              ref={toggleRef}
              className="menu-toggle"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((o) => !o)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div id="mobile-menu" ref={menuRef} className={`mobile-menu ${open ? 'is-open' : ''}`} aria-hidden={!open} inert={open ? undefined : ''}>
        <nav aria-label="Mobile">
          <ol>
            {[...NAV_LINKS, { id: 'contact', label: 'Contact' }].map((l, i) => (
              <li key={l.id} className="mm-item">
                <a className="mm-link" href={`#${l.id}`} onClick={(e) => go(e, l.id)}>
                  <span className="mm-num">0{i + 1}</span>
                  {l.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <p className="mm-foot">THE MOMENT MATTERS.</p>
      </div>
    </>
  )
}
