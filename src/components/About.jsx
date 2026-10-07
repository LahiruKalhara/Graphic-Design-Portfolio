import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { PROFILE } from '../data/profile'
import { CHIP_ITEMS } from '../data/works'
import Img from './ui/Img'
import Logo from './ui/Logo'
import { Counter, FadeUp } from './ui/Reveal'
import { Globe } from './ui/Icons'
import './About.css'

// *word* = accent, {key} = inline image chip
const STATEMENT =
  "I'm Lahiru Kalhara, a graphic designer who has spent eight years living inside Photoshop. I build *impossible* worlds, {worlds} design posters {posters} that *own* the room, and thumbnails {thumbnails} that *win* the click, then cut it all together in Premiere Pro."

function Word({ children, progress, range, accent }) {
  const opacity = useTransform(progress, range, [0.13, 1])
  return (
    <>
      <motion.span className={`st__w ${accent ? 'em' : ''}`} style={{ opacity }}>
        {children}
      </motion.span>{' '}
    </>
  )
}

function Chip({ item, progress, range }) {
  const scale = useTransform(progress, range, [0.3, 1])
  const rotate = useTransform(progress, range, [-12, 0])
  if (!item) return null
  return (
    <>
      <motion.span className="st__chip" style={{ scale, rotate }} aria-hidden="true">
        <Img img={item.img} lqip={item.lqip} sizes="180px" alt="" />
      </motion.span>{' '}
    </>
  )
}

function Statement() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.4'] })
  const tokens = STATEMENT.split(' ')
  const n = tokens.length
  return (
    <p ref={ref} className="st">
      {tokens.map((t, i) => {
        const range = [i / n, Math.min(1, (i + 1.5) / n)]
        if (/^\{.+\}$/.test(t)) return <Chip key={i} item={CHIP_ITEMS[t.slice(1, -1)]} progress={scrollYProgress} range={range} />
        const accent = /^\*.+\*[.,]?$/.test(t)
        const word = accent ? t.replace(/\*/g, '') : t
        return (
          <Word key={i} progress={scrollYProgress} range={range} accent={accent}>
            {word}
          </Word>
        )
      })}
    </p>
  )
}

const FACTS = [
  ['Discipline', 'Graphic design & photo manipulation'],
  ['Main weapon', 'Adobe Photoshop — 8 years'],
  ['Also fluent in', 'Adobe Premiere Pro'],
  ['Based in', `${PROFILE.location} (GMT+5:30)`],
  ['Working with', 'Local brands & clients worldwide via Fiverr'],
]

export default function About() {
  return (
    <section id="about" className="about section">
      <div className="container">
        <div className="about__grid">
          <aside className="about__side">
            <span className="tab">
              <b>about_me.psd</b> @ 100% (RGB/8)
            </span>
            <FadeUp className="about__mark" delay={0.1}>
              <Logo size={132} withText title="LK Creations logo" />
            </FadeUp>
            <dl className="about__facts">
              {FACTS.map(([k, v], i) => (
                <FadeUp key={k} delay={0.1 + i * 0.06}>
                  <dt className="mono">{k}</dt>
                  <dd>{v}</dd>
                </FadeUp>
              ))}
            </dl>
          </aside>

          <div className="about__main">
            <h2 className="visually-hidden">About Lahiru Kalhara</h2>
            <p className="about__kicker mono">
              <span>(01)</span> Who's behind the layers
            </p>
            <Statement />
          </div>
        </div>

        <div className="stats">
          {PROFILE.stats.map((s, i) => (
            <FadeUp className="stat" key={s.label} delay={i * 0.08}>
              <span className="crop-marks" />
              <span className="stat__num">
                <Counter value={s.value} pad={s.pad || 0} />
                <i>{s.suffix}</i>
              </span>
              <span className="stat__label">{s.label}</span>
              <span className="stat__idx mono">{String(i + 1).padStart(2, '0')}</span>
            </FadeUp>
          ))}
        </div>
        <FadeUp className="about__reach">
          <Globe />
          <p>
            Trusted by clients from <b>Sri Lanka</b> to the <b>USA</b>, <b>Canada</b> &amp; <b>Australia</b>. Close to{' '}
            <b>500 projects</b> and counting.
          </p>
        </FadeUp>
      </div>
    </section>
  )
}

