# Lahiru Kalhara — Portfolio ("Behind the Layers")

A dark, cinematic graphic design portfolio built with **React 19 + Vite**, **Motion** (animations) and **Lenis**
(smooth scrolling).

The web-optimised artwork is committed in `public/works`, so the site builds anywhere. The original high-resolution
files are not in this repo; they live locally in category folders next to the project folder (see "Add new work").

## Run it

```bash
npm install      # first time only
npm run dev      # open http://localhost:5173
```

Production build (outputs a static site to `website/dist`):

```bash
npm run build
npm run preview  # check the built site at http://localhost:4173
```

## Edit your details

| What | File |
| --- | --- |
| Name, stats, **email / WhatsApp / Fiverr / socials** | `src/data/profile.js` (empty links are hidden) |
| Artwork titles & descriptions, featured picks, hero slides, services, clients | `src/data/meta.js` |
| Colours & fonts | top of `src/styles/global.css` |

## Add new work

1. Drop images into the category folders that sit next to this project folder (`Posters`, `Flyer Designes`,
   `Photo Manipulations`, `Banner Design`, `Youtube Thumbnails`, `Photo Frame Design`).
   Before/after composites go in `Photo Manipulations Before After` (raw on top / final below, or raw left / final right).
2. Run `npm run images` (only new or changed files are processed; use `npm run images -- --force` to redo everything).
3. Optionally give the piece a nice title in `src/data/meta.js`; otherwise it's titled from its file name.

The image script (`scripts/build-images.mjs`) converts everything to WebP in three sizes, makes blur placeholders and
colour palettes, finds the split line in each before/after composite, and detects duplicates between folders.

## Sections

Preloader (pen-tool logo) → Hero with **x-ray brush** (reveals the raw layers under the finished art) → marquee →
About & stats → pinned **Selected works** reel → **Layer Lab** (18 drag-to-compare breakdowns) → interactive
**Layers panel** (real blend modes & opacity) → thumbnails → filterable **Archive** with zoomable lightbox →
Services & toolkit → clients → contact.

## Deploying

`npm run build` produces a fully static `dist` folder. It can be uploaded as-is to Netlify, Vercel, Cloudflare Pages,
GitHub Pages or any web host.
