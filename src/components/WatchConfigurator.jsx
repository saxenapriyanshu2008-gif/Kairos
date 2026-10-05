import { useEffect, useMemo, useRef, useState } from 'react'
import Watch3DViewer from './Watch3DViewer'
import { watches, studioOptions, strapKey, strapParts, studioPrice, formatPrice } from '../data/watches'
import { gsap, prefersReducedMotion } from '../lib/gsap'
import { scrollToId, useShop } from '../store'

/*
  BUILD YOUR KAIROS
  Arrow buttons (and the keyboard arrow keys) switch between all the
  watches. Every watch starts from its own standard design and can be
  customised with the same options as its product page: case, dial, strap
  type and strap colour. Each watch remembers its own build while you
  switch back and forth. Each option group is a real radio group.
*/

const STORAGE_KEY = 'kairos-config-v2'
const ids = watches.map((w) => w.id)
const byId = (id) => watches.find((w) => w.id === id)

// a watch's standard look, split into the configurator's choices
const standard = (w) => {
  const s = strapParts(w.look.strap)
  return { caseFinish: w.look.caseFinish, dial: w.look.dial, strapType: s.type, strapColor: s.color }
}

function loadSaved() {
  const fresh = { current: 'arc', builds: Object.fromEntries(watches.map((w) => [w.id, standard(w)])) }
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved && ids.includes(saved.current)) return { current: saved.current, builds: { ...fresh.builds, ...saved.builds } }
  } catch {
    /* storage can be blocked, that's fine */
  }
  return fresh
}

const label = (list, id) => list.find((o) => o.id === id)?.label

