import { useCallback, useEffect, useRef, useState } from 'react'
import { useInView } from 'motion/react'
import { PLAYGROUND_ITEM, PLAYGROUND_TITLE } from '../data/works'
import Img from './ui/Img'
import { RevealLines, FadeUp } from './ui/Reveal'
import { Eye, Lock, Replay } from './ui/Icons'
import './Playground.css'

const BLENDS = [
  ['normal', 'Normal'],
  ['multiply', 'Multiply'],
  ['color-burn', 'Color Burn'],
  ['screen', 'Screen'],
  ['color-dodge', 'Color Dodge'],
  ['overlay', 'Overlay'],
  ['soft-light', 'Soft Light'],
  ['hard-light', 'Hard Light'],
  ['difference', 'Difference'],
  ['exclusion', 'Exclusion'],
  ['hue', 'Hue'],
  ['saturation', 'Saturation'],
  ['color', 'Color'],
  ['luminosity', 'Luminosity'],
]
const BLEND_NAME = Object.fromEntries(BLENDS)

// top of the list = top of the stack (like Photoshop)
const DEFAULTS = [
  { id: 'title', name: 'Title', kind: 'text', blend: 'normal', opacity: 100 },
  { id: 'grain', name: 'Film Grain', kind: 'grain', blend: 'overlay', opacity: 55 },
  { id: 'vignette', name: 'Vignette', kind: 'fx', blend: 'multiply', opacity: 85 },
  { id: 'light', name: 'Light Leak', kind: 'fx', blend: 'screen', opacity: 60 },
  { id: 'grade', name: 'Color Lookup', kind: 'fx', blend: 'soft-light', opacity: 65 },
  { id: 'composite', name: 'Composite', kind: 'image', blend: 'normal', opacity: 100 },
  { id: 'raw', name: 'Raw Plates', kind: 'image', blend: 'normal', opacity: 100, locked: true },
]
const BUILD_ORDER = ['composite', 'grade', 'light', 'vignette', 'grain', 'title']

const initialLayers = (built) => DEFAULTS.map((l) => ({ ...l, visible: built || l.id === 'raw' }))

