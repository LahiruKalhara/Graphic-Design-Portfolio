import { useEffect, useRef } from 'react'

/**
 * Custom cursor. Elements opt in with data attributes:
 *   data-cursor="view|drag|link|brush|hide"  data-cursor-label="Open"
 */
export default function Cursor() {
  const rootRef = useRef(null)
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const labelRef = useRef(null)

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    if (!fine.matches) return
    document.documentElement.classList.add('has-cursor')

    const root = rootRef.current
    let x = -100
    let y = -100
    let rx = x
    let ry = y
    let visible = false
    let mode = ''
    let raf

    const setMode = (m, label) => {
      if (m === mode && !label) return
      root.classList.remove(`is-${mode}`)
      mode = m
      if (m) root.classList.add(`is-${m}`)
      labelRef.current.textContent = label || (m === 'drag' ? 'Drag' : m === 'view' ? 'View' : '')
    }

    const onMove = (e) => {
      x = e.clientX
      y = e.clientY
      if (!visible) {
        visible = true
        rx = x
        ry = y
        root.classList.remove('is-hidden')
      }
      dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }
    const modeFor = (target) => {
      const el = target?.closest?.('[data-cursor], a, button, [role="button"], select, input, label')
      if (!el) {
        root.classList.remove('is-dark')
        return setMode('')
      }
      const m = el.dataset.cursor || 'link'
      setMode(m === 'none' ? '' : m, el.dataset.cursorLabel)
      root.classList.toggle('is-dark', el.dataset.cursorTone === 'dark')
    }
    const onOver = (e) => modeFor(e.target)
    // content moves under a still pointer while scrolling: re-check what's underneath
    let scrollRaf = 0
    const onScroll = () => {
      if (!visible || scrollRaf) return
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0
        modeFor(document.elementFromPoint(x, y))
      })
    }
    const onLeaveWindow = () => {
      visible = false
      root.classList.add('is-hidden')
    }
    const onDown = () => root.classList.add('is-down')
    const onUp = () => root.classList.remove('is-down')

    const loop = () => {
      rx += (x - rx) * 0.2
      ry += (y - ry) * 0.2
      ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('pointerover', onOver, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeaveWindow)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    return () => {
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('has-cursor')
      cancelAnimationFrame(scrollRaf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('pointerover', onOver)
      document.documentElement.removeEventListener('pointerleave', onLeaveWindow)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  return (
    <div ref={rootRef} className="cursor is-hidden" aria-hidden="true">
      <div ref={ringRef} className="cursor__ring">
        <span className="cursor__cross" />
        <span ref={labelRef} className="cursor__label" />
      </div>
      <div ref={dotRef} className="cursor__dot" />
    </div>
  )
}
