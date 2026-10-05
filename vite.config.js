import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/*
  Faster first paint on phones:
  1. The stylesheet is written into index.html, so the browser does not wait
     for a second request before it can draw anything. Font and image paths
     inside it are rewritten to stay correct from the page root.
  2. The two fonts used above the fold (Manrope and Bodoni Moda, latin) are
     preloaded, so the headline does not wait for the CSS to discover them.
*/
function inlineCssAndPreloadFonts() {
  return {
    name: 'kairos-inline-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const html = Object.values(bundle).find((f) => f.fileName === 'index.html')
      if (!html) return
      let src = String(html.source)
      for (const f of Object.values(bundle)) {
        if (f.type !== 'asset' || !f.fileName.endsWith('.css')) continue
        const tag = new RegExp(`<link rel="stylesheet"[^>]*href="\\./${f.fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`)
        if (!tag.test(src)) continue
        // url(./x) inside assets/ -> url(./assets/x) from the page root
        const css = String(f.source).replace(/url\(\.\//g, 'url(./assets/')
        src = src.replace(tag, () => `<style>${css}</style>`)
      }
      const fonts = Object.keys(bundle).filter((n) => /(manrope-latin-wght-normal|bodoni-moda-latin-wght-normal)-[\w-]+\.woff2$/.test(n))
      const preloads = fonts.map((n) => `<link rel="preload" href="./${n}" as="font" type="font/woff2" crossorigin>`).join('\n    ')
      src = src.replace('</title>', `</title>\n    ${preloads}`)
      html.source = src
    },
  }
}

// base: './' keeps asset paths relative so the build also works on GitHub Pages
export default defineConfig({
  plugins: [react(), inlineCssAndPreloadFonts()],
  base: './',
  build: {
    rollupOptions: {
      output: {
        // keep GSAP in its own cached chunk
        manualChunks: { gsap: ['gsap'] },
      },
    },
  },
})
