import { useEffect, useMemo, useRef, useState } from 'react'
import Watch3DViewer from './Watch3DViewer'
import { configOptions, CONFIG_BASE_PRICE, formatPrice } from '../data/watches'
import { gsap, prefersReducedMotion } from '../lib/gsap'
import { scrollToId, useShop } from '../store'

/*
  BUILD YOUR KAIROS
  Each option group is a real radio group (keyboard + screen reader friendly),
  styled as swatches. The preview, name, price and reference code are all
  derived from one `config` object, so they can never get out of sync.
*/

const STORAGE_KEY = 'kairos-config'
const DEFAULT = { caseFinish: 'steel', dial: 'ivory', strap: 'steel' }
const GROUPS = ['caseFinish', 'dial', 'strap']

const find = (group, id) => configOptions[group].options.find((o) => o.id === id)

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved && GROUPS.every((g) => find(g, saved[g]))) return saved
  } catch {
    /* storage can be blocked, that's fine */
  }
  return DEFAULT
}

export default function WatchConfigurator() {
  const [config, setConfig] = useState(loadSaved)
  const [savedRef, setSavedRef] = useState(null)
  const previewRef = useRef(null)
  const { addToBag, notify } = useShop()

  const parts = useMemo(() => Object.fromEntries(GROUPS.map((g) => [g, find(g, config[g])])), [config])
  const price = CONFIG_BASE_PRICE + GROUPS.reduce((sum, g) => sum + parts[g].price, 0)
  const name = `KAIROS ${parts.dial.word}${parts.caseFinish.word === 'STEEL' ? '' : ' ' + parts.caseFinish.word}`
  const reference = `KRS-${config.caseFinish.slice(0, 2)}${config.dial.slice(0, 2)}${config.strap.slice(0, 2)}`.toUpperCase()
  const model = config.dial === 'obsidian' ? 'noir' : 'arc'
  const look = useMemo(() => ({ model, ...config }), [model, config])

  // small "breath" on the preview whenever the build changes
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (prefersReducedMotion()) return
    gsap.fromTo(previewRef.current, { scale: 0.965, opacity: 0.6 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'power3.out' })
  }, [config])

  const choose = (group, id) => {
    setConfig((c) => ({ ...c, [group]: id }))
    setSavedRef(null)
  }

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch {
      /* ignore */
    }
    setSavedRef(reference)
    notify(`Configuration ${reference} saved`)
  }

  const request = () => {
    const summary = `I would like details about my KAIROS configuration:\n${name} (${reference})\nCase: ${parts.caseFinish.label}\nDial: ${parts.dial.label}\nStrap: ${parts.strap.label}\nIndicative price: ${formatPrice(price)}`
    window.dispatchEvent(new CustomEvent('kairos:prefill', { detail: summary }))
    scrollToId('contact')
  }

  return (
    <section id="configure" className="section configurator theme-sand" aria-labelledby="config-title">
      <header className="section-head cfg-head">
        <p className="eyebrow" data-reveal>Atelier &nbsp;/&nbsp; Configurator</p>
        <h2 id="config-title" className="display-l" data-split>Build your KAIROS</h2>
      </header>

      <div className="cfg-grid">
        <div className="cfg-stage" data-reveal>
          <div className="cfg-stage-head">
            <span className="eyebrow">Your KAIROS</span>
            <span className="cfg-ref">Ref. {reference}</span>
          </div>
          <div className="cfg-preview" ref={previewRef}>
            <Watch3DViewer look={look} title={`Preview of ${name}: ${parts.caseFinish.label} case, ${parts.dial.label} dial, ${parts.strap.label}`} />
          </div>
          <div className="cfg-summary" aria-live="polite">
            <p className="cfg-name">{name}</p>
            <p className="cfg-parts">
              {parts.caseFinish.label} / {parts.dial.label} / {parts.strap.label}
            </p>
            <p className="cfg-price">{formatPrice(price)}</p>
          </div>
        </div>

        <div className="cfg-controls">
          {GROUPS.map((g, gi) => (
            <fieldset key={g} className="cfg-group" data-reveal>
              <legend>
                <span className="cfg-step">0{gi + 1}</span>
                {configOptions[g].label}
                <span className="cfg-current">{parts[g].label}</span>
              </legend>
              <div className="cfg-options">
                {configOptions[g].options.map((o) => (
                  <label key={o.id} className={`cfg-opt ${config[g] === o.id ? 'is-selected' : ''}`}>
                    <input type="radio" name={g} value={o.id} checked={config[g] === o.id} onChange={() => choose(g, o.id)} />
                    <span className="cfg-swatch" style={{ background: o.swatch }} aria-hidden="true" />
                    <span className="cfg-label">{o.label}</span>
                    <span className="cfg-delta">{o.price ? '+ ' + formatPrice(o.price) : 'Included'}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <div className="cfg-actions" data-reveal>
            <button className="btn btn-ghost" onClick={save} data-cursor="open">
              <span>{savedRef ? 'Saved' : 'Save configuration'}</span>
            </button>
            <button className="btn btn-solid" onClick={request} data-cursor="open">
              <span>Request details</span>
            </button>
            <button
              className="btn-link"
              data-cursor="open"
              onClick={() => addToBag({ id: 'custom', name, price, look: { model, ...config }, note: `${parts.caseFinish.label} / ${parts.dial.label} / ${parts.strap.label}` })}
            >
              Add to bag
            </button>
          </div>
          <p className="cfg-note">Base price {formatPrice(CONFIG_BASE_PRICE)}. Prices are indicative for this concept.</p>
        </div>
      </div>
    </section>
  )
}
