---
title: Chisel
tags:
  - architecture
  - generative
  - graphic-design
---

# Chisel

**Type:** Working tool
**Status:** Live, in development

A generator for axonometric massing studies. It builds a form from stacked
orthogonal blocks, carves it with real boolean subtraction, and draws it flat,
the way a massing sketch gets drawn by hand.

Three dials reshape the form without rolling a new one, so you can hold a shape
and push it rather than gambling on the next random result.

| Dial | What it changes |
| --- | --- |
| Complexity | How many blocks, whether they overhang, how many cuts and which kinds |
| Spread | How wide the lattice is, and whether growth goes sideways or upward |
| Height | Number of levels, one to four, and the storey height |

<div style="position:relative;width:100%;aspect-ratio:3/4;max-height:80vh;border:1px solid var(--lightgray);margin:1.5rem 0;overflow:hidden;">
  <iframe src="../static/chisel/index.html" title="Chisel massing generator" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;border:0;display:block;"></iframe>
</div>

[Open Chisel full screen](../static/chisel/index.html)

On an iPad the full screen version is the better one. Orbit with one finger,
pan with two, pinch to zoom. On a desktop, drag to orbit, scroll to zoom, and
hold shift or use the right button to pan.

## How the geometry works

Every block is axis aligned, which makes exact boolean geometry cheap. A grid is
built from the blocks' own coordinate planes, each cell is classified as solid or
void, and the boundary is then walked to produce the surface. Because the grid
lands exactly on every face, nothing is approximated.

That matters for two reasons. Edges are drawn only where a flat face region
stops, which is precisely the line where two masses intersect, so the form reads
as one solid rather than as boxes sitting inside each other. And subtractions are
genuine voids with depth you can orbit into, rather than dark rectangles painted
onto an elevation.

## The carving moves

- **Hollow** - an inner box removed from the top, leaving a wall thickness of one
  or two modules. This is what produces the open courtyard reads.
- **U-cut** - a full height bite out of one side, giving a U on plan.
- **Corner cut** - a whole corner taken out of a block.
- **Through slot** - driven right the way through.
- **Letterbox slot** - a long thin recess pressed into one elevation.
- **Notch** - a smaller bite out of a face.

Which moves are available depends on where Complexity sits. Low down you only get
slots and notches. Hollows appear past the middle, U-cuts higher still.

## Drawing

Ambient light carries almost all of the illumination and the directional light
contributes very little, so each face resolves to one flat tone with no gradient
across it. Three tones, a narrow range, which is how a massing drawing reads.

On top of that sit two flat terms, both computed per face so they never introduce
a gradient: an occlusion term that steps recessed faces down so pockets read as
depth, and a cast shadow term where a ray toward the light is blocked. The ground
shadow is the real silhouette, the footprint swept from ground level to the top
of each column and blurred in a single pass.

## Known limits

Pitched roofs are not possible. The exactness of the geometry comes from every
cutting plane being axis aligned, and a gable needs an angled one. That would be
a different engine, not a setting.

Line weight is fixed at one pixel, which is the hardware maximum for lines in
WebGL. Anything heavier needs the edges rebuilt as geometry rather than lines.

Related: [[procedural-doodle-generation]]
