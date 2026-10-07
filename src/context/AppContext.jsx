import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const AppCtx = createContext(null)

export function AppProvider({ children }) {
  const [lightbox, setLightbox] = useState(null) // { items, index }
  const [filter, setFilter] = useState('all')
  const lenisRef = useRef(null)

  const openLightbox = useCallback((items, index = 0) => setLightbox({ items, index }), [])
  const closeLightbox = useCallback(() => setLightbox(null), [])
  const stepLightbox = useCallback(
    (dir) =>
      setLightbox((lb) => (lb ? { ...lb, index: (lb.index + dir + lb.items.length) % lb.items.length } : lb)),
    [],
  )

  const scrollTo = useCallback((target, opts = {}) => {
    const lenis = lenisRef.current
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.4, ...opts })
      return
    }
    const el = typeof target === 'string' ? document.querySelector(target) : target
    if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'smooth' })
    else el?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const lockScroll = useCallback((locked) => {
    const lenis = lenisRef.current
    if (locked) {
      lenis?.stop()
      document.documentElement.classList.add('is-locked')
    } else {
      lenis?.start()
      document.documentElement.classList.remove('is-locked')
    }
  }, [])

  const value = useMemo(
    () => ({ lightbox, openLightbox, closeLightbox, stepLightbox, filter, setFilter, lenisRef, scrollTo, lockScroll }),
    [lightbox, openLightbox, closeLightbox, stepLightbox, filter, scrollTo, lockScroll],
  )
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export const useApp = () => useContext(AppCtx)
