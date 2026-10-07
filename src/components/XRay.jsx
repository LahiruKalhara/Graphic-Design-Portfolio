import { useEffect, useRef } from 'react'

/**
 * Paints the "raw plates" layer over the hero through a soft, fading brush mask
 * (like painting on a layer mask in Photoshop). Follows the pointer; when idle,
 * a ghost brush wanders by itself so the effect is discoverable on touch too.
 */
export default function XRay({ src, focus = [0.5, 0.5], hostRef, swapDelay = 650 }) {
  const canvasRef = useRef(null)
  const s = useRef({ img: null, focus, target: null, pos: null, lastInput: -1e9, r: 160, dpr: 1, running: false })

  useEffect(() => {
    s.current.focus = focus
  }, [focus])

  // load (and swap) the raw layer
  useEffect(() => {
    let cancelled = false
    const im = new Image()
    im.decoding = 'async'
    im.src = src
    const timer = setTimeout(() => {
      const apply = () => !cancelled && (s.current.img = im)
      if (im.decode) im.decode().then(apply, apply)
      else im.onload = apply
    }, s.current.img ? swapDelay : 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [src, swapDelay])

  useEffect(() => {
    const canvas = canvasRef.current
    const host = hostRef?.current || canvas.parentElement
    const ctx = canvas.getContext('2d')
    const mask = document.createElement('canvas')
    const mctx = mask.getContext('2d')
    const st = s.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let visible = true

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      canvas.width = mask.width = Math.max(1, Math.round(w * dpr))
      canvas.height = mask.height = Math.max(1, Math.round(h * dpr))
      st.dpr = dpr
      st.r = Math.max(80, Math.min(190, w * 0.105))
      document.documentElement.style.setProperty('--brush', `${Math.round(st.r * 2)}px`)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const stamp = (x, y, r, a) => {
      const g = mctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, `rgba(0,0,0,${a})`)
      g.addColorStop(0.5, `rgba(0,0,0,${a * 0.8})`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      mctx.fillStyle = g
      mctx.beginPath()
      mctx.arc(x, y, r, 0, Math.PI * 2)
      mctx.fill()
    }

    const drawCover = (img) => {
      const cw = canvas.width
      const ch = canvas.height
      const iw = img.naturalWidth
      const ih = img.naturalHeight
      const k = Math.max(cw / iw, ch / ih)
      const dw = iw * k
      const dh = ih * k
      const [fx, fy] = st.focus
      ctx.drawImage(img, (cw - dw) * fx, (ch - dh) * fy, dw, dh)
    }

    const frame = (now) => {
      raf = 0
      if (!visible) return
      // heal the mask a little every frame -> trails fade out
      mctx.globalCompositeOperation = 'destination-out'
      mctx.fillStyle = 'rgba(0,0,0,0.05)'
      mctx.fillRect(0, 0, mask.width, mask.height)
      mctx.globalCompositeOperation = 'source-over'

      const r = st.r * st.dpr
      const idle = now - st.lastInput > 2600
      let target = st.target
      if (idle && !reduced) {
        const t = now / 1000
        target = {
          x: mask.width * (0.5 + 0.32 * Math.sin(t * 0.5)),
          y: mask.height * (0.46 + 0.2 * Math.sin(t * 0.83 + 1.2)),
        }
      }
      if (target) {
        if (!st.pos) st.pos = { ...target }
        const ease = idle ? 0.06 : 0.32
        const nx = st.pos.x + (target.x - st.pos.x) * ease
        const ny = st.pos.y + (target.y - st.pos.y) * ease
        const dist = Math.hypot(nx - st.pos.x, ny - st.pos.y)
        const steps = Math.max(1, Math.ceil(dist / (r * 0.12)))
        for (let i = 1; i <= steps; i++) {
          const f = i / steps
          stamp(st.pos.x + (nx - st.pos.x) * f, st.pos.y + (ny - st.pos.y) * f, idle ? r * 0.85 : r, idle ? 0.07 / steps + 0.03 : 0.2)
        }
        st.pos.x = nx
        st.pos.y = ny
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (st.img) {
        drawCover(st.img)
        ctx.globalCompositeOperation = 'destination-in'
        ctx.drawImage(mask, 0, 0)
        ctx.globalCompositeOperation = 'source-over'
      }
      raf = requestAnimationFrame(frame)
    }
    const start = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame)
    }

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      st.target = { x: (e.clientX - rect.left) * st.dpr, y: (e.clientY - rect.top) * st.dpr }
      if (!st.pos || performance.now() - st.lastInput > 2600) st.pos = { ...st.target }
      st.lastInput = performance.now()
      start()
    }
    const onLeave = () => {
      st.target = null
      st.lastInput = performance.now() - 1500 // resume the ghost brush soon after leaving
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
      else if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    })
    io.observe(canvas)
    const onVis = () => (document.hidden ? (cancelAnimationFrame(raf), (raf = 0)) : start())
    document.addEventListener('visibilitychange', onVis)
    host.addEventListener('pointermove', onMove, { passive: true })
    host.addEventListener('pointerdown', onMove, { passive: true })
    host.addEventListener('pointerleave', onLeave)
    start()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerdown', onMove)
      host.removeEventListener('pointerleave', onLeave)
    }
  }, [hostRef])

  return <canvas ref={canvasRef} className="xray" aria-hidden="true" />
}
