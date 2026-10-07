import { PROFILE } from '../data/profile'
import { useLocalTime } from '../hooks/useLocalTime'
import Magnetic from './ui/Magnetic'
import { RevealLines, FadeUp } from './ui/Reveal'
import { ArrowUpRight, Briefcase, Globe, Instagram, Mail, WhatsApp } from './ui/Icons'
import './Contact.css'

const handleFrom = (url) => '@' + url.replace(/\/+$/, '').split('/').pop()

// "0719223292" or "+94 71 922 3292" -> "94719223292" (Sri Lanka code assumed for local numbers)
const waNumber = (n) => n.replace(/\D/g, '').replace(/^0/, '94')
const waDisplay = (d) =>
  d.startsWith('94') && d.length === 11 ? `+94 ${d.slice(2, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : `+${d}`
// let long email addresses wrap at the @ instead of mid-word
const breakAtSign = (v) => {
  const i = v.indexOf('@')
  return i > 0 ? (
    <>
      {v.slice(0, i)}
      <wbr />
      {v.slice(i)}
    </>
  ) : (
    v
  )
}

const MAIL_SUBJECT = 'Project enquiry from your portfolio'
const WA_TEXT = "Hi Lahiru! I saw your portfolio and I'd like to talk about a project."

export default function Contact() {
  const c = PROFILE.contact
  const time = useLocalTime(PROFILE.timezone)
  const wa = c.whatsapp ? waNumber(c.whatsapp) : ''

  // only entries with a `cta` can become the big round button
  const links = [
    c.email && {
      label: 'Email',
      value: c.email,
      href: `mailto:${c.email}?subject=${encodeURIComponent(MAIL_SUBJECT)}`,
      Icon: Mail,
      cta: 'Email me',
    },
    wa && {
      label: 'WhatsApp',
      value: waDisplay(wa),
      href: `https://wa.me/${wa}?text=${encodeURIComponent(WA_TEXT)}`,
      Icon: WhatsApp,
      cta: 'WhatsApp me',
    },
    c.fiverr && { label: 'Fiverr', value: 'Hire me on Fiverr', href: c.fiverr, Icon: Briefcase, cta: 'Hire on Fiverr' },
    c.instagram && { label: 'Instagram', value: handleFrom(c.instagram), href: c.instagram, Icon: Instagram },
    c.behance && { label: 'Behance', value: handleFrom(c.behance), href: c.behance, Icon: Globe },
    c.facebook && { label: 'Facebook', value: handleFrom(c.facebook), href: c.facebook, Icon: Globe },
    c.linkedin && { label: 'LinkedIn', value: handleFrom(c.linkedin), href: c.linkedin, Icon: Globe },
  ].filter(Boolean)
  const primary = links.find((l) => l.cta)
  const external = (href) => (href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})

  return (
    <section id="contact" className="contact">
      <div className="contact__glow" aria-hidden="true" />
      <div className="container">
        <span className="tab">
          <b>contact.psd</b> @ 100% (RGB/8)
        </span>

        <div className="contact__grid">
          <RevealLines
            as="h2"
            className="contact__title"
            lines={[
              'Got a wild idea?',
              <>
                <em>Let's</em> make it
              </>,
              'real.',
            ]}
          />

          {primary && (
            <FadeUp className="contact__cta" delay={0.2}>
              <Magnetic strength={0.4}>
                <a className="contact__circle" href={primary.href} {...external(primary.href)} data-cursor="link">
                  <svg className="contact__ring" viewBox="0 0 200 200" aria-hidden="true">
                    <defs>
                      <path id="ring" d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0" />
                    </defs>
                    <text>
                      <textPath href="#ring">Let's work together • Let's work together • </textPath>
                    </text>
                  </svg>
                  <span className="contact__circle-core">
                    <ArrowUpRight />
                    <span>{primary.cta}</span>
                  </span>
                </a>
              </Magnetic>
            </FadeUp>
          )}
        </div>

        <ul className="contact__links">
          {links.map(({ label, value, href, Icon }, i) => (
            <FadeUp as="li" key={label} delay={i * 0.06}>
              <a href={href} {...external(href)} data-cursor="link">
                <span className="contact__icon">
                  <Icon />
                </span>
                <span className="contact__label mono">{label}</span>
                <span className="contact__value">{breakAtSign(value)}</span>
                <ArrowUpRight className="contact__arrow" />
              </a>
            </FadeUp>
          ))}
        </ul>

        <div className="contact__meta">
          <div>
            <span className="mono">Location</span>
            <p>{PROFILE.location} · GMT+5:30</p>
          </div>
          <div>
            <span className="mono">Local time</span>
            <p>{time}</p>
          </div>
          <div>
            <span className="mono">Status</span>
            <p>
              <i className="contact__dot" /> {PROFILE.available ? 'Available for freelance' : 'Booked right now'}
            </p>
          </div>
          <div>
            <span className="mono">Works with</span>
            <p>Local brands · Fiverr clients worldwide</p>
          </div>
        </div>
      </div>
    </section>
  )
}
