import { useEffect, useRef, useState } from 'react'

/*
  Accessible contact form: real labels, inline errors linked with
  aria-describedby, and a polite live region for the result.
  This is a concept site, so nothing is sent; the success message says so.
*/

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validate(v) {
  const e = {}
  if (!v.name.trim()) e.name = 'Please tell us your name.'
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Please enter a valid email address.'
  if (v.message.trim().length < 10) e.message = 'Your message should be at least 10 characters.'
  return e
}

export default function Contact() {
  const [values, setValues] = useState({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(null)
  const formRef = useRef(null)

  // the configurator can pre-fill the message
  useEffect(() => {
    const onPrefill = (e) => {
      setValues((v) => ({ ...v, message: e.detail }))
      setSent(null)
      setTimeout(() => formRef.current?.querySelector('#c-name')?.focus({ preventScroll: true }), 700)
    }
    window.addEventListener('kairos:prefill', onPrefill)
    return () => window.removeEventListener('kairos:prefill', onPrefill)
  }, [])

  const update = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }))
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }))
  }

  const submit = (e) => {
    e.preventDefault()
    const errs = validate(values)
    setErrors(errs)
    const firstBad = Object.keys(errs)[0]
    if (firstBad) {
      formRef.current.querySelector(`#c-${firstBad}`)?.focus()
      return
    }
    setSent(values.name.trim().split(' ')[0])
    setValues({ name: '', email: '', message: '' })
  }

  const field = (k, label, type = 'text', props = {}) => (
    <div className={`field ${errors[k] ? 'has-error' : ''}`}>
      <label htmlFor={`c-${k}`}>{label}</label>
      {type === 'textarea' ? (
        <textarea id={`c-${k}`} rows={5} value={values[k]} onChange={update(k)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `c-${k}-err` : undefined} {...props} />
      ) : (
        <input id={`c-${k}`} type={type} value={values[k]} onChange={update(k)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `c-${k}-err` : undefined} {...props} />
      )}
      {errors[k] && (
        <p id={`c-${k}-err`} className="field-error">
          {errors[k]}
        </p>
      )}
    </div>
  )

  return (
    <section id="contact" className="section contact theme-light" aria-labelledby="contact-title">
      <div className="contact-grid">
        <div className="contact-copy">
          <p className="eyebrow" data-reveal>Chapter VII &nbsp;/&nbsp; Contact</p>
          <h2 id="contact-title" className="display-l" data-split>
            Start a <em>conversation.</em>
          </h2>
          <p className="lede" data-reveal>Questions about a model, a configuration or a private viewing. We reply within two working days.</p>

          <address className="studio" data-reveal>
            <p className="studio-name">KAIROS Studio</p>
            <p className="demo-tag">Demonstration content, not a real business</p>
            <dl>
              <div><dt>Studio</dt><dd>Concept address, New Delhi</dd></div>
              <div><dt>Email</dt><dd>studio@kairos.example</dd></div>
              <div><dt>Hours</dt><dd>Mon to Sat, 11:00 to 19:00</dd></div>
            </dl>
          </address>
        </div>

        <form ref={formRef} className="contact-form" onSubmit={submit} noValidate data-reveal>
          {field('name', 'Name', 'text', { autoComplete: 'name' })}
          {field('email', 'Email', 'email', { autoComplete: 'email' })}
          {field('message', 'Message', 'textarea')}
          <button type="submit" className="btn btn-dark" data-cursor="open">
            <span>Send message</span>
          </button>
          <p className="form-status" role="status" aria-live="polite">
            {sent && `Thank you, ${sent}. This is a concept website, so your message was not sent anywhere, but the form works exactly as it would in production.`}
          </p>
        </form>
      </div>
    </section>
  )
}
