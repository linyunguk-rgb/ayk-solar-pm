# AYK PWA Icons

This directory contains the icons used by the AYK Solar Project Management PWA
and for Play Store TWA packaging.

## Source

`icon.svg` is the canonical source icon — a sun/solar themed mark on an
emerald-to-slate gradient background, with rounded corners (maskable-safe:
the visible content sits within the inner 80% safe zone).

## Generated PNGs

| File                  | Size       | Purpose                                         |
| --------------------- | ---------- | ----------------------------------------------- |
| `icon-192.png`        | 192 × 192  | PWA manifest icon (any + maskable)              |
| `icon-512.png`        | 512 × 512  | PWA manifest icon (any + maskable) / Play Store |
| `apple-touch-icon.png`| 180 × 180  | iOS home-screen icon                            |
| `favicon-32.png`      | 32 × 32    | Browser tab favicon (hi-dpi)                    |
| `favicon-16.png`      | 16 × 16    | Browser tab favicon                             |

## Regenerating the PNGs from the SVG

The PNGs were rendered from `icon.svg` using `cairosvg`. To regenerate:

```bash
python3 -c "
import cairosvg
cairosvg.svg2png(url='public/icons/icon.svg', write_to='public/icons/icon-192.png', output_width=192,  output_height=192)
cairosvg.svg2png(url='public/icons/icon.svg', write_to='public/icons/icon-512.png', output_width=512,  output_height=512)
cairosvg.svg2png(url='public/icons/icon.svg', write_to='public/icons/apple-touch-icon.png', output_width=180, output_height=180)
cairosvg.svg2png(url='public/icons/icon.svg', write_to='public/icons/favicon-32.png', output_width=32,  output_height=32)
cairosvg.svg2png(url='public/icons/icon.svg', write_to='public/icons/favicon-16.png', output_width=16,  output_height=16)
"
```

Alternative tools: `rsvg-convert`, `inkscape`, or `sharp` (Node).

## Play Store (TWA) requirements

For Google Play Store packaging as a Trusted Web Activity:

- **512 × 512 PNG** — required for the store listing (provided as `icon-512.png`).
- **Foreground / Background icons** — Android adaptive icons require a foreground
  (108 × 108 dp visible, 72 × 72 dp safe-zone) and a background drawable.
  The current `icon-512.png` is maskable-safe and works as the foreground.
  Generate the dedicated adaptive icon drawables in Android Studio from the
  same SVG if needed.
- The `manifest.json` already declares both 192 and 512 PNGs with
  `"purpose": "any maskable"`, which Android Chrome and TWA bubblewrap accept.

After any change to `icon.svg`, regenerate the PNGs (see above) before
publishing a new Play Store build.
