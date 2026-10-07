import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useApp } from '../context/AppContext'
import { PROFILE } from '../data/profile'
import { useLocalTime } from '../hooks/useLocalTime'
import Logo from './ui/Logo'
import { Roll } from './ui/Reveal'
import { ArrowUpRight, Close, Menu } from './ui/Icons'
import './Nav.css'

export const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Work', href: '#work' },
  { label: 'Lab', href: '#lab' },
  { label: 'Archive', href: '#archive' },
  { label: 'Services', href: '#services' },
]

const EASE = [0.76, 0, 0.24, 1]

export default function Nav({ ready }) {
  const { scrollTo, lockScroll } = useApp()
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)
  const time = useLocalTime(PROFILE.timezone)

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setSolid(y > 40)
    setHidden((h) => (y > 400 && y > prev + 1 ? true : y < prev - 1 ? false : h))
  })

  useEffect(() => {
    if (!open) return
    lockScroll(true)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      lockScroll(false)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, lockScroll])

  const go = (e, href) => {
    e.preventDefault()
    setOpen(false)
    // let the menu close (and scroll unlock) before travelling
    setTimeout(() => scrollTo(href, { offset: href === '#top' ? 0 : -10 }), open ? 420 : 0)
  }

  return (
    <>
      <motion.header
        className={`nav ${solid ? 'is-solid' : ''} ${hidden && !open ? 'is-hidden' : ''}`}
        initial={{ y: -40, opacity: 0 }}
        animate={ready ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
      >
        <div className="nav__inner">
          <a href="#top" className="nav__brand" onClick={(e) => go(e, '#top')} aria-label="Lahiru Kalhara — back to top">
            <Logo size={38} />
            <span className="nav__name">
              <b>{PROFILE.name}</b>
              <span>{PROFILE.brand}</span>
            </span>
          </a>

          <nav className="nav__links" aria-label="Primary">
            {NAV_LINKS.map((l, i) => (
              <a key={l.href} href={l.href} onClick={(e) => go(e, l.href)}>
                <span className="nav__num">0{i + 1}</span>
                <Roll>{l.label}</Roll>
              </a>
            ))}
          </nav>

          <div className="nav__right">
            {PROFILE.available && (
              <span className="nav__status">
                <i /> Available for freelance
              </span>
            )}
            <a href="#contact" className="btn btn--solid btn--sm nav__cta" onClick={(e) => go(e, '#contact')}>
              <Roll>Let's talk</Roll>
              <ArrowUpRight />
            </a>
            <button
              className="nav__menu"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              {open ? <Close /> : <Menu />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="mmenu"
            initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
            exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            transition={{ duration: 0.75, ease: EASE }}
          >
            <nav className="mmenu__links" aria-label="Mobile">
              {[...NAV_LINKS, { label: 'Contact', href: '#contact' }].map((l, i) => (
                <div className="line-mask" key={l.href}>
                  <motion.a
                    href={l.href}
                    onClick={(e) => go(e, l.href)}
                    initial={{ y: '110%' }}
                    animate={{ y: '0%' }}
                    exit={{ y: '110%' }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 + i * 0.05 }}
                  >
                    <span className="mmenu__num">0{i + 1}</span>
                    {l.label}
                  </motion.a>
                </div>
              ))}
            </nav>
            <motion.div
              className="mmenu__foot mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.5 } }}
              exit={{ opacity: 0 }}
            >
              <span>
                {PROFILE.location} · {time}
              </span>
              {PROFILE.contact.instagram && (
                <a href={PROFILE.contact.instagram} target="_blank" rel="noreferrer">
                  Instagram ↗
                </a>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
