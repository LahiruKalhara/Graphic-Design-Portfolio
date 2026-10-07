import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react'
import { HERO_ITEMS } from '../data/works'
import { PROFILE } from '../data/profile'
import { useApp } from '../context/AppContext'
import { useMedia } from '../hooks/useMedia'
import XRay from './XRay'
import Magnetic from './ui/Magnetic'
import { Roll } from './ui/Reveal'
import { ArrowDown, ArrowUpRight } from './ui/Icons'
import './Hero.css'

const SLIDE_MS = 7000
const EASE = [0.22, 1, 0.36, 1]

function Name({ text, delay, play }) {
  return (
    <span className="line-mask hero__line" aria-hidden="true">
      {[...text].map((ch, i) => (
        <motion.span
          key={i}
          className="hero__char"
          initial={{ y: '105%' }}
          animate={play ? { y: '0%' } : {}}
          transition={{ duration: 1.2, ease: EASE, delay: delay + i * 0.045 }}
        >
          <span>{ch}</span>
        </motion.span>
      ))}
    </span>
  )
}

export default function Hero({ ready }) {
  const { scrollTo } = useApp()
  const sectionRef = useRef(null)
  const [index, setIndex] = useState(0)
  const [inView, setInView] = useState(true)
  const wide = useMedia('(min-width: 900px)', true)
  const fine = useMedia('(hover: hover) and (pointer: fine)')
  const size = wide ? 'lg' : 'md'
  const item = HERO_ITEMS[index]
  const pos = `${item.focus[0] * 100}% ${item.focus[1] * 100}%`

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '28%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  useEffect(() => {
    if (!ready || !inView) return
    const id = setTimeout(() => setIndex((i) => (i + 1) % HERO_ITEMS.length), SLIDE_MS)
    return () => clearTimeout(id)
  }, [index, ready, inView])

  useEffect(() => {
    const next = HERO_ITEMS[(index + 1) % HERO_ITEMS.length]
    ;[next.after.img[size].src, next.before.img[size].src].forEach((src) => {
      const im = new Image()
      im.src = src
    })
  }, [index, size])

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 })
    io.observe(sectionRef.current)
    return () => io.disconnect()
  }, [])

  const go = (e, href) => {
    e.preventDefault()
    scrollTo(href)
  }

  return (
    <section id="top" ref={sectionRef} className="hero" data-cursor="brush" data-cursor-label="Raw layer">
      <div className="hero__media">
        <AnimatePresence initial={false}>
          <motion.div
            key={item.id}
            className="hero__slide"
            initial={{ clipPath: 'inset(0% 0% 0% 100%)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
            exit={{ filter: 'brightness(0.35)', transition: { duration: 1.25 } }}
            transition={{ duration: 1.25, ease: [0.77, 0, 0.18, 1] }}
          >
            <img
              src={item.after.img[size].src}
              alt={`${item.title} — photo manipulation by ${PROFILE.name}`}
              style={{ objectPosition: pos }}
              fetchPriority={index === 0 ? 'high' : undefined}
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>
        <XRay src={item.before.img[size].src} focus={item.focus} hostRef={sectionRef} />
        <div className="hero__shade" />
      </div>

      <motion.div className="hero__content" style={{ y: contentY, opacity: contentOpacity }}>
        <div className="hero__top">
          <motion.div
            className="hero__role"
            initial={{ opacity: 0, y: 14 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: EASE, delay: 0.9 }}
          >
            <span className="tab">
              <b>{PROFILE.role}</b>
            </span>
            <span className="hero__loc mono">Based in {PROFILE.location} · Working worldwide</span>
          </motion.div>

          <motion.div
            className="hero__piece"
            initial={{ opacity: 0, y: 14 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: EASE, delay: 1.05 }}
          >
            <span className="mono hero__count">
              <b>{String(index + 1).padStart(2, '0')}</b> / {String(HERO_ITEMS.length).padStart(2, '0')}
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={item.id}
                className="hero__piece-title"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                {item.title}
              </motion.span>
            </AnimatePresence>
            <span className="mono hero__piece-cat">Photo manipulation</span>
          </motion.div>
        </div>

        <div className="hero__bottom">
          <h1 className="hero__name" aria-label={`${PROFILE.name} — ${PROFILE.role}`}>
            <Name text={PROFILE.first} delay={0.15} play={ready} />
            <Name text={PROFILE.last} delay={0.32} play={ready} />
          </h1>

          <motion.div
            className="hero__aside"
            initial={{ opacity: 0, y: 24 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: EASE, delay: 1.1 }}
          >
            <p className="hero__tagline">
              I build <em className="em">impossible</em> worlds in Photoshop, and design the posters, flyers &amp;
              thumbnails that make people stop scrolling.
            </p>
            <div className="hero__ctas">
              <Magnetic>
                <a href="#work" className="btn btn--solid" onClick={(e) => go(e, '#work')} data-cursor="link">
                  <Roll>View my work</Roll>
                  <ArrowUpRight />
                </a>
              </Magnetic>
              <Magnetic>
                <a href="#lab" className="btn btn--ghost" onClick={(e) => go(e, '#lab')} data-cursor="link">
                  <Roll>Behind the layers</Roll>
                </a>
              </Magnetic>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="hero__foot"
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 1.4 }}
        >
          <span className="hero__hint mono">
            <span className="hero__hint-ring" />
            {fine ? 'Move your cursor to x-ray the raw layers' : 'Touch & drag to x-ray the raw layers'}
          </span>
          <div className="hero__dots" role="tablist" aria-label="Hero artwork">
            {HERO_ITEMS.map((h, i) => (
              <button
                key={h.id}
                role="tab"
                aria-selected={i === index}
                aria-label={`Show ${h.title}`}
                className={`hero__dot ${i === index ? 'is-active' : ''}`}
                onClick={() => setIndex(i)}
                data-cursor="link"
              >
                {i === index && (
                  <span
                    key={`${index}-${inView}`}
                    className="hero__dot-fill"
                    style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: inView && ready ? 'running' : 'paused' }}
                  />
                )}
              </button>
            ))}
          </div>
          <a href="#about" className="hero__scroll mono" onClick={(e) => go(e, '#about')} data-cursor="link">
            Scroll <ArrowDown />
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}
