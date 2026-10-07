import { useRef } from 'react'
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from 'motion/react'
import './Marquee.css'

const wrap = (min, max, v) => {
  const r = max - min
  return ((((v - min) % r) + r) % r) + min
}

/** Infinite marquee that speeds up (and flips) with scroll velocity. */
export function VelocityMarquee({ children, speed = 3, className = '', copies = 4 }) {
  const baseX = useMotionValue(0)
  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 })
  const factor = useTransform(smooth, [0, 1000], [0, 4], { clamp: false })
  const x = useTransform(baseX, (v) => `${wrap(-100 / copies, 0, v)}%`)
  const dir = useRef(1)
  const reduce = useReducedMotion()

  useAnimationFrame((_, delta) => {
    if (reduce) return
    const f = factor.get()
    if (f < 0) dir.current = -1
    else if (f > 0) dir.current = 1
    // `speed` sets the base direction; scrolling up reverses it, scrolling fast boosts it
    baseX.set(baseX.get() + dir.current * speed * (delta / 1000) * (1 + Math.abs(f)))
  })

  return (
    <div className={`vmarquee ${className}`}>
      <motion.div className="vmarquee__track" style={{ x }}>
        {Array.from({ length: copies }, (_, i) => (
          <div className="vmarquee__group" key={i} aria-hidden={i > 0 ? 'true' : undefined}>
            {children}
          </div>
        ))}
      </motion.div>
    </div>
  )
}

const WORDS = ['Photo Manipulation', 'Posters', 'Flyers', 'Banners', 'YouTube Thumbnails', 'Photo Frames', 'Retouching', 'Video Editing']

export default function MarqueeBands() {
  return (
    <section className="bands" aria-label="Services">
      <VelocityMarquee className="band band--a" speed={2.2}>
        {WORDS.map((w) => (
          <span className="band__item" key={w}>
            {w}
            <svg className="band__star" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 0c.6 6.6 5.4 11.4 12 12-6.6.6-11.4 5.4-12 12-.6-6.6-5.4-11.4-12-12C6.6 11.4 11.4 6.6 12 0Z" />
            </svg>
          </span>
        ))}
      </VelocityMarquee>
      <VelocityMarquee className="band band--b" speed={-1.6}>
        {['Photoshop', 'Premiere Pro', '8 Years', '500+ Projects', '100+ Local Clients', '20+ Fiverr Clients'].map((w) => (
          <span className="band__item" key={w}>
            {w}
            <span className="band__dot" aria-hidden="true" />
          </span>
        ))}
      </VelocityMarquee>
    </section>
  )
}
