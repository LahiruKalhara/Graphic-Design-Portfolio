import { useRef } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react'

/** Photoshop-style ruler on the right edge that tracks page scroll. */
export default function Ruler() {
  const { scrollYProgress } = useScroll()
  const top = useTransform(scrollYProgress, (v) => `${v * 100}%`)
  const label = useRef(null)
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (label.current) label.current.textContent = `${Math.round(v * 100)}%`
  })
  return (
    <div className="ruler" aria-hidden="true">
      <motion.div className="ruler__mark" style={{ top }}>
        <span ref={label}>0%</span>
      </motion.div>
    </div>
  )
}
