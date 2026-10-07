import { itemsByCat } from '../data/works'
import { useApp } from '../context/AppContext'
import Img from './ui/Img'
import { RevealLines, FadeUp } from './ui/Reveal'
import { Play } from './ui/Icons'
import './Thumbnails.css'

function Row({ items, reverse, duration, onOpen }) {
  return (
    <div className={`trow ${reverse ? 'trow--rev' : ''}`}>
      <div className="trow__track" style={{ animationDuration: `${duration}s` }}>
        {[...items, ...items].map((it, i) => {
          const clone = i >= items.length
          return (
            <button
              key={`${it.id}-${i}`}
              className="tcard"
              onClick={() => onOpen(it)}
              aria-hidden={clone || undefined}
              tabIndex={clone ? -1 : 0}
              aria-label={clone ? undefined : `Open thumbnail: ${it.title}`}
              data-cursor="view"
              data-cursor-label="Play"
            >
              <span className="tcard__frame">
                <Img img={it.img} lqip={it.lqip} sizes="(min-width: 900px) 420px, 280px" alt={clone ? '' : it.title} />
                <span className="tcard__play" aria-hidden="true">
                  <Play />
                </span>
              </span>
              <span className="tcard__title">{it.title}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Thumbnails() {
  const { openLightbox } = useApp()
  const items = itemsByCat('thumbnails')
  if (!items.length) return null
  const half = Math.ceil(items.length / 2)
  const rowB = [...items.slice(half), ...items.slice(0, half)]
  const open = (it) => openLightbox(items, items.indexOf(it))

  return (
    <section id="thumbnails" className="thumbs section">
      <div className="container">
        <header className="shead">
          <span className="tab">
            <b>thumbnails.psd</b> @ 100% (RGB/8)
          </span>
          <div className="shead__row">
            <RevealLines
              className="shead__title"
              lines={[
                <>Thumbnails that</>,
                <>
                  <em>win the click</em>
                </>,
              ]}
            />
            <FadeUp as="p" className="shead__lede">
              <span className="mono lab__idx">(05)</span> Bold faces, huge type, an instant story. Built to read at a glance
              for <strong>health, finance, music and sports</strong> channels.
            </FadeUp>
          </div>
        </header>
      </div>
      <div className="thumbs__rows">
        <Row items={items} duration={70} onOpen={open} />
        <Row items={rowB} duration={80} reverse onOpen={open} />
      </div>
    </section>
  )
}
