/**
 * Bundles `dist/` into one self-contained HTML file for sharing the demo.
 *
 * The output has no external references at all — no CDN, no separate JS or CSS
 * — so it can be emailed, opened straight off a phone, or dropped on any host.
 * It omits <!doctype>/<html>/<head>/<body> because the page it is published to
 * supplies them; browsers imply them when the file is opened directly.
 *
 * Run `npm run build` first, then `npm run build:demo`.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const out = join(root, 'demo', 'finini-dashboard-demo.html')

let html
try {
  html = readFileSync(join(dist, 'index.html'), 'utf8')
} catch {
  console.error('No dist/index.html — run `npm run build:demo` (not `build`) first.')
  process.exit(1)
}

// Read the entry points out of the built HTML rather than globbing the assets
// directory. A glob picks up whatever else the build emitted — the PWA build,
// for one, adds a second .js chunk — and silently inlines the wrong file.
const jsMatch = html.match(/<script[^>]+src="([^"]+\.js)"/)
const cssMatch = html.match(/<link[^>]+href="([^"]+\.css)"/)
if (!jsMatch || !cssMatch) {
  console.error('Could not find the entry script and stylesheet in dist/index.html.')
  process.exit(1)
}

if (/rel="manifest"|serviceWorker/.test(html)) {
  console.error(
    'This build still references a service worker or manifest, which a\n' +
      'single self-contained file cannot serve. Build with `--mode demo`.',
  )
  process.exit(1)
}

const asset = (href) => join(dist, href.replace(/^\//, ''))
const jsSource = readFileSync(asset(jsMatch[1]), 'utf8')
const cssSource = readFileSync(asset(cssMatch[1]), 'utf8')

// A closing tag inside the bundle would end the <script> element early.
if (jsSource.includes('</script')) {
  console.error('Bundle contains a closing script tag; cannot inline safely.')
  process.exit(1)
}

const page = `<title>Finini Dashboard — demo</title>
<style>
${cssSource}
</style>
<div id="root"></div>
<script type="module">
${jsSource}
</script>
`

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, page)
console.log(`wrote ${out} (${(page.length / 1024).toFixed(1)} kB)`)
