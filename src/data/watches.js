// Product data for the eight KAIROS models.
// Each watch carries a `look` object that is passed straight to <WatchSVG />,
// so the product visuals and the data always stay in sync.

export const watches = [
  {
    id: 'arc',
    group: 'dress',
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
    group: 'dress',
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
    group: 'sport',
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
    group: 'dress',
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
  {
    id: 'void',
    name: 'KAIROS VOID',
    short: 'VOID',
    category: 'Skeleton Automatic',
    group: 'sport',
    price: 168000,
    description: 'An open dial that shows the beating heart of the calibre.',
    long:
      'VOID removes the dial and keeps only a slim chapter ring, so the gears, barrel and balance of the K-01 are always on show. A blue PVD case and bracelet with rose-gold hands and indices.',
    specs: { Case: '42 mm, blue PVD steel', Crystal: 'Sapphire, both sides', Movement: 'Automatic K-01 skeleton', Resistance: '50M' },
    look: { model: 'void', caseFinish: 'blue', dial: 'midnight', strap: 'steel' },
    tone: 'dark',
  },
  {
    id: 'apex',
    name: 'KAIROS APEX',
    short: 'APEX',
    category: 'Sport Chronograph',
    group: 'sport',
    price: 154000,
    description: 'A three-register chronograph with a tachymetre bezel.',
    long:
      'APEX times the moments that are measured in seconds. Three sub-dials, two pushers, a tachymetre bezel and gold accents on a gunmetal case, on a ribbed rubber strap built for movement.',
    specs: { Case: '44 mm, gunmetal steel', Crystal: 'Sapphire', Movement: 'Automatic chronograph K-03', Resistance: '100M' },
    look: { model: 'apex', caseFinish: 'gunmetal', dial: 'obsidian', strap: 'blackRubber' },
    tone: 'graphite',
  },
  {
    id: 'pulse',
    name: 'KAIROS PULSE',
    short: 'PULSE',
    category: 'Digital Smartwatch',
    group: 'digital',
    price: 17999,
    description: 'A 47 mm AMOLED smartwatch with dual-band GPS and a 100 hour battery.',
    long:
      'PULSE puts a bright 1.43 inch AMOLED screen inside a light aluminium case. A dual-chip design runs the smart features on one chip and the everyday tracking on a low-power second chip, so you get up to 100 hours in smart mode and 12 days in power saver. Over 100 sports modes, dual-band GPS, heart rate, SpO2, sleep and stress tracking.',
    specs: {
      Display: '1.43 in AMOLED, 466 x 466, 1000 nits, always-on',
      Case: '47 x 46.6 x 12.1 mm aluminium, toughened glass',
      Weight: '37 g without strap, 22 mm strap',
      'Chip / OS': 'Snapdragon W5 Gen 1 + BES2700, Wear OS 4',
      Memory: '2 GB RAM, 32 GB storage',
      Battery: '500 mAh: 100 h smart, 48 h heavy use, 12 days saver',
      Charging: '7.5 W, 10 min gives a full day',
      Durability: '5 ATM + IP68',
      GPS: 'Dual-band L1 + L5, GLONASS, Galileo, BDS, QZSS',
      Connectivity: 'Bluetooth 5.0, dual-band Wi-Fi, NFC',
      Sensors: 'Heart rate, SpO2, accelerometer, gyro, barometer, compass',
      'Sports modes': '100+ including running, cycling, swimming, skiing, badminton',
    },
    look: { model: 'pulse', caseFinish: 'black', dial: 'obsidian', strap: 'navyRubber' },
    tone: 'dark',
  },
  {
    id: 'mono',
    name: 'KAIROS MONO',
    short: 'MONO',
    category: 'Minimal Automatic',
    group: 'dress',
    price: 79000,
    description: 'All black, small seconds at six, rose-gold hands.',
    long:
      'MONO is the quietest KAIROS. A black case and woven mesh bracelet, a sunray dial with nothing on it but slim indices, a small seconds dial at six and rose-gold hands.',
    specs: { Case: '40 mm, black PVD steel', Crystal: 'Sapphire', Movement: 'Automatic K-01, small seconds', Resistance: '50M' },
    look: { model: 'mono', caseFinish: 'black', dial: 'obsidian', strap: 'mesh' },
    tone: 'silver',
  },
  {
    id: 'flora',
    name: 'KAIROS FLORA',
    short: 'FLORA',
    category: 'Floral Automatic',
    group: 'women',
    price: 112000,
    description: 'A hand-painted cherry blossom branch on mother-of-pearl.',
    long:
      'FLORA carries a cherry blossom branch painted by hand across a mother-of-pearl dial, so no two dials are quite alike. A 34 mm rose-gold case, a bezel set with 44 brilliant-cut stones, diamond hour markers and a blush leather strap.',
    specs: { Case: '34 mm, rose-gold PVD steel', Bezel: '44 brilliant-cut stones', Dial: 'Mother-of-pearl, hand-painted', Movement: 'Automatic K-01 petite', Resistance: '30M' },
    look: { model: 'flora', caseFinish: 'rose', dial: 'pearl', strap: 'blushLeather' },
    tone: 'ivory',
  },
  {
    id: 'jardin',
    name: 'KAIROS JARDIN',
    short: 'JARDIN',
    category: 'Floral Automatic',
    group: 'women',
    price: 136000,
    description: 'An engraved gold garden on a deep emerald dial.',
    long:
      'JARDIN is a garden in miniature. A deep emerald sunray dial with a gold rosette guilloche at its centre and a ring of engraved vines, leaves and tiny flowers between the hours. A 36 mm champagne-gold case on a matching bracelet.',
    specs: { Case: '36 mm, champagne-gold PVD steel', Dial: 'Emerald sunray, engraved gold garden', Movement: 'Automatic K-01', Resistance: '50M' },
    look: { model: 'jardin', caseFinish: 'champagne', dial: 'emerald', strap: 'steel' },
    tone: 'dark',
  },
  {
    id: 'luna',
    name: 'KAIROS LUNA',
    short: 'LUNA',
    category: 'Jewellery Automatic',
    group: 'women',
    price: 118000,
    description: 'A starry midnight dial, a crescent moon and a stone-set bezel.',
    long:
      'LUNA puts the night sky on the wrist. A midnight blue dial scattered with star dust, a polished crescent moon above six, a stone at every hour and a bezel set with 44 brilliant-cut stones, in a 34 mm steel case on a fine mesh bracelet.',
    specs: { Case: '34 mm, 316L steel', Bezel: '44 brilliant-cut stones', Dial: 'Midnight blue, star dust and crescent', Movement: 'Automatic K-01 petite', Resistance: '30M' },
    look: { model: 'luna', caseFinish: 'steel', dial: 'midnight', strap: 'mesh' },
    tone: 'dark',
  },
  {
    id: 'aura',
    name: 'KAIROS AURA',
    short: 'AURA',
    category: 'Petite Dress Watch',
    group: 'women',
    price: 96000,
    description: 'Blush sunray dial, rose-gold case and a single stone at twelve.',
    long:
      'AURA is light and quiet. A 32 mm rose-gold case, a blush pink sunray dial with slim indices, a single brilliant-cut stone at twelve and its name written in script, on a rose-gold mesh bracelet.',
    specs: { Case: '32 mm, rose-gold PVD steel', Dial: 'Blush sunray, stone at twelve', Movement: 'Automatic K-01 petite', Resistance: '30M' },
    look: { model: 'aura', caseFinish: 'rose', dial: 'blush', strap: 'mesh' },
    tone: 'ivory',
  },
]

// Collection filters
export const groups = [
  { id: 'all', label: 'All' },
  { id: 'dress', label: 'Dress' },
  { id: 'sport', label: 'Sport' },
  { id: 'digital', label: 'Digital' },
  { id: 'women', label: 'Women' },
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

// ---------- Product studio options (every model) ----------
export const studioOptions = {
  caseFinish: [
    { id: 'steel', label: 'Brushed steel', price: 0, swatch: 'linear-gradient(135deg,#d6d7d3,#7d7e7b 55%,#b9bab6)' },
    { id: 'black', label: 'Black PVD', price: 15000, swatch: 'linear-gradient(135deg,#55565a,#141416 55%,#3a3b3f)' },
    { id: 'gunmetal', label: 'Gunmetal', price: 12000, swatch: 'linear-gradient(135deg,#8a8b90,#3d3e42 55%,#6d6e73)' },
    { id: 'blue', label: 'Blue PVD', price: 18000, swatch: 'linear-gradient(135deg,#5b77ad,#1d2d52 55%,#3d5488)' },
    { id: 'rose', label: 'Rose gold', price: 22000, swatch: 'linear-gradient(135deg,#f3cdb8,#a8664a 55%,#e3b296)' },
    { id: 'champagne', label: 'Champagne', price: 28000, swatch: 'linear-gradient(135deg,#e0cb9f,#8f7448 55%,#c9ad7c)' },
  ],
  dial: [
    { id: 'ivory', label: 'Ivory', price: 0, swatch: 'radial-gradient(circle at 40% 35%,#faf6ee,#d8cfbe)' },
    { id: 'obsidian', label: 'Obsidian', price: 6000, swatch: 'radial-gradient(circle at 40% 35%,#36363a,#070708)' },
    { id: 'midnight', label: 'Midnight blue', price: 9000, swatch: 'radial-gradient(circle at 40% 35%,#2e4570,#0a1324)' },
    { id: 'slate', label: 'Slate grey', price: 6000, swatch: 'radial-gradient(circle at 40% 35%,#5a6067,#1b1e22)' },
    { id: 'pearl', label: 'Mother-of-pearl', price: 14000, swatch: 'radial-gradient(circle at 35% 30%,#ffffff,#f4dfe6 40%,#dfe8f2 70%,#d8cfd0)' },
    { id: 'blush', label: 'Blush pink', price: 6000, swatch: 'radial-gradient(circle at 40% 35%,#f6d8d0,#c98f86)' },
    { id: 'emerald', label: 'Emerald', price: 9000, swatch: 'radial-gradient(circle at 40% 35%,#2a6c55,#06231a)' },
  ],
  strapType: [
    { id: 'leather', label: 'Leather', price: 0 },
    { id: 'bracelet', label: 'Metal bracelet', price: 12000 },
    { id: 'mesh', label: 'Mesh', price: 8000 },
    { id: 'rubber', label: 'Rubber', price: 4000 },
  ],
  strapColor: {
    leather: [
      { id: 'black', label: 'Black', swatch: '#151413' },
      { id: 'brown', label: 'Brown', swatch: '#4f2c1a' },
      { id: 'tan', label: 'Tan', swatch: '#9a6a3c' },
      { id: 'navy', label: 'Navy', swatch: '#1d2840' },
      { id: 'blush', label: 'Blush', swatch: '#c99088' },
    ],
    rubber: [
      { id: 'black', label: 'Black', swatch: '#141414' },
      { id: 'navy', label: 'Navy', swatch: '#1f3157' },
      { id: 'grey', label: 'Grey', swatch: '#55585c' },
    ],
  },
}

// strap key used by the renderers <-> { type, color }
export function strapKey(type, color) {
  if (type === 'bracelet') return 'steel'
  if (type === 'mesh') return 'mesh'
  return color + (type === 'rubber' ? 'Rubber' : 'Leather')
}
export function strapParts(key) {
  if (key === 'steel') return { type: 'bracelet', color: null }
  if (key === 'mesh') return { type: 'mesh', color: null }
  const m = key.match(/^(\w+?)(Leather|Rubber)$/)
  return m ? { type: m[2] === 'Rubber' ? 'rubber' : 'leather', color: m[1] } : { type: 'leather', color: 'black' }
}
// price of a look, relative to the model's standard version
export function studioPrice(watch, look) {
  const p = (list, id) => list.find((o) => o.id === id)?.price || 0
  const parts = (l) => {
    const s = strapParts(l.strap)
    return p(studioOptions.caseFinish, l.caseFinish) + (l.model === 'pulse' ? 0 : p(studioOptions.dial, l.dial)) + p(studioOptions.strapType, s.type)
  }
  return watch.price + parts(look) - parts(watch.look)
}
