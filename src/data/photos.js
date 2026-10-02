// Real photography used on the site.
// All photos are from Unsplash and free to use under the Unsplash License
// (https://unsplash.com/license). They are loaded from Unsplash's image CDN,
// which serves resized WebP/AVIF files, so we never ship a huge original.
// Each entry is credited on the Assets & Credits page (#/credits).

export const photos = {
  arc: {
    id: 'photo-1590995505834-e5380bba1865',
    alt: 'A round steel watch on a wrist, with soft plant shadows across the arm',
    creator: 'François Hurtaud',
    page: 'https://unsplash.com/photos/person-wearing-silver-round-analog-watch-qSwy78OAUgo',
  },
  noir: {
    id: 'photo-1758887952896-8491d393afe2',
    alt: 'A black minimalist watch with a leather strap, studio product shot',
    creator: 'Faraz Fayaz',
    page: 'https://unsplash.com/photos/a-black-minimalist-watch-with-a-leather-strap-3weffxf3mdk',
  },
  atlas: {
    id: 'photo-1779409919727-bafd9a982269',
    alt: 'A black wristwatch resting on a weathered tree trunk outdoors',
    creator: 'Leon (@aiden_kepler)',
    page: 'https://unsplash.com/photos/a-black-wristwatch-rests-on-a-weathered-tree-trunk-vum30b1yAxA',
  },
  elan: {
    id: 'photo-1786284684785-2233d0d364a7',
    alt: 'A gold-tone watch with a black dial resting in folds of green fabric',
    creator: 'Suhas Hanjar',
    page: 'https://unsplash.com/photos/gold-wristwatch-in-green-fabric-JDB2uyBJFhs',
  },
  story: {
    id: 'photo-1679953332630-62aaa6a51bb2',
    alt: 'A man in dark clothing with a watch on his wrist, moody editorial portrait',
    creator: 'Mohammad Hossein Mirzagol',
    page: 'https://unsplash.com/photos/a-man-with-a-watch-on-his-wrist-e69369Ekths',
  },
  gears: {
    id: 'photo-1633451238208-11c8e6c1fed4',
    alt: 'Macro view of the gears and balance wheel inside a mechanical watch',
    creator: 'Lukas Tennie',
    page: 'https://unsplash.com/photos/a-close-up-of-a-watch-face-showing-the-gears-DAWnMmUSMdU',
  },
  movement: {
    id: 'photo-1768062251809-739d987a42fe',
    alt: 'Close-up of an intricate rose gold mechanical watch movement',
    creator: 'Omar Al-Ghosson',
    page: 'https://unsplash.com/photos/close-up-of-a-watchs-intricate-mechanical-movement-ra8E5aSathU',
  },
  wrist: {
    id: 'photo-1715702485014-3860cdd32697',
    alt: 'Close-up of a wrist wearing a watch, in soft grey tones',
    creator: 'Cosmin Ursea',
    page: 'https://unsplash.com/photos/a-close-up-of-a-person-with-a-watch-on-their-wrist-vdZKKvsMmN0',
  },
  holding: {
    id: 'photo-1524592094714-0f0654e20314',
    alt: 'A hand holding an analog watch, product photograph',
    creator: 'Jaelynn Castillo',
    page: 'https://unsplash.com/photos/person-holding-analog-watch-xfNeB1stZ_0',
  },
}

// Build a resized Unsplash CDN URL. auto=format gives WebP/AVIF when supported.
export const photoUrl = (p, w, q = 72) => `https://images.unsplash.com/${p.id}?auto=format&fit=crop&w=${w}&q=${q}`
export const photoSrcSet = (p, widths = [480, 800, 1200, 1600]) => widths.map((w) => `${photoUrl(p, w)} ${w}w`).join(', ')
