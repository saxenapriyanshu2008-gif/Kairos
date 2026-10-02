# KAIROS

**THE MOMENT MATTERS.**

A website for KAIROS, a fictional luxury watch brand, built for a 3-day web development competition.

---

## Brand Concept

*Kairos* is an ancient Greek word for the right, decisive moment. *Chronos* is time that passes. Kairos is the moment that matters.

KAIROS builds watches with one idea: a watch does not only measure time, it marks the moments that define you. The eight models are each made for a different kind of moment: ARC for everyday life, NOIR for quiet nights, ATLAS for travel, ÉLAN for formal evenings, VOID for showing what is inside, APEX for timing, PULSE for a connected day and MONO for the quietest moments. The brand is modern luxury. It is precise and calm, and it stays confident without being loud. It is inspired by Swiss watchmaking, architecture and editorial fashion, but it copies none of them. (95 words)

---

## Design Philosophy

### Color palette
| Token | Hex | Use |
|---|---|---|
| Obsidian Black | `#0C0B0A` | Main dark background, cinematic sections |
| Warm Ivory | `#EFE9DE` | Light editorial sections, main text on dark |
| Graphite | `#2A2927` | Cards, secondary surfaces |
| Brushed Silver | `#A9A8A4` | Muted text, metal details |
| Champagne Gold | `#C9AD7C` | Accent only: seconds hand, active states, rules |

Sections switch between dark and ivory, like turning pages in a print magazine. Gold is used very little, so when it shows up it means something. The site has no neon, no purple or blue AI gradients and no glassmorphism cards. The text color pairs meet WCAG AA contrast. On ivory, the gold accent text uses a darker `#7A5F33`.

### Typography
- **Bodoni Moda** (high-contrast didone serif) for headings and big statements. Its thin hairlines and thick stems look like polished and brushed steel.
- **Manrope** (clean geometric sans) for navigation, buttons, prices, labels and body text.
- Headings are very large and get lots of white space. Labels use small, widely spaced capitals. Both fonts are self-hosted variable fonts, so the page makes no third-party font requests.

### Visual direction
"A luxury watch campaign turned into an interactive experience." The site uses full-screen dark sections with soft studio light, thin architectural grid lines and outlined ghost type (NOIR, the stage numbers, the footer wordmark). Real campaign photography is mixed with an original **3D KAIROS watch modelled in code with Three.js**: case, lugs, crown, bezel, dial, hands, sapphire crystal, a working K-01 movement (spinning gears, beating balance wheel, rubies, blued screws) and a bracelet or leather strap. No 3D files are downloaded, so there is nothing to license, and the configurator can recolor every part instantly. Flat SVG renders of the same watches are used for cards, panels and as the fallback when WebGL is not available.

### UX decisions
- Every effect supports the content. Text never moves with the cursor, so it is always easy to read.
- The collection has an asymmetric editorial grid on desktop. On tablets and phones it becomes a swipe rail with a progress line.
- Shopping features work like a real store: wishlist, bag, product panels and search. Checkout is honestly marked as not part of the concept.
- Configurator option groups are real radio buttons, so they work with a keyboard and a screen reader.
- "Request details" fills in the contact form with your configuration.
- The loader only plays one short reveal and never adds fake waiting time.

---

## Features

- **3D scroll film (Three.js + GSAP ScrollTrigger).** One fixed WebGL stage sits behind the hero and the story, and a single 3D watch travels through it while the story section is pinned:
  - **01 THE CASE.** The watch turns to show the case side and crown, with a giant "316L" behind it.
  - **02 THE DIAL.** A face-on close-up while a gold ring traces the dial.
  - **03 THE MOVEMENT.** An exploded view: crystal, bezel, hands, dial, case, calibre and caseback separate in space, with live labels ("184 parts. Nothing hidden."). Then the camera dives into the movement while the front parts fly past it, and a particle field and "28,800" fill the background.
  - **04 THE MOMENT.** The parts reassemble, the watch shows its 10.8 mm side profile, then lands on the final shot with a giant italic *Moment* behind it.
  - A spec HUD on the left and a progress rail on the right follow the stages. The watch tilts toward your cursor the whole time.
- **Performance of the 3D.** Three.js loads as a separate chunk only after the intro, so the first paint is not blocked. The hero shows a light SVG watch until then. Rendering pauses whenever the stage is off screen, and the pixel ratio is capped (1.5 on phones).
- **Film details taken from motion references.**
  - It opens with four models lining up in front of a giant KAIROS.
  - Giant type then circles the watch in 3D (KAIROS, K-01, 316L), with the front letters passing in front of the case.
  - In the movement dive, light streams flow around the calibre. Each particle is drawn as a short streak along a flow field.
  - A "PRECISE AUTOMATIC MOVEMENT" moment sits behind the reassembled watch.
  - The film turns light grey for "Elegant contours" (a top view) and "Slim profile" (a side view) before the final shot.
