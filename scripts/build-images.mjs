/**
 * Image pipeline for the portfolio.
 *
 * Reads the category folders that sit next to this website folder
 * (e.g. "../Posters"), and writes web-ready WebP files to public/works
 * plus a data file (src/data/gallery.json) the React app reads.
 *
 *   npm run images          -> process new / changed images only
 *   npm run images -- --force  -> re-process everything
 *
 * Drop new images into any category folder and re-run: they appear on the site.
 */
import sharp from 'sharp'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SITE = path.resolve(__dirname, '..')
const SOURCE = path.resolve(SITE, '..')
const OUT_DIR = path.join(SITE, 'public', 'works')
const DATA_FILE = path.join(SITE, 'src', 'data', 'gallery.json')
const CACHE_FILE = path.join(SITE, 'scripts', '.image-cache.json')
const FORCE = process.argv.includes('--force')

// Order here = order of filter tabs on the site.
const CATEGORIES = [
  { slug: 'manipulation', name: 'Photo Manipulation', folder: 'Photo Manipulations' },
  { slug: 'before-after', name: 'Before & After', folder: 'Photo Manipulations Before After', split: true },
  { slug: 'posters', name: 'Posters', folder: 'Posters' },
  { slug: 'flyers', name: 'Flyers & Social', folder: 'Flyer Designes' },
  { slug: 'banners', name: 'Banners & Print', folder: 'Banner Design' },
  { slug: 'thumbnails', name: 'YouTube Thumbnails', folder: 'Youtube Thumbnails' },
  { slug: 'frames', name: 'Photo Frames', folder: 'Photo Frame Design' },
]

const SIZES = [
  { key: 'sm', w: 800, h: 1100, q: 76 },
  { key: 'md', w: 1400, h: 1400, q: 78 },
  { key: 'lg', w: 2400, h: 2400, q: 80 },
]
const IMAGE_EXT = /\.(jpe?g|png|webp|tiff?)$/i

sharp.cache(false)

const slugify = (s) =>
  s
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'image'

const hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

/* ---------- colour helpers ---------- */

function kmeansPalette(data, channels, k = 6, iterations = 12) {
  const px = []
  for (let i = 0; i < data.length; i += channels) px.push([data[i], data[i + 1], data[i + 2]])
  // seed centroids spread across luminance
  const sorted = [...px].sort((a, b) => a[0] * 0.3 + a[1] * 0.59 + a[2] * 0.11 - (b[0] * 0.3 + b[1] * 0.59 + b[2] * 0.11))
  let centroids = Array.from({ length: k }, (_, i) => [...sorted[Math.floor(((i + 0.5) / k) * (sorted.length - 1))]])
  let assign = new Array(px.length).fill(0)
  for (let it = 0; it < iterations; it++) {
    for (let p = 0; p < px.length; p++) {
      let best = 0
      let bestD = Infinity
      for (let c = 0; c < k; c++) {
        const dr = px[p][0] - centroids[c][0]
        const dg = px[p][1] - centroids[c][1]
        const db = px[p][2] - centroids[c][2]
        const d = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11
        if (d < bestD) {
          bestD = d
          best = c
        }
      }
      assign[p] = best
    }
    const sums = Array.from({ length: k }, () => [0, 0, 0, 0])
    for (let p = 0; p < px.length; p++) {
      const s = sums[assign[p]]
      s[0] += px[p][0]
      s[1] += px[p][1]
      s[2] += px[p][2]
      s[3]++
    }
    centroids = centroids.map((c, i) => (sums[i][3] ? [sums[i][0] / sums[i][3], sums[i][1] / sums[i][3], sums[i][2] / sums[i][3]] : c))
  }
  const counts = new Array(k).fill(0)
  assign.forEach((a) => counts[a]++)
  const clusters = centroids.map((c, i) => ({ c, n: counts[i] })).filter((x) => x.n > 0)
  clusters.sort((a, b) => b.n - a.n)
  // merge near-identical swatches
  const out = []
  for (const cl of clusters) {
    if (!out.some((o) => Math.abs(o.c[0] - cl.c[0]) + Math.abs(o.c[1] - cl.c[1]) + Math.abs(o.c[2] - cl.c[2]) < 36)) out.push(cl)
  }
  const palette = out.slice(0, 5).map((o) => hex(...o.c))
  // most "vivid" swatch for glows
  const vivid = out
    .map((o) => {
      const [r, g, b] = o.c.map((v) => v / 255)
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const sat = max === 0 ? 0 : (max - min) / max
      return { o, score: sat * 0.7 + max * 0.3 + Math.min(o.n / px.length, 0.2) }
    })
    .sort((a, b) => b.score - a.score)[0]
  return { palette, accent: vivid ? hex(...vivid.o.c) : palette[0] }
}

