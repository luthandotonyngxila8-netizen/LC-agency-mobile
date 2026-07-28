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
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const out = join(root, 'demo', 'finini-dashboard-demo.html')

let assets
try {
  assets = readdirSync(join(dist, 'assets'))
} catch {
  console.error('No dist/assets — run `npm run build` first.')
  process.exit(1)
}

const js = assets.find((file) => file.endsWith('.js'))
const css = assets.find((file) => file.endsWith('.css'))
if (!js || !css) {
  console.error('Expected one .js and one .css in dist/assets.')
  process.exit(1)
}

const jsSource = readFileSync(join(dist, 'assets', js), 'utf8')
const cssSource = readFileSync(join(dist, 'assets', css), 'utf8')

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