- **Liquid RGB type.** Giant words appear and leave through an SVG displacement filter with a red and blue split. Section headings settle from a short RGB split as they rise in.
- **Manifesto.** A light grid with + markers, where each line is typed inside a black highlight block that then wipes away. A slanted metal bar sweeps across, and the K-clock logo draws itself as a blueprint.
- **Curved-screen journal.** The section pins. The centre story sits on a concave screen made of 16 vertical slices placed on a cylinder with CSS 3D, and the neighbouring stories turn away in perspective. Prev and next buttons and a story list make it keyboard friendly.
- **Blueprint footer mark.** The K-clock logo draws itself with construction lines next to the KAIROS wordmark.
- **Product studio.** Selecting any watch opens a full-screen 3D studio:
  - **360° view:** drag (or use the arrow keys) to rotate, or switch on auto-spin.
  - **Explode:** a slider separates the crystal, bezel, hands, dial, case, calibre and caseback, with live labels. On PULSE it shows the screen, board and battery instead.
  - **PULSE screens:** on the smartwatch a Screen picker switches the live display between the watch face, an app launcher, a sports mode list (100+ modes), a live outdoor run with heart-rate zones, and a health page (heart rate, SpO2, sleep, stress, VO2 max). All icons and layouts are original and drawn in code.
  - **Options:** case colour (steel, black, gunmetal, blue, champagne), dial colour (ivory, obsidian, midnight, slate), strap type (leather, metal bracelet, mesh, rubber) and strap colour. The price updates as you choose.
- **Eight models, four types.** Dress (ARC, NOIR, ÉLAN, MONO), sport (ATLAS diver, VOID skeleton, APEX chronograph) and digital (PULSE smartwatch: 1.43 in 466 x 466 AMOLED, 47 mm aluminium case, dual-chip design, 100 h battery, dual-band GPS, 5 ATM + IP68, with a live screen that shows the real time and four extra app pages). The collection can be filtered by type.
- **Watch configurator.** A drag-to-rotate 3D preview (arrow keys work too). Choose 3 cases × 3 dials × 3 straps (27 builds). The preview, product name (for example *KAIROS MINUIT OR*), price, reference code and summary all come from one state object. You can save the build (stored in localStorage), add it to the bag or request details.
- **"The Moment" clock.** A large live clock. On desktop the hands lean a few degrees toward your cursor and a gold point follows it around the ring. Pick a moment (Sunrise, A first meeting, The finish line, Midnight) and the hands sweep to that time.
- **Hero.** A live watch (it shows the real time) tilts in 3D toward the cursor. A soft light and dust particles react at different depths. On touch devices there is a gentle scroll parallax instead.
- **Custom cursor.** A dot plus a ring that shows **VIEW** on products, **OPEN** on CTAs and **DISCOVER** on images. It is turned off on touch devices and with reduced motion, and it hides over text fields.
- **Product showcase.** Four editorial cards. Each one shows a campaign photo, and on hover the studio render of the model fades in. Cards include a wishlist heart, an Explore panel with specs and add to bag.
- **Transitions.** Headings rise out of a mask, blocks fade up, images wipe open, links draw underlines and the brand story text lights up word by word.
- **Responsive layout.** Tested at 1440, 1280, 1024, 768, 430, 390 and 360 px with no horizontal overflow. Mobile gets a full-screen menu, a scaled hero, swipe rails and touch-sized controls (44 px minimum).
- **Reduced motion and no-WebGL.** With `prefers-reduced-motion`, or without WebGL, the 3D film is swapped for the SVG hero and a static four-stage story.
- **Accessibility.** Semantic landmarks, one `h1`, ordered headings, skip link, visible gold focus rings, labelled icon buttons, `aria-pressed` and `aria-expanded`, dialogs with a focus trap and Escape to close, form errors linked with `aria-describedby`, live regions for status messages, and a full `prefers-reduced-motion` mode (the scroll story becomes a static list and all motion stops).
- **Search.** Finds watches, journal stories and page sections.

---

## Tech Stack

- **React 18** + **Vite 5**
- **Three.js** for the 3D watch (lazy-loaded chunk)
- **GSAP 3 + ScrollTrigger** for all scroll and pointer animation
- Plain **CSS** with design tokens (custom properties). No UI framework was needed.
- **@fontsource-variable** for self-hosted Bodoni Moda and Manrope

There is no React Three Fiber, icon library or state library. Three.js is used directly through one small module (`src/three/stage.js`), and the page only changes a plain `state` object that GSAP animates. The icons are inline SVG and the shop state is a small React context. This keeps the JavaScript small and the code easy to explain.

