import { useLayoutEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { FEATURED_ITEMS, CATEGORIES } from '../data/works'
import { useApp } from '../context/AppContext'
import { useMedia } from '../hooks/useMedia'
import Img from './ui/Img'
import { RevealLines } from './ui/Reveal'
import { ArrowRight, ArrowUpRight } from './ui/Icons'
import './Featured.css'

function Card({ item, index, progress, onOpen }) {
  const imgX = useTransform(progress, [0, 1], ['-4%', '4%'])
  return (
    <button
      className="fcard"
      style={{ '--r': item.ratio }}
      onClick={onOpen}
      data-cursor="view"
      aria-label={`Open ${item.title}`}
    >
      <span className="fcard__media">
        <motion.span className="fcard__parallax" style={{ x: imgX }}>
          <Img img={item.img} lqip={item.lqip} sizes="(min-width: 900px) 60vw, 85vw" alt={item.title} />
        </motion.span>
        <span className="fcard__glow" style={{ '--glow': item.accent }} />
      </span>
      <span className="fcard__meta">
        <span className="fcard__num mono">{String(index + 1).padStart(2, '0')}</span>
        <span className="fcard__title">{item.title}</span>
        <span className="fcard__cat mono">{item.catName}</span>
      </span>
    </button>
  )
}

export default function Featured() {
  const { openLightbox, scrollTo, setFilter } = useApp()
  const items = FEATURED_ITEMS
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const desktop = useMedia('(min-width: 900px)', true)
  const [dist, setDist] = useState(0)

  useLayoutEffect(() => {
    if (!desktop) return
    const measure = () => setDist(Math.max(0, trackRef.current.scrollWidth - window.innerWidth))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(trackRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [desktop])

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, (v) => -v * dist)
  const total = CATEGORIES.find((c) => c.slug === 'all')?.count

  const toArchive = () => {
    setFilter('all')
    scrollTo('#archive')
  }

  return (
    <section
      id="work"
      ref={sectionRef}
      className={`featured ${desktop ? 'is-pinned' : ''}`}
      style={desktop ? { height: `calc(100vh + ${dist}px)` } : undefined}
    >
      <div className="featured__sticky">
        <div className="featured__head container">
          <div className="featured__titles">
            <span className="tab">
              <b>selected_works.psd</b> @ 100% (RGB/8)
            </span>
            <RevealLines
              className="shead__title featured__title"
              lines={[
                <>
                  Selected <em>works</em>
                </>,
              ]}
            />
          </div>
          <div className="featured__info">
            <span className="mono featured__idx">(02)</span>
            <p>
              A handful of favourites: cinematic manipulations and key art, each built layer by layer in Photoshop.
            </p>
            <span className="mono featured__hint">
              {desktop ? 'Keep scrolling' : 'Swipe'} <ArrowRight />
            </span>
          </div>
        </div>

        <motion.div ref={trackRef} className="featured__track" style={desktop ? { x } : undefined}>
          {items.map((it, i) => (
            <Card key={it.id} item={it} index={i} progress={scrollYProgress} onOpen={() => openLightbox(items, i)} />
          ))}
          <button className="featured__end" onClick={toArchive} data-cursor="link">
            <span className="mono">The full archive</span>
            <span className="featured__end-title">
              See all <b>{total}</b> works
            </span>
            <span className="featured__end-icon">
              <ArrowUpRight />
            </span>
          </button>
        </motion.div>

        {desktop && (
          <div className="featured__bar container" aria-hidden="true">
            <span className="mono">01</span>
            <div className="featured__bar-line">
              <motion.span style={{ scaleX: scrollYProgress }} />
            </div>
            <span className="mono">{String(items.length).padStart(2, '0')}</span>
          </div>
        )}
      </div>
    </section>
  )
}
