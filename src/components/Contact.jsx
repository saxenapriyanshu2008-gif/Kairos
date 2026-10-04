import { useEffect, useRef, useState } from 'react'
import { CONTACT, FORM_ENDPOINT, TOPICS } from '../data/contact'
import { watches } from '../data/watches'

/*
  Contact: three ways to reach the studio (email, call, message form).
  The form asks for full details, validates them inline (real labels, errors
  linked with aria-describedby, a polite live region for the result) and sends
  everything to the studio inbox through FormSubmit. If sending fails, it
  opens the visitor's own email app with the same details filled in.
*/

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^[+()\-\s\d]{7,20}$/
const EMPTY = { name: '', email: '', phone: '', city: '', topic: TOPICS[0], watch: '', contactBy: 'Email', message: '', consent: false, website: '' }

function validate(v) {
  const e = {}
  if (v.name.trim().length < 2) e.name = 'Please tell us your full name.'
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Please enter a valid email address.'
  if (!PHONE_RE.test(v.phone.trim())) e.phone = 'Please enter a phone number with country code, for example +91 98765 43210.'
  if (v.city.trim().length < 2) e.city = 'Please tell us your city and country.'
  if (v.message.trim().length < 10) e.message = 'Your message should be at least 10 characters.'
  if (!v.consent) e.consent = 'Please agree so we can use these details to reply to you.'
  return e
}

const telHref = `tel:${CONTACT.phone.replace(/[^\d+]/g, '')}`

