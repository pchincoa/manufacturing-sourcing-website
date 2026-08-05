# Manufacturing Sourcing Partners

Static multilingual website for an international manufacturing sourcing consultancy.

## Language structure

Public content is published under localized directories:

- `/en/` for English
- `/de/` for German
- `/es/` for Spanish

The root `index.html` is intentionally lightweight and sends users safely to `/en/` while still offering manual language links when JavaScript or meta refresh is unavailable. No IP-based language redirect is used.

## Local preview

Run any static web server from the repository root, for example:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Base-path aware routing

Internal navigation uses localized route values (for example `/en/services/`) and resolves them at runtime in `assets/js/components.js` from `import.meta.url`. Because the component module is loaded from `assets/js/`, the site base path is derived from the script URL rather than hard-coded into every page. This keeps links inside `/manufacturing-sourcing-website/` on GitHub Pages while still resolving to root-relative paths on a future custom domain. Static content links use `data-route` attributes so the same centralized resolver updates header links, CTAs, capability cards, sidebars, footers and language switching consistently.

## Updating the brand

Shared brand values are held in `config/brand.js`. Update that file to change the company name, tagline, public domain, contact email, logo reference, and main color palette across the site.
