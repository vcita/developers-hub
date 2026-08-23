# inTandem Icon Library

The icon identifiers accepted by the `icon` property of a
[navigation item](../entities/apps/md/navigation_item.md) — and any other platform object
that references the icon library.

Published via GitHub Pages: <https://vcita.github.io/developers-hub/icons/>

| File | Purpose |
| --- | --- |
| `index.html` | Browsable, filterable gallery that renders the real glyphs. Click an icon to copy its name. |
| `icon-names.json` | Machine-readable list — `{ font_family, source, count, icons: [{ name, codepoint }] }`. |
| `icon-names.txt` | Plain newline-delimited list. |
| `intandem-icons.woff2` | The platform icon font, so the gallery renders offline. |

## Source of truth

The list is derived from the platform IcoMoon stylesheet the inTandem UI itself loads:

```
https://d2wdno3fcy3zvr.cloudfront.net/icons/frontage/style.css
```

Every `.icon-*` class in that stylesheet is a valid value. Nothing in this folder is
hand-maintained — regenerate it whenever the platform icon font is bumped:

```bash
npm run gen:icons
```

That downloads the stylesheet and font, rewrites the two lists, and regenerates
`index.html`.
