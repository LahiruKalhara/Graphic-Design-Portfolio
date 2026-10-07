import gallery from './gallery.json'
import { META, PAIRS, ORDER, ALL_MIX, HERO, FEATURED, PLAYGROUND, ABOUT_CHIPS } from './meta'

const prettify = (file) =>
  file
    .replace(/\.[^.]+$/, '')
    .replace(/LK CREATIONS?/gi, '')
    .replace(/\b(rev\s*\d+|updated|final|copy)\b/gi, '')
    .replace(/\(\d+\)/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Untitled'

const CAT_NAME = Object.fromEntries(gallery.categories.map((c) => [c.slug, c.name]))

export const ITEMS = gallery.items.map((it) => {
  const key = `${it.cat}/${it.file}`
  const meta = META[key] || {}
  return { ...it, key, title: meta.title || prettify(it.file), note: meta.note || '', catName: CAT_NAME[it.cat] || it.cat }
})

const BY_KEY = new Map(ITEMS.map((i) => [i.key, i]))
const BY_ID = new Map(ITEMS.map((i) => [i.id, i]))
export const byKey = (k) => BY_KEY.get(k)

// Link every before/after breakdown to its finished piece (and duplicates of it).
for (const [baKey, finalKey] of Object.entries(PAIRS)) {
  const ba = BY_KEY.get(baKey)
  const fin = BY_KEY.get(finalKey)
  if (!ba || !fin) continue
  ba.pairKey = finalKey
  if (!META[baKey]) {
    ba.title = fin.title
    ba.note = fin.note
  }
  fin.breakdownKey = baKey
}
for (const it of ITEMS) {
  if (it.dupeOf && !it.breakdownKey) {
    const original = BY_ID.get(it.dupeOf)
    if (original?.breakdownKey) it.breakdownKey = original.breakdownKey
  }
}

const orderIndex = (it) => {
  const i = (ORDER[it.cat] || []).indexOf(it.file)
  return i === -1 ? 1e4 : i
}

const CACHE = new Map()
export function itemsByCat(cat) {
  if (!CACHE.has(cat)) {
    CACHE.set(
      cat,
      ITEMS.filter((i) => i.cat === cat).sort(
        (a, b) => orderIndex(a) - orderIndex(b) || a.file.localeCompare(b.file, undefined, { numeric: true }),
      ),
    )
  }
  return CACHE.get(cat)
}

// "All": every piece once (duplicates across folders removed), categories mixed round-robin,
// with before/after breakdowns sprinkled in, never right next to their finished piece.
const ALL = (() => {
  const cats = [...ALL_MIX, ...gallery.categories.map((c) => c.slug).filter((c) => !ALL_MIX.includes(c))]
  const lists = cats.filter((c) => c !== 'before-after').map((c) => itemsByCat(c).filter((i) => !i.dupeOf))
  const base = []
  for (let r = 0, added = true; added; r++) {
    added = false
    for (const l of lists) {
      if (r < l.length) {
        base.push(l[r])
        added = true
      }
    }
  }
  const breakdowns = itemsByCat('before-after').slice()
  const baseIndex = new Map(base.map((it, i) => [it.key, i]))
  const GAP = 10
  const out = []
  let since = 0
  base.forEach((it, i) => {
    out.push(it)
    since++
    if (since < 4 || !breakdowns.length) return
    const k = breakdowns.findIndex((b) => {
      const placed = out.findIndex((o) => o.key === b.pairKey)
      if (placed !== -1) return out.length - placed > GAP
      const later = baseIndex.get(b.pairKey)
      return later === undefined || later - i > GAP
    })
    if (k !== -1) {
      out.push(breakdowns.splice(k, 1)[0])
      since = 0
    }
  })
  return [...out, ...breakdowns]
})()

export const itemsFor = (filter) => (filter === 'all' ? ALL : itemsByCat(filter))

export const CATEGORIES = [
  { slug: 'all', name: 'All', count: ALL.length },
  ...gallery.categories.filter((c) => c.count > 0),
]

export const TOTAL_FILES = ITEMS.length

/** The breakdown (before/after item) for any item, if one exists. */
export const breakdownFor = (item) =>
  !item ? null : item.cat === 'before-after' ? item : item.breakdownKey ? BY_KEY.get(item.breakdownKey) : null

export const HERO_ITEMS = HERO.map((h) => {
  const it = BY_KEY.get(h.key)
  return it && it.before ? { ...it, focus: h.focus } : null
}).filter(Boolean)

export const FEATURED_ITEMS = FEATURED.map((k) => BY_KEY.get(k)).filter(Boolean)
export const LAB_ITEMS = itemsByCat('before-after')
export const PLAYGROUND_ITEM = BY_KEY.get(PLAYGROUND.key)
export const PLAYGROUND_TITLE = PLAYGROUND.title
export const CHIP_ITEMS = Object.fromEntries(Object.entries(ABOUT_CHIPS).map(([k, v]) => [k, BY_KEY.get(v)]))

export const srcSet = (img) =>
  ['sm', 'md', 'lg']
    .filter((k) => img?.[k])
    .map((k) => `${img[k].src} ${img[k].w}w`)
    .join(', ')
