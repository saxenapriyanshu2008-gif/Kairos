// Product data for the four KAIROS models.
// Each watch carries a `look` object that is passed straight to <WatchSVG />,
// so the product visuals and the data always stay in sync.

export const watches = [
  {
    id: 'arc',
    name: 'KAIROS ARC',
    short: 'ARC',
    category: 'Everyday Automatic',
    price: 89000,
    description: 'Minimal proportions, clean dial and versatile design.',
    long:
      'ARC is the quiet centre of the collection. A 39 mm brushed case, a warm ivory dial and applied steel indices that stay legible in any light. Made to be worn every day, for every kind of day.',
    specs: { Case: '39 mm, 316L steel', Crystal: 'Sapphire', Movement: 'Automatic K-01', Resistance: '100M' },
    look: { model: 'arc', caseFinish: 'steel', dial: 'ivory', strap: 'brownLeather' },
    tone: 'ivory',
  },
  {
    id: 'noir',
    name: 'KAIROS NOIR',
    short: 'NOIR',
    category: 'Midnight Automatic',
    price: 124000,
    description: 'Deep black aesthetic with brushed metal detailing.',
    long:
      'NOIR is finished in black-coated steel with an obsidian sunray dial. Polished dot indices catch the smallest amount of light, so the watch reads clearly when everything around it goes dark.',
    specs: { Case: '41 mm, 316L steel', Crystal: 'Sapphire', Movement: 'Automatic K-01', Resistance: '100M' },
    look: { model: 'noir', caseFinish: 'black', dial: 'obsidian', strap: 'blackLeather' },
    tone: 'dark',
  },
  {
    id: 'atlas',
    name: 'KAIROS ATLAS',
    short: 'ATLAS',
    category: 'Built to Explore',
    price: 139000,
    description: 'Sport-luxury design designed around travel and adventure.',
    long:
      'ATLAS pairs a uni-directional timing bezel with a midnight blue dial, a date at three and a fully brushed bracelet. It is built for long journeys and the moments you find along the way.',
    specs: { Case: '42 mm, 316L steel', Crystal: 'Sapphire', Movement: 'Automatic K-02, date', Resistance: '200M' },
    look: { model: 'atlas', caseFinish: 'steel', dial: 'midnight', strap: 'steel' },
    tone: 'graphite',
  },
  {
    id: 'elan',
    name: 'KAIROS ÉLAN',
    short: 'ÉLAN',
    category: 'Refined Dress Watch',
    price: 109000,
    description: 'Slim profile with a sophisticated dial and elegant finishing.',
    long:
      'ÉLAN is 8.4 mm thin, with a champagne-toned case and long, slender indices. It slides under a shirt cuff and comes out only when the moment asks for it.',
    specs: { Case: '38 mm, 316L steel, champagne PVD', Crystal: 'Sapphire', Movement: 'Automatic K-01 slim', Resistance: '50M' },
    look: { model: 'elan', caseFinish: 'champagne', dial: 'obsidian', strap: 'blackLeather' },
    tone: 'silver',
  },
]

export const getWatch = (id) => watches.find((w) => w.id === id)

// Indian number format: 124000 -> ₹1,24,000
export const formatPrice = (n) => '₹' + n.toLocaleString('en-IN')

// ---------- Configurator options ----------
export const configOptions = {
  caseFinish: {
    label: 'Case',
    options: [
      { id: 'steel', label: 'Brushed Steel', price: 0, swatch: 'linear-gradient(135deg,#f1f1ee,#8f8f8c 55%,#d9d9d5)', word: 'STEEL' },
      { id: 'black', label: 'Black Steel', price: 15000, swatch: 'linear-gradient(135deg,#555557,#121213 55%,#3a3a3c)', word: 'OMBRE' },
      { id: 'champagne', label: 'Champagne Finish', price: 28000, swatch: 'linear-gradient(135deg,#f3e2c1,#a3865a 55%,#e3cb9c)', word: 'OR' },
    ],
  },
  dial: {
    label: 'Dial',
    options: [
      { id: 'ivory', label: 'Ivory', price: 0, swatch: 'radial-gradient(circle at 40% 35%,#faf6ee,#d8cfbe)', word: 'LUMIÈRE' },
      { id: 'obsidian', label: 'Obsidian', price: 6000, swatch: 'radial-gradient(circle at 40% 35%,#36363a,#070708)', word: 'NOIR' },
      { id: 'midnight', label: 'Midnight Blue', price: 9000, swatch: 'radial-gradient(circle at 40% 35%,#2e4570,#0a1324)', word: 'MINUIT' },
    ],
  },
  strap: {
    label: 'Strap',
    options: [
      { id: 'steel', label: 'Steel Bracelet', price: 12000, swatch: 'repeating-linear-gradient(90deg,#dcdcd8 0 6px,#8c8c89 6px 8px)' },
      { id: 'blackLeather', label: 'Black Leather', price: 0, swatch: 'linear-gradient(135deg,#2a2826,#0b0b0a)' },
      { id: 'brownLeather', label: 'Brown Leather', price: 0, swatch: 'linear-gradient(135deg,#7a4b30,#3b2214)' },
    ],
  },
}

export const CONFIG_BASE_PRICE = 89000
