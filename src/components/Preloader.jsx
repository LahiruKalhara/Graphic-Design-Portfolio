import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import './Preloader.css'

const STEPS = [
  'Importing raw plates',
  'Cutting out subjects',
  'Matching light & shadow',
  'Colour grading',
  'Adding atmosphere',
  'Exporting — LK Creations',
]

// Monogram drawn like the Pen tool: [path, anchor points]
const PATHS = [
  { d: 'M6 12 Q6 6 12 6 H88 Q94 6 94 12 V88 Q94 94 88 94 H12 Q6 94 6 88 Z', w: 5.5, pts: [[6, 12], [94, 12], [94, 88], [6, 88]] },
  { d: 'M30 20 V66 H46', w: 9.5, pts: [[30, 20], [30, 66], [46, 66]] },
  { d: 'M70 20 L40 50', w: 9.5, pts: [[70, 20], [40, 50]] },
  { d: 'M52 38 L72 66', w: 9.5, pts: [[52, 38], [72, 66]] },
]
// [start, end] of each stroke in seconds
const TIMING = [
  [0.05, 0.95],
  [0.8, 1.3],
  [1.2, 1.6],
  [1.5, 1.9],
]
const DRAW_END = 2.0

export default function Preloader({ assets, onDone }) {
  const svgRef = useRef(null)
  const penRef = useRef(null)
  const countRef = useRef(null)
  const barRef = useRef(null)
  const [step, setStep] = useState(0)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const svg = svgRef.current
    const paths = [...svg.querySelectorAll('.pl-stroke')]
    const anchors = [...svg.querySelectorAll('.pl-anchor')]
    const lens = paths.map((p) => p.getTotalLength())
    paths.forEach((p, i) => {
      p.style.strokeDasharray = `${lens[i]}`
      p.style.strokeDashoffset = reduce ? '0' : `${lens[i]}`
    })

    // asset loading
    let loaded = 0
    const total = assets.length + 1
    const bump = () => (loaded += 1)
    ;(document.fonts?.ready ?? Promise.resolve()).then(bump, bump)
    assets.forEach((src) => {
      const im = new Image()
      im.onload = im.onerror = bump
      im.src = src
    })

    const MIN = reduce ? 600 : 2300
    const MAX = 9000
    const start = performance.now()
    let shown = 0
    let lastStep = -1
    let raf
    let finished = false

    const tick = (now) => {
      const t = (now - start) / 1000

      // pen-tool drawing
      if (!reduce) {
        let penAt = null
        paths.forEach((p, i) => {
          const [a, b] = TIMING[i]
          const f = Math.min(1, Math.max(0, (t - a) / (b - a)))
          const eased = 1 - Math.pow(1 - f, 2)
          p.style.strokeDashoffset = `${lens[i] * (1 - eased)}`
          if (f > 0 && f < 1) penAt = p.getPointAtLength(lens[i] * eased)
          const pts = PATHS[i].pts
          pts.forEach((_, k) => {
            const anchor = anchors.find((el) => el.dataset.key === `${i}-${k}`)
            if (anchor) anchor.classList.toggle('on', eased >= (pts.length === 1 ? 0 : k / (pts.length - 1)) - 0.02 && f > 0)
          })
        })
        if (penRef.current) {
          if (penAt) {
            penRef.current.style.opacity = '1'
            penRef.current.setAttribute('transform', `translate(${penAt.x} ${penAt.y})`)
          } else if (t > DRAW_END) penRef.current.style.opacity = '0'
        }
      }

      // progress
      const elapsed = now - start
      let target = Math.min(loaded / total, elapsed / MIN, 1)
      if (elapsed > MAX) target = 1
      shown += (target - shown) * 0.09
      if (target >= 1 && shown > 0.994) shown = 1
      const pct = Math.round(shown * 100)
      if (countRef.current) countRef.current.textContent = String(pct).padStart(3, '0')
      if (barRef.current) barRef.current.style.transform = `scaleX(${shown})`
      const s = Math.min(STEPS.length - 1, Math.floor(shown * STEPS.length))
      if (s !== lastStep) {
        lastStep = s
        setStep(s)
      }

      if (shown >= 1 && (reduce || t > DRAW_END) && !finished) {
        finished = true
        setDrawn(true)
        setTimeout(onDone, reduce ? 100 : 650)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      className="preloader"
      initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      transition={{ duration: 1.05, ease: [0.76, 0, 0.24, 1] }}
      aria-label="Loading portfolio"
      role="status"
    >
      <motion.div
        className="preloader__inner"
        exit={{ y: -80, opacity: 0 }}
        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="preloader__top mono">
          <span className="tab">
            <b>lahiru_kalhara.psd</b> @ 100% (RGB/8)
          </span>
          <span className="preloader__res">8 yrs · 500+ projects</span>
        </div>

        <div className={`preloader__mark ${drawn ? 'is-drawn' : ''}`}>
          <svg ref={svgRef} viewBox="-4 -4 108 108" aria-hidden="true">
            {PATHS.map((p, i) => (
              <path key={i} className="pl-stroke" d={p.d} strokeWidth={p.w} />
            ))}
            {PATHS.flatMap((p, i) =>
              p.pts.map(([x, y], k) => (
                <rect key={`${i}-${k}`} data-key={`${i}-${k}`} className="pl-anchor" x={x - 2.2} y={y - 2.2} width="4.4" height="4.4" />
              )),
            )}
            <text className="pl-text" x="50" y="84.5" textAnchor="middle">
              CREATIONS
            </text>
            <g ref={penRef} className="pl-pen" style={{ opacity: 0 }}>
              <g transform="rotate(-28) scale(0.9)">
                <path d="M0 0 L5.5 10 L3.4 16 H-3.4 L-5.5 10 Z" />
                <path className="pl-pen-slit" d="M0 1.5 V8" />
                <circle cx="0" cy="8.6" r="1.2" />
              </g>
            </g>
          </svg>
        </div>

        <div className="preloader__bottom">
          <div className="preloader__count" aria-hidden="true">
            <span ref={countRef}>000</span>
            <i>%</i>
          </div>
          <ul className="preloader__steps mono" aria-hidden="true">
            {STEPS.map((s, i) => (
              <li key={s} className={i < step ? 'done' : i === step ? 'now' : ''}>
                <span>{i < step ? '✓' : i === step ? '›' : '·'}</span> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="preloader__bar">
          <span ref={barRef} />
        </div>
      </motion.div>
    </motion.div>
  )
}
