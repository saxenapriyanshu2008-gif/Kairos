import { useEffect, useState } from 'react'

/*
  Tiny hash router.
    #/credits          Assets & Credits
    #/legal/<page>     a legal page (privacy, terms, shipping, warranty, cookies)
    anything else      the home page
  navigate() updates the hash AND tells the app directly, so links still work
  where the page runs inside a frame that does not fire hashchange.
*/

const EVENT = 'kairos:route'

export function parseRoute(hash = window.location.hash) {
  if (hash.startsWith('#/credits')) return { name: 'credits' }
  const m = hash.match(/^#\/legal\/([a-z-]+)/)
  if (m) return { name: 'legal', page: m[1] }
  return { name: 'home' }
}

export function navigate(path) {
  const hash = path ? `#/${path}` : ''
  try {
    if (hash) window.location.hash = hash
    else history.replaceState(null, '', window.location.pathname + window.location.search)
  } catch {
    /* some frames block history changes; the event below still updates the page */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: hash }))
  window.scrollTo(0, 0)
}

// onClick helper for <a href="#/..."> links
export const linkTo = (path) => (e) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return
  e.preventDefault()
  navigate(path)
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseRoute())
  useEffect(() => {
    const onHash = () => setRoute(parseRoute())
    const onNav = (e) => setRoute(parseRoute(e.detail))
    window.addEventListener('hashchange', onHash)
    window.addEventListener(EVENT, onNav)
    return () => {
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener(EVENT, onNav)
    }
  }, [])
  return route
}
