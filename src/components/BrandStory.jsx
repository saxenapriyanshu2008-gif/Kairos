import { useEffect, useRef } from 'react'
import WatchSVG from './WatchSVG'
import Photo from './Photo'
import { gsap, prefersReducedMotion } from '../lib/gsap'

export default function BrandStory() {
  const root = useRef(null)
  const sign = useRef(null)

  // the founder's signature writes itself from left to right when it comes into view
  useEffect(() => {
    const el = sign.current
    if (!el) return
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      el.classList.add('is-signed')
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('is-signed')
          io.disconnect()
        }
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      // words light up one by one as the paragraph scrolls through
      gsap.fromTo(
        '.story-body .w',
        { opacity: 0.16 },
        {
          opacity: 1,
          stagger: 0.05,
          ease: 'none',
          scrollTrigger: { trigger: '.story-body', start: 'top 80%', end: 'bottom 45%', scrub: true },
        }
      )
      // image: slow push-in and drift
      gsap.fromTo('.story-figure .story-watch', { scale: 1.25, yPercent: -6 }, {
        scale: 1, yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: '.story-figure', start: 'top bottom', end: 'bottom top', scrub: true },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  const para1 =
    'KAIROS was born from a simple idea: the most important moments in life rarely announce themselves. They happen between seconds, in places we remember long after the clock has moved on.'
  const para2 = 'We create watches for those moments, precise enough to measure time, considered enough to become part of it.'
  const words = (t) => t.split(' ').map((w, i) => <span key={i} className="w">{w} </span>)

  return (
    <section id="story" ref={root} className="section story theme-dark" aria-labelledby="story-title">
      <div className="story-grid">
        <div className="story-copy">
          <p className="eyebrow" data-reveal>Chapter III &nbsp;/&nbsp; The Story</p>
          <h2 id="story-title" className="display-l story-title" data-split>
            Time is easy to measure.
            <br />
            <em>Moments are not.</em>
          </h2>
          <div className="story-body">
            <p>{words(para1)}</p>
            <p>{words(para2)}</p>
          </div>
          <div className="story-sign" ref={sign}>
            <span className="rule" aria-hidden="true" />
            <p className="story-signature">
              <span className="sig" aria-label="Signed, Priyanshu Saxena">Priyanshu Saxena</span>
              <span className="sig-role">Founder, KAIROS</span>
            </p>
          </div>
        </div>

        <figure className="story-figure" data-reveal-img data-cursor="discover">
          <div className="story-frame">
            <div className="story-light" aria-hidden="true" />
            <div className="story-watch">
              <Photo
                name="story"
                className="story-photo"
                sizes="(max-width: 1024px) 90vw, 40vw"
                fallback={<WatchSVG model="elan" caseFinish="champagne" dial="ivory" strap="brownLeather" title="KAIROS ÉLAN resting in a beam of evening light" />}
              />
            </div>
          </div>
          <figcaption>
            <span>Fig. 03</span> The decisive second, 18:42
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
