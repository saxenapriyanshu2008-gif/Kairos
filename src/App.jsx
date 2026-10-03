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
import LegalPage from './components/LegalPage'
import { useRoute } from './lib/router'


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
    const reveal = gsap.utils.toArray('[data-reveal]')
    const split = gsap.utils.toArray('[data-split]')
    const imgs = gsap.utils.toArray('[data-reveal-img]')
    gsap.set(reveal, { y: 36, opacity: 0 })
    split.forEach((el) => el.classList.add('split-ready'))
    gsap.set(split, { clipPath: 'inset(0% -10% 100% -10%)', y: 60 })
    gsap.set(imgs, { clipPath: 'inset(100% 0 0 0)' })

    // On every scroll (once per frame), reveal anything whose top has reached the
    // lower 12% of the screen or gone past it. Elements skipped by a fast scroll
    // or a menu jump are revealed too, and nothing depends on positions measured
    // before the pinned film was built.
    let pending = [...reveal, ...split, ...imgs]
    let raf = 0
    const animate = (el, i) => {
      if (el.hasAttribute('data-split')) {
        gsap.fromTo(el, {
          textShadow: '-10px 0px 0px rgba(255,40,90,0.55), 10px 0px 0px rgba(40,170,255,0.55)',
        }, {
          clipPath: 'inset(-20% -10% -30% -10%)', y: 0, duration: 1.3, ease: 'power4.out', delay: i * 0.06, clearProps: 'clipPath,textShadow',
          textShadow: '0px 0px 0px rgba(255,40,90,0), 0px 0px 0px rgba(40,170,255,0)',
        })
      } else if (el.hasAttribute('data-reveal-img')) {
        gsap.to(el, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'power4.inOut', delay: i * 0.09 })
      } else {
        gsap.to(el, { y: 0, opacity: 1, duration: 1.1, delay: i * 0.09, overwrite: true })
      }
    }
    const check = () => {
      raf = 0
      const line = window.innerHeight * 0.88
      const now = []
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top < line) {
          now.push(el)
          return false
        }
        return true
      })
      // things far above the screen appear at once; things arriving together come in one after another
      let k = 0
      now.forEach((el) => animate(el, el.getBoundingClientRect().bottom < 0 ? 0 : k++))
      if (!pending.length) stop()
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check)
    }
    const stop = () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()
    // fonts change text heights, so measure the pinned sections again once they are ready
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return () => {
      stop()
      cancelAnimationFrame(raf)
      gsap.set([...reveal, ...split, ...imgs], { clearProps: 'all' })
    }
  }, [route])
}

export default function App() {
  const { name: route, page: legalPage } = useRoute()
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
      ) : route === 'legal' ? (
        <LegalPage key={legalPage} slug={legalPage} />
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
