---
tags:
  - illustration
  - graphic-design
  - architecture
  - generative
---

# Procedural Doodle Generation

**Type:** Technique / prototype idea

## The Technique

Source: [@mannay on X](https://x.com/mannay) — doodle faces drawn entirely with Canvas 2D, no image model involved. The core trick: every facial feature (eyes, nose, mouth, hair) is its own drawing function, and each feature is positioned by placing it on a **rough 3D head model** first, then projecting that 3D point to 2D. This is what makes the doodle survive rotation (yaw/pitch/roll) correctly — a naive 2D drawing breaks the moment you try to turn the head, because features don't move together in a way that reads as a real head turning. Anchoring placement to an actual 3D surface, even a very rough one, fixes that.

Replicated as a working Claude Artifact prototype (2026-08-21): "Doodle heads — drawn by functions," with yaw/pitch/roll sliders, a "new head" randomiser, and a gallery of generated variations, ink and cut-paper render modes. Confirms the technique holds up: fully code-drawn, genuinely varied, no diffusion model needed.

**Why this matters next to [[illustration-style]]:** this is a different lane from the hero-image work logged in the anandshenoy.me project (diffusion-model-based, needs ChatGPT). This technique needs no external model at all — it's pure procedural generation, deterministic, scriptable, and instantly variable via parameters/randomisation. Two genuinely different tools for two different jobs.

## Anand's Idea: Apply This to Building Forms

Instead of doodled faces, doodled **building massing** — a "doodle app for architecture." Same underlying trick should translate cleanly, arguably more cleanly than faces, since buildings are already naturally box-like volumes rather than an organic ellipsoid:

- **3D anchor:** a rough massing volume (box, L-shape, or a combination of simple prisms) stands in for the "rough 3D head."
- **Features as functions:** windows (grid-positioned on a facade), doors, roofline (flat/gable/hip), cladding hatch lines (brick coursing, board cladding, render), chimneys, balconies, entrance canopy — each its own function, each positioned by projecting a point on the massing volume's surface through the current yaw/pitch/roll, same as the face technique.
- **Randomisation knobs:** storey count, window grid rhythm/density, massing proportions, roof type, material hatch style — turning "new head" into "new building," rotatable and variable the same way.

## Built: Doodle Buildings prototype (2026-08-23)

Working prototype, six revisions in one session. The projection trick transferred cleanly, as predicted — buildings are an easier case than faces because a massing volume genuinely is a box, so surface points are trivial to define.

**What works:**
- **Face-relative coordinates.** Every element is defined as "40% across the front facade, 60% up," then projected through the current yaw/pitch. One shared projection helper; no feature function reasons about 2D position itself.
- **Normal-based visibility.** Each face (front/back/left/right, plus every roof plane) is tested by rotating its own surface normal and checking whether it points at the camera. An early version hardcoded "front + right," which broke forms at most angles — deriving visibility from the normal is what makes the volume read as solid from any direction.
- **Slot-grid element placement.** Each face carries a grid of bays × storeys. Windows, doors and balconies are dealt into free slots at random, so every face differs and nothing overlaps. Rules are enforced at layout time rather than visually: doors always seat on the base of whichever level they land on; balconies are barred from the ground floor. Layout is computed once per building, not per frame, so rotating never reshuffles anything.
- **Two render modes off identical geometry:** ink Sketch, and coloured stripe-fill Hatch.

**The hard-won bit — making lines look hand-drawn.** Jittering line *endpoints* does nothing: a line with wobbly ends is still perfectly straight between them. Took three revisions to get right. What actually works is subdividing every line into ~7px segments, then pushing each sample sideways off the true line with a *damped random walk* (damping keeps it near the intended path instead of drifting away), and giving every individual segment its own width and alpha. Per-segment width variation is what reads as a brush nib rather than a plotter. On top of that: three passes per line (wet base, independently-wobbled second pass for the doubled-back look of a real pen, and a dry-brush pass that randomly drops ~22% of its segments to break the edge), plus sparse ink speckle and random corner overshoot.

**General lesson worth keeping:** procedural "hand-drawn" quality lives almost entirely in *variation along the stroke* — width, opacity, path deviation, deliberate gaps. Uniform anything reads as machine-made instantly, no matter how much noise sits at the endpoints.

**Where it could go:** early sketch-massing studies before committing to a real model; concept-stage presentation imagery; or a public-facing toy in the vein of the archcurated tools. Not decided.

## The Artefact: a form-variation sheet (2026-08-24)

The building doodles were a warm-up. The real artefact came from a different starting point: rather than inventing a style, I gave the code a sketch of my own and asked it to reproduce my line work and shading, then extend that into form exploration.

Three reference forms first, drawn in Procreate: a plain cube, a cube with a smaller cube added at a corner, and a cube with one subtracted. The style rules that mattered turned out to be fewer than expected. Lit faces are unpainted paper, the same tone as the ground, not cream. One shaded face in dusty mauve. Void interiors dark, floor darkest. A high light source so shadows stay short. And above all a **line hierarchy**: heavy silhouette, lighter fold, lighter still inside a cavity. Get the hierarchy right and the drawing reads; get it wrong and no amount of texture saves it.

Then the variation engine: **a 5×5 sheet of 24 distinct forms**, each a main cube with one smaller cube added or subtracted at a corner junction, every cell labelled so a form can be found again.

### What made it work

Hand-placing geometry was fine for three drawings and hopeless for twenty-four. The move that unlocked it was giving up on authored geometry entirely and building a **voxel engine**: the form is a set of cells, a face is drawn wherever a cell has no neighbour facing the camera, and faces are painted far-to-near so nearer material overdraws farther.

The elegant part is that **the edges are derived rather than drawn**. An edge shared by two coplanar faces is interior and gets dropped. One shared by two faces of different orientation is a fold and gets a light line. One belonging to a single face is silhouette and gets weight. Collinear survivors are merged so strokes run the full length of a form instead of stuttering cell by cell. Nobody specifies where a line goes; the line hierarchy falls out of the solid.

### Four bugs, and what they taught

Every one was caught by eye, not by testing:

1. **Placement.** Volumes added at ground corners ended up buried. Centring a cube on a ground junction is genuinely ill-defined, since half of it belongs underground.
2. **Repeats.** Seven corners times two operations is fourteen possibilities for twenty-four cells, sampled with replacement. This was arithmetic, not bad luck.
3. **Edge classification.** "Only one visible face meets here" describes two different things: the outer boundary of the mass, and the far wall inside a cavity. Weighting both as silhouette made every hole read as a solid stuck to the surface.
4. **Hidden lines.** Edges were drawn after all faces with no occlusion test, so a cavity wall that was completely buried still had its outline painted on top.

The general lesson, which I did not expect: **automated checking confirms the requirements you already know about.** I had a QA process measuring face tones, stroke widths and vertex positions numerically, and it passed every earlier version. It could not catch any of these four, because in each case the specification itself was wrong. Only looking at the thing found the requirement nobody had written down.

### Geometry worth keeping
- A corner notch only reads as an enclosed pocket at the corner **facing you**, where all three faces it opens onto are visible. At any other corner it becomes a cut *through* the corner.
- A cube centred on that same near corner projects concentrically with the main hexagon, so it nests inside the outline rather than breaking it. True, and the least legible of the additive moves at small scale.

### From sheet to instrument

The static sheet was the proof. Making it usable turned it into something I actually reach for: it fills a phone screen, **Refresh** deals a new set from 36 permutations and rerolls the hand-drawn jitter so even a repeated form redraws differently, **Play** fills the screen with one form at a time so you can judge each properly, and **PNG** exports whatever is showing.

One piece of layout maths mattered more than expected. Forms have to be scaled to the *worst case* or the large ones overflow their cell, and the worst case is not a cube. An added block protrudes a quarter unit past the mass on every axis, so from the projection the real extent is **2.60 wide × 2.75 tall** in units of scale, with the vertical centre sitting slightly above the origin, rather than the 1.73 × 2.0 a plain cube would suggest.

### The bug that wasn't

The first two attempts at the phone layout looked wrecked: four of five columns visible, forms overlapping, buttons cut off. I changed the layout code twice trying to fix it.

Nothing was wrong with the layout. **Headless Chrome was reporting a 500px layout viewport regardless of the window size I asked for**, then cropping the screenshot down to the width I requested. Every mobile screenshot was a 393px crop of a 500px page. The newer headless mode behaved the same way. I only caught it by rendering a debug page that printed its own `innerWidth` into the image.

Switching to Playwright with genuine device emulation gave a true 393px viewport, and the layout turned out to be very nearly right all along. Playwright then also drove the buttons, so the controls got *verified* rather than assumed: click each one, confirm the canvas output actually changes, confirm the download event fires, collect any page errors.

**The lesson, which cost me two rounds of edits:** when a rendering looks broken, check that your harness is measuring what you think it is before you touch the code. I spent that time fixing a problem that did not exist, in a file that was already working.

## Related
- [[illustration-style]]
- [[graphic-design]]
