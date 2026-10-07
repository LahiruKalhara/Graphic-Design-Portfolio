import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { useApp } from '../context/AppContext'
import { PROFILE } from '../data/profile'
import Logo from './ui/Logo'
import { Roll } from './ui/Reveal'
import './Footer.css'

export default function Footer() {
  const { scrollTo } = useApp()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const y = useTransform(scrollYProgress, [0, 1], ['45%', '0%'])

  return (
    <footer ref={ref} className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Logo size={42} />
          <span>
            © {new Date().getFullYear()} {PROFILE.name}
            <br />
            <span className="mono">{PROFILE.brand}</span>
          </span>
        </div>
        <span className="footer__made mono">Designed in Photoshop · Built with React</span>
        <button className="footer__top" onClick={() => scrollTo(0, { duration: 2 })} data-cursor="link">
          <Roll>Back to top ↑</Roll>
        </button>
      </div>
      <div className="footer__giant" aria-hidden="true">
        <motion.span style={{ y }}>{PROFILE.name}</motion.span>
      </div>
    </footer>
  )
}