async function dHash(buffer, info) {
  const { data } = await sharp(buffer, { raw: info }).resize(9, 8, { fit: 'fill' }).greyscale().raw().toBuffer({ resolveWithObject: true })
  let bits = ''
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += data[y * 9 + x] > data[y * 9 + x + 1] ? '1' : '0'
  return BigInt('0b' + bits).toString(16).padStart(16, '0')
}

const hamming = (a, b) => {
  let x = BigInt('0x' + a) ^ BigInt('0x' + b)
  let n = 0
  while (x) {
    n += Number(x & 1n)
    x >>= 1n
  }
  return n
}

/* ---------- before / after split detection ---------- */

async function findSplit(file) {
  const { width: W, height: H } = await sharp(file, { limitInputPixels: false }).metadata()
  const vertical = H > W // stacked top/bottom when portrait, side-by-side when landscape
  const N = vertical ? H : W
  const S = 300
  const { data, info } = await sharp(file, { limitInputPixels: false })
    .resize(vertical ? S : W, vertical ? H : S, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const at = (line, k) => (vertical ? data[line * info.width + k] : data[k * info.width + line])
  const L = vertical ? info.width : info.height
  const diff = (i) => {
    let s = 0
    for (let k = 0; k < L; k++) s += Math.abs(at(i, k) - at(i - 1, k))
    return s / L
  }
  const std = (i) => {
    let m = 0
    for (let k = 0; k < L; k++) m += at(i, k)
    m /= L
    let v = 0
    for (let k = 0; k < L; k++) v += (at(i, k) - m) ** 2
    return Math.sqrt(v / L)
  }

  const lo = Math.round(N * 0.42)
  const hi = Math.round(N * 0.58)
  const scores = []
  for (let i = lo; i < hi; i++) scores.push([i, diff(i)])
  scores.sort((a, b) => b[1] - a[1])
  const [p, pScore] = scores[0]

  // Is there a flat divider band (white/black line) next to the main edge?
  let start = p
  let end = p
  const win = Math.max(16, Math.round(N * 0.006))
  const second = scores.find(([i, d]) => Math.abs(i - p) >= 3 && Math.abs(i - p) <= win && d >= pScore * 0.25)
  if (second) {
    const a = Math.min(p, second[0])
    const b = Math.max(p, second[0])
    let flat = true
    for (let i = a; i < b; i++) if (std(i) > 15) flat = false
    if (flat) {
      start = a
      end = b
    }
  }
  const sizeA = start // before: [0, start)
  const sizeB = N - end // after: [end, N)
  const common = Math.min(sizeA, sizeB)
  return {
    vertical,
    W,
    H,
    before: vertical ? { left: 0, top: 0, width: W, height: common } : { left: 0, top: 0, width: common, height: H },
    after: vertical ? { left: 0, top: end, width: W, height: common } : { left: end, top: 0, width: common, height: H },
    note: `edge=${p} band=${start}-${end} sizes=${sizeA}/${sizeB}`,
  }
}

/* ---------- core processing ---------- */

async function processImage(input, extract, outBase, urlBase) {
  let pipeline = sharp(input, { limitInputPixels: false, failOn: 'none' })
  if (extract) pipeline = pipeline.extract(extract)
  // decode once to an intermediate (largest size) to keep huge files fast
  const { data, info } = await pipeline
    .rotate()
    .resize(SIZES.at(-1).w, SIZES.at(-1).h, { fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#0a0a0a' })
    .toColourspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true })
  const raw = { width: info.width, height: info.height, channels: info.channels }

  const img = {}
  for (const s of SIZES) {
    const file = `${outBase}-${s.key}.webp`
    const res = await sharp(data, { raw })
      .resize(s.w, s.h, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: s.q, effort: 5, smartSubsample: true })
      .toFile(file)
    img[s.key] = { src: `${urlBase}-${s.key}.webp`, w: res.width, h: res.height }
  }

  const lqipBuf = await sharp(data, { raw }).resize(16, 16, { fit: 'inside' }).webp({ quality: 35 }).toBuffer()
  const small = await sharp(data, { raw }).resize(64, 64, { fit: 'inside' }).raw().toBuffer({ resolveWithObject: true })
  const { palette, accent } = kmeansPalette(small.data, small.info.channels)
  const dhash = await dHash(data, raw)

  return {
    img,
    lqip: `data:image/webp;base64,${lqipBuf.toString('base64')}`,
    palette,
    accent,
    dhash,
    ratio: +(info.width / info.height).toFixed(4),
  }
}

