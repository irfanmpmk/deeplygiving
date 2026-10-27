# Deeply Giving

Website for **Deeply Giving**: psychology-driven experiences and reflective journals that help people enrich the human experience.

It's a static site with no build step. Brand colours are white and teal blue.

## Structure

```
index.html                 single-page site
css/style.css              brand tokens, layout, responsive rules
js/main.js                 motion & interactions
assets/logo-mark.svg       vector logo mark (also the favicon)
assets/img/                photography (WebP)
assets/docs/               brochure PDFs shown in the in-page viewer
```

## Libraries (loaded from CDN)

- [GSAP 3.12.5](https://gsap.com) + ScrollTrigger: scroll animations
- [Lenis 1.1.13](https://github.com/darkroomengineering/lenis): smooth scrolling
- [pdf.js 3.11.174](https://mozilla.github.io/pdf.js/): renders the brochures on the page

If a CDN fails to load, the content still shows. Users who turn on reduced motion get the site without animation.

## Run locally

The PDF viewer needs the site to be served over HTTP. Opening the file directly (`file://`) won't work.

```bash
npx http-server -p 5173 .
# then open http://localhost:5173
```

## Deploy (GitHub Pages)

Go to repo **Settings → Pages**, set Source to *Deploy from a branch*, and pick `main` / `root`.

## Editing content

- All text is in `index.html`, in sections marked with `<!-- ===== SECTION ===== -->` comments.
- To swap a brochure, replace the file in `assets/docs/` and keep the same filename.
- Brand colours are CSS variables at the top of `css/style.css` (`--teal-*`).
