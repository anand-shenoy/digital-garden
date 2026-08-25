---
tags:
  - illustration
  - graphic-design
  - architecture
  - generative
---

# Procedural Doodle Generation

**Type:** Technique / working tool

Code that draws architectural massing in my own sketching hand, and generates variations faster than I can draw them.

![[procedural-doodle-generation-01.png]]

**[Open the tool →](https://claude.ai/code/artifact/8a441741-c9b7-4066-bb07-17d34cc8358b)** — refresh for a new set, play to view one at a time, export as PNG.

## Why

Early massing exploration is the same move repeated: take a volume, add or subtract another at a corner, look at it, try the next one. The thinking is in the *comparing*, not the drawing. Drawing twenty-four options by hand costs an afternoon and I would stop at six.

So: encode the rules, let the code produce the options, and spend the attention on choosing.

Deliberately **not** an image model. This is procedural, so it is deterministic, parametric and instantly variable. Different tool from the [[illustration-style]] work, which needs a diffusion model and someone else's servers.

## How it works, briefly

Source technique: [@mannay on X](https://x.com/mannay) drew doodle faces in Canvas 2D where every feature is a function positioned on a **rough 3D model** first, then projected to 2D. That 3D anchoring is what survives rotation.

Buildings turn out to be the easier case, since a massing volume genuinely is a box. The form is a set of cells on a lattice: a face is drawn wherever a cell has no neighbour facing the camera, and **edges are derived rather than authored** — shared by two coplanar faces means interior and dropped, different orientations means a fold, belonging to one face means silhouette. Nobody specifies where a line goes; the line hierarchy falls out of the solid.

## What actually mattered

**Line hierarchy beats texture.** Heavy silhouette, lighter fold, lighter still inside a cavity. Get the hierarchy right and it reads as a drawing. Get it wrong and no amount of wobble saves it.

**Lit faces are unpainted paper**, the same tone as the ground, not cream. One shaded face. Voids dark. That is the whole palette.

**Hand-drawn quality lives in variation along the stroke** — width, opacity, deviation, deliberate gaps. Jittering the *endpoints* does nothing: a line with wobbly ends is still perfectly straight in between. That one cost three revisions.

## Two lessons worth the trouble

**Automated checking confirms the requirements you already know about.** I had a QA process measuring face tones, stroke widths and vertex positions numerically. It passed every version. It caught none of the four real geometry bugs, because in each case the *specification* was wrong, not the code. Only looking found the requirement nobody had written down.

**Check the harness before you change the code.** The phone layout looked wrecked, so I rewrote it twice. Nothing was wrong with it. Headless Chrome was reporting a 500px viewport regardless of the window size I passed, then cropping the screenshot to the width I asked for. Every mobile screenshot was a crop of a wider page.

Both are failures of the *checking apparatus*, not the thing being checked. That is the pattern to watch for.

## Related
- [[illustration-style]]
- [[graphic-design]]
