# Asset provenance

## Phosphor typography and grain

Added 11 September 2026 from the user's supplied `preview (11).html` and `preview (12).html`. The printable ASCII alphabet and TrueType construction code come from Preview 11; the local builder changes square spacing, geometry, metrics and family names and produces two optical sizes. Preview 12 supplies the panel composition and its embedded grain PNG, copied unchanged to `public/phosphor-grain.png`. No raster labels, glyph atlas, canvas lettering or sample password images from Preview 12 are used in the app. Source files remain untouched.

On 11 September 2026, the project author confirmed these references were created through their own AI image-generation process and then translated into code with a model. They were not supplied as an identified third-party font or codebase. The project-authored adaptations are offered under the repository MIT license. This records the author’s provenance statement, not a guarantee of model-output uniqueness. No new imagery was generated during the Phosphor implementation.

Rebuild the checked-in fonts only when changing the alphabet or geometry; ordinary builds use the existing WOFF2 files:

```sh
node scripts/build-phosphor-font.mjs
uv run --with fonttools --with brotli python - <<'PY'
from fontTools.ttLib import TTFont
from pathlib import Path
for path in Path('public/fonts').glob('phosphor-*.ttf'):
    font = TTFont(path)
    font.flavor = 'woff2'
    font.save(path.with_suffix('.woff2'))
PY
```

Both fonts cover printable ASCII (U+0020–U+007E). System monospace handles body copy and any unsupported characters. The included TTF files are authoring intermediates; the browser loads WOFF2 only.

## Horizon landscape

Generated on 11 September 2026 using the built-in image generation tool. The user's supplied generated concept was used as a visual style and composition reference. Only the scenery was generated; the interface, text, controls and cube are implemented in the app.

- Final asset: `public/horizon-landscape.png` (1672 × 941 PNG), copied unchanged from the tool output.
- The scenery loads only on Horizon. Existing designs and supplied sources are preserved.

## Generation prompt

Use case: stylized-concept. Asset type: background artwork for a working password-generator website. Input image: visual style and composition reference ONLY. Create a new wide 16:9 background showing the reference's dreamy lavender pixel-art alien landscape: a pale lilac sky, distant plum mountains at the far left and right edges along the lower quarter, a flat reflective lilac plain with sparse horizontal pixel reflections, one softly dithered moon on the left side and a smaller distant moon on the right, a few understated cross-shaped stars. This should feel like an optimistic late-1990s console future, SNES pixel art meets Dreamcast menus. Keep the middle 65 percent of the canvas and upper middle very quiet and open because a real dark web interface will sit there. Preserve the image's very light lilac dominant palette and darker violet pixel mountains; crisp tasteful dithering and visible pixels, soft atmospheric distance. Full bleed to all edges, landscape fills bottom edge. NO panel, no frame, no UI, no buttons, no text, no logos, no labels, no typography, no cube, no people. The entire output must be ONLY the landscape environment.
