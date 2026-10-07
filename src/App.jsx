import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, MotionConfig } from 'motion/react'
import Lenis from 'lenis'
import { AppProvider, useApp } from './context/AppContext'
import { HERO_ITEMS } from './data/works'
import Preloader from './components/Preloader'
import Cursor from './components/Cursor'
import Nav from './components/Nav'
import Hero from './components/Hero'
import MarqueeBands from './components/Marquee'
import About from './components/About'
import Featured from './components/Featured'
import LayerLab from './components/LayerLab'
import Playground from './components/Playground'
import Thumbnails from './components/Thumbnails'
import Archive from './components/Archive'
import Services from './components/Services'
import Clients from './components/Clients'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Lightbox from './components/Lightbox'
import Ruler from './components/Ruler'

function Site() {
  const { lenisRef, lockScroll } = useApp()
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)

  // smooth scrolling (skipped for reduced-motion users)
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, autoRaf: true })
    lenisRef.current = lenis
    return () => {
      lenis.destroy()
      lenisRef.current = null
    }
  }, [lenisRef])

  useEffect(() => {
    lockScroll(loading)
  }, [loading, lockScroll])

  const assets = useMemo(() => {
    const first = HERO_ITEMS[0]
    if (!first) return []
    const size = window.matchMedia('(min-width: 900px)').matches ? 'lg' : 'md'
    return [first.after.img[size].src, first.before.img[size].src]
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {loading && (
          <Preloader
            key="preloader"
            assets={assets}
            onDone={() => {
              setLoading(false)
              setReady(true)
            }}
          />
        )}
      </AnimatePresence>
      <Cursor />
      <Nav ready={ready} />
      <main>
        <Hero ready={ready} />
        <MarqueeBands />
        <About />
        <Featured />
        <LayerLab />
        <Playground />
        <Thumbnails />
        <Archive />
        <Services />
        <Clients />
        <Contact />
      </main>
      <Footer />
      <Lightbox />
      <Ruler />
      <div className="grain" aria-hidden="true" />
    </MotionConfig>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Site />
    </AppProvider>
  )
}
