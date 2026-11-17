# Alpic landing page — animated Figma hero

Brand preview for alpic.ai. From this folder, run `npm run dev` and open http://127.0.0.1:4174. The served site is `dist/` (tracked on purpose; the repo-wide `dist` ignore does not apply here).

Source design: Figma file ZO8vcUgVwp8p0TaTpnRbiR, node 9039:20373.

The responsive layout, original assets, navigation, and draft CTA dialogs are prepared. Product signup and pricing integrations are not configured; their dialogs clearly identify this as a design preview.

The user subsequently authorized connecting the original Figma shader through a custom browser adapter. The authored effect source is retained verbatim in src/lib/custom-effects, with only TypeScript annotations stripped into dist/figma-dither.js by Node's stripTypeScriptTypes. The image-texture adapter in mountain-animation.js calls its original setup/render functions with Bayer 16×16, 3 color levels, contrast 1, brightness 100, mono false, 6px foreground and 8px background, scaled to the Figma design width. The 10% background opacity is preserved. No HTML-in-Canvas API is required for image-texture input.

Animation deforms the mountain raster coherently before passing it through the original compute shader. The graph above it is preset 21, Grand Alpine, rendered by unchanged source files copied directly from the local `../mountain-playground/dist` repository into `dist/prototype`. Its saved recipe includes seed 246114, density 10, detail 67, mixed 6.8px squares, dashed lines, and drift motion. The recipe produces exactly 86 squares and 174 lines. The former hand-built overlay and traveling extra samples have been removed. `npm run check` verifies source-file equality, geometry equality, graph counts, and motion samples against the local prototype.

Motion pauses outside the viewport or in a hidden tab. Reduced-motion preferences start with a still composition; the explicit play/pause button remains available. Browsers without WebGPU use a CPU Bayer implementation with the same matrix and quantization parameters. The original image remains visible if the animation module fails to initialize.

The Grand Alpine replacement is currently local only at the user's request. The working Git root is `alpic-landing`; `mountain-playground` is a separate sibling Git repository used as the renderer source. No remote publication was made for this replacement.

## Local mountain studio

The full-width hero has a small Configure button that opens a compact, nonmodal drop-up anchored above the button. Pause Motion lives inside this popup, alongside Reset and the Position, Shape, Lines, Squares, Motion, and Image tabs. All existing controls, undo/redo, settings export, and browser-local persistence remain available. The drop-up closes with its close button, Escape, the Configure button, or an outside click. It has no backdrop or focus trap, and follows its anchor on scroll and resize. No toolbar or sidebar is shown on the landing page.

The original preset recipe and renderer remain unchanged. Landing-page presentation defaults explicitly override line and square colors to black. `mountain-fit.js` traces the original PNG's alpha silhouette and registers preset 21's display vertices to its summit, roof, and base while retaining all 86 square indices and 174 connections. The registration follows the raster's animated deformation. The Position tab exposes Fit graph to mountain silhouette plus independent position, uniform scale, width/height scale, and rotation controls for the mountain image and graph overlay. Move graph with mountain image links their placement; Reset positions & scales resets placement without affecting styling. The original affine placement remains available when fitting is turned off. Version-two local settings preserve earlier styling while migrating alignment to the fitted defaults (100% scales, zero offsets).

The solutions section now has the heading “Two ways to get ready for AI agents:” and narrower paired cards. These refinements remain local.


Dash Shuffle in Motion animates each connection’s dash phase continuously while keeping graph geometry fixed. Its dash length and gap are adjustable; speed and motion amount tune the rhythm. Pause Motion freezes both layers. npm run check verifies transforms, linked placement, rotations, looping phases, and unchanged renderer endpoints.

The solutions cards share one desktop row with aligned CTAs and stack on mobile. [ THE SHIFT ] precedes the heading. The manifesto reveals word by word with scroll, reversing on upward scroll; reduced-motion users see the full statement. CTA arrows use the original Figma Inter Regular glyph bundled locally as assets/inter-arrow.ttf.


## Agent readiness section

The local section at #agent-readiness follows the existing solutions section. Its content and three previews are adapted from Figma section 9091:14018, specifically the light study 9078:12343: Measure agent traffic, Run tests at scale, and Fix what breaks. The implementation reuses the existing typography, CTA arrow font, palette and width rules, with square panels and cyan/pink accents. All visuals are native HTML/CSS; no rasterized Figma screenshot is used.

The 7D/30D toggle changes illustrative traffic data. Run demo progresses through 56 sample checks, with an accessible completion count and reduced-motion support. The fix toggle changes the sample trace from a missing API key to success and can reset it. These are browser-only demonstrations, not live telemetry or actual product fixes. Get early access opens the existing design-preview dialog.


