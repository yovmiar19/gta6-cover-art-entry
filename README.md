# Vice Cover

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/yovmiar19/gta6-cover-art-entry/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/yovmiar19/gta6-cover-art-entry/reward.svg)](https://make.fun/c/gta6-cover-art-01)

A web app that turns a photo and a caption into GTA 6-style cover art, exported as a PNG to share. Built for the [gta6-cover-art-01](https://make.fun/c/gta6-cover-art-01) competition on make.fun.

## What it does

- **Any photo**: upload up to three photos from your machine, or start with the two included sample photos. Photos are read locally and never uploaded.
- **Multi-panel posters**: three layouts — Triptych, Hero strip, and Quad. Each panel takes any of your photos; click a panel in the preview to pick it, drag its photo to reposition it, zoom with the slider.
- **Bold caption lettering**: editable caption and tagline, four ink colours, size and top/bottom placement.
- **Colour grades**: Sunset, Neon, Dusk, and Clean washes over the whole poster.
- **Fast export**: one click exports a PNG in 1080 × 1080, 1080 × 1350, or 1920 × 1080.

## Run it

Static files, no build step, no network requests. Serve `app/` with any static server and open `app/index.html` in desktop Chrome:

```sh
node serve.ts
```

Then open http://localhost:8080.

## Originality

Original design. No Rockstar Games logo, wordmark, official artwork, character, or font. The two sample photos under `app/samples/` were made with an image model for make.fun and are free to use.

## License

MIT — see [LICENSE](LICENSE).
