import { Fragment, useEffect, useRef } from 'react'
import { animate, motion, useInView } from 'motion/react'

const EASE = [0.22, 1, 0.36, 1]

/** Lines that slide up from behind a mask when they enter the viewport. */
export function RevealLines({ lines, as: Tag = 'h2', className = '', delay = 0, stagger = 0.09, play }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const show = play ?? inView
  return (
    <Tag ref={ref} className={className}>
      {lines.map((line, i) => (
        <span className="line-mask" key={i}>
          <motion.span
            style={{ display: 'block' }}
            initial={{ y: '108%' }}
            animate={show ? { y: '0%' } : { y: '108%' }}
            transition={{ duration: 1.05, ease: EASE, delay: delay + i * stagger }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}

/** Word-by-word reveal for plain strings. */
export function RevealWords({ text, as: Tag = 'span', className = '', delay = 0, stagger = 0.035 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const words = text.split(' ')
  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="rw" aria-hidden="true">
            <motion.span
              className="rw__in"
              initial={{ y: '110%' }}
              animate={inView ? { y: '0%' } : {}}
              transition={{ duration: 0.9, ease: EASE, delay: delay + i * stagger }}
            >
              {w}
            </motion.span>
          </span>{' '}
        </Fragment>
      ))}
    </Tag>
  )
}

export function FadeUp({ children, delay = 0, y = 28, className = '', as = 'div', ...rest }) {
  const M = motion[as]
  return (
    <M
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.9, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </M>
  )
}

/** Number that counts up once it scrolls into view. */
export function Counter({ value, pad = 0, duration = 2.2 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' })
  const fmt = (v) => String(Math.round(v)).padStart(pad, '0')
  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = fmt(v)
      },
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value])
  return <span ref={ref}>{fmt(0)}</span>
}

/** Text that rolls to a duplicate of itself on hover (styles in global.css). */
export const Roll = ({ children }) => (
  <span className="roll">
    <span data-text={children}>{children}</span>
  </span>
)
