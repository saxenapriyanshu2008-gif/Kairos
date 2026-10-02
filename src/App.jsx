import { useEffect, useState } from 'react'
import { ShopProvider } from './store'
import { gsap, ScrollTrigger, prefersReducedMotion } from './lib/gsap'

import Loader from './components/Loader'
import CustomCursor from './components/CustomCursor'
import Navbar from './components/Navbar'
import Cinema from './components/Cinema'
import Manifesto from './components/Manifesto'
import Collection from './components/Collection'
import FeaturedWatch from './components/FeaturedWatch'
import WatchConfigurator from './components/WatchConfigurator'
import BrandStory from './components/BrandStory'
import Craftsmanship from './components/Craftsmanship'
import MomentClock from './components/MomentClock'
import Journal from './components/Journal'
import CTA from './components/CTA'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Credits from './components/Credits'
import { Drawer, Search, Toast } from './components/Overlays'
import ProductStudio from './components/ProductStudio'

// Tiny hash router: "#/credits" shows the credits page, anything else the home page
const useRoute = () => {
  const read = () => (window.location.hash.startsWith('#/credits') ? 'credits' : 'home')
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const on = () => setRoute(read())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

/*
  Shared section transitions, applied once to the whole page:
  [data-reveal]      fade + rise
  [data-split]       headings rise out of a mask, line by line
  [data-reveal-img]  image wipes open from the bottom
*/
function useRevealAnimations(route) {
  useEffect(() => {
    if (route !== 'home') return
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.set('[data-reveal]', { y: 36, opacity: 0 })
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 88%',
        once: true,
        onEnter: (els) => gsap.fromTo(els, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.09, overwrite: true }),
      })
      gsap.utils.toArray('[data-split]').forEach((el) => {
        el.classList.add('split-ready')
        // rise out of a mask with a short RGB split that settles (ALCHE-style)
        gsap.fromTo(el, {
          clipPath: 'inset(0% -10% 100% -10%)', y: 60,
          textShadow: '-10px 0px 0px rgba(255,40,90,0.55), 10px 0px 0px rgba(40,170,255,0.55)',
        }, {
          clipPath: 'inset(-20% -10% -30% -10%)', y: 0, duration: 1.3, ease: 'power4.out', clearProps: 'clipPath,textShadow',
          textShadow: '0px 0px 0px rgba(255,40,90,0), 0px 0px 0px rgba(40,170,255,0)',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      })
      gsap.utils.toArray('[data-reveal-img]').forEach((el) => {
        gsap.fromTo(el, { clipPath: 'inset(100% 0 0 0)' }, {
          clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'power4.inOut',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        })
      })
    })
    // fonts change text heights, so measure again once they are ready
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return () => ctx.revert()
  }, [route])
}

export default function App() {
  const route = useRoute()
  const [ready, setReady] = useState(false)
  useRevealAnimations(route)
  useEffect(() => {
    document.body.dataset.route = route
  }, [route])

  return (
    <ShopProvider>
      <Loader onDone={() => setReady(true)} />
      <CustomCursor />
      <Navbar />
      {route === 'credits' ? (
        <Credits />
      ) : (
        <main id="main">
          <Cinema ready={ready} />
          <Manifesto />
          <Collection />
          <FeaturedWatch />
          <WatchConfigurator />
          <BrandStory />
          <Craftsmanship />
          <MomentClock />
          <Journal />
          <CTA />
          <Contact />
        </main>
      )}
      <Footer />
      <Drawer />
      <ProductStudio />
      <Search />
      <Toast />
    </ShopProvider>
  )
}
