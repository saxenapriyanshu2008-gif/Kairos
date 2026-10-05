import inlined from 'virtual:kairos-media'

/*
  URL of a file in public/media. The normal build serves the files next to the
  page. The single-file build (npm run build:single) packs them into the HTML
  as data URLs, so the one file works offline when opened from disk.
*/
const BASE = import.meta.env.BASE_URL
export const mediaUrl = (name) => inlined[name] || `${BASE}media/${name}`