export default function WatchConfigurator() {
  const [state, setState] = useState(loadSaved)
  const [savedRef, setSavedRef] = useState(null)
  const previewRef = useRef(null)
  const { addToBag, notify } = useShop()

  const watch = byId(state.current)
  const index = ids.indexOf(watch.id)
  const build = state.builds[watch.id]
  const isPulse = watch.id === 'pulse'
  const strap = strapKey(build.strapType, build.strapColor)
  const look = useMemo(() => ({ model: watch.id, caseFinish: build.caseFinish, dial: build.dial, strap }), [watch.id, build.caseFinish, build.dial, strap])
  const price = studioPrice(watch, look)

  const caseLabel = label(studioOptions.caseFinish, build.caseFinish)
  const dialLabel = label(studioOptions.dial, build.dial)
  const typeLabel = label(studioOptions.strapType, build.strapType)
  const colorLabel = build.strapColor ? label(studioOptions.strapColor[build.strapType] || [], build.strapColor) : null
  const strapLabel = colorLabel ? `${colorLabel} ${typeLabel.toLowerCase()}` : typeLabel
  const summary = [caseLabel, isPulse ? null : `${dialLabel} dial`, strapLabel].filter(Boolean).join(' / ')
  const reference = `KRS-${watch.id.slice(0, 2)}${build.caseFinish.slice(0, 2)}${isPulse ? '' : build.dial.slice(0, 2)}${strap.slice(0, 2)}`.toUpperCase()

  // small "breath" on the preview whenever the build changes
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (prefersReducedMotion() || !previewRef.current) return
    gsap.fromTo(previewRef.current, { scale: 0.965, opacity: 0.6 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'power3.out' })
  }, [look])

  const go = (step) => {
    setState((s) => ({ ...s, current: ids[(ids.indexOf(s.current) + step + ids.length) % ids.length] }))
    setSavedRef(null)
  }
  const choose = (patch) => {
    setState((s) => ({ ...s, builds: { ...s.builds, [s.current]: { ...s.builds[s.current], ...patch } } }))
    setSavedRef(null)
  }
  const chooseType = (type) => {
    const colors = studioOptions.strapColor[type]
    choose({ strapType: type, strapColor: colors ? (colors.some((c) => c.id === build.strapColor) ? build.strapColor : colors[0].id) : null })
  }
  const reset = () => {
    choose(standard(watch))
    notify(`${watch.name} reset to its standard design`)
  }

  // left / right arrow keys switch watches while the configurator has focus
  const onKey = (e) => {
    if (e.target.closest('input')) return // radio groups use the arrow keys themselves
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      go(-1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      go(1)
    }
  }

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
    setSavedRef(reference)
    notify(`Configuration ${reference} saved`)
  }

  const request = () => {
    const text = `I would like details about my KAIROS configuration:\n${watch.name} (${reference})\nCase: ${caseLabel}\n${isPulse ? '' : `Dial: ${dialLabel}\n`}Strap: ${strapLabel}\nIndicative price: ${formatPrice(price)}`
    window.dispatchEvent(new CustomEvent('kairos:prefill', { detail: text }))
    scrollToId('contact')
  }

  const groups = [
    { key: 'caseFinish', title: 'Case', current: caseLabel, options: studioOptions.caseFinish, value: build.caseFinish, pick: (id) => choose({ caseFinish: id }) },
    !isPulse && { key: 'dial', title: 'Dial', current: dialLabel, options: studioOptions.dial, value: build.dial, pick: (id) => choose({ dial: id }) },
    { key: 'strapType', title: 'Strap', current: typeLabel, options: studioOptions.strapType, value: build.strapType, pick: chooseType },
    studioOptions.strapColor[build.strapType] && {
      key: 'strapColor',
      title: 'Strap colour',
      current: colorLabel,
      options: studioOptions.strapColor[build.strapType],
      value: build.strapColor,
      pick: (id) => choose({ strapColor: id }),
    },
  ].filter(Boolean)
  const base = studioPrice(watch, watch.look)

  return (
    <section id="configure" className="section configurator theme-sand" aria-labelledby="config-title" onKeyDown={onKey}>
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

          <div className="cfg-switch" role="group" aria-label="Choose a watch">
            <button type="button" className="cfg-arrow" onClick={() => go(-1)} aria-label={`Previous watch: ${byId(ids[(index - 1 + ids.length) % ids.length]).name}`} data-cursor="open">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <div className="cfg-model" aria-live="polite">
              <span className="cfg-model-no">{String(index + 1).padStart(2, '0')} / {String(ids.length).padStart(2, '0')}</span>
              <span className="cfg-model-name">{watch.name}</span>
              <span className="cfg-model-cat">{watch.category}</span>
            </div>
            <button type="button" className="cfg-arrow" onClick={() => go(1)} aria-label={`Next watch: ${byId(ids[(index + 1) % ids.length]).name}`} data-cursor="open">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div className="cfg-preview" ref={previewRef}>
            <Watch3DViewer look={look} title={`Preview of ${watch.name}: ${summary}`} />
          </div>
          <div className="cfg-dots" aria-hidden="true">
            {ids.map((id, i) => (
              <span key={id} className={i === index ? 'is-on' : ''} />
            ))}
          </div>
          <div className="cfg-summary" aria-live="polite">
            <p className="cfg-name">{watch.name}</p>
            <p className="cfg-parts">{summary}</p>
            <p className="cfg-price">{formatPrice(price)}</p>
          </div>
        </div>

        <div className="cfg-controls">
          {groups.map((g, gi) => (
            <fieldset key={g.key} className="cfg-group" data-reveal>
              <legend>
                <span className="cfg-step">0{gi + 1}</span>
                {g.title}
                <span className="cfg-current">{g.current}</span>
              </legend>
              <div className="cfg-options">
                {g.options.map((o) => (
                  <label key={o.id} className={`cfg-opt ${g.value === o.id ? 'is-selected' : ''}`}>
                    <input type="radio" name={`cfg-${g.key}`} value={o.id} checked={g.value === o.id} onChange={() => g.pick(o.id)} />
                    {o.swatch ? <span className="cfg-swatch" style={{ background: o.swatch }} aria-hidden="true" /> : <span className="cfg-swatch cfg-swatch-type" aria-hidden="true">{o.label[0]}</span>}
                    <span className="cfg-label">{o.label}</span>
                    {'price' in o && <span className="cfg-delta">{o.price ? '+ ' + formatPrice(o.price) : 'Included'}</span>}
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
            <button className="btn-link" data-cursor="open" onClick={() => addToBag({ id: `custom-${watch.id}`, name: watch.name, price, look, note: summary })}>
              Add to bag
            </button>
            <button className="btn-link" data-cursor="open" onClick={reset}>
              Reset
            </button>
          </div>
          <p className="cfg-note">
            {watch.name} starts at {formatPrice(base)}. Use the arrows or your arrow keys to switch watches. Prices are indicative for this concept.
          </p>
        </div>
      </div>
    </section>
  )
}