// Inside some embedded previews (sandboxed frames) the browser is not allowed to
// hand mailto: and tel: links to another app. There we try a new window and also
// offer web mail and copy options. On a normal page the links just work.
const isFramed = () => {
  try {
    return window.self !== window.top
  } catch {
    return true
  }
}
const webMail = (subject = '', body = '') => ({
  gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  outlook: `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(CONTACT.email)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
})

function ReachHelp({ help, onClose }) {
  const [copied, setCopied] = useState('')
  if (!help) return null
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
    } catch {
      setCopied('')
      window.prompt('Copy this:', text)
    }
  }
  const links = webMail(help.subject, help.body)
  return (
    <div className="reach-help" role="dialog" aria-label={help.kind === 'mail' ? 'Ways to email us' : 'Ways to call us'}>
      {help.kind === 'mail' ? (
        <>
          <p>If your mail app did not open, write to us here:</p>
          <div className="reach-actions">
            <a className="chip chip-light" href={links.gmail} target="_blank" rel="noopener noreferrer">Open in Gmail</a>
            <a className="chip chip-light" href={links.outlook} target="_blank" rel="noopener noreferrer">Open in Outlook</a>
            <button type="button" className="chip chip-light" onClick={() => copy(CONTACT.email)}>
              {copied === CONTACT.email ? 'Address copied' : 'Copy address'}
            </button>
          </div>
          <p className="reach-addr">{CONTACT.email}</p>
        </>
      ) : (
        <>
          <p>If your phone app did not open, call us on:</p>
          <p className="reach-addr">{CONTACT.phone}</p>
          <div className="reach-actions">
            <button type="button" className="chip chip-light" onClick={() => copy(CONTACT.phone)}>
              {copied === CONTACT.phone ? 'Number copied' : 'Copy number'}
            </button>
          </div>
        </>
      )}
      <button type="button" className="reach-close" onClick={onClose} aria-label="Close">×</button>
    </div>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3.5 6l8.5 7 8.5-7" />
    </svg>
  )
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M6.5 3.5h3l1.5 4-2 1.3a11 11 0 006.2 6.2l1.3-2 4 1.5v3a2 2 0 01-2.2 2A17 17 0 014.5 5.7a2 2 0 012-2.2z" />
    </svg>
  )
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M4 5h16v11H9l-5 4z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </svg>
  )
}

export default function Contact() {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ state: 'idle' }) // idle | sending | sent | fallback | error
  const formRef = useRef(null)
  const [help, setHelp] = useState(null)

  // mailto: / tel: links: normal behaviour on a normal page, extra help inside a sandboxed preview
  const reach = (kind, href, subject = '', body = '') => (e) => {
    if (!isFramed()) return
    e.preventDefault()
    try {
      window.open(href, '_blank')
    } catch {
      /* blocked: the help panel below covers it */
    }
    setHelp({ kind, subject, body })
  }

  // the configurator can pre-fill the message
  useEffect(() => {
    const onPrefill = (e) => {
      setValues((v) => ({ ...v, message: e.detail, topic: 'My configuration' }))
      setStatus({ state: 'idle' })
      setTimeout(() => formRef.current?.querySelector('#c-name')?.focus({ preventScroll: true }), 700)
    }
    window.addEventListener('kairos:prefill', onPrefill)
    return () => window.removeEventListener('kairos:prefill', onPrefill)
  }, [])

  const update = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setValues((v) => ({ ...v, [k]: val }))
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }))
  }

  const summary = (v) =>
    [
      `Name: ${v.name.trim()}`,
      `Email: ${v.email.trim()}`,
      `Phone: ${v.phone.trim()}`,
      `City / country: ${v.city.trim()}`,
      `Topic: ${v.topic}`,
      `Watch: ${v.watch || 'Not specified'}`,
      `Preferred reply: ${v.contactBy}`,
      '',
      v.message.trim(),
    ].join('\n')

  const mailtoFor = (v) =>
    `mailto:${CONTACT.email}?subject=${encodeURIComponent(`KAIROS enquiry: ${v.topic} from ${v.name.trim()}`)}&body=${encodeURIComponent(summary(v))}`

  const submit = async (e) => {
    e.preventDefault()
    if (status.state === 'sending') return
    const errs = validate(values)
    setErrors(errs)
    const firstBad = Object.keys(errs)[0]
    if (firstBad) {
      formRef.current.querySelector(`#c-${firstBad}`)?.focus()
      return
    }
    if (values.website) return // honeypot: bots fill hidden fields
    const v = values
    const first = v.name.trim().split(' ')[0]
    setStatus({ state: 'sending' })
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 15000)
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          _subject: `KAIROS enquiry: ${v.topic} from ${v.name.trim()}`,
          _template: 'table',
          _captcha: 'false',
          _replyto: v.email.trim(),
          Name: v.name.trim(),
          Email: v.email.trim(),
          Phone: v.phone.trim(),
          'City / country': v.city.trim(),
          Topic: v.topic,
          Watch: v.watch || 'Not specified',
          'Preferred reply': v.contactBy,
          Message: v.message.trim(),
          'Sent from': window.location.href.split('#')[0],
        }),
      })
      clearTimeout(timer)
      const data = await res.json().catch(() => ({}))
      if (!res.ok || String(data.success) === 'false') throw new Error(data.message || `HTTP ${res.status}`)
      setStatus({ state: 'sent', first })
      setValues(EMPTY)
    } catch (err) {
      // could not reach the mail service: hand the same message to the visitor's email app
      setStatus({ state: 'fallback', first, href: mailtoFor(v), web: webMail(`KAIROS enquiry: ${v.topic} from ${v.name.trim()}`, summary(v)), reason: String(err.message || err) })
    }
  }

  const describedBy = (k, hint) => [errors[k] ? `c-${k}-err` : null, hint ? `c-${k}-hint` : null].filter(Boolean).join(' ') || undefined
  const err = (k) =>
    errors[k] && (
      <p id={`c-${k}-err`} className="field-error">
        {errors[k]}
      </p>
    )
  const field = (k, label, type = 'text', props = {}, hint) => (
    <div className={`field ${errors[k] ? 'has-error' : ''}`}>
      <label htmlFor={`c-${k}`}>
        {label} <span className="req" aria-hidden="true">*</span>
      </label>
      {type === 'textarea' ? (
        <textarea id={`c-${k}`} rows={5} value={values[k]} onChange={update(k)} required aria-invalid={!!errors[k]} aria-describedby={describedBy(k, hint)} {...props} />
      ) : (
        <input id={`c-${k}`} type={type} value={values[k]} onChange={update(k)} required aria-invalid={!!errors[k]} aria-describedby={describedBy(k, hint)} {...props} />
      )}
      {hint && (
        <p id={`c-${k}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {err(k)}
    </div>
  )

  const goForm = (e) => {
    e.preventDefault()
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => formRef.current?.querySelector('#c-name')?.focus({ preventScroll: true }), 600)
  }

  return (
    <section id="contact" className="section contact theme-light" aria-labelledby="contact-title">
      <div className="contact-grid">
        <div className="contact-copy">
          <p className="eyebrow" data-reveal>Chapter VII &nbsp;/&nbsp; Contact</p>
          <h2 id="contact-title" className="display-l" data-split>
            Start a <em>conversation.</em>
          </h2>
          <p className="lede" data-reveal>Questions about a model, a configuration or a private viewing. Write, call or send us a message. We reply within two working days.</p>

          <ul className="contact-ways" aria-label="Ways to contact us">
            <li>
              <a className="way" href={`mailto:${CONTACT.email}?subject=${encodeURIComponent('Hello KAIROS')}`} onClick={reach('mail', `mailto:${CONTACT.email}?subject=${encodeURIComponent('Hello KAIROS')}`, 'Hello KAIROS')}>
                <span className="way-icon"><MailIcon /></span>
                <span className="way-text">
                  <strong>Email us</strong>
                  <em>{CONTACT.email}</em>
                </span>
              </a>
            </li>
            <li>
              <a className="way" href={telHref} onClick={reach('tel', telHref)}>
                <span className="way-icon"><PhoneIcon /></span>
                <span className="way-text">
                  <strong>Call us</strong>
                  <em>{CONTACT.phone}</em>
                </span>
              </a>
            </li>
            <li>
              <a className="way" href="#contact-form" onClick={goForm}>
                <span className="way-icon"><ChatIcon /></span>
                <span className="way-text">
                  <strong>Send a message</strong>
                  <em>Use the form, we reply by email or phone</em>
                </span>
              </a>
            </li>
          </ul>
          <ReachHelp help={help} onClose={() => setHelp(null)} />

          <address className="contact-studio" data-reveal>
            <p className="studio-name">KAIROS Studio</p>
            <dl>
              <div><dt>Studio</dt><dd>{CONTACT.city}</dd></div>
              <div><dt>Email</dt><dd><a href={`mailto:${CONTACT.email}`} onClick={reach('mail', `mailto:${CONTACT.email}`)}>{CONTACT.email}</a></dd></div>
              <div><dt>Phone</dt><dd><a href={telHref} onClick={reach('tel', telHref)}>{CONTACT.phone}</a></dd></div>
              <div><dt>Hours</dt><dd>{CONTACT.hours}</dd></div>
            </dl>
          </address>
        </div>

        <form id="contact-form" ref={formRef} className="contact-form" onSubmit={submit} noValidate aria-describedby="c-required">
          <p className="form-title">Send a message</p>
          <p id="c-required" className="field-hint">All fields marked * are required.</p>
          <div className="field-row">
            {field('name', 'Full name', 'text', { autoComplete: 'name' })}
            {field('email', 'Email', 'email', { autoComplete: 'email', inputMode: 'email' })}
          </div>
          <div className="field-row">
            {field('phone', 'Phone', 'tel', { autoComplete: 'tel', inputMode: 'tel', placeholder: '+91 98765 43210' })}
            {field('city', 'City and country', 'text', { autoComplete: 'address-level2', placeholder: 'New Delhi, India' })}
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="c-topic">Topic</label>
              <select id="c-topic" value={values.topic} onChange={update('topic')}>
                {TOPICS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="c-watch">Watch (optional)</label>
              <select id="c-watch" value={values.watch} onChange={update('watch')}>
                <option value="">Not sure yet</option>
                {watches.map((w) => (
                  <option key={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>
          <fieldset className="field field-radios">
            <legend>Reply to me by</legend>
            {['Email', 'Phone call', 'WhatsApp'].map((m) => (
              <label key={m} className={`radio ${values.contactBy === m ? 'is-on' : ''}`}>
                <input type="radio" name="contactBy" value={m} checked={values.contactBy === m} onChange={update('contactBy')} />
                {m}
              </label>
            ))}
          </fieldset>
          {field('message', 'Message', 'textarea')}
          {/* honeypot: hidden from people, bots fill it */}
          <div className="hp" aria-hidden="true">
            <label htmlFor="c-website">Leave this empty</label>
            <input id="c-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={update('website')} />
          </div>
          <div className={`field field-check ${errors.consent ? 'has-error' : ''}`}>
            <label className="check">
              <input id="c-consent" type="checkbox" checked={values.consent} onChange={update('consent')} aria-invalid={!!errors.consent} aria-describedby={errors.consent ? 'c-consent-err' : undefined} />
              <span>
                I agree that KAIROS may use these details to reply to me. See the <a href="#/legal/privacy">Privacy Notice</a>. <span className="req" aria-hidden="true">*</span>
              </span>
            </label>
            {err('consent')}
          </div>
          <button type="submit" className="btn btn-dark" disabled={status.state === 'sending'} aria-busy={status.state === 'sending'}>
            <span>{status.state === 'sending' ? 'Sending…' : 'Send message'}</span>
          </button>
          <div className="form-status" role="status" aria-live="polite">
            {status.state === 'sent' && <p className="ok">Thank you, {status.first}. Your message is on its way to the KAIROS studio. We will reply within two working days.</p>}
            {status.state === 'fallback' && (
              <p className="warn">
                Sorry {status.first}, we could not send the form from here. <a href={status.href}>Open your email app</a> or <a href={status.web.gmail} target="_blank" rel="noopener noreferrer">open it in Gmail</a>, and your message will be ready to send to {CONTACT.email}.
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}
