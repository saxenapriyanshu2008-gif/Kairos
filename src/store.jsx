import { createContext, useCallback, useContext, useMemo, useState } from 'react'

/*
  Small shared store for the shopping UI (no library needed):
  - wishlist: ids of watches the user saved
  - bag: items added (a model id, or a custom configuration)
  - drawer: which side panel is open ({ type: 'product', id } | { type: 'bag' } | { type: 'wishlist' } | null)
  - toast: short status message shown at the bottom of the screen
*/

const ShopContext = createContext(null)

export function ShopProvider({ children }) {
  const [wishlist, setWishlist] = useState([])
  const [bag, setBag] = useState([])
  const [drawer, setDrawer] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [toast, setToast] = useState(null)

  const notify = useCallback((msg) => {
    setToast({ msg, key: Date.now() })
  }, [])

  const toggleWish = useCallback(
    (id) => {
      const has = wishlist.includes(id)
      notify(has ? 'Removed from wishlist' : 'Saved to wishlist')
      setWishlist((w) => (has ? w.filter((x) => x !== id) : [...w, id]))
    },
    [notify, wishlist]
  )

  const addToBag = useCallback(
    (item) => {
      setBag((b) => [...b, { ...item, key: Date.now() + Math.random() }])
      notify(`${item.name} added to bag`)
    },
    [notify]
  )

  const removeFromBag = useCallback((key) => setBag((b) => b.filter((i) => i.key !== key)), [])

  const value = useMemo(
    () => ({ wishlist, toggleWish, bag, addToBag, removeFromBag, drawer, setDrawer, searchOpen, setSearchOpen, toast, notify }),
    [wishlist, toggleWish, bag, addToBag, removeFromBag, drawer, searchOpen, toast, notify]
  )
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export const useShop = () => useContext(ShopContext)

// Smooth scroll to a section id, respecting reduced motion
export function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) {
    // we are on another "page" (e.g. #/credits): go home first, then scroll
    if (window.location.hash.startsWith('#/')) {
      window.location.hash = ''
      setTimeout(() => document.getElementById(id)?.scrollIntoView(), 150)
    }
    return
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}
