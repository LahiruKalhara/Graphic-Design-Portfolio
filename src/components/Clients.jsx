import { Fragment } from 'react'
import { CLIENTS } from '../data/meta'
import { FadeUp } from './ui/Reveal'
import './Clients.css'

export default function Clients() {
  return (
    <section className="clients" aria-labelledby="clients-title">
      <div className="container">
        <div className="clients__head">
          <span className="tab">
            <b>clients.psd</b> @ 100% (RGB/8)
          </span>
          <h2 id="clients-title" className="mono">
            Designed for
          </h2>
          <p>
            <b>100+</b> local clients · <b>20+</b> international clients on Fiverr · <b>~500</b> projects
          </p>
        </div>
        <FadeUp as="ul" className="clients__wall">
          {CLIENTS.map((c, i) => (
            <Fragment key={c}>
              <li>{c}</li>
              {i < CLIENTS.length - 1 && (
                <li className="clients__sep" aria-hidden="true">
                  /
                </li>
              )}
            </Fragment>
          ))}
        </FadeUp>
      </div>
    </section>
  )
}
