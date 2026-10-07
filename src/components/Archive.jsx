import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CATEGORIES, itemsFor, breakdownFor } from '../data/works'
import { useApp } from '../context/AppContext'
import { useElementSize } from '../hooks/useElementSize'
import Img from './ui/Img'
import { RevealLines, FadeUp } from './ui/Reveal'
import { Plus } from './ui/Icons'
import './Archive.css'

const PAGE = 24
const SIZES = '(min-width: 1280px) 25vw, (min-width: 900px) 33vw, 50vw'
const EASE = [0.22, 1, 0.36, 1]

function masonry(items, cols, width, gap) {
  const colW = (width - gap * (cols - 1)) / cols
  const heights = new Array(cols).fill(0)
  const placed = items.map((item) => {
    const ratio = item.w / item.h
    const h = colW / ratio
    let c = 0
    for (let i = 1; i < cols; i++) if (heights[i] < heights[c] - 1) c = i
    const pos = { item, x: c * (colW + gap), y: heights[c], w: colW, h }
    heights[c] += h + gap
    return pos
  })
  return { placed, height: Math.max(0, Math.max(...heights) - gap) }
}

function Tile({ item, onOpen }) {
  const ba = item.cat === 'before-after'
  const hasBreakdown = !ba && !!breakdownFor(item)
  const onMove = (e) => {
    if (!ba) return
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--split', `${((e.clientX - r.left) / r.width) * 100}%`)
  }
  const onLeave = (e) => ba && e.currentTarget.style.setProperty('--split', '50%')

  return (
    <button
      className={`tile ${ba ? 'tile--ba' : ''}`}
      onClick={onOpen}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      data-cursor="view"
      style={{ '--ph': item.palette?.[1] || '#111', '--glow': item.accent }}
      aria-label={`Open ${item.title} — ${item.catName}`}
    >
      {ba ? (
        <>
          <Img className="tile__img" img={item.after.img} lqip={item.after.lqip} sizes={SIZES} alt={`${item.title} (final)`} />
          <span className="tile__raw">
            <Img img={item.before.img} lqip={item.before.lqip} sizes={SIZES} alt={`${item.title} (raw)`} />
          </span>
          <span className="tile__split" aria-hidden="true" />
          <span className="tile__badge mono">Before / After</span>
        </>
      ) : (
        <>
          <Img className="tile__img" img={item.img} lqip={item.lqip} sizes={SIZES} alt={item.title} />
          {hasBreakdown && <span className="tile__badge mono">+ Breakdown</span>}
        </>
      )}
      <span className="ants" aria-hidden="true" />
      <span className="tile__info" aria-hidden="true">
        <span className="tile__cat mono">{item.catName}</span>
        <span className="tile__title">{item.title}</span>
        {item.palette && (
          <span className="tile__swatches">
            {item.palette.slice(0, 5).map((c) => (
              <i key={c} style={{ background: c }} />
            ))}
          </span>
        )}
      </span>
    </button>
  )
}

export default function Archive() {
  const { filter, setFilter, openLightbox, scrollTo } = useApp()
  const [expanded, setExpanded] = useState(false)
  const sectionRef = useRef(null)
  const gridRef = useRef(null)
  const { width } = useElementSize(gridRef)
  const firstRun = useRef(true)

  const all = useMemo(() => itemsFor(filter), [filter])
  const limited = filter === 'all' && !expanded && all.length > PAGE + 6
  const visible = limited ? all.slice(0, PAGE) : all

  const cols = width >= 1280 ? 4 : width >= 860 ? 3 : 2
  const gap = width >= 860 ? 18 : 10
  const layout = useMemo(() => (width ? masonry(visible, cols, width, gap) : { placed: [], height: 0 }), [visible, cols, width, gap])

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    const top = sectionRef.current?.getBoundingClientRect().top ?? 0
    if (top < -200) scrollTo('#archive', { duration: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  return (
    <section id="archive" ref={sectionRef} className="archive section">
      <div className="container">
        <header className="shead">
          <span className="tab">
            <b>archive.psd</b> @ 100% (RGB/8)
          </span>
          <div className="shead__row">
            <RevealLines
              className="shead__title"
              lines={[
                <>
                  The <em>archive</em>
                </>,
              ]}
            />
            <FadeUp as="p" className="shead__lede">
              <span className="mono lab__idx">(06)</span> Everything in one place:{' '}
              <strong>
                {CATEGORIES[0].count} pieces across {CATEGORIES.length - 1} disciplines
              </strong>
              . Filter by category, tap anything to open it full-screen and zoom into the details.
            </FadeUp>
          </div>
        </header>

        <div className="filters" role="tablist" aria-label="Filter work by category">
          {CATEGORIES.map((c) => {
            const on = filter === c.slug
            return (
              <button
                key={c.slug}
                role="tab"
                aria-selected={on}
                className={`pill ${on ? 'is-active' : ''}`}
                onClick={() => {
                  setFilter(c.slug)
                  setExpanded(false)
                }}
                data-cursor="link"
              >
                {on && <motion.span layoutId="pill-bg" className="pill__bg" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                <span className="pill__label">{c.name}</span>
                <sup className="pill__count">{c.count}</sup>
              </button>
            )
          })}
        </div>

        <div ref={gridRef} className="masonry" style={{ height: layout.height }}>
          <AnimatePresence initial={false}>
            {layout.placed.map(({ item, x, y, w, h }, i) => (
              <motion.div
                key={item.id}
                className="masonry__cell"
                style={{ width: w, height: h }}
                initial={{ opacity: 0, scale: 0.92, x, y }}
                animate={{ opacity: 1, scale: 1, x, y }}
                exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.25 } }}
                transition={{ duration: 0.75, ease: EASE, delay: Math.min(i * 0.012, 0.3) }}
              >
                <motion.div
                  className="masonry__reveal"
                  initial={{ opacity: 0, y: 46 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '0px 0px -4% 0px' }}
                  transition={{ duration: 0.9, ease: EASE }}
                >
                  <Tile item={item} onOpen={() => openLightbox(all, all.indexOf(item))} />
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {limited && (
          <div className="archive__more">
            <button className="btn btn--ghost" onClick={() => setExpanded(true)}>
              <Plus /> Show all {all.length} works
            </button>
            <span className="mono">
              Showing {visible.length} of {all.length}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
