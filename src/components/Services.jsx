import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useSpring } from 'motion/react'
import { SERVICES, SKILLS } from '../data/meta'
import { itemsByCat, CATEGORIES } from '../data/works'
import { useApp } from '../context/AppContext'
import { useFinePointer } from '../hooks/useMedia'
import Img from './ui/Img'
import { RevealLines, FadeUp } from './ui/Reveal'
import { ArrowUpRight } from './ui/Icons'
import './Services.css'

const previewItems = (s) => (s?.cat ? itemsByCat(s.cat) : itemsByCat('thumbnails')).slice(0, 6)

function Preview({ service, x, y }) {
  const [i, setI] = useState(0)
  const list = previewItems(service)
  useEffect(() => {
    setI(0)
    if (!service) return
    const id = setInterval(() => setI((n) => n + 1), 850)
    return () => clearInterval(id)
  }, [service])
  const it = list.length ? list[i % list.length] : null
  return (
    <motion.div className="svc-preview" style={{ x, y }} aria-hidden="true">
      <AnimatePresence>
        {service && it && (
          <motion.div
            key={service.id}
            className="svc-preview__card"
            initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: -3 }}
            exit={{ opacity: 0, scale: 0.6, rotate: 6 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {list.map((p, k) => (
              <Img
                key={p.id}
                className={`svc-preview__img ${k === i % list.length ? 'is-on' : ''}`}
                img={p.cat === 'before-after' ? p.after.img : p.img}
                size="sm"
                alt=""
              />
            ))}
            {service.tool && <span className="svc-preview__tag mono">Premiere Pro</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Services() {
  const { setFilter, scrollTo } = useApp()
  const fine = useFinePointer()
  const [hover, setHover] = useState(null)
  const x = useSpring(0, { stiffness: 260, damping: 26, mass: 0.5 })
  const y = useSpring(0, { stiffness: 260, damping: 26, mass: 0.5 })
  const count = (cat) => CATEGORIES.find((c) => c.slug === cat)?.count ?? 0

  const go = (s) => {
    if (!s.cat) return scrollTo('#contact')
    setFilter(s.cat)
    scrollTo('#archive')
  }

  return (
    <section
      id="services"
      className="services section"
      onPointerMove={fine ? (e) => (x.set(e.clientX), y.set(e.clientY)) : undefined}
    >
      <div className="container">
        <header className="shead">
          <span className="tab">
            <b>services.psd</b> @ 100% (RGB/8)
          </span>
          <div className="shead__row">
            <RevealLines
              className="shead__title"
              lines={[
                <>
                  What I <em>do</em>
                </>,
              ]}
            />
            <FadeUp as="p" className="shead__lede">
              <span className="mono lab__idx">(07)</span> From a single social post to a full campaign. Pick a
              service to jump straight to the work.
            </FadeUp>
          </div>
        </header>

        <ul className="svc" onPointerLeave={() => setHover(null)}>
          {SERVICES.map((s, i) => (
            <FadeUp as="li" key={s.id} delay={i * 0.04}>
              <button
                className={`svc__row ${hover && hover.id !== s.id ? 'is-dim' : ''}`}
                onPointerEnter={() => setHover(s)}
                onFocus={() => setHover(s)}
                onBlur={() => setHover(null)}
                onClick={() => go(s)}
                data-cursor="view"
                data-cursor-tone="dark"
                data-cursor-label={s.cat ? 'See work' : 'Hire me'}
              >
                <span className="svc__num mono">{String(i + 1).padStart(2, '0')}</span>
                <span className="svc__title">
                  {s.title}
                  {s.tool && <span className="svc__tool">{s.tool}</span>}
                </span>
                <span className="svc__desc">{s.desc}</span>
                <span className="svc__count mono">
                  {s.cat ? `${count(s.cat)} works` : "Let's talk"}
                  <ArrowUpRight />
                </span>
              </button>
            </FadeUp>
          ))}
        </ul>

        <div className="toolkit">
          <FadeUp className="app app--ps">
            <span className="app__icon" aria-hidden="true">
              Ps
            </span>
            <div className="app__body">
              <h3>Adobe Photoshop</h3>
              <p>Expert · 8 years · where everything on this page was made</p>
              <div className="app__bar" aria-hidden="true">
                <motion.span
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
            <span className="app__level mono">Expert</span>
          </FadeUp>
          <FadeUp className="app app--pr" delay={0.08}>
            <span className="app__icon" aria-hidden="true">
              Pr
            </span>
            <div className="app__body">
              <h3>Adobe Premiere Pro</h3>
              <p>Video editing · cuts, pacing, colour &amp; titles</p>
              <div className="app__bar" aria-hidden="true">
                <motion.span
                  style={{ originX: 0 }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 0.68 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                />
              </div>
            </div>
            <span className="app__level mono">Proficient</span>
          </FadeUp>
          <FadeUp className="skills" delay={0.12}>
            <span className="mono skills__label">Toolbox</span>
            <ul>
              {SKILLS.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </FadeUp>
        </div>
      </div>
      {fine && <Preview service={hover} x={x} y={y} />}
    </section>
  )
}
