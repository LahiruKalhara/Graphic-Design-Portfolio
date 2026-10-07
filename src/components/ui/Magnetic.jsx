import { useRef } from 'react'
import { motion, useSpring } from 'motion/react'
import { useFinePointer } from '../../hooks/useMedia'

/** Pulls its child gently toward the cursor. */
export default function Magnetic({ children, strength = 0.32, className = '' }) {
  const ref = useRef(null)
  const fine = useFinePointer()
  const cfg = { stiffness: 200, damping: 16, mass: 0.6 }
  const x = useSpring(0, cfg)
  const y = useSpring(0, cfg)

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={`magnetic ${className}`}
      style={{ x, y, display: 'inline-flex' }}
      onPointerMove={fine ? onMove : undefined}
      onPointerLeave={reset}
    >
      {children}
    </motion.div>
  )
}
