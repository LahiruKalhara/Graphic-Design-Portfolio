import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useApp } from '../context/AppContext'
import { breakdownFor } from '../data/works'
import { useElementSize } from '../hooks/useElementSize'
import CompareSlider from './CompareSlider'
import { ArrowLeft, ArrowRight, Check, Close, Compare, ImageIcon, Split, ZoomIn } from './ui/Icons'
import './Lightbox.css'

const MAX_ZOOM = 4
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

/* ---------- zoomable image ---------- */
function ZoomImage({ item, w, h, onSwipe }) {
  const ref = useRef(null)
  const [t, setT] = useState({ s: 1, x: 0, y: 0 })
  const [loaded, setLoaded] = useState(false)
  const drag = useRef(null)
  const tRef = useRef(t)
  tRef.current = t

  const limit = (s, x, y) => {
    const mx = ((s - 1) * w) / 2
    const my = ((s - 1) * h) / 2
    return { s, x: clamp(x, -mx, mx), y: clamp(y, -my, my) }
  }
  const local = (e) => {
    const r = ref.current.getBoundingClientRect()
    return { qx: e.clientX - r.left - r.width / 2, qy: e.clientY - r.top - r.height / 2 }
  }
  const zoomAt = (qx, qy, s2) => {
    const { s, x, y } = tRef.current
    s2 = clamp(s2, 1, MAX_ZOOM)
    setT(limit(s2, qx - ((qx - x) * s2) / s, qy - ((qy - y) * s2) / s))
  }

  const onDown = (e) => {
    drag.current = { sx: e.clientX, sy: e.clientY, x: tRef.current.x, y: tRef.current.y, moved: false }
    ref.current.setPointerCapture?.(e.pointerId)
  }
  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    if (Math.abs(dx) + Math.abs(dy) > 5) d.moved = true
    if (tRef.current.s > 1) setT(limit(tRef.current.s, d.x + dx, d.y + dy))
  }
  const onUp = (e) => {
    const d = drag.current
    drag.current = null
    if (!d) return
    const dx = e.clientX - d.sx
    if (!d.moved) {
      const { qx, qy } = local(e)
      if (tRef.current.s > 1) setT({ s: 1, x: 0, y: 0 })
      else zoomAt(qx, qy, 2.5)
    } else if (tRef.current.s === 1 && Math.abs(dx) > 60) onSwipe(dx < 0 ? 1 : -1)
  }
  const onWheel = (e) => {
    const { qx, qy } = local(e)
    zoomAt(qx, qy, tRef.current.s * (1 - e.deltaY * 0.0016))
  }

  useEffect(() => {
    const el = ref.current
    const block = (e) => e.preventDefault()
    el.addEventListener('wheel', block, { passive: false })
    return () => el.removeEventListener('wheel', block)
  }, [])

  const zoomed = t.s > 1
  return (
    <div
      ref={ref}
      className={`zoom ${zoomed ? 'is-zoomed' : ''}`}
      style={{ width: w, height: h }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={() => (drag.current = null)}
      onWheel={onWheel}
      data-cursor="view"
      data-cursor-label={zoomed ? 'Drag' : 'Zoom'}
    >
      <div
        className="zoom__inner"
        style={{
          transform: `translate3d(${t.x}px, ${t.y}px, 0) scale(${t.s})`,
          transition: drag.current ? 'none' : undefined,
          backgroundImage: `url(${item.img.sm.src})`,
        }}
      >
        <img
          src={item.img.lg.src}
          alt={item.title}
          className={loaded ? 'is-loaded' : ''}
          onLoad={() => setLoaded(true)}
          draggable={false}
        />
      </div>
      {!loaded && <span className="zoom__spin" aria-hidden="true" />}
    </div>
  )
}

/* ---------- raw / final side by side ---------- */
function SideBySide({ item, w, h }) {
  const stacked = item.w / item.h >= 1
  return (
    <div className={`sbs ${stacked ? 'is-stacked' : ''}`} style={{ width: w, height: h }}>
      {[
        ['Raw plates', item.before],
        ['Final', item.after],
      ].map(([label, layer]) => (
        <figure key={label} className="sbs__cell" style={{ backgroundImage: `url(${layer.img.sm.src})` }}>
          <img src={layer.img.md.src} alt={`${item.title}: ${label}`} draggable={false} />
          <figcaption className="mono">{label}</figcaption>
        </figure>
      ))}
    </div>
  )
}

function fit(W, H, ratio) {
  if (!W || !H) return { w: 0, h: 0 }
  const w = Math.min(W, H * ratio)
  return { w, h: w / ratio }
}

