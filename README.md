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

## Updating the brand

Shared brand values are held in `config/brand.js`. Update that file to change the company name, tagline, public domain, contact email, logo reference, and main color palette across the site.