async function md5(file) {
  return crypto.createHash('md5').update(await fs.readFile(file)).digest('hex')
}

async function main() {
  const t0 = Date.now()
  await fs.mkdir(OUT_DIR, { recursive: true })
  let cache = {}
  if (!FORCE && existsSync(CACHE_FILE)) cache = JSON.parse(await fs.readFile(CACHE_FILE, 'utf8'))
  const nextCache = {}
  const items = []
  const categories = []

  for (const cat of CATEGORIES) {
    const dir = path.join(SOURCE, cat.folder)
    if (!existsSync(dir)) {
      console.warn(`! missing folder: ${cat.folder} (skipped)`)
      continue
    }
    const files = (await fs.readdir(dir))
      .filter((f) => IMAGE_EXT.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
    const outCat = path.join(OUT_DIR, cat.slug)
    await fs.mkdir(outCat, { recursive: true })
    const used = new Set()
    let count = 0

    for (const f of files) {
      const file = path.join(dir, f)
      const stat = await fs.stat(file)
      let slug = slugify(f)
      while (used.has(slug)) slug += '-2'
      used.add(slug)
      const key = `${cat.slug}/${f}`
      const sig = `${stat.size}:${Math.round(stat.mtimeMs)}`
      const cached = cache[key]
      const outBase = path.join(outCat, slug)
      const urlBase = `/works/${cat.slug}/${slug}`
      const expectFiles = cat.split ? [`${outBase}-before-lg.webp`, `${outBase}-after-lg.webp`] : [`${outBase}-lg.webp`]

      let item
      if (cached && cached.sig === sig && expectFiles.every((p) => existsSync(p))) {
        item = cached.item
        process.stdout.write(`  = ${key}\n`)
      } else {
        const t = Date.now()
        const base = {
          id: `${cat.slug}/${slug}`,
          cat: cat.slug,
          file: f,
          hash: await md5(file),
          date: new Date(stat.mtimeMs).toISOString().slice(0, 10),
        }
        if (cat.split) {
          const sp = await findSplit(file)
          const before = await processImage(file, sp.before, `${outBase}-before`, `${urlBase}-before`)
          const after = await processImage(file, sp.after, `${outBase}-after`, `${urlBase}-after`)
          item = {
            ...base,
            split: sp.vertical ? 'v' : 'h',
            w: sp.before.width,
            h: sp.before.height,
            ratio: after.ratio,
            before,
            after,
            img: after.img,
            lqip: after.lqip,
            palette: after.palette,
            accent: after.accent,
            dhash: after.dhash,
          }
          console.log(`  + ${key}  [${sp.note}]  ${Date.now() - t}ms`)
        } else {
          const meta = await sharp(file, { limitInputPixels: false }).metadata()
          const r = await processImage(file, null, outBase, urlBase)
          item = { ...base, w: meta.width, h: meta.height, ...r }
          console.log(`  + ${key}  ${meta.width}x${meta.height}  ${Date.now() - t}ms`)
        }
      }
      nextCache[key] = { sig, item }
      items.push(item)
      count++
    }
    categories.push({ slug: cat.slug, name: cat.name, folder: cat.folder, count })
  }

  // exact + near duplicates (used to keep the "All" view clean)
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < i; j++) {
      const a = items[i]
      const b = items[j]
      if (a.cat === 'before-after' || b.cat === 'before-after' || a.cat === b.cat) continue
      const same = a.hash === b.hash
      const near = !same && hamming(a.dhash, b.dhash) <= 5 && Math.abs(a.ratio - b.ratio) < 0.02
      if (same || near) {
        a.dupeOf = b.id
        console.log(`  ~ ${same ? 'duplicate' : 'near-duplicate'}: ${a.id}  ==  ${b.id}`)
        break
      }
    }
  }

  await fs.writeFile(DATA_FILE, JSON.stringify({ generatedAt: new Date().toISOString(), categories, items }, null, 0))
  await fs.writeFile(CACHE_FILE, JSON.stringify(nextCache))
  console.log(`\nDone: ${items.length} images in ${categories.length} categories (${((Date.now() - t0) / 1000).toFixed(1)}s)`)
  console.log(`Data -> ${path.relative(SITE, DATA_FILE)}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
