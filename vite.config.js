import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import fs from 'node:fs'
import path from 'node:path'

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

/*
  virtual:kairos-media -> { 'file.webp': url }
  Normal build: empty, files are served from public/media.
  Single-file build: every file in public/media as a base64 data URL.
*/
const MIME = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', mp4: 'video/mp4', webm: 'video/webm', svg: 'image/svg+xml' }
function kairosMedia(inline) {
  const id = 'virtual:kairos-media'
  return {
    name: 'kairos-media',
    resolveId: (s) => (s === id ? '\0' + id : null),
    load(s) {
      if (s !== '\0' + id) return null
      if (!inline) return 'export default {}'
      const dir = path.resolve('public/media')
      const map = {}
      for (const f of fs.readdirSync(dir)) {
        const type = MIME[f.split('.').pop()]
        if (type) map[f] = `data:${type};base64,${fs.readFileSync(path.join(dir, f)).toString('base64')}`
      }
      return `export default ${JSON.stringify(map)}`
    },
  }
}

// favicon inside the page too, so the single file has no outside files at all
function inlineFavicon() {
  return {
    name: 'kairos-inline-favicon',
    transformIndexHtml(html) {
      const svg = fs.readFileSync(path.resolve('public/favicon.svg')).toString('base64')
      return html.replace(/href="[^"]*favicon\.svg"/, `href="data:image/svg+xml;base64,${svg}"`)
    },
  }
}

// base: './' keeps asset paths relative so the build also works on GitHub Pages
export default defineConfig(({ mode }) =>
  mode === 'single'
    ? {
        // npm run build:single -> dist-single/index.html: the whole site in one file
        plugins: [react(), kairosMedia(true), inlineFavicon(), viteSingleFile({ removeViteModuleLoader: true })],
        base: './',
        publicDir: false,
        build: { outDir: 'dist-single', assetsInlineLimit: 100000000, chunkSizeWarningLimit: 100000 },
      }
    : {
        plugins: [react(), kairosMedia(false), inlineCssAndPreloadFonts()],
        base: './',
        build: {
          rollupOptions: {
            output: {
              // keep GSAP in its own cached chunk
              manualChunks: { gsap: ['gsap'] },
            },
          },
        },
      }
)
