import { useEffect, useRef } from 'react'
import { animate, motion, useInView, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react'
import Img from './ui/Img'
import './CompareSlider.css'

const clamp = (v, a = 0, b = 100) => Math.min(b, Math.max(a, v))

/** Drag-to-reveal before/after slider for a before-after item. */
export default function CompareSlider({
  item,
  sizes = '100vw',
  initial = 50,
  sweep = false,
  labels = ['Raw plates', 'Final'],
  className = '',
  style,
  priority = false,
}) {
  const ref = useRef(null)
  const handleRef = useRef(null)
  const dragging = useRef(false)
  const pos = useMotionValue(initial)
  const clip = useTransform(pos, (v) => `inset(0 ${100 - v}% 0 0)`)
  const left = useTransform(pos, (v) => `${v}%`)
  const tagL = useTransform(pos, [4, 16], [0, 1])
  const tagR = useTransform(pos, [84, 96], [1, 0])
  const inView = useInView(ref, { once: true, amount: 0.55 })

  useEffect(() => {
    if (!sweep || !inView) return
    const controls = animate(pos, [initial, 80, 22, initial], { duration: 2.8, ease: 'easeInOut', delay: 0.35 })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, sweep, item.id])

  useMotionValueEvent(pos, 'change', (v) => handleRef.current?.setAttribute('aria-valuenow', String(Math.round(v))))

  const setFrom = (e) => {
    const r = ref.current.getBoundingClientRect()
    pos.set(clamp(((e.clientX - r.left) / r.width) * 100))
  }
  const onDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return
    dragging.current = true
    pos.stop()
    ref.current.setPointerCapture?.(e.pointerId)
    setFrom(e)
  }
  const onMove = (e) => dragging.current && setFrom(e)
  const onUp = (e) => {
    dragging.current = false
    ref.current?.releasePointerCapture?.(e.pointerId)
  }
  const onKey = (e) => {
    const step = e.shiftKey ? 10 : 2
    const map = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step }
    if (e.key in map) pos.set(clamp(pos.get() + map[e.key]))
    else if (e.key === 'Home') pos.set(0)
    else if (e.key === 'End') pos.set(100)
    else return
    e.preventDefault()
  }

  return (
    <div
      ref={ref}
      className={`cmp ${className}`}
      style={{ aspectRatio: `${item.w} / ${item.h}`, ...style }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      data-cursor="drag"
    >
      <Img
        key={`a-${item.id}`}
        className="cmp__img"
        img={item.after.img}
        lqip={item.after.lqip}
        sizes={sizes}
        alt={`${item.title}: final composite`}
        priority={priority}
      />
      <motion.div className="cmp__before" style={{ clipPath: clip }}>
        <Img
          key={`b-${item.id}`}
          className="cmp__img"
          img={item.before.img}
          lqip={item.before.lqip}
          sizes={sizes}
          alt={`${item.title}: raw source photos`}
          priority={priority}
        />
      </motion.div>
      <motion.div className="cmp__line" style={{ left }} aria-hidden="true" />
      <motion.div
        ref={handleRef}
        className="cmp__handle"
        style={{ left }}
        role="slider"
        tabIndex={0}
        aria-label={`Compare raw and final: ${item.title}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={initial}
        aria-valuetext="Percent of raw layer shown"
        onKeyDown={onKey}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 7 4 12l5 5M15 7l5 5-5 5" />
        </svg>
      </motion.div>
      <motion.span className="cmp__tag cmp__tag--l mono" style={{ opacity: tagL }}>
        {labels[0]}
      </motion.span>
      <motion.span className="cmp__tag cmp__tag--r mono" style={{ opacity: tagR }}>
        {labels[1]}
      </motion.span>
    </div>
  )
}