export default function Playground() {
  const item = PLAYGROUND_ITEM
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const [layers, setLayers] = useState(() => initialLayers(false))
  const [selected, setSelected] = useState('composite')
  const [flash, setFlash] = useState(null)
  const timers = useRef([])

  const build = useCallback(() => {
    timers.current.forEach(clearTimeout)
    setLayers(initialLayers(false))
    setSelected('raw')
    BUILD_ORDER.forEach((id, i) => {
      timers.current.push(
        setTimeout(() => {
          setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, visible: true } : l)))
          setSelected(id)
          setFlash(id)
        }, 700 + i * 650),
      )
    })
    timers.current.push(setTimeout(() => setFlash(null), 700 + BUILD_ORDER.length * 650 + 400))
  }, [])

  useEffect(() => {
    if (inView) build()
  }, [inView, build])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  if (!item) return null
  const sel = layers.find((l) => l.id === selected)
  const update = (id, patch) => setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const visibleCount = layers.filter((l) => l.visible).length

  const content = (l) => {
    switch (l.id) {
      case 'raw':
        return <Img img={item.before.img} lqip={item.before.lqip} sizes="(min-width: 1000px) 60vw, 100vw" alt="Raw source photos" />
      case 'composite':
        return <Img img={item.after.img} lqip={item.after.lqip} sizes="(min-width: 1000px) 60vw, 100vw" alt="Final composite" />
      case 'title':
        return (
          <div className="pg__title">
            <span className="mono">LK Creations presents</span>
            <strong>{PLAYGROUND_TITLE}</strong>
            <span className="mono">Something is waiting in the beam</span>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <section id="playground" className="pg section" ref={ref}>
      <div className="container">
        <header className="shead">
          <span className="tab">
            <b>layers_panel.psd</b> @ 66.7% (RGB/8)
          </span>
          <div className="shead__row">
            <RevealLines
              className="shead__title"
              lines={[
                <>
                  Play with my <em>layers</em>
                </>,
              ]}
            />
            <FadeUp as="p" className="shead__lede">
              <span className="mono lab__idx">(04)</span> This is how I think. Every image is a stack of decisions.{' '}
              <strong>Toggle the eyes, swap blend modes, drag the opacity</strong>. It's a working mini Photoshop.
            </FadeUp>
          </div>
        </header>

        <div className="pg__wrap">
          <div className="pg__doc">
            <div className="pg__doc-tab mono">
              <span>{PLAYGROUND_TITLE.toLowerCase()}.psd @ 66.7% ({sel?.name}, RGB/8)</span>
              <span className="pg__doc-x" aria-hidden="true">
                ×
              </span>
            </div>
            <div className="pg__canvas" style={{ aspectRatio: `${item.w} / ${item.h}` }}>
              {[...layers].reverse().map((l) => (
                <div
                  key={l.id}
                  className={`pg__layer pg__layer--${l.id}`}
                  style={{ mixBlendMode: l.blend, opacity: l.visible ? l.opacity / 100 : 0 }}
                >
                  {content(l)}
                </div>
              ))}
            </div>
            <div className="pg__doc-info mono">
              <span>Doc: {visibleCount} of {layers.length} layers visible</span>
              <span>
                {sel?.name}: {BLEND_NAME[sel?.blend]} · {sel?.opacity}%
              </span>
            </div>
          </div>

          <div className="pg__panel" role="group" aria-label="Layers panel">
            <div className="pg__tabs">
              <span className="is-on">Layers</span>
              <span>Channels</span>
              <span>Paths</span>
              <button className="pg__rebuild" onClick={build} title="Rebuild the image layer by layer">
                <Replay /> Rebuild
              </button>
            </div>

            <div className="pg__props">
              <label className="pg__field">
                <span className="visually-hidden">Blend mode for {sel?.name}</span>
                <select
                  value={sel?.blend}
                  disabled={sel?.locked}
                  onChange={(e) => update(sel.id, { blend: e.target.value })}
                >
                  {BLENDS.map(([v, n]) => (
                    <option key={v} value={v}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="pg__opacity">
                <span>Opacity:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sel?.opacity ?? 100}
                  onChange={(e) => update(sel.id, { opacity: +e.target.value })}
                  aria-label={`Opacity for ${sel?.name}`}
                  style={{ '--v': `${sel?.opacity}%` }}
                />
                <b>{sel?.opacity}%</b>
              </label>
            </div>
            <div className="pg__lockrow">
              <span>
                Lock: <i>▦</i> <i>✎</i> <i>✥</i> <i>🔒︎</i>
              </span>
              <span>Fill: 100%</span>
            </div>

            <ul className="pg__list">
              {layers.map((l) => (
                <li
                  key={l.id}
                  className={`pg__row ${l.id === selected ? 'is-sel' : ''} ${flash === l.id ? 'is-flash' : ''} ${!l.visible ? 'is-off' : ''}`}
                >
                  <button
                    className="pg__eye"
                    onClick={() => update(l.id, { visible: !l.visible })}
                    aria-pressed={l.visible}
                    aria-label={`${l.visible ? 'Hide' : 'Show'} ${l.name}`}
                  >
                    {l.visible && <Eye />}
                  </button>
                  <button className="pg__sel" onClick={() => setSelected(l.id)} aria-label={`Select layer ${l.name}`}>
                    <span className={`pg__thumb pg__thumb--${l.id}`}>
                      {l.id === 'raw' && <Img img={item.before.img} size="sm" alt="" />}
                      {l.id === 'composite' && <Img img={item.after.img} size="sm" alt="" />}
                      {l.id === 'title' && <b>T</b>}
                      {(l.kind === 'fx' || l.kind === 'grain') && <span className={`pg__fx pg__layer--${l.id}`} />}
                    </span>
                    <span className="pg__name">
                      {l.name}
                      <small>{l.locked ? 'Background' : BLEND_NAME[l.blend]}</small>
                    </span>
                    {l.locked && <Lock className="pg__lock" />}
                  </button>
                </li>
              ))}
            </ul>
            <div className="pg__foot" aria-hidden="true">
              <span>
                <i>fx</i> <i>◐</i> <i>▣</i> <i>▭</i> <i>＋</i> <i>🗑︎</i>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