### Project structure
```
src/
  main.jsx            entry, font imports
  App.jsx             page order, hash route for #/credits, shared reveal animations
  three/model.js      the 3D KAIROS watch, built from code (parts, materials, explode, strap)
  three/stage.js      renderer, studio lighting, particles, gold ring, render loop
  store.jsx           wishlist / bag / drawer / toast state (React context)
  styles.css          tokens, layout, all section styles, responsive + reduced motion
  lib/gsap.js         registers ScrollTrigger once
  data/watches.js     the 4 models + configurator options and prices
  data/journal.js     journal articles
  data/photos.js      Unsplash photos + credits
  components/
    Cinema (3D hero + scroll film)  ProductStudio (360° + explode + options)
    Manifesto (typed highlight lines)  LineLogo (blueprint K-clock)
    Watch3DViewer (3D configurator preview)
    Navbar  Hero  ScrollStory (SVG fallback)  Collection  WatchCard  FeaturedWatch
    WatchConfigurator  BrandStory  Craftsmanship  MomentClock  Journal
    CTA  Contact  Footer  CustomCursor  Loader  Overlays (Drawer, Search, Toast)
    Credits  WatchSVG (the watch render engine)  Art (movement, craft, journal art)
    Photo (responsive lazy photo with SVG fallback)  Logo  Icons
```

---

## Installation

Requires Node.js 18 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
```

Production build:
```bash
npm run build      # outputs to /dist
npm run preview    # serves the build at http://localhost:4173
```

---

## Assets

All assets are free or licensed. The full table is also on the site at **Footer → Assets & Credits** (`#/credits`).

| Asset | Creator | Source | License |
|---|---|---|---|
| Watch on wrist with plant shadows | François Hurtaud | [Unsplash](https://unsplash.com/photos/person-wearing-silver-round-analog-watch-qSwy78OAUgo) | Unsplash License |
| Black minimalist watch, studio | Faraz Fayaz | [Unsplash](https://unsplash.com/photos/a-black-minimalist-watch-with-a-leather-strap-3weffxf3mdk) | Unsplash License |
| Black watch on tree trunk | Leon (@aiden_kepler) | [Unsplash](https://unsplash.com/photos/a-black-wristwatch-rests-on-a-weathered-tree-trunk-vum30b1yAxA) | Unsplash License |
| Gold watch in green fabric | Suhas Hanjar | [Unsplash](https://unsplash.com/photos/gold-wristwatch-in-green-fabric-JDB2uyBJFhs) | Unsplash License |
| Man with watch, editorial portrait | Mohammad Hossein Mirzagol | [Unsplash](https://unsplash.com/photos/a-man-with-a-watch-on-his-wrist-e69369Ekths) | Unsplash License |
| Watch gears macro | Lukas Tennie | [Unsplash](https://unsplash.com/photos/a-close-up-of-a-watch-face-showing-the-gears-DAWnMmUSMdU) | Unsplash License |
| Rose gold movement close-up | Omar Al-Ghosson | [Unsplash](https://unsplash.com/photos/close-up-of-a-watchs-intricate-mechanical-movement-ra8E5aSathU) | Unsplash License |
| Wrist with watch, grey tones | Cosmin Ursea | [Unsplash](https://unsplash.com/photos/a-close-up-of-a-person-with-a-watch-on-their-wrist-vdZKKvsMmN0) | Unsplash License |
| Hand holding analog watch | Jaelynn Castillo | [Unsplash](https://unsplash.com/photos/person-holding-analog-watch-xfNeB1stZ_0) | Unsplash License |
| Bodoni Moda | Owen Earl | [Google Fonts](https://fonts.google.com/specimen/Bodoni+Moda) | SIL OFL 1.1 |
| Manrope | Mikhail Sharanda | [Google Fonts](https://fonts.google.com/specimen/Manrope) | SIL OFL 1.1 |
| GSAP + ScrollTrigger | GreenSock / Webflow | [gsap.com](https://gsap.com/licensing/) | GSAP Standard License (free) |
| Three.js | three.js authors | npm | MIT |
| React, Vite, Fontsource | Open-source contributors | npm | MIT |
| KAIROS 3D watch model, logo, favicon, all watch renders, movement, craft and blueprint art | Original work for this project | `src/three`, `src/components` | Original |

Photos are loaded from the Unsplash image CDN (`images.unsplash.com`) at the right size for each screen, in WebP or AVIF format. If a photo cannot load, an original SVG illustration is shown instead, so the layout never breaks. To change a photo, edit one entry in `src/data/photos.js`.

---

## Deployment

**Vercel**
1. Push the project to GitHub.
2. On vercel.com, click **Add New → Project** and import the repo.
3. The framework preset is detected as Vite. Build command: `npm run build`. Output folder: `dist`. Click Deploy.

**Netlify**
1. Click **Add new site → Import from Git** and pick the repo.
2. Build command: `npm run build`. Publish directory: `dist`.
   (Or drag and drop the `dist` folder onto app.netlify.com/drop.)

**GitHub Pages**
1. `vite.config.js` already uses `base: './'`, so the build works from any sub-path.
2. Run `npm run build`, then publish the `dist` folder, for example with:
   ```bash
   npx gh-pages -d dist
   ```
3. In the repo, go to **Settings → Pages** and set the source to the `gh-pages` branch.

The site uses hash routing (`#/credits`), so no server rewrite rules are needed on any host.

---

© 2026 KAIROS. Concept brand for development project.