function Palette({ colors }) {
  const [copied, setCopied] = useState(null)
  if (!colors?.length) return null
  const copy = async (c) => {
    try {
      await navigator.clipboard.writeText(c)
      setCopied(c)
      setTimeout(() => setCopied(null), 1200)
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <div className="lb__palette" aria-label="Colour palette">
      <span className="mono">Swatches</span>
      <div>
        {colors.map((c) => (
          <button key={c} onClick={() => copy(c)} style={{ '--c': c }} title={`Copy ${c}`} aria-label={`Copy colour ${c}`}>
            <i />
            <span className="mono">{copied === c ? <Check /> : c}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- dialog ---------- */
function Dialog({ items, index, onClose, onStep }) {
  const item = items[index]
  const breakdown = breakdownFor(item)
  const isBA = item.cat === 'before-after'
  const defaultMode = isBA ? 'compare' : 'image'
  const [mode, setMode] = useState(defaultMode)
  const [dir, setDir] = useState(1)
  const stageRef = useRef(null)
  const dialogRef = useRef(null)
  const { width: W, height: H } = useElementSize(stageRef)

  useEffect(() => setMode(defaultMode), [item.id, defaultMode])

  const step = (d) => {
    setDir(d)
    onStep(d)
  }

  useEffect(() => {
    const prevFocus = document.activeElement
    dialogRef.current?.querySelector('.lb__close')?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' && !e.target.closest?.('[role="slider"]')) step(1)
      else if (e.key === 'ArrowLeft' && !e.target.closest?.('[role="slider"]')) step(-1)
      else if (e.key === 'Tab') {
        const f = [...dialogRef.current.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')].filter(
          (el) => !el.disabled && el.offsetParent !== null,
        )
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          last.focus()
          e.preventDefault()
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus()
          e.preventDefault()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      prevFocus?.focus?.({ preventScroll: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // preload neighbours
  useEffect(() => {
    ;[items[(index + 1) % items.length], items[(index - 1 + items.length) % items.length]].forEach((it) => {
      const src = it?.img?.lg?.src
      if (src) new Image().src = src
    })
  }, [index, items])

  let media = null
  const pair = breakdown
  if (mode === 'image' || !pair) {
    const view = isBA ? { ...item, img: item.after.img } : item
    const { w, h } = fit(W, H, item.w / item.h)
    media = w ? <ZoomImage key={item.id} item={view} w={w} h={h} onSwipe={step} /> : null
  } else if (mode === 'compare') {
    const { w, h } = fit(W, H, pair.w / pair.h)
    media = w ? <CompareSlider key={pair.id} item={pair} sweep sizes="100vw" style={{ width: w, height: h }} /> : null
  } else {
    const r = pair.w / pair.h
    const { w, h } = fit(W, H, r >= 1 ? r / 2 : r * 2)
    media = w ? <SideBySide item={pair} w={w} h={h} /> : null
  }

  const modes = pair
    ? [
        ['image', isBA ? 'Final' : 'Image', ImageIcon],
        ['compare', 'Compare', Compare],
        ['split', 'Side by side', Split],
      ]
    : null

  return (
    <motion.div
      ref={dialogRef}
      className="lb"
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title}, ${item.catName}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      data-lenis-prevent
    >
      <div className="lb__backdrop" onClick={onClose} />

      <div className="lb__top">
        <span className="lb__count mono">
          <b>{String(index + 1).padStart(2, '0')}</b> / {String(items.length).padStart(2, '0')}
        </span>
        {modes ? (
          <div className="lb__modes" role="tablist" aria-label="View mode">
            {modes.map(([m, label, Icon]) => (
              <button key={m} role="tab" aria-selected={mode === m} className={mode === m ? 'is-on' : ''} onClick={() => setMode(m)}>
                <Icon /> <span>{label}</span>
              </button>
            ))}
          </div>
        ) : (
          <span className="lb__tip mono">
            <ZoomIn /> Click to zoom · scroll to zoom · drag to pan
          </span>
        )}
        <button className="lb__close" onClick={onClose} aria-label="Close viewer">
          <span className="mono">Esc</span>
          <Close />
        </button>
      </div>

      <div ref={stageRef} className="lb__stage">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={`${item.id}-${mode}`}
            className="lb__media"
            custom={dir}
            initial={{ opacity: 0, x: dir * 60, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: dir * -60, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {media}
          </motion.div>
        </AnimatePresence>
      </div>

      {items.length > 1 && (
        <>
          <button className="lb__nav lb__nav--prev" onClick={() => step(-1)} aria-label="Previous">
            <ArrowLeft />
          </button>
          <button className="lb__nav lb__nav--next" onClick={() => step(1)} aria-label="Next">
            <ArrowRight />
          </button>
        </>
      )}

      <div className="lb__bottom">
        <div className="lb__meta">
          <span className="mono lb__cat">{item.catName}</span>
          <h3>{item.title}</h3>
          {item.note && <p>{item.note}</p>}
        </div>
        <Palette colors={item.palette} />
      </div>
    </motion.div>
  )
}

export default function Lightbox() {
  const { lightbox, closeLightbox, stepLightbox, lockScroll } = useApp()
  const open = !!lightbox

  useEffect(() => {
    if (!open) return
    lockScroll(true)
    return () => lockScroll(false)
  }, [open, lockScroll])

  return (
    <AnimatePresence>
      {open && (
        <Dialog key="lightbox" items={lightbox.items} index={lightbox.index} onClose={closeLightbox} onStep={stepLightbox} />
      )}
    </AnimatePresence>
  )
}
