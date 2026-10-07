import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LAB_ITEMS } from '../data/works'
import { useApp } from '../context/AppContext'
import { useElementSize } from '../hooks/useElementSize'
import CompareSlider from './CompareSlider'
import Img from './ui/Img'
import { RevealLines, FadeUp } from './ui/Reveal'
import { ArrowLeft, ArrowRight, ZoomIn } from './ui/Icons'
import './LayerLab.css'

export default function LayerLab() {
  const items = LAB_ITEMS
  const { openLightbox } = useApp()
  const [active, setActive] = useState(0)
  const item = items[active]
  const stageRef = useRef(null)
  const stripRef = useRef(null)
  const { width: W, height: H } = useElementSize(stageRef)

  // fit the slider inside the stage ("contain")
  const r = item.w / item.h
  let w = Math.min(W, H * r)
  let h = w / r
  if (!W || !H) {
    w = undefined
    h = undefined
  }

  const go = (dir) => setActive((a) => (a + dir + items.length) % items.length)

  useEffect(() => {
    const strip = stripRef.current
    const el = strip?.children[active]
    if (el) strip.scrollTo({ left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
  }, [active])

  return (
    <section id="lab" className="lab section">
      <div className="container">
        <header className="shead">
          <span className="tab">
            <b>layer_lab.psd</b> @ 100% (RGB/8)
          </span>
          <div className="shead__row">
            <RevealLines
              className="shead__title"
              lines={[
                <>
                  The layer <em>lab</em>
                </>,
              ]}
            />
            <FadeUp as="p" className="shead__lede">
              <span className="mono lab__idx">(03)</span> Every final frame starts as a pile of raw photos.{' '}
              <strong>Drag the handle</strong> to see what Photoshop did: {items.length} real breakdowns, from cut-outs to
              cinema.
            </FadeUp>
          </div>
        </header>

        <div ref={stageRef} className="lab__stage">
          <AnimatePresence mode="wait">
            <motion.div
              key={item.id}
              className="lab__frame"
              style={{ width: w, height: h }}
              initial={{ opacity: 0, scale: 0.97, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.02, filter: 'blur(8px)' }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <CompareSlider item={item} sweep sizes="(min-width: 1200px) 1200px, 100vw" style={{ width: '100%', height: '100%' }} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="lab__bar">
          <div className="lab__info">
            <span className="mono lab__count">
              <b>{String(active + 1).padStart(2, '0')}</b> / {items.length}
            </span>
            <AnimatePresence mode="wait">
              <motion.div
                key={item.id}
                className="lab__text"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <h3>{item.title}</h3>
                <p>{item.note}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="lab__controls">
            <button className="icon-btn" onClick={() => go(-1)} aria-label="Previous breakdown">
              <ArrowLeft />
            </button>
            <button className="icon-btn" onClick={() => go(1)} aria-label="Next breakdown">
              <ArrowRight />
            </button>
            <button className="btn btn--ghost btn--sm" onClick={() => openLightbox(items, active)}>
              <ZoomIn /> Full screen
            </button>
          </div>
        </div>

        <div ref={stripRef} className="lab__strip" role="tablist" aria-label="Choose a breakdown">
          {items.map((it, i) => (
            <button
              key={it.id}
              role="tab"
              aria-selected={i === active}
              aria-label={it.title}
              className={`lab__thumb ${i === active ? 'is-active' : ''}`}
              style={{ '--r': it.w / it.h }}
              onClick={() => setActive(i)}
              data-cursor="link"
            >
              <Img img={it.after.img} lqip={it.after.lqip} size="sm" alt="" />
              <Img className="lab__thumb-raw" img={it.before.img} lqip={it.before.lqip} size="sm" alt="" />
              <span className="ants" />
              <span className="lab__thumb-n mono">{String(i + 1).padStart(2, '0')}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
