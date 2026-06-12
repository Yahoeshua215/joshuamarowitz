# Landing page face assets

The sci-fi landing page (`/`) renders your face as a 2.5D holographic portrait
on the astronaut's visor. Drop your images here:

- `face.png` (required for your real likeness)
  - Forward-facing headshot, square, ~1024x1024.
  - A plain/dark background reads best as a hologram.
  - Until this file exists, a featureless placeholder bust is shown.

- `face-depth.png` (optional, improves the 3D relief)
  - Grayscale depth map: white = closest to camera, black = farthest.
  - If omitted, a procedural radial bulge is used automatically.

No code changes are needed after adding the files — they load at runtime from
`/me/face.png` and `/me/face-depth.png`.