## Manifesto scroll pacing

The resources statement now uses locally bundled GSAP + ScrollTrigger 3.15.1 (see dist/vendor/gsap/NOTICE.md). A viewport-height reading stage is pinned for 1.8 viewport heights, with a minimum 1100px scroll distance. A scrubbed timeline includes a lead-in, sequential word-color reveal, supporting-note fade and a completed hold. The surrounding section adds 18vh (120–240px) above and below on desktop. Reduced-motion users get a fully readable, unpinned layout; missing vendor scripts also leave the statement readable. The native short-range scroll handler was replaced by dist/manifesto-reveal.js. Browser QA verified pinning, completion and reversal with no console errors.


The readiness previews now use pale mint, blue-gray and neutral panels, muted sage/blush data marks, a neutral heading and a pale CTA. The section eyebrow and the three numbered step eyebrows were removed to simplify the layout. Demo controls and sample-data labeling are retained.


## Alternating readiness features

The readiness section now presents three generous alternating rows: traffic copy left / chart right, tests chart left / copy right, and fix copy left / trace right. On small screens each row stacks with its copy first. The solid, pale product panels retain traffic-period, run-demo and apply-fix interactions. Each panel sits above a separate procedural square-data field (wave, rings, contours), drawn by preview-data-fields.js. Fields resize with their containers, animate at a capped cadence only while visible, pause in hidden tabs and render still for reduced motion. Browser checks verified alternating coordinates, larger panels, all three demo controls and no console errors.


The manifesto supporting paragraph is centered. Its heading is slightly smaller, and the pinned stage now has the original prototype preset 12 (Fractured Peaks / Fracture) rendered transparently behind the text in a pale sage-gray at 14% layer opacity. The original renderer is shared with the hero; slow drift is isolated from hero configuration. The backdrop pauses offscreen and in hidden tabs, and is static with reduced motion.


Readiness rows now span the entire viewport with equal halves, zero outer gutters and no inter-row gaps; mobile stacks the halves. Copy and preview typography use Mozilla Text. The manifesto backdrop has its own discreet Background drop-up using the same controls factory as the hero, with 46 presets, position/scale/rotation, shape, line/square styling, layer opacity, motion, Dash Shuffle, pause, undo/redo/reset and JSON export. State is stored independently under alpic-manifesto-studio-v1. Default drift is faster and more visible (speed 1, amplitude 48) while keeping the pale 14% treatment. Browser QA confirmed elapsed animation time advances, opacity updates, preset changes and undo, independent hero settings and no errors.


The readiness introduction now has a generous 550px desktop composition, a stacked See it / Test it / Fix it headline, supporting copy and early-access CTA, plus a square-and-line navigation rail linking to the three full-width feature rows. It stacks naturally on mobile, using the same pale palette and Mozilla Text.


All three split-feature backgrounds now reuse the hero’s original everest11.png raster crop and Bayer 16×16 checker treatment. The sampled texture is converted to luminance and tinted sage, blue-gray and warm neutral respectively, replacing the previous procedural dots/rings. Product panels stay opaque. A slow pan preserves subtle movement; offscreen/hidden pauses and reduced-motion still rendering remain. Browser QA verified all three textures, demo controls and no console errors.


The split-section palette is centralized in dist/brand-palette.css using the official Figma variables verified at nodes 9039:20373 and 9078:12343. Scene bases are Light Lime #F6FFED, Midnight 50 #EAF4F3 and Berry 50 #FFF0F3; texture inks are Midnight 400 #227F72, Midnight 300 #4FA9A2 and Berry 500 #FF3B76. Preview data, text, borders and controls now use the same lime/teal/berry families rather than the earlier gray-green, blue-gray and mauve approximations. Pale error marks are white tints of official Berry 500. Browser QA confirmed all three computed colors and no console errors.


Scroll pacing was shortened: the manifesto now pins for 0.85 viewport heights (minimum 540px), with 0.3s scrub smoothing and much shorter lead-in/end holds. This replaces the earlier 1.8 viewport / 1100px minimum interval.


The split backgrounds now use three original alpine scene images from Figma section 9118:14035: a peak, ski lift and lodge. Local assets and source node provenance live in dist/assets/alpine-scenes.json. preview-data-fields.js applies the original Dither shader with Bayer 16x16, eight levels and an eight-pixel design scale, through the approved image adapter; a matching CPU fallback handles browsers without WebGPU. These Figma scenes are static. Pale official lime, teal and berry color overlays sit above them, behind the opaque interactive product panels. Background loading is independent of demo initialization. Browser QA verified all three render, traffic controls, completed test runs, fix interaction and no console errors.
