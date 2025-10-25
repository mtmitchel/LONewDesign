# Konva.js Comprehensive Documentation Guide

# Comprehensive Extraction Blueprint for Konva.js Official Documentation (konvajs.org)

## Executive Summary and Scope

This blueprint consolidates, structures, and distills the core content of the Konva.js official documentation into a single, rigorous reference. The aim is to equip front‑end engineers, technical writers, developer advocates, and engineering managers with a cohesive narrative that connects Konva’s conceptual model, practical usage patterns, integration guidance, and performance strategies.

The scope mirrors the official documentation’s scope: an overview of Konva’s architecture and rendering model; installation and setup guidance for browser and Node.js; canonical usage of shapes, styling, events, drag & drop, selection and transformation, clipping, groups and layers, filters, tweens, and animations; demos; selectors and traversal; data and serialization; performance optimization; framework integrations (React, Vue, Angular, Svelte); Node.js server-side rendering and image export; support and donation channels; and API entry points. The extraction plan follows the official site’s main navigation and sidebar structure to ensure completeness and fidelity.[^1][^2][^40]

Constraints and information gaps are explicitly acknowledged. This blueprint does not reproduce every shape’s full API or all tutorials’ inline code; instead, it highlights the minimum set of properties and patterns to get started and defers to the API Reference and dedicated pages for exhaustive detail. Lists of demos, filters, event topics, and integration subpages are drawn from the documentation indices and should be treated as directional rather than exhaustive. Where official pages reference community links, only the source URLs included in the official materials are cited here.[^2][^11][^31]

The blueprint is structured for maximum utility: it starts with a conceptual foundation (what Konva is), progresses to practical usage (how to use it effectively), and ends with strategic guidance (performance, integrations, SSR, and contribution). Appendices reference API anchors and external links to streamline further exploration.

## Konva Overview: Architecture and Capabilities

Konva is an HTML5 Canvas JavaScript framework that extends the 2D drawing context with a virtual node hierarchy and dual renderers to enable interactive, performant graphics for desktop and mobile applications. Everything begins with a Stage, which holds Layers. Each Layer contains Shapes, Groups of Shapes, or nested Groups. Layers have two renderers: a visible scene renderer and a hidden hit graph renderer for efficient event detection. The node hierarchy resembles the DOM: nodes can be nested, transformed, and event-bound, but with Canvas-level performance and control.[^2]

Konva provides high-performance animations, transitions, filtering, caching, and comprehensive event handling across mouse, touch, and pointer inputs. The library includes prebuilt shapes (rectangles, circles, ellipses, lines, polygons, splines, blobs, images, text, text paths, stars, labels, SVG paths, regular polygons) and supports custom shapes via a draw function. Styling capabilities include fills (solid colors, gradients, patterns), strokes, shadows, and opacity. Interactivity is powered by a rich event system, drag-and-drop primitives, and a Transformer for selection, resize, and rotation. Performance is achieved through caching, layered rendering, and draw minimization strategies.[^2]

To ground this overview, the following summary consolidates architecture and capability highlights.

Table 1. Konva architecture and capabilities summary

| Topic | Key Points |
|---|---|
| Node hierarchy | Stage → Layer(s) → Shapes/Groups (nested) |
| Renderers per layer | Two: scene renderer (visible) and hit graph (hidden) |
| Prebuilt shapes | Rect, Circle, Ellipse, Line, Polygon, Spline, Blob, Image, Text, TextPath, Star, Label, SVG Path, RegularPolygon |
| Styling | Fill (solid/gradient/pattern), Stroke, Shadow, Opacity |
| Interactivity | Mouse/touch/pointer events, drag & drop, Transformer |
| Animation | Konva.Animation (frame updates), Konva.Tween (property transitions) |
| Performance tools | Caching (shape.cache), multi-layer rendering, draw minimization |

Konva’s heritage is relevant to the ecosystem: the project began as a GitHub fork of KineticJS, which influences certain design patterns and community practices.[^4]

## Installation and Setup

Konva supports two primary install modes: package manager installation for bundler-based projects and CDN-based script tags for direct browser usage.

- Package managers: `npm install konva`
- Script tag via CDN (full and minified builds)

Table 2. CDN resources and guidance

| Resource | Notes |
|---|---|
| Full build (konva.js) | Use for development and debugging[^5] |
| Minified build (konva.min.js) | Use for production[^6] |

In modern bundler setups, import Konva as an ES module. For CDN, include the script tag and access the global `Konva` object. Choose the approach that aligns with your project’s build system and deployment pipeline.[^1]

## Node Hierarchy and Rendering Model

Konva’s rendering model is intentionally layered. Each Layer corresponds to an HTML5 canvas for the scene renderer and a separate hit graph canvas for event detection. This separation allows Konva to redraw only the layers that change, minimizing expensive draw operations. Nested Groups enable logical composition and shared transformations (e.g., dragging a group moves all children together). Event detection leverages the hit graph to quickly identify the target node under the pointer, making interaction responsive even in complex scenes.[^2]

Two practical consequences flow from this model:

- Only redraw what changes. Splitting static backgrounds from frequently updated interactive layers can significantly reduce draw costs.
- Keep the number of layers manageable. Each layer adds overhead; judicious layering improves performance without excessive fragmentation.[^2][^35]

## Shapes: Usage and Patterns

Konva’s shape model covers essential primitives and specialized constructs. The documentation provides tutorials for each shape and explicitly points to the API Reference for complete property and method listings. The patterns below synthesize common setup and useful properties for representative shapes.

Table 3. Shape catalog overview (see dedicated API pages for full specs)

| Shape | Typical instantiation | Demonstrated properties (tutorials) | Reference |
|---|---|---|---|
| Rect | `new Konva.Rect(config)` | x, y, width, height, fill, stroke, strokeWidth, shadowBlur, cornerRadius (number or [tl, tr, br, bl]) | [^14] |
| Circle | `new Konva.Circle(config)` | x, y, radius, fill, stroke, strokeWidth | [^15] |
| Line | `new Konva.Line(config)` | points, stroke, strokeWidth, lineCap, lineJoin, dash, tension, closed, fill | [^16] |
| Image | `new Konva.Image(config)` or `Konva.Image.fromURL(url, cb)` | x, y, image (HTMLImageElement), width, height, scaleX, scaleY, cornerRadius | [^17] |
| Text | `new Konva.Text(config)` | x, y, text, fontSize, fontFamily, fill, width, padding, align, offsetX, width() | [^18] |

### Rect

Rectangles are created with `Konva.Rect` and accept both positioning and styling options. A distinctive feature is flexible corner rounding via `cornerRadius`, which accepts a single number for uniform rounding or an array of four numbers to specify each corner independently.

- Example properties: `x`, `y`, `width`, `height`, `fill`, `stroke`, `strokeWidth`, `shadowBlur`.
- `cornerRadius` variations: `10` (uniform) vs `[0, 10, 20, 30]` (topLeft, topRight, bottomRight, bottomLeft).

Refer to the Rect API for the full attribute list.[^14]

### Circle

Circles are created with `Konva.Circle` and require a center (`x`, `y`) and `radius`. Basic styling mirrors other shapes (`fill`, `stroke`, `strokeWidth`). See the Circle API for all properties.[^15]

### Line (Simple, Spline, Polygon, Blob)

Lines are defined by an array of points (`points: [x1, y1, x2, y2, ...]`). Stroke appearance is controlled by `stroke`, `strokeWidth`, `lineCap`, `lineJoin`, and optional `dash` for dashed lines. The `tension` property enables smooth curves (splines), while `closed: true` creates polygons and blobs.

- Simple line: `points` + stroke props.
- Spline: `tension` > 0 for curvature.
- Polygon: `closed: true` + fill.
- Blob: `closed: true` + `tension` for rounded closed shape.

See the Line API for detailed behavior.[^16]

### Image

Images can be instantiated directly by providing an `HTMLImageElement` or loaded via the static helper `Konva.Image.fromURL(url, callback)`. Typical properties include `x`, `y`, `width`, `height`, `scaleX`, `scaleY`, and optional corner radius. Use `setAttrs` for batch updates. See the Image API for the complete interface.[^17]

### Text

Text nodes support multiline content (`\n`), font styling (`fontSize`, `fontFamily`, `fill`), and layout properties (`width` for wrapping, `padding`, `align`). Centering can be achieved by setting `offsetX` based on measured `width()`. The Text API provides the full set of properties and methods.[^18]

## Styling

Konva styling revolves around fill, stroke, shadow, and opacity. The Fill tutorial is explicit about four fill types and their associated properties, including setters and batch updates via `setAttrs`. Event-driven dynamic styling (e.g., hover effects) is straightforward: update fill properties on `mouseover`/`mouseout` or touch events.

Table 4. Fill types and key properties (from Fill tutorial)

| Fill type | Key properties | Notes |
|---|---|---|
| Solid color | `fill(colorString)` | Simple color strings (name, hex, rgb, rgba). |
| Image pattern | `fillPatternImage(imageObject)`, `fillPatternOffset({x, y})` | Use an HTML image/canvas/video as pattern; offset controls positioning. |
| Linear gradient | `fillLinearGradientStartPoint({x, y})`, `fillLinearGradientEndPoint({x, y})`, `fillLinearGradientColorStops([offset, color, ...])` | Gradient endpoints define direction; color stops are arrays of offset-color pairs. |
| Radial gradient | `fillRadialGradientStartPoint({x, y})`, `fillRadialGradientStartRadius(radius)`, `fillRadialGradientEndPoint({x, y})`, `fillRadialGradientEndRadius(radius)`, `fillRadialGradientColorStops([offset, color, ...])` | Define start/end circles and radius; stops array controls color transitions. |

Fill properties can be updated dynamically using dedicated setters or `setAttrs` to batch-change attributes. Stroke and stroke width are used in combination with fills for crisp outlines; shadow properties belong to the broader styling system and are covered in dedicated pages.[^11]

## Events and Interactivity

Konva exposes a robust event system bound via `node.on(eventType, handler)`. The Stage provides `getPointerPosition()` to retrieve coordinates for mouse or touch interactions. Event categories span mouse, touch, pointer, drag, and transform. Framework bindings are idiomatic: React components accept camelCase event props (e.g., `onMouseMove`), and Vue templates use shorthand directives (e.g., `@mousemove`).[^12]

Table 5. Event types (as documented)

| Category | Event types |
|---|---|
| Mouse | `mouseover`, `mouseout`, `mouseenter`, `mouseleave`, `mousemove`, `mousedown`, `mouseup`, `wheel`, `click`, `dblclick` |
| Touch | `touchstart`, `touchmove`, `touchend`, `tap`, `dbltap` |
| Pointer | `pointerdown`, `pointermove`, `pointereup`, `pointercancel`, `pointerover`, `pointerenter`, `pointerout`, `pointerleave`, `pointerclick`, `pointerdblclick` |
| Drag | `dragstart`, `dragmove`, `dragend` |
| Transform | `transformstart`, `transform`, `transformend` |

Pointer retrieval is essential for many interactions:

Table 6. Pointer handling essentials

| Topic | Detail |
|---|---|
| Stage coordinate retrieval | `stage.getPointerPosition()` returns `{x, y}` relative to the stage. |
| Usage | Use in `mousemove` or touch handlers to implement pointer-based features (e.g., painting, dragging, hit testing). |

Event handling patterns vary by framework, but the underlying Konva semantics remain consistent. Advanced topics—such as event propagation cancellation, custom hit regions, delegation, and mobile-specific behavior—are documented across related pages.[^12]

## Drag and Drop

Drag-and-drop is enabled by setting `draggable: true` or calling the `draggable()` method. Konva emits drag events (`dragstart`, `dragmove`, `dragend`) that can be bound with `on()`. Cursor styling on `mouseover`/`mouseout` improves UX. For complex scenarios—bounds, multiple-node drags, drop zones—the documentation provides advanced topics and demos.[^13]

Table 7. Drag-and-drop events and usage

| Aspect | Details |
|---|---|
| Enabling | `draggable: true` or `node.draggable(true)` |
| Events | `dragstart`, `dragmove`, `dragend` |
| Binding | `node.on('dragstart', handler)`, etc. |
| UX | Cursor change on `mouseover`/`mouseout` |

Optimizing drag operations is discussed in Performance: move the dragged node to a dedicated drag layer on `dragstart` and return it on `dragend` to avoid redrawing the entire layer each move.[^35]

## Select and Transform (Transformer)

The Transformer (`Konva.Transformer`) provides selection, resize, and rotation interactions. Selection can be single (click shape) or multi (shift/ctrl/meta to add/remove), and area selection can be implemented with a selection rectangle. Resizing changes `scaleX` and `scaleY` rather than `width` and `height`. Constraints (e.g., minimum size via `boundBoxFunc`) and snapping behaviors are covered in the Transformer topics. For text nodes, specialized resizing behavior and events are documented.[^19]

Table 8. Transformer topics (overview)

| Topic | Purpose |
|---|---|
| Basic demo | Instantiate and attach Transformer to nodes. |
| Centered scaling, Keep ratio | Control scaling origin and aspect constraints. |
| Styling and complex styling | Appearance configuration for Transformer handles and anchors. |
| Transform events | `transformstart`, `transform`, `transformend` lifecycle. |
| Resize limits and snaps | BoundBoxFunc, snap-to-grid/radius behaviors. |
| Rotation snaps | Snap rotation to increments. |
| Force update | Programmatically refresh Transformer bounds. |
| Resize text | Text-specific resize behavior. |
| Ignore stroke on transform | Exclude stroke width from transform bounds. |

## Clipping

Clipping restricts rendering to an arbitrary region defined via `clipFunc` on a Group or Layer. The function receives the 2D rendering context (`ctx`), enabling standard Canvas 2D commands (e.g., `beginPath`, `arc`, `rect`, `closePath`) to describe the clip region. Children of the clipped node are rendered only within the clipping path.[^20]

Table 9. Clipping essentials

| Topic | Details |
|---|---|
| Applies to | `Konva.Group` and `Konva.Layer` |
| Signature | `clipFunc(ctx)` |
| Context usage | Standard Canvas 2D path methods define the clip region |

This approach enables complex shapes (e.g., overlapping circles) and flexible layouts without manual masking strategies.[^20]

## Groups and Layers

Groups are used to organize shapes and apply combined transformations; Layers are render surfaces that determine draw and event boundaries. The `moveTo(targetContainer)` method relocates a node between containers (Stage, Layer, Group), detaching from the current parent and attaching to the new target. This is useful for optimizing drag operations, reparenting nodes, and managing z-order across layers.[^21]

Table 10. Container types and typical usage

| Container | Purpose |
|---|---|
| Stage | Root container; owns dimensions and DOM integration. |
| Layer | Rendering and event boundaries; split static vs dynamic content. |
| Group | Logical grouping; shared transforms and event handling. |

## Filters

Filters operate on cached image nodes. The application sequence is: `cache()` the node, assign filters via `filters([Konva.Filters.Blur])`, and set filter-specific properties (e.g., `blurRadius`). The Filters documentation lists available filter types.[^22][^3]

Table 10A. Filters catalog (from documentation indices)

| Filter | Notes |
|---|---|
| Blur | Requires caching; set `blurRadius` for intensity. |
| Brighten | Marked deprecated in some materials. |
| Brightness | Adjusts luminance. |
| Contrast | Adjusts contrast. |
| Custom Filter | User-defined filter logic. |
| Emboss | Emboss effect. |
| Enhance | Automatic enhancement. |
| Grayscale | Convert to grayscale. |
| HSL | Adjust hue/saturation/lightness. |
| HSV | Adjust hue/saturation/value. |
| Invert | Invert colors. |
| Kaleidoscope | Kaleidoscopic effect. |
| Mask | Masking via filter. |
| Multiple Filters | Combine filters. |
| Noise | Add noise. |
| Pixelate | Pixelation effect. |
| RGB | Adjust channels. |
| Sepia | Sepia tone. |
| Solarize | Solarize effect. |
| Threshold | Binary-like thresholding. |

Filter behavior and property details are provided in the Filters API.[^3]

## Tweens

Tweens animate property transitions on a node. The constructor takes the target node, duration (seconds), target properties (e.g., `x`, `rotation`, `opacity`), and an easing function. Konva provides tween control methods—`play`, `pause`, `reverse`, `reset`, `finish`, `seek(position)`—and convenience shorthand (e.g., `node.to({ ... })`). Easing functions have dedicated pages.[^24]

Table 11. Tween control methods

| Method | Purpose |
|---|---|
| `play()` | Start or resume. |
| `pause()` | Pause playback. |
| `reverse()` | Reverse direction. |
| `reset()` | Return to initial state. |
| `finish()` | Jump to final state. |
| `seek(position)` | Jump to time position (typically 0–1). |

Table 12. Easing references

| Topic | Notes |
|---|---|
| All easings | Comprehensive list (see linked page). |
| Common easings | Frequent presets (ease-in, ease-out, etc.). |
| Linear easing | Uniform rate of change. |

## Animations

Konva.Animation creates frame-by-frame updates with an update function and optional layer(s). The animation engine passes a `frame` object with `time` (ms), `timeDiff` (ms since last frame), and `frameRate` (fps). The update function should only modify node properties; Konva handles redraw. Animations are started with `start()` and stopped with `stop()`; specialized tutorials cover moving, rotation, scaling, stopping, and text animations.[^23]

Table 13. Animation constructor and frame object

| Aspect | Detail |
|---|---|
| Constructor | `new Konva.Animation(updateFunction, layerOrLayers?)` |
| Update function | Receives `frame`; update node properties only. |
| Frame properties | `time` (ms), `timeDiff` (ms), `frameRate` (fps) |
| Lifecycle | `start()`, `stop()` |

## Demos: Use Cases and Patterns

The demos catalog spans CAD-style editors, games, common canvas use cases (text editing, rich text, scrolling, GIF/video display, SVG on canvas, background/foreground techniques), and performance stress tests (drag, animation, thousands of nodes). These examples demonstrate practical patterns that complement tutorials.[^31]

Table 14. Demos category overview (representative examples)

| Category | Examples (non-exhaustive) |
|---|---|
| CAD Systems | Canvas Editor; Window Frame Designer; Seats Reservation; Image Labeling; Interactive Building Map |
| Games and Apps | Wheel of Fortune; Free Drawing; Animals on the Beach Game; Planets Image Map; Physics Simulator |
| Common use cases | Editable Text; Rich Text; Canvas Scrolling; Scroll by Edge Drag; GIF on Canvas; Video on Canvas; SVG on Canvas; Canvas Background; Transparent Group; Mirror/Flip Shape; Canvas to PDF; Custom Font; Relative Pointer Position; Drop DOM Element; Objects Snapping; Zooming Relative To Pointer; Context Menu; Image Scale To Fit; Limited Drag And Resize |
| Performance tests | Drag and Drop Stress Test; Animation Stress Test; Bunnies Stress Test; 10000 Shapes with Tooltip; 20000 Nodes; Resizing Stress Test; Quantum Squiggle |
| Other random demos | Web Worker; Star Spinner; Connected Objects; Manual Image Resize; Stage Preview; Modify Curves with Anchor Points; Image Border; Collision Detection; Elastic Stars; Shape Tango; Image Border Highlighting; Zoom Layer On Hover; Responsive Canvas; Touch Gestures; Multi-touch Scale Shape/Stage; Modify Shape Color on Click; Expand Images on Hover; Shape Tooltips; Drag and Drop Multiple Shapes |

These demos illustrate integration of core features (events, drag, clipping, filters, animations) in realistic scenarios.[^31]

## Selectors and Node Traversal

Konva provides traversal and selection via `find()` (returns a collection) and `findOne()` (returns the first match). Selectors support type, ID (`#id`), and name (`.name`) patterns. “Select by Name” demonstrates using name selectors to retrieve and animate matched nodes.[^25]

Table 15. Selector patterns

| Pattern | Example | Result |
|---|---|---|
| Type | `stage.find('Circle')` | Collection of all Circle nodes. |
| ID | `stage.find('#nodeId')` | Node with `id('nodeId')`. |
| Name | `layer.find('.myCircle')` | Nodes with `name('myCircle')`. |

## Data and Serialization Best Practices

For small apps, built-in `toJSON()` and `Konva.Node.create(json)` are convenient. However, in larger applications, serializing the entire visual tree is problematic: event listeners, images, and filters are not readily serializable, and much visual state can be derived from simpler domain state. The recommended approach is to serialize essential application state (e.g., object counts, coordinates) and implement `create(state)` and `update(state)` functions that rebuild or patch the Konva scene accordingly. For undo/redo, maintain a history stack of serialized state snapshots and reapply as needed.[^26]

Table 16. Serialization approaches

| Approach | Pros | Cons | Recommended use |
|---|---|---|---|
| `toJSON()` + `Node.create(json)` | Simple for small scenes | Not suitable for complex trees; non-serializable data (images, listeners, filters) | Small apps or prototypes |
| Application state + `create/update` | Flexible, performant; clear separation of state and view | Requires disciplined state modeling | Medium/large apps; undo/redo systems |

## Performance Optimization

Konva performance centers on two imperatives: compute as little as possible and draw as little as possible. The official tips translate these imperatives into concrete tactics across stage, layers, shapes, animations, and memory management.[^35]

Table 17. Performance tactics (selected highlights)

| Area | Tactic | Details |
|---|---|---|
| Stage | Avoid oversized stages | Large stages amplify memory-to-screen costs; prefer viewport strategies. |
| Stage | Set viewport on mobile | `viewport: <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">` avoids scaling overhead. |
| Stage | Consider `Konva.pixelRatio = 1` on retina | Override device pixel ratio when performance trumps crispness; test quality impact. |
| Layers | Keep layers to minimum | Each layer is a separate canvas; overhead increases with layer count. |
| Layers | Use `listening: false` | Disable event listeners where unnecessary to reduce check overhead. |
| Drag | Optimize dragging via drag layer | Move node to a dedicated drag layer on `dragstart`; return on `dragend`. |
| Shapes | Cache complex shapes/groups | `shape.cache()` draws from a buffer canvas; avoids recomposition cost. |
| Shapes | Hide or remove invisible objects | Reduce event checks and draw calls. |
| Shapes | Disable perfect drawing when safe | `perfectDrawEnabled(false)` can avoid extra draw passes for certain fills/strokes. |
| Shapes | Optimize stroke drawing | Shadow + stroke can trigger extra internal draw; align styling choices to minimize cost. |
| Animations | Reduce unnecessary redraws | Ensure animation steps produce visible changes; avoid wasteful updates. |
| Memory | Avoid leaks; manage lifecycle | Proactively destroy shapes/tweens that are no longer needed. |

Many tips reference demos and subpages for demonstration and deeper configuration detail.[^35]

## React Integration (react-konva)

react-konva provides declarative bindings for Konva in React. All Konva nodes and shapes are exposed as components, and all events are supported as props. Installation is straightforward (`npm install react-konva konva --save`), and a simple example illustrates `Stage`, `Layer`, `Rect`, `Circle`, and `Text`. The documentation lists a wide range of topics—accessing nodes, canvas export, portals, animations, filters, transformer, undo/redo, and z-index—signaling deep ecosystem support. Note that react-konva is not supported in React Native.[^27][^28]

Table 18. react-konva topics (index)

| Topic | Purpose |
|---|---|
| Access Konva Nodes | Reference node instances imperatively. |
| Canvas Export | Export stage to data URL. |
| Canvas/DOM Portal | Render DOM content over/under canvas. |
| Complex/Simple Animations | Integration patterns for Konva.Animation and Tween. |
| Custom Shape | Define application-specific shapes. |
| Drag and Drop | Declarative drag interactions. |
| Drop Image | Image drag/drop workflows. |
| Events | Event binding patterns in React. |
| Filters | Declarative filter application. |
| Free Drawing | Drawing tools integration. |
| Images | Image node patterns. |
| Shapes | Shape usage patterns. |
| Transformer | Selection/resize/rotate. |
| Undo/Redo | State history integration. |
| zIndex | Layering control. |

## Vue Integration (Vue Konva)

Vue Konva integrates Konva with Vue 3, using component names prefixed with `v-` (e.g., `v-rect`, `v-circle`). Setup involves installing packages (`npm install vue-konva konva --save`), importing `VueKonva`, and calling `app.use(VueKonva)` before mounting. Props are passed via a `config` object, and reactivity is handled through Vue’s `ref` and lifecycle hooks. Event handling follows Vue’s directive shorthand (e.g., `@dragstart`).[^29]

Table 19. vue-konva components and props overview

| Component | Purpose | Props |
|---|---|---|
| `v-stage` | Stage container | `config` (stage config) |
| `v-layer` | Layer container | `config` (layer config) |
| `v-rect`, `v-circle`, `v-ellipse`, `v-line`, `v-image`, `v-text`, `v-text-path`, `v-star`, `v-label`, `v-path`, `v-regular-polygon` | Shapes | `config` (shape properties) |

The library’s demos and topics cover cache, custom shapes, drag and drop, events, filters, images, save/load, shapes, animations, transformer, undo/redo, and z-index.[^29]

## Angular Integration (ng2-konva)

ng2-konva targets Angular 20+ and provides declarative markup for Konva. Components follow a `ko-` prefix mapping (e.g., `ko-rect` for `Konva.Rect`). All Konva parameters are passed via property binding through a `config` input. Event handling yields `NgKonvaEventObject`, exposing the underlying Konva shape via `event.target`. Custom shapes are supported, and core components include a broad set of shape elements.[^30]

Table 20. ng2-konva components (selected list)

| Component | Konva counterpart |
|---|---|
| `ko-rect` | `Konva.Rect` |
| `ko-circle` | `Konva.Circle` |
| `ko-ellipse` | `Konva.Ellipse` |
| `ko-line` | `Konva.Line` |
| `ko-image` | `Konva.Image` |
| `ko-text` | `Konva.Text` |
| `ko-text-path` | `Konva.TextPath` |
| `ko-star` | `Konva.Star` |
| `ko-label` | `Konva.Label` |
| `ko-path` | `Konva.Path` |
| `ko-regular-polygon` | `Konva.RegularPolygon` |

See the ng2-konva repository for examples and updates.[^30]

## Svelte Integration (svelte-konva)

svelte-konva provides declarative bindings for Svelte. Components mirror Konva names, and properties map directly as props. The documentation lists integration topics such as bindings, cache, custom shapes, drag and drop, events, filters, images, labels, save/load, shapes, simple animations, transformer, SvelteKit integration, and z-index management. Detailed examples are available on the linked documentation pages and repository.[^34]

Table 21. svelte-konva integration topics (overview)

| Topic | Notes |
|---|---|
| Bindings, Cache | State and performance patterns. |
| Custom Shape | Application-specific rendering. |
| Drag and Drop, Events | Interaction handling. |
| Filters, Images, Labels | Visual effects and media. |
| Save and Load, zIndex | Persistence and layering. |
| Simple Animations, Transformer | Animation and selection/resize. |
| SvelteKit Integration | Framework-specific setup. |

## Node.js Usage and Server-Side Rendering

Konva supports Node.js for server-side rendering (SSR) and image generation. Starting with v10, Konva requires explicitly importing a backend: the Canvas backend (`konva/canvas-backend`) or the Skia backend (`konva/skia-backend`) for better performance. Legacy setups (≤ v9) are simpler but deprecated. In Node.js, the `container` option is ignored; `stage.toDataURL()` is used to export the canvas as an image. Typical use cases include dynamic image generation (emails, reports), charts, document processing, and batch operations.[^32]

Table 22. Node.js backends (v10+)

| Backend | Install | Import | Notes |
|---|---|---|---|
| Canvas | `npm install konva canvas` | `import 'konva/canvas-backend'` | Default backend. |
| Skia | `npm install konva skia-canvas` | `import 'konva/skia-backend'` | Better performance for SSR. |

SSR considerations:

- No DOM required; Konva runs headless for rendering.
- Use `stage.toDataURL()` for image export.
- Manage memory for batch operations.
- Evaluate client-side rendering for frameworks like Next.js where canvas interactivity matters.[^32]

## Support, Community, and Contributing

The project offers multiple support channels: searching online, asking questions on Stack Overflow (with the `konva` tag), reporting issues on GitHub, participating in Discord, and sharing content on Twitter with the #konvajs hashtag. A changelog is available for version history, and consulting services are listed for organizations needing structured support.[^7][^8][^9][^10][^36][^38]

Table 23. Support channels and guidance

| Channel | Usage guidance |
|---|---|
| Search (Google/site search) | First step for known issues and patterns. |
| Stack Overflow | Ask high-quality questions with demos, code samples, and correct tags (`konva`). |
| GitHub Issues | Report bugs or request features; include minimal repro steps. |
| Discord | Community discussion and quick help. |
| Twitter (#konvajs) | Share examples and discoveries. |
| Changelog | Track changes, deprecations, and new features. |
| Consulting | Professional support for strategy and implementation. |

## Donations and Sponsorship

The maintainer dedicates significant time to supporting users, fixing bugs, and developing new features across Konva and ecosystem tools (e.g., react-konva, vue-konva). Donations via Patreon, Open Collective, and GitHub Sponsors help ensure continued maintenance and quality, especially for companies that benefit from the project’s stability and ongoing development.[^37][^38][^39]

## API Reference Overview

The API reference organizes classes, namespaces, and global configuration. The global `Konva` object exposes static properties and methods to tune runtime behavior.[^3]

Table 24. API classes overview (selected)

| Class | Purpose |
|---|---|
| Transform, Context, Canvas | Low-level utilities and rendering primitives. |
| Node, Container, Stage | Node hierarchy, containers, and stage. |
| Shape, Layer, FastLayer, Group | Shape base, rendering layers, fast layer, grouping. |
| Animation, Tween | Animation systems. |
| Arc, Line, Path, Arrow | Vector and line-based shapes. |
| Circle, Ellipse, Image | Basic shapes and image node. |
| Label, Tag | Label container and tag shape. |
| Rect, RegularPolygon, Ring | Rectangular and polygonal shapes. |
| Sprite, Star, Text, TextPath | Specialized nodes for sprites, stars, text along paths. |
| Transformer | Selection/resize/rotate tool. |
| Wedge | Pie-slice shape. |

Table 25. Namespaces and utilities

| Namespace | Purpose |
|---|---|
| Util | Helper functions. |
| Easings | Easing presets for tweens. |
| Filters | Filter implementations. |

Table 26. Global Konva properties (selected)

| Property | Default | Purpose |
|---|---|---|
| `autoDrawEnabled` | `true` | Toggle automatic canvas redraws. |
| `hitOnDragEnabled` | `false` | Enable hit detection while dragging (off by default for performance). |
| `capturePointerEventsEnabled` | `false` | Capture pointer events like DOM (default off; Konva triggers on current target). |
| `legacyTextRendering` | `false` | Use legacy text baseline behavior. |
| `pixelRatio` | device-dependent | Override device pixel ratio (set before initialization). |
| `dragDistance` | `3px` (effective default) | Minimum distance before drag starts. |
| `angleDeg` | `true` | Use degrees for angle properties (set to `false` for radians). |
| `showWarnings` | `true` | Show warnings for API misuse. |
| `dragButtons` | `[0]` (left button) | Configure mouse buttons allowed for drag. |
| `releaseCanvasOnDestroy` | `true` | Release canvas elements on destroy to avoid memory leaks (Safari). |

Global methods include `isDragging()` and `isDraggingReady()` to query drag state.[^3]

## Appendix: External Resources and Tools

External resources complement the documentation with community support and commercial tooling.

Table 27. External resources

| Resource | Purpose |
|---|---|
| Stack Overflow (`konva` tag) | Q&A forum for technical questions. |
| Discord | Real-time community support. |
| Twitter (`@lavrton`) | Updates, tips, and announcements. |
| Polotno SDK | Commercial design editor SDK powered by Konva. |

These resources provide additional examples, support channels, and tooling that may accelerate development and adoption.[^7][^8][^9][^41]

## How to Use This Blueprint

This document provides a narrative pathway through Konva’s official documentation. For implementation:

1. Start with Overview to understand the node hierarchy and dual-renderer model.
2. Follow Installation for setup, then Shapes and Styling to build basic scenes.
3. Layer in Events and Drag & Drop for interactivity; add Transformer for selection and resize.
4. Apply Clipping, Groups/Layers, and Filters to structure and enhance visuals.
5. Use Tweens and Animations for motion, consulting demos for patterns.
6. Adopt Selectors for node traversal; adopt serialization best practices for persistence and undo/redo.
7. Apply Performance tips to scale scenes; integrate with React/Vue/Angular/Svelte via documented patterns.
8. For SSR and image export, use Node.js backends and `stage.toDataURL()`.
9. Reference the API overview for global configuration and class details; use external resources for community support.

Where deeper detail is needed, defer to the official API Reference and specific tutorials.

## Acknowledged Information Gaps

- Not all individual shape pages are extracted here; this blueprint highlights representative shapes and refers to API pages for exhaustive properties/methods.[^14][^15][^16][^17][^18]
- Advanced Transformer subpages (e.g., complex styling, rotation snaps) are referenced but not fully reproduced; consult the Transformer documentation.[^19]
- Full lists of all demos and filter subpages are aggregated from indices; some per-demo implementations are not included.[^31][^3]
- Vue and Svelte integration pages include partial examples and topic lists; deeper examples reside on linked subpages.[^29][^34]
- Node.js server-side image generation code examples beyond `toDataURL()` are summarized; additional patterns may be needed for production SSR workflows.[^32]
- Not all event topics are covered in depth; the document consolidates categories and pointer handling essentials.[^12]
- Posts and tools pages appear as indices; detailed articles are not included beyond references to a sample post.[^33]

---

## References

[^1]: Konva Tutorials (Home). https://konvajs.org/docs/index.html  
[^2]: Konva Overview. https://konvajs.org/docs/overview.html  
[^3]: Konva API Reference. https://konvajs.org/api/Konva.html  
[^4]: KineticJS (GitHub). https://github.com/ericdrowell/KineticJS  
[^5]: Konva v10 Full Build (CDN). https://unpkg.com/konva@10/konva.js  
[^6]: Konva v10 Minified Build (CDN). https://unpkg.com/konva@10/konva.min.js  
[^7]: Stack Overflow: Konva Tag. https://stackoverflow.com/questions/tagged/konva  
[^8]: Konva Discord. https://discord.gg/8FqZwVT  
[^9]: Anton Lavrov Twitter. https://twitter.com/lavrton  
[^10]: Konva GitHub Issues. https://github.com/konvajs/konva/issues  
[^11]: Styling: Fill. https://konvajs.org/docs/styling/Fill.html  
[^12]: Events: Binding Events. https://konvajs.org/docs/events/Binding_Events.html  
[^13]: Drag and Drop. https://konvajs.org/docs/drag_and_drop/Drag_and_Drop.html  
[^14]: Shapes: Rect. https://konvajs.org/docs/shapes/Rect.html  
[^15]: Shapes: Circle. https://konvajs.org/docs/shapes/Circle.html  
[^16]: Shapes: Line. https://konvajs.org/docs/shapes/Line.html  
[^17]: Shapes: Image. https://konvajs.org/docs/shapes/Image.html  
[^18]: Shapes: Text. https://konvajs.org/docs/shapes/Text.html  
[^19]: Select and Transform: Basic Demo. https://konvajs.org/docs/select_and_transform/Basic_demo.html  
[^20]: Clipping: Clipping Function. https://konvajs.org/docs/clipping/Clipping_Function.html  
[^21]: Groups and Layers: Change Containers (moveTo). https://konvajs.org/docs/groups_and_layers/Change_Containers.html  
[^22]: Filters: Blur. https://konvajs.org/docs/filters/Blur.html  
[^23]: Animations: Create an Animation. https://konvajs.org/docs/animations/Create_an_Animation.html  
[^24]: Tweens: All Controls. https://konvajs.org/docs/tweens/All_Controls.html  
[^25]: Selectors: Select by Name. https://konvajs.org/docs/selectors/Select_by_Name.html  
[^26]: Data and Serialization: Best Practices. https://konvajs.org/docs/data_and_serialization/Best_Practices.html  
[^27]: React Integration (react-konva). https://konvajs.org/docs/react/index.html  
[^28]: react-konva (GitHub). https://github.com/lavrton/react-konva  
[^29]: Vue Integration (Vue Konva). https://konvajs.org/docs/vue/index.html  
[^30]: Angular Integration (ng2-konva). https://konvajs.org/docs/angular/index.html  
[^31]: Demos (Sandbox). https://konvajs.org/docs/sandbox.html  
[^32]: Node.js Setup. https://konvajs.org/docs/nodejs/nodejs-setup  
[^33]: Posts: Position vs Offset. https://konvajs.org/docs/posts/Position_vs_Offset.html  
[^34]: Svelte Integration (svelte-konva). https://konvajs.org/docs/svelte/index.html  
[^35]: Performance: All Tips. https://konvajs.org/docs/performance/All_Performance_Tips.html  
[^36]: Konva Changelog (GitHub). https://github.com/konvajs/konva/blob/master/CHANGELOG.md  
[^37]: Donate: Support Konva. https://konvajs.org/docs/donate.html  
[^38]: Patreon: lavrton. https://www.patreon.com/lavrton  
[^39]: GitHub Sponsors: lavrton. https://github.com/sponsors/lavrton  
[^40]: Konva (Home). https://konvajs.org/  
[^41]: Polotno SDK. https://polotno.com# Konva.js API Reference: Foundations, Classes, Patterns, and Implementation Blueprint

## Executive Overview and Scope

This report distills and operationalizes the official Konva.js API documentation into a single, end‑to‑end reference for frontend engineers, technical writers, and documentation leads building on the HTML5 Canvas with Konva. It aims to do three things unusually well: first, provide a clear conceptual model of Konva’s architecture and class relationships; second, document the core APIs with precision—constructors, methods, properties, and inheritance; and third, translate those into implementation patterns and practical recipes that scale to real‑world interfaces.

Scope and fidelity. The analysis is based on the official Konva API site and the Transformer page hosted in the Konva site repository, as listed in the References. All facts, signatures, and behaviors are taken from those sources. Where the official pages are silent or only partially captured, the gaps are explicitly acknowledged.

Deliverables. The report provides:
- A hierarchical taxonomy of Konva classes, clarifying how Node, Container, Shape, Layer, Group, Stage, and specific shapes relate and differ.
- A canonical inventory of modules and utilities (Canvas, Context, Easings, Filters, Util, Transform, Tween, Animation), with their roles and key methods.
- A class‑by‑class API catalog detailing constructors, configuration properties, own and inherited methods, events, and usage notes.
- A pattern catalog with code examples for high‑value tasks—hit testing, efficient redraws, text layout and ellipsis, animation and easing, image and sprite rendering, and transformer‑based manipulation.

Non‑goals. This report does not propose unlisted features, benchmark quantitative performance, or prescribe a framework‑specific integration layer. It focuses on canonical Konva usage and the content available in the official pages listed in References.

How to use this document. Read it linearly the first time to build a mental model; thereafter, treat it as a navigable reference. Each section is designed to stand on its own, while cross‑references tie related concepts together (for example, linking hit testing and animation to Stage and Layer lifecycles).

To orient the reader before diving into details, Table 1 lists the high‑level module inventory and where each is elaborated in the report.

To illustrate the functional coverage, Table 1 summarizes the principal modules, their roles, and where they are treated in depth.

Table 1. High‑level module inventory and roles

| Module         | Role in Konva ecosystem                                                                 | Where to find details |
|----------------|-----------------------------------------------------------------------------------------|-----------------------|
| Node           | Base class for position, transform, events, caching                                     | Node class            |
| Container      | Base class that holds children; provides traversal and clipping                         | Container class       |
| Shape          | Base for drawable nodes; styles, scene/hit funcs, hit graph                             | Shape class           |
| Stage          | Root container bound to a DOM element; input, layers, and draw orchestration            | Stage class           |
| Layer          | Render surface within a Stage; offers batchDraw and hit testing                         | Layer class           |
| Group          | Logical container for nodes; transforms children collectively                           | Group (Container)     |
| Text           | Rich text rendering; typography, wrapping, ellipsis, per‑character hooks                | Text class            |
| TextPath       | Text rendered along an SVG path                                                         | TextPath class        |
| Label + Tag    | Label as Group of Text and Tag; Tag draws a pointer‑shaped rect                         | Label & Tag           |
| Image          | Canvas/HTMLImageElement rendering; utilities for loading and cropping                   | Image class           |
| Sprite         | Animated bitmap via named animations and frame index                                    | Sprite class          |
| Path           | Shape that renders an SVG path string                                                   | Path class            |
| Line           | Open/closed polylines; tension and bezier options                                       | Line class            |
| Arc, Ring      | Segments and annuli (donuts)                                                            | Arc & Ring            |
| Wedge          | Circular sector (angle in degrees, clockwise)                                           | Wedge class           |
| Circle         | Circle geometry                                                                         | Circle class          |
| Ellipse        | Elliptical geometry                                                                     | Ellipse class         |
| Rect, RegularPolygon, Star | Common 2D shapes with corner radius and multi‑point variants                 | Rect; RegularPolygon; Star |
| Arrow          | Line with configurable pointers                                                         | Arrow class           |
| Transformer    | Interactive transform handles and events                                                | Transformer class     |
| Canvas         | Canvas abstraction for size, pixel ratio, and data URLs                                 | Utilities             |
| Context        | Wrapper with shape composition helpers                                                  | Utilities             |
| Animation      | Frame function runner tied to layers                                                    | Utilities             |
| Easings        | Time functions for animation                                                            | Utilities             |
| Filters        | Pixel‑based image effects                                                               | Utilities             |
| Util           | Random color, RGB parsing, rectangle intersection                                       | Utilities             |
| Transform      | 2D matrix operations for custom math                                                   | Utilities             |
| Tween          | Value animation of Node properties                                                      | Utilities             |

Interpretation. Konva’s model is intentionally layered: Stage manages layers and input; Layers render shapes; Containers group nodes; Shapes draw and interact; Nodes provide the transform, event, and caching substrate; utilities supply math and effects. This separation keeps scene composition, rendering, and interaction modular and testable.

Information gaps. The official sources do not provide a version matrix or changelog, formal type signatures for Tween config, complete TextPath method signatures (kerningFunc setter/getter), a full enumeration of Stage events, exhaustive argument defaults for some classes, formal type definitions for Filter arguments, detailed Transformer event payloads, nor comprehensive examples for Arc/Ring constructors. These omissions are flagged where relevant.

References. The analysis draws on the official API pages and the Transformer page source, listed at the end of the report.[^1][^41]



## Conceptual Architecture and Class Taxonomy

Konva’s architecture is object‑oriented and layered. Conceptually, every visible element is a Node. Nodes that can contain other nodes are Containers. Nodes that can draw themselves are Shapes. Stages are special containers attached to a DOM element; Layers belong to a Stage and perform actual rendering. Groups are Containers used to transform related nodes as a unit. Specific shapes—Text, Image, Line, Rect, Circle, Arrow, and so on—extend Shape.

This hierarchy drives how coordinate transforms, event dispatch, and rendering occur. Node provides position, scale, rotation, opacity, visibility, caching, and event APIs. Container adds child management and traversal. Shape adds drawing mechanics, including fill/stroke styling and hooks for custom rendering. Layer orchestrates draw cycles and hit testing, while Stage coordinates input and orchestrates Layers.

Table 2 maps core classes to their inheritance and purpose.

Table 2. Core class hierarchy map

| Class               | Inherits (direct → chain)             | Purpose                                                                 |
|---------------------|----------------------------------------|-------------------------------------------------------------------------|
| Node                | —                                      | Base for transforms, events, caching, attributes                        |
| Container           | Node                                   | Adds children and traversal/clipping                                    |
| Shape               | Node                                   | Adds styling and drawing hooks (sceneFunc, hitFunc, hasFill/Stroke, etc.) |
| Stage               | Container                              | Attaches to a DOM element, holds Layers, dispatches input               |
| Layer               | Container                              | Renders a set of shapes; batchDraw, hit testing                         |
| Group               | Container                              | Logical grouping and collective transforms                              |
| Text                | Shape                                  | Text rendering with typography, wrapping, ellipsis                      |
| TextPath            | Shape                                  | Text rendered along an SVG path                                         |
| Label               | Group                                  | Container for Text + Tag; Tag draws a pointer‑shaped label              |
| Tag                 | Shape                                  | Rounded rectangle with optional pointer                                 |
| Image               | Shape                                  | Renders an HTMLImageElement or Canvas source                            |
| Sprite              | Shape                                  | Animated bitmap via frame index                                         |
| Path                | Shape                                  | Renders an SVG path string                                              |
| Line                | Shape                                  | Polyline and curves (open/closed, tension/bezier)                       |
| Arc                 | Shape                                  | Circular segment                                                        |
| Ring                | Shape                                  | Annulus (donut)                                                         |
| Wedge               | Shape                                  | Circular sector (angle degrees, clockwise flag)                         |
| Circle              | Shape                                  | Circle geometry                                                         |
| Ellipse             | Shape                                  | Ellipse geometry                                                        |
| Rect                | Shape                                  | Rectangle with optional corner radius                                   |
| RegularPolygon      | Shape                                  | Regular polygon (sides, radius)                                         |
| Star                | Shape                                  | Star shape (numPoints, inner/outer radii)                               |
| Arrow               | Shape (extends Line)                   | Line with arrowheads at ends                                            |
| Transformer         | Special Group                          | Interactive transform UI for nodes                                      |

Table 3 clarifies the inheritance paths for the most commonly used classes to make method lookups predictable.

Table 3. Inheritance paths for commonly used classes

| Class            | Direct inheritance    | Full chain                                  |
|------------------|-----------------------|---------------------------------------------|
| Stage            | Container             | Stage → Container → Node                    |
| Layer            | Container             | Layer → Container → Node                    |
| Group            | Container             | Group → Container → Node                    |
| Shape            | Node                  | Shape → Node                                |
| Text             | Shape                 | Text → Shape → Node                         |
| TextPath         | Shape                 | TextPath → Shape → Node                     |
| Label            | Group                 | Label → Group → Container → Node            |
| Tag              | Shape                 | Tag → Shape → Node                          |
| Image            | Shape                 | Image → Shape → Node                        |
| Sprite           | Shape                 | Sprite → Shape → Node                       |
| Path             | Shape                 | Path → Shape → Node                         |
| Line             | Shape                 | Line → Shape → Node                         |
| Arc              | Shape                 | Arc → Shape → Node                          |
| Ring             | Shape                 | Ring → Shape → Node                         |
| Wedge            | Shape                 | Wedge → Shape → Node                        |
| Circle           | Shape                 | Circle → Shape → Node                       |
| Ellipse          | Shape                 | Ellipse → Shape → Node                      |
| Rect             | Shape                 | Rect → Shape → Node                         |
| RegularPolygon   | Shape                 | RegularPolygon → Shape → Node               |
| Star             | Shape                 | Star → Shape → Node                         |
| Arrow            | Line (extends Shape)  | Arrow → Line → Shape → Node                 |
| Transformer      | Special Group         | Transformer → Group → Container → Node     |

Interpretation. These inheritance chains explain why Node methods (for example, cache, on/off, getAttr/setAttrs, fire) appear on all shapes, and why Shape methods (for example, stroke, strokeWidth, shadowBlur) appear on Text and images alike. It also means that property names are consistent across shapes where applicable (for example, x, y, rotation, scaleX, scaleY, offsetX, offsetY).



## Global Configuration and Utilities

Konva exposes a handful of global toggles and utilities that influence rendering, input handling, animation timing, and simple geometry.

Global settings. The autoDrawEnabled flag, when enabled, allows Konva to automatically redraw Stages. When building precise, event‑driven UIs, you may prefer manual control via Layer.batchDraw. Konva also exposes pixelRatio for scaling the drawing buffer; dragDistance to tune drag sensitivity; and helper predicates isDragging and isDragReady for input gating.

Canvas and Context. Canvas wraps the HTML5 canvas with pixel ratio and toDataURL. Context provides helpers used by shapes during drawing: fillShape, strokeShape, and fillStrokeShape, along with reset and clear.

Animation and Easings. Animation runs a callback per frame, bound to one or more layers. It offers isRunning, start, and stop, and can be re‑targeted via setLayers, getLayers, and addLayer. Easings such as Linear, Back, Elastic, and Bounce are used with Tween and Animation to shape time.

Filters. Filters offer pixel‑level image effects. Typical operations include Blur, Brighten, Contrast, Emboss, Grayscale, HSL, HSV, Invert, Noise, Pixelate, RGB, Sepia, and Threshold. Applying filters can be expensive; test on target devices.

Util. Utility functions include getRandomColor (hex), getRGB (parse color to {r,g,b}), and haveIntersection (bounding‑box intersection check).

Transform. Transform encapsulates 2D matrix operations including translation, scale, rotation, skew, multiply, invert, and decompose, with getMatrix returning the six‑element matrix. This is sufficient to implement custom geometry or hit logic if needed.

Table 4 lists the most commonly used global toggles and utilities.

Table 4. Global toggles and utility methods

| Name                     | Category            | Purpose                                           |
|--------------------------|---------------------|---------------------------------------------------|
| autoDrawEnabled          | Global              | Auto‑redraw toggle                                |
| pixelRatio               | Global              | Device pixel ratio for canvas scaling             |
| dragDistance             | Global              | Drag sensitivity threshold                        |
| isDragging()             | Global              | True if any node is dragging                      |
| isDragReady()            | Global              | True if a drag is ready                           |
| Canvas.getContext()      | Canvas              | 2D drawing context                                |
| Canvas.getPixelRatio()   | Canvas              | Current pixel ratio                               |
| Canvas.setPixelRatio()   | Canvas              | Set pixel ratio                                   |
| Canvas.toDataURL()       | Canvas              | Export rasterized image                           |
| Context.fillShape()      | Context             | Fill a shape from its config                      |
| Context.strokeShape()    | Context             | Stroke a shape from its config                    |
| Context.fillStrokeShape()| Context             | Fill then stroke a shape                          |
| Context.reset()          | Context             | Reset context state                               |
| Context.clear()          | Context             | Clear context                                     |
| Animation.setLayers()    | Animation           | Set target layers                                 |
| Animation.getLayers()    | Animation           | Get target layers                                 |
| Animation.addLayer()     | Animation           | Add a layer                                       |
| Animation.isRunning()    | Animation           | Is animation running                              |
| Animation.start()        | Animation           | Start animation                                   |
| Animation.stop()         | Animation           | Stop animation                                    |
| Easings.*                | Easings             | Time functions (Linear, Back, Elastic, Bounce)    |
| Filters.*                | Filters             | Pixel effects for images                          |
| Util.getRandomColor()    | Util                | Random hex color                                  |
| Util.getRGB(color)       | Util                | Parse color to {r,g,b}                            |
| Util.haveIntersection()  | Util                | Rectangle intersection check                      |
| Transform.*              | Transform           | Matrix math utilities                             |

Sub‑sections below elaborate specific utility modules.

### Konva.Canvas

Canvas encapsulates canvas size and device pixel ratio. The getContext method returns a 2D drawing context. getPixelRatio and setPixelRatio allow reading and adjusting the internal scale, which affects sharpness and hit accuracy. For export, toDataURL returns a data URL of the rendered canvas.

### Konva.Animation

Animation binds a function to one or more layers. The function is invoked on each frame while the animation is running. You can switch layers via setLayers/getLayers/addLayer and check or control the lifecycle with isRunning, start, stop. This is the idiomatic way to create continuous updates that need to stay in sync with Konva’s redraw loop.

### Konva.Easings

Easings are time functions used by Tween and Animation to modulate progress non‑linearly. Typical families include Back, Elastic, Bounce, and Linear. While the exact signatures are not listed, their usage is conceptually: pass an easing name when constructing a Tween or evaluate it inside an Animation step to shape velocity.

### Konva.Filters

Filters are image‑level effects applied to Konva.Image instances. Common filters include Blur, Brighten, Contrast, Emboss, Grayscale, HSL, HSV, Invert, Noise, Pixelate, RGB, Sepia, and Threshold. Each filter modifies pixels post‑draw and may trigger re‑rasterization; therefore, test on target devices and budgets.

### Konva.Util

- getRandomColor: returns a random hex color string for quick styling.
- getRGB: returns {r,g,b} for a CSS color string, useful when operating on pixel data.
- haveIntersection: returns true if two client rectangles intersect; each rectangle is represented by {x,y,width,height}.

### Konva.Transform

Transform implements affine 2D matrix operations. Key methods include:
- copy: clone a Transform
- point: transform a 2D point
- translate, scale, rotate, skew: mutating operations that return the Transform for chaining
- multiply, invert: matrix composition and inversion
- getTranslation: returns {x,y}
- getMatrix: returns the six‑element matrix array
- decompose: convert matrix back to attribute space

This API is sufficient for custom hit testing, spatial queries, and feature work that requires explicit matrix math.



## Node and Event Model

Node is the base class for all renderable and interactive entities. It provides the transform model (x, y, scaleX, scaleY, rotation, offsetX, offsetY), visibility and opacity controls, attribute get/set, hierarchical navigation, caching, and event handling.

Attributes and transforms. Nodes expose x/y for position; scaleX/scaleY for non‑uniform scaling; rotation in degrees; offsetX/offsetY for changing the origin of rotation and scaling; visible and opacity for visibility and alpha modulation. The attribute system is uniform: getAttr(name) and setAttrs(map) read or update node attributes directly.

Hierarchical navigation. Each node knows its parent (getParent), its layer (getLayer), and its stage (getStage). Nodes can be removed (remove, destroy) and moved relative to siblings (move). Rotation is available via rotate(angle) in degrees.

Event API. Konva supports DOM‑like event binding on nodes:
- on(evtStr, handler): bind an event handler
- off(evtStr?, handler?): unbind, optionally by event string or handler reference
- fire(type, evt?, bubble?): emit an event, optionally bubbling up the hierarchy

Caching. cache() creates an off‑screen canvas for a node to accelerate redraw and hit testing, while clearCache() discards it. drawHitFromCache(alphaThreshold) regenerates the hit graph from the cached scene and can be used to tune the alpha threshold for hit detection. The intersects(point) method is available on shapes for per‑shape hit tests, but it clears and redraws a temporary canvas and therefore performs poorly when used in bulk. For overall stage hit tests, prefer Stage.getIntersection.

Table 5 enumerates the most commonly used Node methods and their roles.

Table 5. Node methods: purpose and typical use cases

| Method                  | Purpose                                              | Typical use case                                  |
|-------------------------|------------------------------------------------------|---------------------------------------------------|
| cache(), clearCache()   | Create/discard off‑screen cache for a node           | Improve redraw/hit performance                    |
| drawHitFromCache()      | Rebuild hit graph from cached scene                  | Adjust hit sensitivity after cache                |
| on(evt, handler)        | Bind event handler                                   | Input handling and interactions                   |
| off(evt?, handler?)     | Unbind event(s)                                      | Cleanup and dynamic re‑binding                    |
| fire(type, evt?, bubble?)| Emit event                                           | Custom events and side‑effects                    |
| getAttr(name), setAttrs(map)| Access/set attributes                           | Generic property management                       |
| getParent()             | Navigate to parent                                   | Grouping, event bubbling                          |
| getLayer(), getStage()  | Navigate to rendering context                        | Draw scoping, batching                            |
| remove(), destroy()     | Remove/destroy node                                  | Scene teardown                                    |
| move(delta)             | Change z‑order within siblings                       | Layering controls                                 |
| rotate(deg)             | Rotate by delta                                      | Animated rotation increments                      |
| show(), hide()          | Toggle visibility                                    | State changes                                     |

Interpretation. The Node model is intentionally lightweight and consistent. Because all shapes inherit from Node, you can attach events uniformly, manipulate transforms in one place, and cache heavy nodes (e.g., text or complex shapes) to accelerate redraw. For hit detection at scale, avoid repeated intersects on many nodes; prefer Stage.getIntersection, which is optimized at the stage level.



## Stage and Layers: Rendering and Hit Testing

Stage is the top‑level container bound to a DOM element. It manages Layers, orchestrates input, and coordinates redraws. Stage exposes methods to set and get its container, clear the scene, compute pointer positions, find the topmost node under a point, and batch redraw Layers.

Stage API. setContainer accepts a DOM element or selector. clear clears the Stage’s drawing surfaces. getPointerPosition returns the current pointer coordinates in stage space; setPointersPositions syncs pointer capture across devices. getIntersection(point) returns the topmost node under a point, which is the recommended way to perform bulk hit testing. getLayers returns the Stage’s Layers; batchDraw triggers a redraw for all Layers.

Layer API. Layer inherits from Container and represents a render surface. getCanvas returns its Canvas, batchDraw schedules or performs a redraw, and getIntersection delegates up to Stage’s method. Layer also exposes imageSmoothingEnabled for image quality control and clearBeforeDraw to control whether the layer clears before drawing.

FastLayer. The documentation includes a FastLayer note indicating deprecation and recommending Layer with listening set to false for equivalent behavior where event listening is not required.

Table 6 summarizes the Stage API.

Table 6. Stage API summary

| Method                         | Purpose                                             |
|--------------------------------|-----------------------------------------------------|
| setContainer(elementOrSelector)| Bind the stage to a DOM element                     |
| container()                    | Get the bound container                             |
| clear()                        | Clear all layers’ drawings                          |
| getPointerPosition()           | Get pointer position in stage coordinates           |
| setPointersPositions()         | Update pointer positions for all inputs             |
| getIntersection(point)         | Get topmost node under a point                      |
| getLayers()                    | Get the list of layers                              |
| batchDraw()                    | Redraw all layers                                   |

Table 7 summarizes the Layer API.

Table 7. Layer API summary

| Method                   | Purpose                                           |
|--------------------------|---------------------------------------------------|
| getCanvas()              | Get the Layer’s Canvas                            |
| batchDraw()              | Redraw the layer                                  |
| getIntersection(point)   | Delegate to Stage for hit testing                 |
| imageSmoothingEnabled()  | Control image smoothing on the layer              |
| clearBeforeDraw()        | Control whether the layer clears before drawing   |

Interpretation. Use Stage to manage input and coordinate redraw across Layers; use Layer.batchDraw for targeted updates. Prefer Stage.getIntersection for hit testing over per‑shape intersects, particularly when the scene contains many nodes. FastLayer is superseded by Layer({listening:false}); this preserves rendering performance while disabling event listening on the layer.



## Containers and Grouping

Container extends Node with child management. It provides:
- getChildren(filterFn?): returns a collection of direct children, optionally filtered.
- add(node…): append one or more children.
- find(selector): find descendants matching a selector (for example, by name or id).
- findOne(selector): return the first match.
- clip(config): set a rectangular clipping region for children.

Groups are Containers used to logically organize nodes that share transforms or lifecycle management. Because Group is a Container, all child‑management methods apply. Clip rules apply to children only; the Group itself may have its own styles and transforms.

Table 8 summarizes Container methods.

Table 8. Container methods

| Method                   | Purpose                                           |
|--------------------------|---------------------------------------------------|
| getChildren(filterFn?)   | Get direct children, optionally filtered          |
| add(node…)               | Add children                                      |
| find(selector)           | Find descendants by selector                      |
| findOne(selector)        | Find first descendant                             |
| clip(config)             | Apply clip region to children                     |

Interpretation. Grouping is the primary tool for managing complex scenes. Clip can be used for masked regions, while find and findOne support patterns like “select all nodes with this name” or “get the first label.” As a rule, keep groups semantically meaningful (for example, “ui-toolbar-buttons”), so queries remain readable.



## Base Shape API

Shape extends Node and serves as the base for all drawable nodes. It defines style properties (fill, stroke, shadow, dash), drawing functions (sceneFunc, hitFunc), and auxiliary methods (hasFill, hasStroke, hasShadow, getSelfRect, intersects, drawHitFromCache).

Common style properties. Shapes support:
- fill (color, gradient, pattern), fillEnabled, fillPriority
- stroke (color), strokeWidth, strokeEnabled, hitStrokeWidth
- lineJoin, lineCap, miterLimit
- shadowColor, shadowBlur, shadowOpacity, shadowOffset, shadowEnabled
- dash, dashEnabled

Drawing and hit funcs. sceneFunc(context, shape) is invoked to draw the shape’s visible pixels; hitFunc(context) draws the shape’s hit graph. If hitFunc is not defined, sceneFunc is used for hit detection. getSelfRect returns the axis‑aligned bounding box in the node’s untransformed local space. intersects(point) determines if a point lies within the shape by drawing into a temporary canvas; this is accurate but expensive if called many times.

Table 9 summarizes style properties and methods available on Shape and inherited by its subclasses.

Table 9. Shape style properties and rendering methods

| Category            | Members (non‑exhaustive)                                                                                      |
|---------------------|---------------------------------------------------------------------------------------------------------------|
| Fill                | fill, fillEnabled, fillPriority, fillPatternImage, fillLinearGradient*, fillRadialGradient*                   |
| Stroke              | stroke, strokeWidth, strokeEnabled, hitStrokeWidth, strokeHitEnabled (deprecated), strokeLinearGradient*      |
| Line geometry       | lineJoin, lineCap, miterLimit                                                                                 |
| Shadow              | shadowColor, shadowBlur, shadowOpacity, shadowOffset, shadowEnabled, shadowForStrokeEnabled                   |
| Dash                | dash, dashEnabled                                                                                             |
| Draw hooks          | sceneFunc, hitFunc                                                                                            |
| Queries             | hasFill, hasStroke, hasShadow, getSelfRect, intersects, drawHitFromCache                                      |

Interpretation. Shape centralizes styling and drawing semantics. When default primitives are insufficient, sceneFunc and hitFunc allow custom rendering while preserving styling, caching, and hit detection semantics.



## Specific Shapes: API Details by Class

This section catalogs each class’s constructor signature, configuration options, own methods, inherited methods, and events where applicable. Inheritance paths are summarized from Table 3.

### Arc

- Inheritance: Arc → Shape → Node.
- Constructor: new Konva.Arc(config). The config commonly includes innerRadius, outerRadius, angle, and clockwise; exact defaults are not specified in the captured sources.
- Own methods: Provide getters/setters commonly used for arc geometry (for example, radius and angle semantics). The captured sources only partially enumerate method names and defaults; see Information gaps for specifics.
- Inherited: All Shape styling and Node APIs apply.

Usage note. Use Arc to render donut segments and pie slices. For filled arcs, consider Ring (annulus) if you need a hole with independent inner/outer radii.

### Arrow

- Inheritance: Arrow → Line → Shape → Node.
- Constructor: new Konva.Arrow(config).
- Configuration: Extends Line’s points, tension, closed, bezier with pointerLength, pointerWidth, pointerAtBeginning, pointerAtEnding.
- Inherited: Line’s methods (for example, points, tension, closed, bezier) and Shape styling.

Usage note. Arrow is ideal for diagrams and connectors. Configure pointer shapes per endpoint to emulate lines, arrows, or capped segments.

### Circle

- Inheritance: Circle → Shape → Node.
- Constructor: new Konva.Circle(config), commonly with radius.
- Own methods: radius() to get/set the radius.

Usage note. For circular sectors, prefer Wedge; for arcs with a hole, prefer Ring or Arc.

### Ellipse

- Inheritance: Ellipse → Shape → Node.
- Constructor: new Konva.Ellipse(config) with a radius object {x: radiusX, y: radiusY}.
- Own methods: radius(), radiusX(), radiusY().

Usage note. Ellipse exposes separate radii for x and y; use radiusX/radiusY if you need independent access.

### Label and Tag

- Label: Inheritance Label → Group → Container → Node. It is a Group that contains a Text node and a Tag node.
  - Own methods: getText(), getTag() to access the label’s content and pointer box.
- Tag: Inheritance Tag → Shape → Node.
  - Constructor: new Konva.Tag(config) with pointerDirection, pointerWidth, pointerHeight, cornerRadius.
  - Own methods: pointerDirection(), pointerWidth(), pointerHeight(), cornerRadius(). The cornerRadius can be a single number or a four‑element array [tl, tr, br, bl].

Usage note. Label pairs text with a callout box via Tag. Control pointer direction to point at UI anchors.

### Image

- Inheritance: Image → Shape → Node.
- Constructor: new Konva.Image(config) with image, crop, and common styles.
- Static: fromURL(url, callback) to construct an Image node once the source loads.
- Own methods: image() to get/set the HTMLImageElement; methods to get/set cropX, cropY, cropWidth, cropHeight; cornerRadius() for rounded corners when used with caching.

Usage note. Use fromURL to ensure the Image is constructed only after the source is ready. For sprites or image strips, use Image with a custom draw function or crop.

### Path

- Inheritance: Path → Shape → Node.
- Constructor: new Konva.Path(config) with a data string containing SVG path commands.
- Own methods: data() to get/set the SVG path; getLength() and getPointAtLength(length) for sampling along the path.
- Supported path commands: M/m, L/l, H/h, V/v, Q/q, T/t, C/c, S/s, A/a, Z/z.

Usage note. Sampling methods enable text‑on‑path or custom positioning of markers along the path.

### Line

- Inheritance: Line → Shape → Node.
- Constructor: new Konva.Line(config) with points (flat array), tension, closed, bezier.
- Own methods: points(), tension(), closed(), bezier().

Usage note. For arrows, use Arrow instead. For complex curves, use bezier or tension depending on your data.

### RegularPolygon

- Inheritance: RegularPolygon → Shape → Node.
- Constructor: new Konva.RegularPolygon(config) with sides, radius, and optional cornerRadius (array supported).
- Own methods: sides(), radius(), cornerRadius().

Usage note. Use cornerRadius array to tune per‑corner rounding on polygons that support it.

### Rect

- Inheritance: Rect → Shape → Node.
- Constructor: new Konva.Rect(config) with optional cornerRadius; accepts a single number or an array [tl, tr, br, bl].
- Own methods: cornerRadius().

Usage note. Rounded rectangles are common in UI chrome; set cornerRadius per corner for nuance.

### Sprite

- Inheritance: Sprite → Shape → Node.
- Constructor: new Konva.Sprite(config) with image, animations (name‑to‑frames map), animation name, frameIndex, frameRate.
- Own methods: start(), stop(), isRunning(), animation(), animations(), offsets(), image(), frameIndex(), frameRate().

Usage note. Sprite animates by advancing frameIndex at frameRate within the currently selected animation.

### Ring

- Inheritance: Ring → Shape → Node.
- Constructor: new Konva.Ring(config) with innerRadius and outerRadius.
- Own methods: innerRadius(), outerRadius().

Usage note. Use Ring to render a donut or an annulus. For pie‑shaped wedges, use Wedge; for arc segments, use Arc.

### Star

- Inheritance: Star → Shape → Node.
- Constructor: new Konva.Star(config) with numPoints, innerRadius, outerRadius.
- Own methods: numPoints(), innerRadius(), outerRadius().

Usage note. Star is a convenience shape; use for rating widgets or icons.

### Wedge

- Inheritance: Wedge → Shape → Node.
- Constructor: new Konva.Wedge(config) with angle (degrees), radius, clockwise.
- Own methods: radius(), angle(), clockwise().

Usage note. Wedge is a circular sector; its clockwise flag governs draw direction.

### Text

- Inheritance: Text → Shape → Node.
- Constructor: new Konva.Text(config) with text, fontFamily, fontSize, fontStyle, fontVariant, align, verticalAlign, padding, lineHeight, wrap, ellipsis, direction, and full Shape styling.
- Own methods include:
  - getTextWidth(): measure text width excluding padding
  - measureSize(text): return {width,height} for a single line in the current font
  - width([value]), height([value]): get/set text area dimensions; set to 'auto' to size to content
  - direction(), fontFamily(), fontSize(), fontStyle(), fontVariant(), padding(), align(), verticalAlign(), lineHeight(), wrap(), ellipsis(), letterSpacing(value), text(), textDecoration(), charRenderFunc
  - _shouldHandleEllipsis(currentHeightPx): internal helper for ellipsis logic
- Notes:
  - wrap can be 'word', 'char', or 'none' (default 'word'). When wrap is 'none' and ellipsis is true with bounded width and height, Konva adds '…'.
  - charRenderFunc receives a props object with context and index and allows per‑grapheme rendering changes; it may disable native kerning/ligatures.
- Inherited: All Shape styling and Node APIs.

Usage note. Use width('auto') and height('auto') to measure text bounds without setting fixed size. For ellipsis, constrain width and height and enable ellipsis. For complex scripts or emphasis, charRenderFunc allows custom per‑character effects.

### TextPath

- Inheritance: TextPath → Shape → Node.
- Constructor: new Konva.TextPath(config) with data (SVG path string) and text, plus Text‑like typography properties (fontFamily, fontSize, fontStyle, fontVariant, textBaseline, align, letterSpacing).
- Own methods:
  - getTextWidth(): width in pixels of the rendered text
  - data(value?): get/set SVG path; parses into an internal data array
  - fontFamily(value?), fontSize(value?), fontStyle(value?), align(value?), letterSpacing(value?), textBaseline(value?), fontVariant(value?), text(value?), textDecoration(value?), kerningFunc(value?): getters/setters for typography and text content
- Supported commands in data: M/m, L/l, H/h, V/v, Q/q, T/t, C/c, S/s, A/a, Z/z.
- Inherited: All Shape styling and Node APIs.
- Notes. The captured sources partially list kerningFunc signatures; setter/getter behavior is implied but not fully enumerated (see Information gaps).

Usage note. Use TextPath to flow text along a path. Sample the path with getPointAtLength to build custom text effects or anchors.

### Transformer

- Inheritance: Transformer is a special group.
- Constructor: new Konva.Transformer(config) with many UI options; it does not change node width/height but changes scaleX/scaleY.
- Key configuration:
  - resizeEnabled, rotateEnabled, rotateLineVisible
  - rotationSnaps (array of angles), rotationSnapTolerance, rotateAnchorOffset, rotateAnchorCursor
  - padding, borderEnabled, borderStroke, borderStrokeWidth, borderDash
  - anchorFill, anchorStroke, anchorCornerRadius, anchorStrokeWidth, anchorSize
  - keepRatio, shiftBehavior, centeredScaling, enabledAnchors (array of handle names)
  - flipEnabled, ignoreStroke, useSingleNodeRotation, shouldOverdrawWholeArea
  - boundBoxFunc (custom bounding box transform), anchorDragBoundFunc (custom anchor drag constraint), anchorStyleFunc (style anchors)
- Events: The Transformer emits transform, transformstart, transformend, dragstart, dragmove, dragend.
- Methods:
  - attachTo(node): deprecated alias to nodes([shape])
  - getActiveAnchor(): name of the active anchor or null
  - detach(): detach from attached node(s)
  - on(evt, handler): bind events; events include 'transform' and lifecycle events
  - forceUpdate(), isTransforming(), stopTransform()
  - nodes(), enabledAnchors(), flipEnabled(), resizeEnabled(), anchorSize(), rotateEnabled(), rotateLineVisible(), rotationSnaps(), rotateAnchorOffset(), rotateAnchorCursor(), rotationSnapTolerance(), borderEnabled(), anchorStroke(), anchorStrokeWidth(), anchorFill(), anchorCornerRadius(), borderStroke(), borderStrokeWidth(), borderDash(), keepRatio(), shiftBehavior(), centeredScaling(), ignoreStroke(), padding(), boundBoxFunc(), anchorDragBoundFunc(), anchorStyleFunc(), shouldOverdrawWholeArea(), useSingleNodeRotation()
- Usage notes:
  - boundBoxFunc operates in absolute coordinates and can clamp or reject proposed boxes.
  - shouldOverdrawWholeArea may temporarily disable events on attached nodes while dragging empty space.
- Additional reference: see the site repository for the Transformer page.[^41]

Usage note. Transformer is the standard manipulation tool for interactive editors. Configure anchors, snapping, and bounding box functions to enforce user experience constraints.

### Tween

- Constructor: new Konva.Tween(config). The captured sources do not provide a formal config schema; properties likely include node references, target attribute maps, duration, easing, and onfinish handlers, but details are not listed.
- Methods:
  - play(), pause(), reverse()
  - seek(t) where t is a time in seconds within the tween duration
  - reset(), finish(), destroy()
- Default easing: Linear (unless overridden).
- Notes. Use Konva.Easings to select an easing function. The exact Tween config schema is not captured (see Information gaps).

Usage note. Tween is the idiomatic way to animate Node properties. Use seek for scrubbing, and destroy to free resources when the tween is no longer needed.



## Eventing and Interaction Model

Konva exposes DOM‑like events on nodes: on to bind, off to unbind, and fire to emit. Events bubble by default, allowing container‑level handlers to react to children. Specific components add specialized events:

- Transformer emits transform, transformstart, transformend, dragstart, dragmove, dragend while the user drags and resizes nodes.
- Animation isRunning, start, and stop signal the lifecycle of continuous updates.
- Stage provides getPointerPosition and setPointersPositions to manage input coordinates across devices, and getIntersection to discover the topmost node under a point.

Event payload conventions. The Transformer documentation specifies that handlers receive an event object where target is the primary event target, currentTarget is the node the listener is attached to, and evt is the native browser event. This pattern is likely consistent across Konva but is only explicitly documented for Transformer.

Table 10 outlines key event sources and their payloads.

Table 10. Event sources and payload conventions

| Source          | Events                                           | Payload notes                                                            |
|-----------------|--------------------------------------------------|---------------------------------------------------------------------------|
| Node            | All DOM‑like events (e.g., click, mouseover)     | target, currentTarget, evt (native) per Transformer doc                  |
| Transformer     | transform, transformstart, transformend, dragstart, dragmove, dragend | Event object includes target, currentTarget, evt                        |
| Stage           | Input and pointer updates (via API)              | getPointerPosition(), setPointersPositions(), getIntersection()          |
| Animation       | isRunning, start, stop                           | Lifecycle signals                                                        |

Interpretation. Use event delegation on Containers when many similar children exist, and prefer Stage.getIntersection for hit testing in bulk. For Transformer, structure handlers to read the proposed bounding box in absolute coordinates and enforce constraints via boundBoxFunc.



## Patterns and Implementation Recipes

This section distills repeatable recipes that recur in Konva application code.

1) Animations with Animation and Tween
- Animation: Bind a function to one or more layers. Drive time‑based changes inside the function and call layer.batchDraw() only if necessary. Start/stop controls lifecycle. This is suitable for simulations, clocks, or custom progress indicators.
- Tween: Animate Node properties between current and target values. Configure easing via Easings. Use seek for scrubbing (for example, timeline sliders) and destroy on teardown.

2) Transformers and interactive manipulation
- Attach nodes via transformer.nodes([node…]).
- Configure rotationSnaps and rotationSnapTolerance for snapping behavior; keepRatio to constrain aspect ratio; centeredScaling for center scaling; and ignoreStroke when stroke scaling should be decoupled (via strokeScaleEnabled on the shape).
- boundBoxFunc can enforce min/max sizes or lock aspect ratios.
- shouldOverdrawWholeArea allows dragging the transformer by its empty space but may disable events on attached nodes while dragging; re‑enable as needed.

3) Text layout and ellipsis
- Set wrap to 'word' for word‑aware wrapping, 'char' for character wrapping, or 'none' to disable wrapping.
- To enable ellipsis, set ellipsis to true and constrain both width and height. Use width('auto') and height('auto') to measure content before setting constraints.
- Use charRenderFunc for per‑character styling or effects; be aware it may disable native kerning/ligatures.

4) Efficient hit testing
- Use Stage.getIntersection(point) for most interactive hit tests. It is stage‑optimized and avoids per‑shape temporary canvas operations.
- Avoid calling intersects on many shapes in a loop; if unavoidable, cache the shape first and use drawHitFromCache to tune alpha thresholds.

5) Image loading and rendering
- Use Image.fromURL to construct an Image node asynchronously once the source is ready.
- For image strips or sprite sheets, set crop parameters and advance them programmatically, or use Sprite for named animations.

6) Drawing custom shapes with sceneFunc/hitFunc
- Implement sceneFunc(context, shape) to draw the shape based on its properties and call context.fillStrokeShape(shape) to respect the node’s styling.
- Provide hitFunc(context) to define a hit region; if omitted, sceneFunc is used for hit detection.
- cache() heavy shapes and call drawHitFromCache(alphaThreshold) to accelerate redraw and hit testing.

7) Working with groups and clipping
- Group nodes that share transforms. Use find and findOne to target descendants by name/id.
- clip(config) on a Container limits drawing of children to the clip rectangle; this is useful for scroll panes and masked regions.

8) Working with SVG paths and TextPath
- For Path, use data to set the SVG string and getLength/getPointAtLength for sampling.
- For TextPath, set data to your path and text for the content. Use typography getters/setters to tune appearance.

To consolidate, Table 11 provides a quick pattern index.

Table 11. Pattern index: use‑case to API mapping

| Use case                                   | Recommended API(s)                                                                 |
|--------------------------------------------|-------------------------------------------------------------------------------------|
| Continuous animation loop                  | Animation + Easings; layer.batchDraw()                                             |
| Property animation with easing             | Tween + Konva.Easings                                                              |
| Interactive resize/rotate                  | Transformer + nodes + rotationSnaps/keepRatio/boundBoxFunc                         |
| Ellipsis for overflowing text              | Text with wrap='none', ellipsis=true, bounded width/height                         |
| Measure text before layout                 | Text.width('auto')/height('auto') or measureSize for single line                   |
| Hit test many nodes                        | Stage.getIntersection(point)                                                       |
| Draw custom shapes with styling            | Shape.sceneFunc + context.fillStrokeShape; cache + drawHitFromCache                |
| Load image asynchronously                  | Image.fromURL + node.image() + node.draw()                                         |
| Crop image strip                           | Image with cropX/cropY/cropWidth/cropHeight                                        |
| Group and find descendants                 | Group (Container) + getChildren + find/findOne                                     |
| Mask children                              | Container.clip(config)                                                             |
| Flow text along a path                     | TextPath with data + typography setters/getters                                    |
| Export raster image                        | Canvas.toDataURL()                                                                  |
| Utility colors and intersections           | Util.getRandomColor, Util.getRGB, Util.haveIntersection                            |
| Custom matrix math                         | Transform.copy/point/translate/rotate/scale/skew/multiply/invert/getMatrix/decompose |

Interpretation. These patterns map cleanly to Konva’s module boundaries—Animation/Tween to time, Transformer to manipulation, Text to layout, Stage to input, Shape to drawing, and Util/Transform to math. Favor batchDraw over broad invalidations to keep rendering predictable.



## Appendices

### Appendix A. Class inheritance quick reference

This quick reference lists direct inheritance and a one‑line purpose for commonly used classes. Full chains appear in Table 3.

- Arrow → Line: Line with arrowhead pointers.
- Circle → Shape: Circle geometry.
- Ellipse → Shape: Ellipse geometry.
- Group → Container: Logical grouping of nodes.
- Image → Shape: Renders image sources.
- Label → Group: Group containing Text and Tag.
- Layer → Container: Render surface within Stage.
- Line → Shape: Polylines and curves.
- Path → Shape: Renders SVG path data.
- Rect → Shape: Rectangle with optional corner radius.
- RegularPolygon → Shape: Regular polygon.
- Ring → Shape: Annulus/donut.
- Sprite → Shape: Animated bitmap frames.
- Stage → Container: Root attached to DOM.
- Star → Shape: Star shape.
- Tag → Shape: Rounded rectangle with optional pointer.
- Text → Shape: Rich text layout and rendering.
- TextPath → Shape: Text along an SVG path.
- Transformer → Special Group: Interactive transform UI.
- Wedge → Shape: Circular sector.

### Appendix B. Utility index

- Canvas: getContext, getPixelRatio, setPixelRatio, toDataURL.
- Context: fillShape, strokeShape, fillStrokeShape, reset, clear.
- Easings: Linear, Back, Elastic, Bounce.
- Filters: Blur, Brighten, Contrast, Emboss, Grayscale, HSL, HSV, Invert, Noise, Pixelate, RGB, Sepia, Threshold.
- Util: getRandomColor, getRGB(color), haveIntersection(r1, r2).
- Transform: copy, point, translate, scale, rotate, skew, multiply, invert, getTranslation, getMatrix, decompose.

### Appendix C. Event quick reference

- Node: on(evt, handler), off(evt?, handler?), fire(type, evt?, bubble?).
- Transformer: transform, transformstart, transformend, dragstart, dragmove, dragend.
- Stage: getPointerPosition(), setPointersPositions(), getIntersection(point).
- Animation: isRunning(), start(), stop().

### Appendix D. Notes on defaults and deprecations

- Stage.autoDrawEnabled: Global toggle to auto‑redraw Stages (default not specified).
- Layer.imageSmoothingEnabled: Controls smoothing for images on the layer.
- Konva.FastLayer: Deprecated; use Layer({listening:false}) for equivalent rendering without events.
- Transformer.attachTo: Deprecated; use transformer.nodes([shape]) instead.
- strokeHitEnabled: Deprecated; use hitStrokeWidth instead.
- For many classes, the captured sources do not list full defaults for constructor arguments; where defaults are not specified in the official pages, this report does not infer them.

### Appendix E. Source coverage

- Main API coverage by class:
  - Nodes and base classes: Node, Container, Shape, Layer, Stage.
  - Utilities: Canvas, Context, Animation, Easings, Filters, Util, Transform, Tween.
  - Shapes: Arc, Arrow, Circle, Ellipse, Image, Path, Line, Rect, RegularPolygon, Ring, Sprite, Star, Wedge, Text, TextPath, Label & Tag.
  - Interaction: Transformer.
  - Additional: FastLayer deprecation note.

### Appendix F. Known information gaps in the official captured sources

- Tween configuration schema (for example, duration, easing name, onUpdate) is not specified.
- Stage event names beyond getPointerPosition, setPointersPositions, getIntersection are not fully enumerated.
- Transformer event payload fields beyond target, currentTarget, evt are not fully defined.
- Complete TextPath method set and kerningFunc setter/getter signatures are partially listed.
- Filter argument types and defaults are not fully enumerated; only a representative list is available.
- Arc and Ring constructor default values are not fully captured; only partial method lists are available.
- Easings function signatures and parameterization are not enumerated.
- Class‑specific defaults (for example, Stage.autoDrawEnabled, Layer.clearBeforeDraw) are not always present.
- A comprehensive, official class inheritance diagram is not included; the chains here are derived from class descriptions.
- Examples are not exhaustive for every class; only class‑specific examples present in official pages are referenced.

### Appendix G. References and citation mapping

- Node and core base classes: see official API pages.[^1][^3][^5]
- Stage and Layer lifecycle and hit testing: see Stage and Layer API pages.[^8][^4]
- Containers and groups: see Container and Group API pages.[^2][^27]
- Shape styling and hooks: see Shape API page.[^7]
- Specific shapes and utilities: see individual class pages.[^6][^9][^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^40]
- Transformer configuration and events: see Transformer page and site repository.[^41]
- Easings, Filters, Util, Transform: see their respective pages.[^30][^28][^29][^31]



## References

[^1]: Konva.js API: Konva (main object). https://konvajs.org/api/Konva.html  
[^2]: Konva.js API: Konva.Container. https://konvajs.org/api/Konva.Container.html  
[^3]: Konva.js API: Konva.Node. https://konvajs.org/api/Konva.Node.html  
[^4]: Konva.js API: Konva.Layer. https://konvajs.org/api/Konva.Layer.html  
[^5]: Konva.js API: Konva.Stage. https://konvajs.org/api/Konva.Stage.html  
[^6]: Konva.js API: Konva.Circle. https://konvajs.org/api/Konva.Circle.html  
[^7]: Konva.js API: Konva.Shape. https://konvajs.org/api/Konva.Shape.html  
[^8]: Konva.js API: Konva.Canvas. https://konvajs.org/api/Konva.Canvas.html  
[^9]: Konva.js API: Konva.Rect. https://konvajs.org/api/Konva.Rect.html  
[^10]: Konva.js API: Konva.Ellipse. https://konvajs.org/api/Konva.Ellipse.html  
[^11]: Konva.js API: Konva.Image. https://konvajs.org/api/Konva.Image.html  
[^12]: Konva.js API: Konva.Text. https://konvajs.org/api/Konva.Text.html  
[^13]: Konva.js API: Konva.TextPath. https://konvajs.org/api/Konva.TextPath.html  
[^14]: Konva.js API: Konva.Line. https://konvajs.org/api/Konva.Line.html  
[^15]: Konva.js API: Konva.Arrow. https://konvajs.org/api/Konva.Arrow.html  
[^16]: Konva.js API: Konva.Arc. https://konvajs.org/api/Konva.Arc.html  
[^17]: Konva.js API: Konva.Ring. https://konvajs.org/api/Konva.Ring.html  
[^18]: Konva.js API: Konva.Wedge. https://konvajs.org/api/Konva.Wedge.html  
[^19]: Konva.js API: Konva.RegularPolygon. https://konvajs.org/api/Konva.RegularPolygon.html  
[^20]: Konva.js API: Konva.Star. https://konvajs.org/api/Konva.Star.html  
[^21]: Konva.js API: Konva.Label. https://konvajs.org/api/Konva.Label.html  
[^22]: Konva.js API: Konva.Tag. https://konvajs.org/api/Konva.Tag.html  
[^23]: Konva.js API: Konva.Path. https://konvajs.org/api/Konva.Path.html  
[^24]: Konva.js API: Konva.Sprite. https://konvajs.org/api/Konva.Sprite.html  
[^25]: Konva.js API: Konva.FastLayer. https://konvajs.org/api/Konva.FastLayer.html  
[^26]: Konva.js API: Konva.Context. https://konvajs.org/api/Konva.Context.html  
[^27]: Konva.js API: Konva.Group. https://konvajs.org/api/Konva.Group.html  
[^28]: Konva.js API: Konva.Filters. https://konvajs.org/api/Konva.Filters.html  
[^29]: Konva.js API: Konva.Util. https://konvajs.org/api/Konva.Util.html  
[^30]: Konva.js API: Konva.Easings. https://konvajs.org/api/Konva.Easings.html  
[^31]: Konva.js API: Konva.Transform. https://konvajs.org/api/Konva.Transform.html  
[^40]: Konva.js API: Konva.Animation. https://konvajs.org/api/Konva.Animation.html  
[^41]: Konva site repository: Konva.Transformer page. https://github.com/konvajs/site/tree/new/content/api/Konva.Transformer.mdx# Comprehensive Konva.js Shapes Documentation

## Table of Contents
1. [Framework Overview](#framework-overview)
2. [Basic Geometric Shapes](#basic-geometric-shapes)
3. [Text and Label Shapes](#text-and-label-shapes)
4. [Advanced Shapes](#advanced-shapes)
5. [Line and Path Shapes](#line-and-path-shapes)
6. [Custom Shapes and Grouping](#custom-shapes-and-grouping)
7. [Image and Sprite Shapes](#image-and-sprite-shapes)

---

## Framework Overview

Konva is an HTML5 Canvas JavaScript framework designed for 2D interactivity on desktop and mobile. It extends the 2D context, enabling high-performance animations, transitions, node nesting, layering, filtering, caching, and event handling. The framework operates on a hierarchy of virtual nodes: `Konva.Stage` contains `Konva.Layer`s, which can contain `Konva.Group`s or `Konva.Shape`s. All nodes can be styled and transformed.

### Basic Shapes Supported
- Rect, Circle, Ellipse, Line, Polygon, Spline, Blob
- Image, Text, TextPath, Star, Label, SVG Path, RegularPolygon

---

## Basic Geometric Shapes

### Arc (Konva.Arc)
Creates arc shapes with configurable angles and radii.

**Properties:**
- `x`: X-coordinate of the arc's center (Number)
- `y`: Y-coordinate of the arc's center (Number)
- `radius`: Radius of the arc (Number)
- `angle`: Angle of the arc in degrees (Number)
- `fill`: Fill color for the arc (String)
- `stroke`: Stroke color (String)
- `strokeWidth`: Width of the stroke (Number)

**Example:**
```javascript
const arc = new Konva.Arc({
  x: 100,
  y: 100,
  radius: 70,
  angle: 60,
  fill: 'red',
  stroke: 'black',
  strokeWidth: 4
});
```

---

### Circle (Konva.Circle)
Creates circular shapes with configurable radius.

**Properties:**
- `x`: X-coordinate of the circle's center (Number)
- `y`: Y-coordinate of the circle's center (Number)
- `radius`: Radius of the circle (Number)
- `fill`: Fill color (String)
- `stroke`: Stroke color (String)
- `strokeWidth`: Width of the stroke (Number)

**Example:**
```javascript
const circle = new Konva.Circle({
  x: stage.width() / 2,
  y: stage.height() / 2,
  radius: 70,
  fill: 'red',
  stroke: 'black',
  strokeWidth: 4
});
```

---

### Rectangle (Konva.Rect)
Creates rectangular shapes with optional rounded corners.

**Properties:**
- `x`: X-coordinate of the rectangle's top-left corner (Number)
- `y`: Y-coordinate of the rectangle's top-left corner (Number)
- `width`: Width of the rectangle (Number)
- `height`: Height of the rectangle (Number)
- `fill`: Fill color (String)
- `stroke`: Stroke color (String)
- `strokeWidth`: Width of the stroke (Number)
- `cornerRadius`: Radius of corners (Number | Array<Number>)
- `shadowBlur`: Blur radius of the shadow (Number)

**Example:**
```javascript
const rect = new Konva.Rect({
  x: 20,
  y: 20,
  width: 100,
  height: 50,
  fill: 'green',
  stroke: 'black',
  strokeWidth: 4,
  cornerRadius: 10
});
```

**Corner Radius Options:**
- Single number: `cornerRadius: 10` (all corners)
- Array of four numbers: `cornerRadius: [0, 10, 20, 30]` (topLeft, topRight, bottomRight, bottomLeft)

---

### Ellipse (Konva.Ellipse)
Creates elliptical shapes with configurable radii.

**Properties:**
- `x`: X-coordinate of the ellipse's center (Number)
- `y`: Y-coordinate of the ellipse's center (Number)
- `radiusX`: Horizontal radius of the ellipse (Number)
- `radiusY`: Vertical radius of the ellipse (Number)
- `fill`: Fill color (String)
- `stroke`: Stroke color (String)
- `strokeWidth`: Width of the stroke (Number)

**Example:**
```javascript
const ellipse = new Konva.Ellipse({
  x: stage.width() / 2,
  y: stage.height() / 2,
  radiusX: 100,
  radiusY: 50,
  fill: 'yellow',
  stroke: 'black',
  strokeWidth: 4
});
```

---

### Regular Polygon (Konva.RegularPolygon)
Creates regular polygon shapes with configurable number of sides.

**Properties:**
- `x`: X-coordinate of the polygon's center (Number)
- `y`: Y-coordinate of the polygon's center (Number)
- `sides`: Number of sides (Number)
- `radius`: Radius of the polygon (Number)
- `fill`: Fill color (String)
- `stroke`: Stroke color (String)
- `strokeWidth`: Width of the stroke (Number)

**Example:**
```javascript
const hexagon = new Konva.RegularPolygon({
  x: stage.width() / 2,
  y: stage.height() / 2,
  sides: 6,
  radius: 70,
  fill: 'red',
  stroke: 'black',
  strokeWidth: 4
});
```

---

### Star (Konva.Star)
Creates star shapes with configurable number of points and radii.

**Properties:**
- `x`: X-coordinate of the star's center (Number)
- `y`: Y-coordinate of the star's center (Number)
- `numPoints`: Number of points (Number)
- `innerRadius`: Inner radius (Number)
- `outerRadius`: Outer radius (Number)
- `fill`: Fill color (String)
- `stroke`: Stroke color (String)
- `strokeWidth`: Width of the stroke (Number)

**Example:**
```javascript
const star = new Konva.Star({
  x: stage.width() / 2,
  y: stage.height() / 2,
  numPoints: 5,
  innerRadius: 30,
  outerRadius: 70,
  fill: 'yellow',
  stroke: 'black',
  strokeWidth: 4
});
```

---

### Ring (Konva.Ring)
Creates ring (donut) shapes with inner and outer radii.

**Properties:**
- `x`: X-coordinate of the ring's center (Number)
- `y`: Y-coordinate of the ring's center (Number)
- `innerRadius`: Inner radius (Number)
- `outerRadius`: Outer radius (Number)
- `fill`: Fill color (String)
- `stroke`: Stroke color (String)
- `strokeWidth`: Width of the stroke (Number)

**Example:**
```javascript
const ring = new Konva.Ring({
  x: stage.width() / 2,
  y: stage.height() / 2,
  innerRadius: 40,
  outerRadius: 70,
  fill: 'yellow',
  stroke: 'black',
  strokeWidth: 4
});
```

---

### Wedge (Konva.Wedge)
Creates wedge (pie piece) shapes with configurable angle.

**Properties:**
- `x`: X-coordinate of the wedge's center (Number)
- `y`: Y-coordinate of the wedge's center (Number)
- `radius`: Radius of the wedge (Number)
- `angle`: Angle of the wedge in degrees (Number)
- `fill`: Fill color (String)
- `stroke`: Stroke color (String)
- `strokeWidth`: Width of the stroke (Number)
- `rotation`: Rotation of the wedge in degrees (Number)

**Example:**
```javascript
const wedge = new Konva.Wedge({
  x: stage.width() / 2,
  y: stage.height() / 2,
  radius: 70,
  angle: 60,
  fill: 'red',
  stroke: 'black',
  strokeWidth: 4,
  rotation: -120
});
```

---

### Arrow (Konva.Arrow)
Creates arrow shapes with configurable pointer length and width.

**Properties:**
- `x`: Horizontal position (Number)
- `y`: Vertical position (Number)
- `points`: Array defining line segments [x1, y1, x2, y2, ...] (Array<Number>)
- `pointerLength`: Length of the arrow pointer in pixels (Number)
- `pointerWidth`: Width of the arrow pointer in pixels (Number)
- `fill`: Fill color (String)
- `stroke`: Stroke color (String)
- `strokeWidth`: Width of the stroke (Number)

**Example:**
```javascript
const arrow = new Konva.Arrow({
  x: stage.width() / 4,
  y: stage.height() / 4,
  points: [0, 0, 100, 100],
  pointerLength: 20,
  pointerWidth: 20,
  fill: 'black',
  stroke: 'black',
  strokeWidth: 4
});
```

---

## Text and Label Shapes

### Text (Konva.Text)
Creates text shapes with comprehensive formatting and layout options.

**Properties:**
- `x`: X-coordinate of the text's top-left corner (Number)
- `y`: Y-coordinate of the text's top-left corner (Number)
- `text`: The text content (String)
- `fontSize`: Font size in pixels (Number)
- `fontFamily`: Font family name (String)
- `fill`: Fill color (String)
- `width`: Maximum width for text wrapping (Number)
- `padding`: Inner padding around text (Number)
- `align`: Horizontal alignment ('left', 'center', 'right') (String)
- `offsetX`: Horizontal offset (Number)

**Methods:**
- `offsetX(value)`: Sets horizontal offset
- `width()`: Returns calculated width of text

**Features:**
- Multi-line support with `\n` characters
- Automatic text wrapping when width is set
- Internal padding for layout control
- Dynamic positioning with offsetX()

**Simple Text Example:**
```javascript
const simpleText = new Konva.Text({
  x: stage.width() / 2,
  y: 15,
  text: 'Simple Text',
  fontSize: 30,
  fontFamily: 'Calibri',
  fill: 'green'
});
simpleText.offsetX(simpleText.width() / 2);
```

**Complex Text Example with Wrapping:**
```javascript
const complexText = new Konva.Text({
  x: 20,
  y: 60,
  text: "COMPLEX TEXT\\n\\nAll the world's a stage...",
  fontSize: 18,
  fontFamily: 'Calibri',
  fill: '#555',
  width: 300,
  padding: 20,
  align: 'center'
});
```

---

### TextPath (Konva.TextPath)
Creates text that follows an SVG path.

**Properties:**
- `x`: X-coordinate for positioning (Number)
- `y`: Y-coordinate for positioning (Number)
- `text`: The text content to follow the path (String)
- `data`: SVG path data string (String)
- `fontSize`: Font size (Number)
- `fontFamily`: Font family (String)
- `fill`: Fill color (String)

**Example:**
```javascript
const textPath = new Konva.TextPath({
  x: 0,
  y: 50,
  fill: '#333',
  fontSize: 16,
  fontFamily: 'Arial',
  text: 'All the world\'s a stage...',
  data: 'M10,10 C0,0 10,150 100,100 S300,150 400,50'
});
```

---

### Label (Konva.Label)
Creates composite labels with background shapes and text.

**Components:**
- `Konva.Tag`: Background shape component
- `Konva.Text`: Text content component

**Label Properties:**
- `x`: X-coordinate (Number)
- `y`: Y-coordinate (Number)
- `opacity`: Transparency level (Number)

**Tag Properties:**
- `fill`: Fill color of the tag background (String)
- `pointerDirection`: Direction of pointer ('down', 'left', etc.) (String)
- `pointerWidth`: Width of the tag's pointer (Number)
- `pointerHeight`: Height of the tag's pointer (Number)
- `lineJoin`: Style of corners ('round') (String)
- `shadowColor`: Shadow color (String)
- `shadowBlur`: Shadow blur radius (Number)
- `shadowOffsetX`: Shadow X-offset (Number)
- `shadowOffsetY`: Shadow Y-offset (Number)
- `shadowOpacity`: Shadow opacity (Number)

**Text Properties (within Label):**
- `text`: Text content (String)
- `fontFamily`: Font family (String)
- `fontSize`: Font size (Number)
- `padding`: Padding around text (Number)
- `fill`: Text color (String)

**Example:**
```javascript
const tooltip = new Konva.Label({
  x: 170,
  y: 75,
  opacity: 0.75
});

tooltip.add(
  new Konva.Tag({
    fill: 'black',
    pointerDirection: 'down',
    pointerWidth: 10,
    pointerHeight: 10,
    lineJoin: 'round',
    shadowColor: 'black',
    shadowBlur: 10,
    shadowOffsetX: 10,
    shadowOffsetY: 10,
    shadowOpacity: 0.5
  })
);

tooltip.add(
  new Konva.Text({
    text: 'Tooltip pointing down',
    fontFamily: 'Calibri',
    fontSize: 18,
    padding: 5,
    fill: 'white'
  })
);
```

---

## Advanced Shapes

### Group (Konva.Group)
Creates logical groups of shapes with unified transformations.

**Features:**
- Grouping functionality for logical organization
- Child management with `group.add()` method
- Unified transformations (position, rotation, scaling)
- Draggable groups

**Properties:**
- `x`: X-coordinate of the group (Number)
- `y`: Y-coordinate of the group (Number)
- `draggable`: Enable/disable dragging (Boolean)

**Example:**
```javascript
const group = new Konva.Group({
  x: 100,
  y: 100,
  draggable: true
});

// Add shapes to group
group.add(new Konva.Circle({ radius: 50, fill: 'red' }));
group.add(new Konva.Rect({ x: 60, y: 60, width: 80, height: 40, fill: 'blue' }));
```

---

### Image (Konva.Image)
Creates image shapes with loading and manipulation capabilities.

**Properties:**
- `x`: X-coordinate (Number)
- `y`: Y-coordinate (Number)
- `image`: HTML Image object (Image)
- `width`: Width of the image (Number)
- `height`: Height of the image (Number)
- `scaleX`: Horizontal scaling factor (Number)
- `scaleY`: Vertical scaling factor (Number)
- `cornerRadius`: Radius for rounded corners (Number)

**Loading Methods:**
1. **Standard HTML Image Object:**
```javascript
const imageObj = new Image();
imageObj.onload = function() {
  const yoda = new Konva.Image({
    x: 50,
    y: 50,
    image: imageObj,
    width: 106,
    height: 118
  });
  layer.add(yoda);
};
imageObj.src = 'https://konvajs.org/assets/yoda.jpg';
```

2. **Konva.Image.fromURL() Static Method:**
```javascript
Konva.Image.fromURL('https://konvajs.org/assets/darth-vader.jpg', function(darthNode) {
  darthNode.setAttrs({
    x: 200,
    y: 50,
    scaleX: 0.5,
    scaleY: 0.5,
    cornerRadius: 20
  });
  layer.add(darthNode);
});
```

---

### Sprite (Konva.Sprite)
Creates animated sprite shapes from sprite sheets.

**Properties:**
- `x`: X-coordinate (Number)
- `y`: Y-coordinate (Number)
- `image`: The sprite sheet image object (Image)
- `animation`: Current animation name (String)
- `animations`: Object containing animation sequences (Object)
- `frameRate`: Frames per second (Number)
- `frameIndex`: Current frame index (Number)

**Animation Structure:**
Each animation in the `animations` object is an array of frame definitions, where each frame is `[x, y, width, height]`:
```javascript
const sprite = new Konva.Sprite({
  x: 50,
  y: 50,
  image: spriteSheet,
  animation: 'idle',
  animations: {
    idle: [
      [2, 2, 70, 119],
      [74, 2, 70, 119],
      [146, 2, 70, 119]
    ],
    punch: [
      [2, 124, 70, 119],
      [74, 124, 70, 119]
    ]
  },
  frameRate: 7,
  frameIndex: 0
});
```

---

### Path (Konva.Path)
Creates shapes from SVG path data.

**Properties:**
- `x`: X-coordinate (Number)
- `y`: Y-coordinate (Number)
- `data`: SVG path data string (String)
- `fill`: Fill color (String)
- `scale`: Scale object with x and y properties (Object)

**Example:**
```javascript
const path = new Konva.Path({
  x: 50,
  y: 50,
  data: 'M12.582,9.551C3.251,16.237...',
  fill: 'green',
  scale: {
    x: 2,
    y: 2
  }
});
```

---

### Custom Shape (Konva.Shape)
Creates custom shapes by defining drawing functions.

**Properties:**
- `sceneFunc`: Drawing function (Function)
- `hitFunc`: Optional hit detection function (Function)
- `fill`: Fill color (String)
- `stroke`: Stroke color (String)
- `strokeWidth`: Stroke width (Number)

**Methods for sceneFunc:**
- `context.beginPath()`: Start drawing path
- `context.rect(x, y, width, height)`: Draw rectangle
- `context.moveTo(x, y)`: Move to position
- `context.lineTo(x, y)`: Draw line to position
- `context.closePath()`: Close the path
- `context.fillStrokeShape(shape)`: Apply styles (Konva-specific)

**Simple Rectangle Custom Shape:**
```javascript
const rect = new Konva.Shape({
  x: 10,
  y: 20,
  fill: '#00D2FF',
  width: 100,
  height: 50,
  sceneFunc: function(context, shape) {
    context.beginPath();
    context.rect(0, 0, shape.getAttr('width'), shape.getAttr('height'));
    context.fillStrokeShape(shape);
  }
});
```

**Custom Triangle Shape:**
```javascript
const triangle = new Konva.Shape({
  sceneFunc: function(context, shape) {
    context.beginPath();
    context.moveTo(20, 50);
    context.lineTo(220, 80);
    context.lineTo(100, 150);
    context.closePath();
    context.fillStrokeShape(shape);
  },
  fill: '#00D2FF',
  stroke: 'black',
  strokeWidth: 4
});
```

---

## Line and Path Shapes

### Line (Konva.Line)
Creates various line types through configuration.

**Common Properties:**
- `points`: Array of coordinates [x1, y1, x2, y2, ...] (Array<Number>)
- `stroke`: Line color (String)
- `strokeWidth`: Line width (Number)
- `lineCap`: Line end caps ('butt', 'round', 'square') (String)
- `lineJoin`: Line corner joins ('miter', 'round', 'bevel') (String)
- `dash`: Dash pattern array (Array<Number>)

**Variant-Specific Properties:**
- `tension`: Curvature for splines (Number)
- `closed`: Close shape for polygons/blobs (Boolean)
- `fill`: Fill color for closed shapes (String)

---

### Line - Simple Line
Creates basic lines connecting points.

**Example:**
```javascript
const redLine = new Konva.Line({
  points: [5, 70, 140, 23, 250, 60, 300, 20],
  stroke: 'red',
  strokeWidth: 15,
  lineCap: 'round',
  lineJoin: 'round'
});

const greenLine = new Konva.Line({
  points: [5, 70, 140, 23, 250, 60, 300, 20],
  stroke: 'green',
  strokeWidth: 2,
  lineJoin: 'round',
  dash: [33, 10]
});

const blueLine = new Konva.Line({
  points: [5, 70, 140, 23, 250, 60, 300, 20],
  stroke: 'blue',
  strokeWidth: 10,
  lineCap: 'round',
  lineJoin: 'round',
  dash: [29, 20, 0.001, 20]
});
```

**Dash Pattern Examples:**
- `[33, 10]`: 33px line, 10px gap
- `[29, 20, 0.001, 20]`: Complex pattern

---

### Line - Spline
Creates curved lines using tension property.

**Example:**
```javascript
const spline = new Konva.Line({
  points: [5, 70, 140, 23, 250, 60, 300, 20],
  stroke: 'red',
  strokeWidth: 15,
  lineCap: 'round',
  lineJoin: 'round',
  tension: 1
});
```

**Properties:**
- `tension`: Controls curvature (higher values = more curves)

---

### Line - Polygon
Creates closed polygon shapes.

**Example:**
```javascript
const polygon = new Konva.Line({
  points: [73, 192, 73, 160, 340, 23, 500, 109, 499, 139, 342, 93],
  fill: '#00D2FF',
  stroke: 'black',
  strokeWidth: 5,
  closed: true
});
```

**Properties:**
- `closed`: Must be `true` to close the shape
- `fill`: Fill color for the enclosed shape

---

### Line - Blob
Creates smooth, closed blob-like shapes.

**Example:**
```javascript
const blob = new Konva.Line({
  points: [23, 20, 23, 160, 70, 93, 150, 109, 290, 139, 270, 93],
  fill: '#00D2FF',
  stroke: 'black',
  strokeWidth: 5,
  closed: true,
  tension: 0.3
});
```

**Properties:**
- `closed`: Must be `true`
- `tension`: Controls blob curvature (e.g., 0.3)

---

## Styling and Events

### Common Styling Properties
All shapes support these styling properties:

**Fill:**
- `fill`: Solid color, gradients, or patterns

**Stroke:**
- `stroke`: Stroke color
- `strokeWidth`: Stroke width in pixels

**Shadow:**
- `shadowColor`: Shadow color
- `shadowOffsetX`: Shadow X-offset
- `shadowOffsetY`: Shadow Y-offset
- `shadowBlur`: Shadow blur radius
- `shadowOpacity`: Shadow opacity (0-1)

**Opacity:**
- `opacity`: Overall transparency (0-1)

**Example:**
```javascript
const styledShape = new Konva.Rect({
  x: 20,
  y: 20,
  width: 100,
  height: 50,
  fill: 'blue',
  stroke: 'black',
  strokeWidth: 2,
  shadowColor: 'black',
  shadowBlur: 10,
  shadowOffsetX: 5,
  shadowOffsetY: 5,
  opacity: 0.8
});
```

---

### Events
All shapes support various event types:

**User Input Events:**
- `click`, `dblclick`, `mouseover`, `mouseout`
- `touchstart`, `touchend`, `tap`, `dbltap`

**Attribute Change Events:**
- `xChange`, `yChange`, `scaleXChange`, `scaleYChange`
- `fillChange`, `strokeChange`

**Drag & Drop Events:**
- `dragstart`, `dragmove`, `dragend`

**Example:**
```javascript
circle.on('mouseover', function() {
  console.log('Mouse over circle');
});

circle.on('dragend', function() {
  console.log('Drag ended');
});

circle.on('xChange', function() {
  console.log('X position changed');
});
```

**Enable Dragging:**
```javascript
shape.draggable(true);
```

---

## Performance Optimization

### Caching
Complex shapes benefit from caching:
```javascript
shape.cache();
```

### Layer Management
Use multiple layers for better performance:
```javascript
const backgroundLayer = new Konva.Layer();
const foregroundLayer = new Konva.Layer();
```

### Animation
Konva supports two animation types:

**Konva.Tween:**
```javascript
circle.to({
  duration: 1,
  fill: 'green',
  scaleX: 2,
  scaleY: 2
});
```

**Konva.Animation:**
```javascript
const animation = new Konva.Animation(function(frame) {
  circle.rotation(circle.rotation() + 1);
}, layer);
animation.start();
```

---

## React and Vue Integration

### React Integration
Import Konva components:
```javascript
import { Stage, Layer, Circle, Rect } from 'react-konva';

const App = () => {
  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Circle x={100} y={100} radius={50} fill="red" />
        <Rect x={200} y={200} width={100} height={50} fill="blue" />
      </Layer>
    </Stage>
  );
};
```

### Vue Integration
Use vue-konva components:
```javascript
import { Stage, Layer, Circle } from 'vue-konva';

export default {
  components: { Stage, Layer, Circle },
  data() {
    return {
      stageSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      circleConfig: {
        x: 100,
        y: 100,
        radius: 50,
        fill: 'red'
      }
    };
  }
};
```

---

## API Reference Notes

For comprehensive documentation of all properties, methods, and events for each shape, please refer to the official Konva.js API Reference at:
- https://konvajs.org/api/Konva.Arc.html (replace Arc with any shape name)

Each API reference provides:
- Complete list of properties with types and default values
- All available methods with parameters and return types
- Event documentation with payload information
- Inheritance hierarchies and relationships

---

This documentation covers all the major shapes and functionality of Konva.js. Each shape offers extensive customization options and can be combined to create complex interactive graphics and animations.# Konva.js Styling and Appearance: Complete Documentation Blueprint

## Executive Summary and Scope

Konva’s styling model spans the essential appearance controls needed to build high‑fidelity, interactive canvas graphics: fills (solid, pattern, linear gradient, radial gradient), strokes (color and width), shadows, opacity, line joins and line caps, visibility, mouse cursor feedback, blending via global composite operations, and control over fill/stroke rendering order. This blueprint consolidates the definitive patterns and properties from Konva’s public documentation and API references, and it organizes them for practical use by engineers, technical writers, and UI designers.

The narrative begins with the shape model and default styling decisions (what Konva provides out of the box), then explains how to configure each styling feature (how to use properties and methods correctly), and closes with strategic guidance on interaction and performance (so what to prioritize when building real‑world canvases). Throughout, the documentation is evidence‑based and example‑driven, anchored in Konva’s tutorials and API pages. Where the documentation leaves open questions—such as exhaustive enumerations or cross‑browser caveats—these are explicitly acknowledged for future research.

Key defaults and important behaviors referenced throughout:
- Rendering order: Konva draws fill first and then stroke on top, which suits most applications; stroke‑first can be enabled via `fillAfterStrokeEnabled` on shapes[^2][^11].
- Opacity: default 1 (fully opaque), with interactive control via property and method[^3].
- Line join: default `miter`; alternatives are `bevel` and `round`[^7].
- Line cap: default `butt`; alternatives are `round` and `square`[^10].
- Blending: controlled via `globalCompositeOperation` (e.g., `xor`), with authoritative mode list and behavior on MDN[^9][^16].

Known information gaps to address in follow‑up work:
- Comprehensive enumeration of all stroke‑related properties (e.g., `lineCap`, `lineJoin`, `dash`) beyond color and width is not fully covered in the stroke tutorial[^4].
- Full list and detailed semantics of blend modes are referenced externally; MDN should be used as the canonical source[^9][^16].
- Pattern scaling (device pixel ratio, repetition, transformation) and advanced gradient features such as percentage‑based stop positions are not deeply specified in the extracted content[^5].
- Cross‑browser caveats for `globalCompositeOperation` and potential performance impacts require external validation[^9][^16].
- Event phases (capture vs. bubbling) and precise hit graph interactions for `globalCompositeOperation` require consulting the API references for authoritative details[^15].
- Default values for certain advanced styling properties (e.g., exact defaults for shadow properties) are not fully documented in the provided sources[^6].

## Konva Styling Model: Nodes, Layers, and Shapes

Konva organizes visual elements into nodes—Stage, Layers, Groups, and Shapes—with layers serving as the primary rendering surfaces. Shapes are the fundamental visible objects (rectangles, circles, lines, text, paths, and more), and each shape supports style properties that determine its fill, stroke, shadow, and opacity, among others[^12]. Konva provides prebuilt shapes for common needs and allows custom drawing via `Konva.Shape` when specialized rendering is required.

Styling in Konva is compositional. Nodes can be transformed and styled individually, with visual properties layered on top of one another through the drawing sequence. For example, a `Konva.Line` can be stroked with color and width, include shadow for depth, and use `lineJoin` to control how segments connect. Because layers map to canvas elements, styling decisions can be scoped per layer for performance and clarity[^15]. When using custom shapes, the `sceneFunc` receives the 2D context and can execute arbitrary drawing commands while still participating in Konva’s hit graph and event system[^15].

To anchor the vocabulary, the following summary table collects the major styling categories and where they are controlled.

Table 1. Styling categories overview

| Category             | Typical Properties (examples)                                                                 | Where to configure (typical)              |
|----------------------|-----------------------------------------------------------------------------------------------|-------------------------------------------|
| Fill                 | `fill`, `fillPatternImage`, `fillPatternOffset`, `fillLinearGradient*`, `fillRadialGradient*` | Shape instances; many via methods[^5]     |
| Stroke               | `stroke`, `strokeWidth`                                                                       | Shape instances; methods for updates[^4]  |
| Shadow               | `shadowColor`, `shadowBlur`, `shadowOffset`, `shadowOpacity`                                  | Shape instances; methods for updates[^6]  |
| Opacity              | `opacity` (0–1)                                                                               | Shape instances; method for updates[^3]   |
| Line Join            | `lineJoin` (`miter`, `bevel`, `round`)                                                        | Shape instances; method for updates[^7]   |
| Line Cap             | `lineCap` (`butt`, `round`, `square`)                                                         | Shape instances; method for updates[^10]  |
| Visibility           | `visible`, `hide()`, `show()`                                                                 | Shape instances; methods[^8]              |
| Mouse Cursor         | Stage container `style.cursor`                                                                | Event handlers; stage container[^13]      |
| Blend Mode           | `globalCompositeOperation`                                                                    | Node instances; API getter/setter[^9][^15] |
| Fill/Stroke Order    | `fillAfterStrokeEnabled`                                                                      | Shape instances; API property[^2][^11]    |

The rest of this guide explains how to configure each category, how the defaults interact, and how to use the corresponding methods and properties in code.

## Fill: Solid Colors, Patterns, and Gradients

Fills define the interior appearance of shapes. Konva supports four principal fill types: solid color, pattern (image), linear gradient, and radial gradient. Each can be set at instantiation and updated later via dedicated methods. The fill tutorial provides explicit property names, structures, and method signatures for dynamic updates[^5].

Solid color fills use a simple string—such as `'red'` or `'blue'`—assigned to the `fill` property and can be changed at runtime using `fill(color)`. Pattern fills leverage an image object assigned to `fillPatternImage`, with optional `fillPatternOffset` to shift the pattern relative to the shape. Linear gradients require start and end points plus color stops, while radial gradients require two circle centers (start and end) and radii plus color stops. For both gradient types, `fillLinearGradientColorStops` and `fillRadialGradientColorStops` accept arrays of offset–color pairs, where offsets range from 0 to 1.

The configuration patterns and method usage are demonstrated below, drawn directly from the tutorial:

```js
// Solid color fill
const solidRect = new Konva.Rect({ fill: 'red', width: 100, height: 100 });
solidRect.fill('blue'); // update later

// Pattern fill
const patternRect = new Konva.Rect({
  fillPatternImage: images.yoda,
  fillPatternOffset: { x: -100, y: 70 },
  width: 150,
  height: 150
});
patternRect.fillPatternImage(images.yoda); // update image
patternRect.fillPatternOffset({ x: -100, y: 70 }); // update offset

// Linear gradient fill
const linearRect = new Konva.Rect({
  width: 150,
  height: 150,
  fillLinearGradientStartPoint: { x: -50, y: -50 },
  fillLinearGradientEndPoint: { x: 50, y: 50 },
  fillLinearGradientColorStops: [0, 'green', 1, 'yellow']
});
linearRect.fillLinearGradientStartPoint({ x: -50 }); // update later
linearRect.fillLinearGradientEndPoint({ x: 50 });
linearRect.fillLinearGradientColorStops([0, 'green', 1, 'yellow']);

// Radial gradient fill
const radialCircle = new Konva.Circle({
  radius: 70,
  fillRadialGradientStartPoint: { x: 0, y: 0 },
  fillRadialGradientStartRadius: 0,
  fillRadialGradientEndPoint: { x: 0, y: 0 },
  fillRadialGradientEndRadius: 70,
  fillRadialGradientColorStops: [0, 'red', 0.5, 'yellow', 1, 'green']
});
radialCircle.fillRadialGradientColorStops([0, 'red', 0.5, 'yellow', 1, 'green']);
```

Table 2 consolidates the key properties and methods for each fill type.

Table 2. Fill types, properties, and methods

| Fill Type        | Key Properties                                                                                              | Value Structure / Examples                            | Methods for Updates                                                     |
|------------------|--------------------------------------------------------------------------------------------------------------|-------------------------------------------------------|-------------------------------------------------------------------------|
| Solid            | `fill`                                                                                                       | String: `'red'`, `'#00D2FF'`[^12]                     | `fill(color)`                                                            |
| Pattern          | `fillPatternImage`, `fillPatternOffset`                                                                      | Image object; offset `{x, y}`                         | `fillPatternImage(image)`, `fillPatternOffset({x, y})`                   |
| Linear Gradient  | `fillLinearGradientStartPoint`, `fillLinearGradientEndPoint`, `fillLinearGradientColorStops`                 | Points `{x, y}`; colorStops array `[offset, color, …]`| `fillLinearGradientStartPoint({x, y})`, `fillLinearGradientEndPoint({x, y})`, `fillLinearGradientColorStops([...])` |
| Radial Gradient  | `fillRadialGradientStartPoint`, `fillRadialGradientStartRadius`, `fillRadialGradientEndPoint`, `fillRadialGradientEndRadius`, `fillRadialGradientColorStops` | Points `{x, y}`; radii number; colorStops array `[offset, color, …]` | `fillRadialGradientColorStops([...])`                                   |

These APIs allow runtime changes that are useful for interactive UIs—switching between solid and pattern fills, animating gradient stops, or shifting pattern offsets to create motion effects. They also support bulk updates via `setAttrs`, which is helpful when initializing complex gradients in one call[^5].

A few practical considerations emerge:
- Pattern scaling, repetition, and transformations—such as `fillPatternScale` or pattern rotation—are not specified in the provided content and may require external references or custom drawing for full control.
- Gradient stop offsets in the documented examples use values like 0, 0.5, and 1. Whether percentage‑based positions are supported is not explicitly covered; treating offsets as normalized 0–1 fractions is the safe interpretation based on the examples.

## Stroke: Color and Width

Strokes outline the edges of shapes. The stroke tutorial demonstrates setting `stroke` (color) and `strokeWidth` (line thickness) at instantiation and updating them later via methods[^4]. The examples use values such as `stroke: 'black'` and `strokeWidth: 4`, and show dynamic updates like changing `stroke` to `'blue'` or `strokeWidth` to `20`.

```js
// Initial stroke configuration
const outlined = new Konva.Rect({
  stroke: 'black',
  strokeWidth: 4,
  width: 120,
  height: 80
});

// Dynamic updates
outlined.stroke('blue');
outlined.strokeWidth(20);
```

Beyond color and width, the full stroke vocabulary—such as `lineCap`, `lineJoin`, and dash patterns—is only partially covered in the stroke tutorial[^4]. However, `lineJoin` is documented in its own tutorial and `lineCap` is documented in the Arc API. See the “Line Join” and “Line Cap” sections below for authoritative defaults and accepted values[^7][^10].

Table 3 summarizes stroke basics for quick reference.

Table 3. Stroke basics

| Property       | Type             | Example Values                  | Usage Notes                                              |
|----------------|------------------|---------------------------------|----------------------------------------------------------|
| `stroke`       | String (color)   | `'black'`, `'blue'`             | Set during instantiation; update via `stroke(color)`[^4] |
| `strokeWidth`  | Number (pixels)  | `4`, `20`                       | Set during instantiation; update via `strokeWidth(n)`[^4] |

Practical implications:
- Strokes are affected by transforms and scaling of the shape; a scaled shape will render its stroke width scaled accordingly unless the application counteracts it.
- Strokes and shadows interact; when both are present, Konva may perform additional drawing steps to achieve the expected result. See the performance note in “Opacity, Shadows, Strokes, and Performance.”

## Opacity: Transparency Control

Opacity controls transparency for a shape or group, allowing overlays, fades, and subtle depth cues. The opacity tutorial specifies a numeric range of 0 to 1, with a default of 1 (fully opaque)[^3]. It can be set at instantiation and changed at runtime via the `opacity()` method.

```js
// Setting initial opacity
const translucent = new Konva.RegularPolygon({
  sides: 5,
  radius: 70,
  opacity: 0.5
});

// Dynamic update
translucent.opacity(1);
```

Group‑level opacity can be used to apply uniform transparency across multiple shapes. For scenarios where overlapping areas would compound transparency undesirably, consider strategies such as using separate layers or adjusting group opacity only when shapes do not overlap visually. The Konva tutorial also references a “Transparent Group Demo” for further illustration[^3].

Table 4. Opacity property and methods

| Property / Method | Type     | Range    | Default | Notes                                                  |
|-------------------|----------|----------|---------|--------------------------------------------------------|
| `opacity`         | Number   | 0–1      | 1       | Set at instantiation[^3]                               |
| `opacity(value)`  | Method   | 0–1      | —       | Updates transparency at runtime[^3]                    |

## Shadow: Effects and Styling

Shadows enhance depth and focus. Konva exposes four primary shadow properties, all settable at instantiation and adjustable post‑construction via methods[^6]:

- `shadowColor`: the shadow color (e.g., `'black'`, `'red'`).
- `shadowOffset`: an `{x, y}` offset object defining displacement from the shape (e.g., `{x: 10, y: 10}`).
- `shadowBlur`: a blur radius; `0` is sharp, higher values soften the shadow.
- `shadowOpacity`: transparency of the shadow, ranging from 0 to 1.

The tutorial includes an interactive example and shows how to set these for shapes such as Text and Line, while also demonstrating `lineJoin` and `lineCap` in the line example[^6].

```js
// Shadow on text
const text = new Konva.Text({
  text: 'Text Shadow!',
  fontFamily: 'Calibri',
  fontSize: 40,
  x: 20,
  y: 20,
  stroke: 'red',
  strokeWidth: 2,
  shadowColor: 'black',
  shadowBlur: 0,
  shadowOffset: { x: 10, y: 10 },
  shadowOpacity: 0.5
});

// Shadow on line
const line = new Konva.Line({
  stroke: 'green',
  strokeWidth: 10,
  lineJoin: 'round',
  lineCap: 'round',
  points: [50, 140, 250, 160],
  shadowColor: 'black',
  shadowBlur: 10,
  shadowOffset: { x: 10, y: 10 }
});

// Dynamic updates
text.shadowColor('black');
text.shadowOffset({ x: 10, y: 10 });
text.shadowBlur(0);
text.shadowOpacity(0.5);
```

Table 5. Shadow properties

| Property          | Type            | Example Values                       | Default (if known) | Notes                                                             |
|-------------------|-----------------|--------------------------------------|--------------------|-------------------------------------------------------------------|
| `shadowColor`     | String (color)  | `'black'`, `'red'`                   | Not documented     | Set at instantiation; update via `shadowColor(color)`[^6]         |
| `shadowOffset`    | Object `{x, y}` | `{x: 10, y: 10}`                     | Not documented     | Set at instantiation; update via `shadowOffset({x, y})`[^6]       |
| `shadowBlur`      | Number          | `0`, `10`                            | Not documented     | Set at instantiation; update via `shadowBlur(n)`[^6]              |
| `shadowOpacity`   | Number (0–1)    | `0.5`                                | Not documented     | Set at instantiation; update via `shadowOpacity(n)`[^6]           |

Shadows can be expensive to render, particularly when combined with strokes and complex paths; see “Opacity, Shadows, Strokes, and Performance” for guidance.

## Line Join: Line Connection Styles

Line join defines how strokes appear at joints between segments. Konva documents three values: `miter` (default), `bevel`, and `round`[^7]. The join style can be set at instantiation or changed later via the `lineJoin()` method.

- `miter`: extends outer edges to meet at a point, creating sharp corners.
- `bevel`: squares off the corner, filling the triangular gap with a straight edge.
- `round`: arcs the corner, filling with a rounded segment.

```js
const poly = new Konva.Line({
  points: [50, 140, 150, 60, 250, 140],
  closed: true,
  stroke: 'black',
  strokeWidth: 10,
  lineJoin: 'round'
});

// Update later
poly.lineJoin('bevel');
```

Table 6. Line join values and defaults

| Value   | Description                                           | Default |
|---------|-------------------------------------------------------|---------|
| `miter` | Sharp corner by extending outer edges                 | Yes[^7] |
| `bevel` | Squared‑off corner with a straight edge               | No      |
| `round` | Rounded corner filled with an arc                     | No      |

Use `round` or `bevel` to avoid excessively long miter spikes on acute angles, which can be visually distracting and potentially problematic in tight geometries.

## Line Cap: Stroke Endcap Styles

Line cap determines the appearance of stroke endpoints. Konva documents `lineCap` with accepted values `'butt'` (default), `'round'`, and `'square'`[^10]. The Arc API provides the authoritative default and method usage examples.

```js
// Initial cap style
const arc = new Konva.Arc({
  innerRadius: 40,
  outerRadius: 60,
  angle: 240,
  rotation: -120,
  stroke: 'black',
  strokeWidth: 10,
  lineCap: 'round'
});

// Updates
arc.lineCap('butt'); // default
arc.lineCap('square');
```

Table 7. Line cap values and defaults

| Value   | Description                                         | Default |
|---------|-----------------------------------------------------|---------|
| `butt`  | Stroke ends flush at the endpoint                   | Yes[^10]|
| `round` | Stroke ends rounded with a semicircle               | No      |
| `square`| Stroke ends with a square cap                       | No      |

Choosing the right cap is largely aesthetic, but it influences how edges align visually—especially where lines terminate at shapes or angled joins.

## Hide and Show: Visibility Controls

Konva provides both declarative and imperative controls for visibility: the `visible` property and the methods `hide()` and `show()`[^8]. Setting `visible` to `false` hides a shape; calling `show()` restores it. The same property can be bound to application state in reactive frameworks.

```js
// Declarative
const rect = new Konva.Rect({ visible: false, width: 120, height: 80 });

// Imperative
rect.hide();
rect.show();

// Framework usage (illustrative patterns)
visible ? <Rect ... /> : null; // React
```

Table 8. Visibility controls

| Property / Method | Behavior                             | Usage Example                     |
|-------------------|--------------------------------------|-----------------------------------|
| `visible`         | Show/hide at instantiation or update | `{ visible: false }`              |
| `hide()`          | Hide the shape programmatically      | `rect.hide()`                     |
| `show()`          | Show the shape programmatically      | `rect.show()`                     |

Visibility affects rendering and input handling; hidden nodes typically do not receive pointer events, which is desirable in most interaction models.

## Mouse Cursor: Cursor Customization

Changing the mouse cursor in Konva is accomplished by setting the `style.cursor` property of the Stage’s container element in response to pointer events, typically `mouseover` and `mouseout`[^13]. The tutorial shows how to access the stage container from the event target and switch between CSS cursor values such as `'pointer'`, `'default'`, `'crosshair'`, and `'move'`.

```js
// Vanilla Konva
pentagon1.on('mouseover', function(e) {
  e.target.getStage().container().style.cursor = 'pointer';
});
pentagon1.on('mouseout', function(e) {
  e.target.getStage().container().style.cursor = 'default';
});
```

In React and Vue, the cursor can be set either by direct DOM manipulation from event handlers or by managing a cursor state variable and passing it into the Stage component. The key insight is that the canvas container must be targeted, not the shape itself, to achieve a consistent cursor change across browsers and interactions[^13].

Table 9. Cursor styles and events

| Event       | CSS Cursor Values (examples) | Implementation Notes                                   |
|-------------|-------------------------------|--------------------------------------------------------|
| `mouseover` | `'pointer'`, `'crosshair'`, `'move'` | Access stage container via event and set `style.cursor`[^13] |
| `mouseout`  | `'default'`                   | Reset to `'default'` to restore normal cursor[^13]     |

## Blend Mode: Blending Effects

Konva uses `globalCompositeOperation` to control blending between a node and the underlying canvas content[^9]. While the tutorial demonstrates `'xor'`, the authoritative list of modes and their behaviors is maintained by MDN for Canvas 2D[^16]. Setting a blend mode alters how source pixels (the node) composite with destination pixels (what’s already drawn).

```js
// Setting blend mode on a shape or node
const blendRect = new Konva.Rect({
  x: 50,
  y: 50,
  width: 100,
  height: 100,
  fill: 'red',
  globalCompositeOperation: 'xor' // example mode
});

// Via API getter/setter
shape.globalCompositeOperation('multiply'); // change blend mode
const mode = shape.globalCompositeOperation(); // get current mode
```

Table 10. Blend modes and references

| Mode Example | Effect Summary                                      | Reference for Full List |
|--------------|------------------------------------------------------|-------------------------|
| `'xor'`      | Exclusive OR compositing                            | See MDN[^16]            |
| Others       | Source-over, multiply, screen, overlay, etc.        | See MDN[^16]            |

Important considerations:
- Blend modes affect visual rendering but do not alter Konva’s hit graph (input detection). The documentation notes that nodes remain “clickable” according to their geometry even if visually blended[^15].
- Cross‑browser behavior may vary for certain composite operations; consult MDN and conduct verification in target environments[^16].
- Performance implications depend on scene complexity and the specific mode; profile on target devices.

## Fill and Stroke Order: Layering Control

Konva’s default rendering order draws the fill first and then the stroke on top, which is appropriate for most applications[^2]. For cases where the stroke should appear beneath the fill—such as callouts where the fill should occlude part of the stroke—set `fillAfterStrokeEnabled` to `true` on the shape[^2][^11].

```js
// Default behavior: fill first, stroke on top
const defaultRect = new Konva.Rect({
  width: 140,
  height: 90,
  fill: 'yellow',
  stroke: 'black',
  strokeWidth: 8
});

// Reverse order: stroke first, fill on top
const reversedRect = new Konva.Rect({
  width: 140,
  height: 90,
  fill: 'yellow',
  stroke: 'black',
  strokeWidth: 8,
  fillAfterStrokeEnabled: true
});
```

Table 11. Fill/stroke order comparison

| Order                        | Property                    | Use‑case Rationale                                      |
|-----------------------------|-----------------------------|---------------------------------------------------------|
| Fill then Stroke (default)  | Default                     | Most applications; ensures clean edges and fills[^2]    |
| Stroke then Fill            | `fillAfterStrokeEnabled: true` | Fill occludes part of the stroke; special callouts[^2][^11] |

The ability to control rendering order matters when stroke shadows, gradient strokes, or pattern strokes interact with filled interiors.

## Styling Properties and Methods: Consolidated Reference

This consolidated index maps properties to their methods and default values where documented. It serves as a quick lookup for shape styling.

Table 12. Styling properties and methods index

| Category  | Property / Method                                   | Default / Range              | Notes                                                      |
|-----------|------------------------------------------------------|------------------------------|------------------------------------------------------------|
| Fill      | `fill`, `fill(color)`                                | String (color)               | Solid color[^5]                                            |
| Fill      | `fillPatternImage`, `fillPatternImage(image)`        | Image object                 | Pattern fill[^5]                                           |
| Fill      | `fillPatternOffset`, `fillPatternOffset({x, y})`     | `{x, y}`                     | Pattern offset[^5]                                         |
| Fill      | `fillLinearGradientStartPoint`, `fillLinearGradientStartPoint({x, y})` | `{x, y}` | Linear gradient[^5]                                        |
| Fill      | `fillLinearGradientEndPoint`, `fillLinearGradientEndPoint({x, y})`     | `{x, y}` | Linear gradient[^5]                                        |
| Fill      | `fillLinearGradientColorStops`, `fillLinearGradientColorStops([...])` | `[offset, color, …]`         | Offsets 0–1[^5]                                            |
| Fill      | `fillRadialGradientStartPoint`, `fillRadialGradientStartRadius`        | `{x, y}`, number             | Radial gradient[^5]                                        |
| Fill      | `fillRadialGradientEndPoint`, `fillRadialGradientEndRadius`            | `{x, y}`, number             | Radial gradient[^5]                                        |
| Fill      | `fillRadialGradientColorStops`, `fillRadialGradientColorStops([...])`  | `[offset, color, …]`         | Offsets 0–1[^5]                                            |
| Stroke    | `stroke`, `stroke(color)`                            | String (color)               | Stroke color[^4]                                           |
| Stroke    | `strokeWidth`, `strokeWidth(n)`                      | Number (pixels)              | Stroke width[^4]                                           |
| Shadow    | `shadowColor`, `shadowColor(color)`                  | String (color)               | Shadow color[^6]                                           |
| Shadow    | `shadowOffset`, `shadowOffset({x, y})`               | `{x, y}`                     | Shadow offset[^6]                                          |
| Shadow    | `shadowBlur`, `shadowBlur(n)`                        | Number                       | Blur radius[^6]                                            |
| Shadow    | `shadowOpacity`, `shadowOpacity(n)`                  | 0–1                          | Shadow transparency[^6]                                    |
| Opacity   | `opacity`, `opacity(value)`                          | 0–1 (default 1)              | Transparency[^3]                                           |
| Line Join | `lineJoin`, `lineJoin(value)`                        | `'miter'` (default), `'bevel'`, `'round'` | Line connection style[^7]                              |
| Line Cap  | `lineCap`, `lineCap(value)`                          | `'butt'` (default), `'round'`, `'square'` | Stroke endpoint style[^10]                            |
| Visibility| `visible`, `hide()`, `show()`                        | Boolean; methods             | Show/hide shapes[^8]                                       |
| Cursor    | Stage container `style.cursor`                       | CSS cursor values            | Event‑driven changes[^13]                                  |
| Blend     | `globalCompositeOperation`, `globalCompositeOperation(value)` | String (mode)      | Blending; full list on MDN[^9][^16]                        |
| Order     | `fillAfterStrokeEnabled`                             | Boolean (default false)      | Stroke first when true[^2][^11]                            |

## Interaction and Performance Considerations

Konva’s performance tips provide actionable guidance for complex scenes, particularly when strokes and shadows are combined[^14]. Two themes recur:

- Optimize stroke drawing. When a shape has both stroke and shadow, Konva may perform an extra internal draw to achieve the expected visual result. If stroke shadows are not required, `shadowForStrokeEnabled(false)` can be set to disable shadows on strokes, reducing draw overhead[^14].
- Be judicious with shadows and gradients. Soft shadows and complex gradients are computationally expensive; minimize blur radii and gradient complexity in large scenes. Use fewer layers if it does not compromise composability, and batch updates when animating.

Additionally, blending modes can be expensive depending on the mode and the platform; test representative scenes and measure frame times when introducing non‑standard composite operations[^16]. Finally, the hit graph is independent of visual blending: `globalCompositeOperation` does not change input detection, so nodes remain clickable based on their geometric shapes[^15].

## Appendix: Common Code Patterns

Below are common patterns for setting and updating styling properties across different categories. These snippets illustrate the typical idioms seen in Konva tutorials and are suitable starting points for application code.

```js
// Fills
const rect = new Konva.Rect({ fill: 'red' });
rect.fill('blue');

const imgRect = new Konva.Rect({ fillPatternImage: img, fillPatternOffset: { x: -50, y: 30 } });
imgRect.fillPatternOffset({ x: -30, y: 30 });

const linear = new Konva.Rect({
  fillLinearGradientStartPoint: { x: -50, y: -50 },
  fillLinearGradientEndPoint: { x: 50, y: 50 },
  fillLinearGradientColorStops: [0, 'red', 1, 'yellow']
});
linear.fillLinearGradientColorStops([0, 'green', 1, 'yellow']);

const radial = new Konva.Circle({
  radius: 70,
  fillRadialGradientStartPoint: { x: 0, y: 0 },
  fillRadialGradientStartRadius: 0,
  fillRadialGradientEndPoint: { x: 0, y: 0 },
  fillRadialGradientEndRadius: 70,
  fillRadialGradientColorStops: [0, 'red', 0.5, 'yellow', 1, 'blue']
});
radial.fillRadialGradientColorStops([0, 'red', 0.5, 'yellow', 1, 'green']);

// Stroke
const outlined = new Konva.Rect({ stroke: 'black', strokeWidth: 4 });
outlined.stroke('blue');
outlined.strokeWidth(10);

// Shadow
const label = new Konva.Text({
  text: 'Hello',
  shadowColor: 'black',
  shadowBlur: 10,
  shadowOffset: { x: 5, y: 5 },
  shadowOpacity: 0.5
});
label.shadowBlur(20);

// Opacity
const ghost = new Konva.Circle({ radius: 40, opacity: 0.6 });
ghost.opacity(0.3);

// Line join & cap
const path = new Konva.Line({ points: [10, 10, 200, 10, 200, 100], closed: true, strokeWidth: 12, lineJoin: 'round', lineCap: 'round' });
path.lineJoin('miter');
path.lineCap('butt');

// Visibility
const hidden = new Konva.Rect({ visible: false });
hidden.show();

// Cursor
shape.on('mouseover', (e) => e.target.getStage().container().style.cursor = 'pointer');
shape.on('mouseout', (e) => e.target.getStage().container().style.cursor = 'default');

// Blend mode
shape.globalCompositeOperation('xor');
const mode = shape.globalCompositeOperation();

// Fill/stroke order
const callout = new Konva.Rect({ fill: 'white', stroke: '#333', strokeWidth: 6, fillAfterStrokeEnabled: true });
```

## Conclusion

Konva’s styling features provide a practical balance of simplicity and power. Fills, strokes, shadows, and opacity cover the majority of visual needs; line joins and caps add fine control over edge quality; visibility and cursor controls enable polished interactivity; blend modes introduce rich compositing effects; and fill/stroke ordering resolves nuanced layering scenarios. While some topics—such as exhaustive stroke properties, pattern scaling, and blend mode behaviors—require external references, the patterns and defaults documented here equip teams to implement robust, performant canvases. As applications scale, it is essential to consider the performance guidance around strokes, shadows, and blending, and to verify cross‑browser composite behavior during testing.

---

## References

[^1]: Fill and stroke order demo | Konva - JavaScript Canvas 2d Library. https://konvajs.org/docs/styling/Fill_Stroke_Order.html  
[^2]: Konva.Shape | Konva - JavaScript Canvas 2d Library (fillAfterStrokeEnabled). https://konvajs.org/api/Konva.Shape.html#fillAfterStrokeEnabled  
[^3]: HTML5 Canvas Set Shape Opacity Tutorial - Konva.js. https://konvajs.org/docs/styling/Opacity.html  
[^4]: HTML5 Canvas Set Shape Stroke Color and Width Tutorial - Konva.js. https://konvajs.org/docs/styling/Stroke.html  
[^5]: HTML5 Canvas Set Fill Tutorial | Konva - JavaScript Canvas 2d Library. https://konvajs.org/docs/styling/Fill.html  
[^6]: HTML5 Canvas Shadows Tutorial - Konva.js. https://konvajs.org/docs/styling/Shadow.html  
[^7]: HTML5 Canvas Line Join Tutorial - Konva.js. https://konvajs.org/docs/styling/Line_Join.html  
[^8]: HTML5 Canvas Hide and Show Shape Tutorial - Konva. https://konvajs.org/docs/styling/Hide_and_Show.html  
[^9]: JavaScript Canvas 2d Library | Blend Mode - Konva. https://konvajs.org/docs/styling/Blend_Mode.html  
[^10]: Konva.Arc | Konva - JavaScript Canvas 2d Library (lineCap). https://konvajs.org/api/Konva.Arc.html  
[^11]: HTML5 Canvas Set Shape Opacity Tutorial - Konva.js (mentions Transparent Group Demo and related guidance). https://konvajs.org/docs/styling/Opacity.html  
[^12]: Konva Framework Overview | Konva - JavaScript Canvas 2d Library. https://konvajs.org/docs/overview.html  
[^13]: HTML5 Canvas Change Mouse Cursor Style - Konva.js. https://konvajs.org/docs/styling/Mouse_Cursor.html  
[^14]: HTML5 Canvas All Konva performance tips list. https://konvajs.org/docs/performance/All_Performance_Tips.html  
[^15]: Konva.Stage | Konva - JavaScript Canvas 2d Library (globalCompositeOperation and hit graph notes). https://konvajs.org/api/Konva.Stage.html  
[^16]: MDN: CanvasRenderingContext2D.globalCompositeOperation. https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation# Konva.js Event Handling: Comprehensive Documentation Blueprint

## Executive Summary

Konva’s event model brings a familiar, DOM-like programming model to the HTML5 Canvas. At its core, the framework emits mouse, touch, and pointer events for nodes such as shapes, groups, layers, and the stage. Developers bind handlers with `node.on(type, handler)`, remove them with `node.off(type)`, and can programmatically dispatch events via `node.fire(type, data)`. Events bubble up the node hierarchy and can be stopped at any level by setting `evt.cancelBubble = true`. Two facilities shape hit detection: image-level optimization with `drawHitFromCache()` and custom hit areas via `hitFunc` and `hitStrokeWidth`. Cross-input behavior is addressed through paired mouse/touch bindings or unified pointer events. Finally, delegation to parent containers, listening controls, and stage-level handling for empty space provide scalable strategies for complex scenes. This document explains the “what,” “how,” and “so what” of Konva events with pragmatic patterns, platform considerations, and actionable guidance grounded in Konva’s published tutorials and API references.[^1][^2]

---

## Event Fundamentals and Binding

Konva exposes a uniform method `on(evtStr, handler)` across nodes to attach event handlers. The call is made on the node that should “listen” for user input. In practice, you can bind to the stage, layers, groups, and shapes. The handler receives an event object (`evt`) whose `target` refers to the node that originated the event. For position-sensitive interactions, use `stage.getPointerPosition()` to retrieve coordinates within the stage.[^1][^4][^5]

Konva supports a wide range of event families:
- Mouse: `mouseover`, `mouseout`, `mouseenter`, `mouseleave`, `mousemove`, `mousedown`, `mouseup`, `wheel`, `click`, `dblclick`
- Touch: `touchstart`, `touchmove`, `touchend`, `tap`, `dbltap`
- Pointer: `pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `pointerover`, `pointerenter`, `pointerout`, `pointerleave`, `pointerclick`, `pointerdblclick`
- Drag: `dragstart`, `dragmove`, `dragend`
- Transform: `transformstart`, `transform`, `transformend`[^1][^3][^4][^5]

Patterns of use vary: mouse events for desktop hover/press, touch events for mobile taps and moves, and pointer events to unify handling across devices. The following table summarizes the supported families and typical use cases.

### Table 1. Event Types and Use Cases

| Family   | Representative Types                                                                 | Typical Use Case                                             |
|----------|---------------------------------------------------------------------------------------|--------------------------------------------------------------|
| Mouse    | mouseover, mouseout, mousemove, mousedown, mouseup, wheel, click, dblclick            | Hover feedback, drag, zoom with wheel, click/tap selection  |
| Touch    | touchstart, touchmove, touchend, tap, dbltap                                          | Mobile tap/drag, double-tap gestures                        |
| Pointer  | pointerdown, pointermove, pointerup, pointercancel, pointerover/enter/out/leave, pointerclick, pointerdblclick | Unified input across mouse/touch/stylus                     |
| Drag     | dragstart, dragmove, dragend                                                          | Native drag behaviors on draggable nodes                    |
| Transform| transformstart, transform, transformend                                               | Transformer interactions (resize/rotate)                    |

To make this concrete, the code below binds hover and press events to a triangle and a circle, and updates a text node with pointer coordinates on `mousemove`.[^1]

```javascript
import Konva from 'konva';

const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight,
});

const layer = new Konva.Layer();
const text = new Konva.Text({
  x: 10, y: 10, fontFamily: 'Calibri', fontSize: 24, text: '', fill: 'black'
});
const triangle = new Konva.RegularPolygon({
  x: 80, y: 120, sides: 3, radius: 80,
  fill: '#00D2FF', stroke: 'black', strokeWidth: 4
});
const circle = new Konva.Circle({
  x: 230, y: 100, radius: 60, fill: 'red', stroke: 'black', strokeWidth: 4
});

layer.add(triangle, circle, text);
stage.add(layer);

function writeMessage(message) {
  text.text(message);
  layer.batchDraw();
}

triangle.on('mouseover', () => writeMessage('Mouseover triangle'));
triangle.on('mouseout', () => writeMessage('Mouseout triangle'));
triangle.on('mousemove', () => {
  const mousePos = stage.getPointerPosition();
  writeMessage(`x: ${mousePos.x}, y: ${mousePos.y}`);
});

circle.on('mouseover', () => writeMessage('Mouseover circle'));
circle.on('mouseout', () => writeMessage('Mouseout circle'));
circle.on('mousedown', () => writeMessage('Mousedown circle'));
circle.on('mouseup', () => writeMessage('Mouseup circle'));
```

Framework bindings follow the same model. In React and Vue, you attach handler props to Konva components (e.g., `onMouseover`, `@mousemove`) while Konva handles the underlying binding.[^1][^2]

---

## Listening Controls and Event Delegation

Konva offers precise control over event “listening.” The `listening` config property enables or disables event emission for a node. Changes require redrawing the hit graph on affected layers via `layer.drawHit()` for the change to take effect.[^14]

The example below dynamically toggles listening for an oval and refreshes its hit region:

```javascript
// Disable listening on an existing node
oval.setListening(false);
// Re-enable listening
oval.setListening(true);

// Redraw hit graph for the layer after changes
layer.drawHit();
```

Event delegation leverages this model at scale. Instead of binding handlers to many child shapes, attach a single handler to a parent (e.g., a layer) and use `evt.target` to identify the actual child involved.[^9][^15] This reduces listener overhead and simplifies maintenance when children are numerous or dynamic.

```javascript
// Delegate clicks from all children to the layer
layer.on('click', (evt) => {
  const shape = evt.target; // the actual child clicked
  // Route behavior based on shape
});
```

To make delegation effective, use stable identifiers (e.g., `name()`) and compare types (e.g., `getClassName()`). For large scenes—such as thousands of nodes—delegation from the stage or layer is the recommended pattern.[^15]

### Table 2. Delegation Patterns

| Parent Node | Typical Child Shapes | evt.target Usage                                   |
|-------------|----------------------|----------------------------------------------------|
| Layer       | Rects, Circles, Stars| Inspect `evt.target` to identify the clicked shape |
| Stage       | All layers           | Handle “empty space” clicks and route to children  |

---

## Propagation Control: Cancel Bubble and Stage-Level Events

Konva events bubble up the node tree, much like the DOM. To stop an event from propagating to parents, set `evt.cancelBubble = true` within a handler. This is useful to prevent duplicate handling when a parent also listens for the same event.[^6]

```javascript
circle.on('click', (evt) => {
  // Handle circle click
  evt.cancelBubble = true; // Layer/Stage will not receive this click
});

layer.on('click', () => {
  // This will not fire for clicks on the circle when cancelBubble is true
});
```

Not all events originate from shapes. When interaction occurs on empty canvas space, the event is delivered directly to the stage, not the layer. A common pattern is to check if `evt.target === evt.target.getStage()` to detect background clicks on the stage.[^7]

```javascript
stage.on('click', (evt) => {
  if (evt.target === evt.target.getStage()) {
    // Clicked empty space
  }
});
```

### Table 3. Propagation and Stage Behavior

| Scenario                                   | Recommended Technique                 |
|--------------------------------------------|---------------------------------------|
| Child event should not bubble              | `evt.cancelBubble = true`             |
| Distinguish empty space vs. shape click    | Check `evt.target === evt.target.getStage()` |
| Manage many children with shared handling  | Delegate to parent (Layer or Stage)   |

---

## Cross-Platform Input: Desktop & Mobile Pairings vs. Pointer Events

For consistent behavior across desktop and mobile, pair mouse and touch events when binding. For example, use `'mousedown touchstart'` and `'mouseup touchend'` on the same handler to ensure both platforms trigger your logic. The same approach applies to `'dblclick dbltap'` for double actions.[^8]

Konva and modern browsers also support pointer events as a unified input model. Binding to `pointerdown`, `pointermove`, `pointerup`, and related types lets you handle mouse, touch, and stylus with a single handler set.[^3]

### Table 4. Event Pairings vs. Pointer Events

| Approach              | Binding Example                            | Pros                                      | Cons                                      |
|-----------------------|--------------------------------------------|-------------------------------------------|-------------------------------------------|
| Paired Mouse/Touch    | `'mousedown touchstart'`, `'mouseup touchend'`, `'dblclick dbltap'` | Simple, explicit platform coverage        | Slightly more verbose; two types per action |
| Pointer Events        | `'pointerdown'`, `'pointermove'`, `'pointerup'`, `'pointerclick'`    | Unified handler set across devices        | Requires modern browser support            |

Selecting between the two is a trade-off between explicitness and simplicity. Pairing is ideal when you want clear, platform-specific semantics. Pointer events reduce duplication and can simplify code for teams targeting modern browsers.[^3][^8]

---

## Pointer Events

Pointer event bindings mirror mouse/touch handlers. The example below binds `pointermove` to a triangle and displays coordinates, which is directly analogous to `mousemove` or `touchmove` for position feedback.[^3]

```javascript
triangle.on('pointermove', () => {
  const pos = stage.getPointerPosition();
  writeMessage(`x: ${pos.x}, y: ${pos.y}`);
});
```

Supported pointer types include `pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `pointerover`, `pointerenter`, `pointerout`, `pointerleave`, `pointerclick`, and `pointerdblclick`.[^3]

### Table 5. Pointer Event Types

| Type             | When It Fires                                |
|------------------|-----------------------------------------------|
| pointerdown      | Input begins (mouse button, touch, stylus)    |
| pointermove      | Input moves                                   |
| pointerup        | Input ends                                    |
| pointercancel    | Input is canceled                             |
| pointerover      | Pointer enters the element’s hit area         |
| pointerenter     | Pointer enters (no bubbling)                  |
| pointerout       | Pointer leaves the element’s hit area         |
| pointerleave     | Pointer leaves (no bubbling)                  |
| pointerclick     | Click produced by pointer                     |
| pointerdblclick  | Double click produced by pointer              |

---

## Touch & Mobile Events and Mobile Scrolling

Konva supports mobile touch events—`touchstart`, `touchmove`, `touchend`, `tap`, `dbltap`—and drag events (`dragstart`, `dragmove`, `dragend`). Bind them just like mouse events, using `on()` on the target node.[^11]

```javascript
circle.on('touchstart', () => writeMessage('touchstart circle'));
circle.on('touchend', () => writeMessage('touchend circle'));
```

By default, Konva prevents the default behavior of pointer interactions with a stage to avoid unintended page scrolling during shape manipulation. If you want the browser’s native scrolling within the page to resume for a specific shape, set `preventDefault: false` on that shape’s config.[^10]

### Table 6. Touch Events and Browser Defaults

| Topic                     | Guidance                                                           |
|---------------------------|--------------------------------------------------------------------|
| Supported touch events    | `touchstart`, `touchmove`, `touchend`, `tap`, `dbltap`             |
| Drag on mobile            | `dragstart`, `dragmove`, `dragend`                                |
| Default scroll prevention | Konva prevents page scroll on stage interactions                   |
| Overriding scroll         | Set `preventDefault: false` on specific shapes when needed         |

---

## Image Events and Custom Hit Regions

By default, Konva triggers image events for all pixels within the image’s bounding box, including transparent areas. `drawHitFromCache()` generates a precise hit region that respects non-transparent pixels, improving usability for images with odd shapes or transparency.[^12]

The typical sequence is:
1. Load the image into a `Konva.Image`.
2. Call `cache()` to prepare internal canvases.
3. Call `drawHitFromCache()` to compute a pixel-accurate hit region.
4. Bind events (e.g., `mouseover`) to the image.

```javascript
const imageObj = new Image();
imageObj.onload = () => {
  const lion = new Konva.Image({
    x: 320, y: 50, image: imageObj, width: 200, height: 200
  });
  lion.cache();
  lion.drawHitFromCache();

  lion.on('mouseover', () => writeMessage('mouseover lion (precise hit)'));
  lion.on('mouseout', () => writeMessage(''));
  layer.add(lion);
  layer.batchDraw();
};
imageObj.src = 'https://konvajs.org/assets/lion.png';
```

Beyond images, Konva shapes expose `hitFunc` and `hitStrokeWidth` to customize hit detection:
- `hitFunc(context, shape)`: Draw a custom hit area using the Canvas 2D API via `Konva.Context`.
- `hitStrokeWidth`: Increase or customize the stroke hit area without rewriting `hitFunc`.[^13]

Examples:

```javascript
// Using hitFunc to define a circular hit area around a star
star.hitFunc((context, shape) => {
  context.beginPath();
  context.arc(0, 0, 70, 0, Math.PI * 2, true);
  context.closePath();
  context.fillStrokeShape(shape);
});

// Using hitStrokeWidth to enlarge stroke hit area
// (useful for lines or thin shapes)
lineConfig.hitStrokeWidth = 20;
```

Custom hit regions improve interaction fidelity (e.g., larger invisible handles for precise tapping) and can simplify hit logic for performance.[^13]

### Table 7. Image vs. Shape Hit Regions

| Technique               | When to Use                                         | Notes                                              |
|-------------------------|------------------------------------------------------|----------------------------------------------------|
| `drawHitFromCache()`    | Images with transparent pixels                       | Requires same-origin or proper CORS; cache first   |
| `hitFunc()`             | Complex shapes needing custom hit areas              | Draw hit region with Konva.Context                 |
| `hitStrokeWidth`        | Stroke-based shapes (e.g., lines)                    | Simpler than `hitFunc` for stroke expansion        |

---

## Keyboard Events on Canvas

Konva does not provide built-in keyboard events. To implement keyboard handling on a canvas-based UI, make the stage container focusable, focus it (via user click or programmatically), and attach `keydown`/`keyup` listeners to the container. Use `e.preventDefault()` to stop page scrolling when moving shapes with arrow keys.[^16]

```javascript
// Make container focusable and focused
stage.container().tabIndex = 1;
stage.container().focus();

// Arrow-key movement
const DELTA = 4;
stage.container().addEventListener('keydown', (e) => {
  if (e.keyCode === 37) circle.x(circle.x() - DELTA);      // Left
  else if (e.keyCode === 38) circle.y(circle.y() - DELTA); // Up
  else if (e.keyCode === 39) circle.x(circle.x() + DELTA); // Right
  else if (e.keyCode === 40) circle.y(circle.y() - DELTA); // Down
  e.preventDefault();
});
```

### Table 8. Arrow Key Codes

| Key          | keyCode |
|--------------|---------|
| Left Arrow   | 37      |
| Up Arrow     | 38      |
| Right Arrow  | 39      |
| Down Arrow   | 40      |

---

## Fire Events (Manual Triggering)

Konva supports programmatic event emission via `node.fire(type, data)`. You can fire built-in events (e.g., `'click'`, `'mouseover'`) or custom events (e.g., `'customevent'`). Passing `{ bubbles: true }` causes the event to bubble up the node hierarchy.[^17]

```javascript
// Fire a custom event
circle.fire('customevent', { bubbles: true });

// Fire a built-in event programmatically
circle.fire('click', {});
```

Use cases include testing, simulating user actions, and decoupling UI triggers from application logic. Prefer built-in events for maintainability and debugging; custom events are best reserved for application-level communication.[^17]

---

## Remove Event Listeners

To remove event listeners, use `node.off(evtStr)`. Calling `off('click')` removes all handlers for `'click'` on that node. To remove all listeners for multiple types, call `off()` with no arguments.[^18]

```javascript
// Remove all 'click' handlers on circle
circle.off('click');

// Remove all handlers for multiple types
circle.off('mousedown mouseup');

// Remove all listeners on the node (all types)
circle.off();
```

### Table 9. off() Scenarios

| Call                        | Effect                                        |
|----------------------------|-----------------------------------------------|
| `node.off('click')`        | Removes all `'click'` handlers                |
| `node.off('a b c')`        | Removes handlers for types `a`, `b`, `c`      |
| `node.off()`               | Removes all listeners for all event types     |

---

## Remove by Name (Node Naming and Removal Context)

Konva nodes support naming via `name('...')`. While `removeName(name)` is documented in the API and removes a name from a node, event cleanup remains type-based via `off(...)`. In practice, name-based management is useful for identifying nodes (e.g., in delegation), and type-based cleanup is used for listeners. Treat `removeName` as part of node metadata management, not event listener removal.[^19]

---

## Multi-Event Binding

Konva allows binding multiple event types to a single handler by passing a space-delimited string to `on()`. The handler executes for each listed event type.[^20]

```javascript
circle.on('mouseover mousedown mouseup', (evt) => {
  writeMessage(`event: ${evt.type}`);
});
```

This reduces repetition and keeps behavior coherent across related events. In frameworks, the same logic can be expressed by attaching multiple props, but the single `on(...)` call remains concise and uniform across environments.[^20]

---

## Stage-Level and Empty-Space Interactions

When a user clicks an area of the canvas not covered by a shape, the event is delivered to the stage directly, not the layer. Detect background interactions by comparing `evt.target` to the stage and take appropriate action—e.g., clear selection, start a marquee, or ignore.[^7]

```javascript
stage.on('click', (evt) => {
  if (evt.target === evt.target.getStage()) {
    // Empty space clicked
  }
});
```

This pattern complements delegation and helps implement global behaviors without attaching handlers to every child.

---

## Implementation Patterns and Best Practices

- Prefer pointer events when your target browsers support them; otherwise, pair mouse/touch for explicit coverage.[^3][^8]
- Use event delegation on containers for scalable scenes; reserve direct bindings for high-priority or specialized behaviors.[^9][^15]
- Make the stage container focusable for keyboard interactions and prevent default behavior when moving shapes with arrow keys.[^16]
- For image-heavy interfaces, leverage `drawHitFromCache()` to respect transparency and `hitFunc`/`hitStrokeWidth` to fine-tune shapes’ interactive areas.[^12][^13]
- Control whether nodes emit events via `listening` and call `layer.drawHit()` after changes to refresh the hit graph.[^14]
- Use `evt.cancelBubble` judiciously to isolate handling and avoid unintended parent reactions.[^6]
- Be mindful of Konva’s default prevention of page scroll during stage interactions; override only when necessary using `preventDefault: false`.[^10]

---

## Information Gaps and Scope Notes

- Keyboard events are not built into Konva; this documentation explains container focus and standard DOM listeners rather than a Konva-native keyboard API.[^16]
- Named event removal via `off(name)` is not documented; `off(evtStr)` is supported, and `removeName(name)` pertains to node naming, not listener removal.[^18][^19]
- Comprehensive performance metrics for event delegation are not provided; guidance is conceptual, emphasizing listener reduction.[^9][^15]
- Event propagation nuances beyond `cancelBubble` (e.g., capture phase) are not detailed in the sources; Konva’s tutorials emphasize bubble behavior.[^6]
- Some mobile scrolling nuances and gesture specifics (e.g., complex multi-touch gestures beyond `touchstart/move/end`) are referenced in demos but not formally specified in the base event tutorials.[^10][^11]

---

## References

[^1]: HTML5 Canvas Shape Events (Binding Events). https://konvajs.org/docs/events/Binding_Events.html  
[^2]: Konva.Node API Reference. https://konvajs.org/api/Konva.Node.html  
[^3]: HTML5 Canvas Pointer Events Tutorial. https://konvajs.org/docs/events/Pointer_Events.html  
[^4]: Konva.Stage API Reference. https://konvajs.org/api/Konva.Stage.html  
[^5]: Konva.Container API Reference. https://konvajs.org/api/Konva.Container.html  
[^6]: Cancel Event Bubble Propagation in Konva. https://konvajs.org/docs/events/Cancel_Propagation.html  
[^7]: HTML5 Canvas Special Stage Events. https://konvajs.org/docs/events/Stage_Events.html  
[^8]: Desktop and Mobile Events Support. https://konvajs.org/docs/events/Desktop_and_Mobile.html  
[^9]: Event Delegation with Konva. https://konvajs.org/docs/events/Event_Delegation.html  
[^10]: Mobile Scrolling and Native Events. https://konvajs.org/docs/events/Mobile_Scrolling.html  
[^11]: Mobile Touch Events Tutorial. https://konvajs.org/docs/events/Mobile_Events.html  
[^12]: Image Events with Konva. https://konvajs.org/docs/events/Image_Events.html  
[^13]: Custom Hit Detection Function (hitFunc & hitStrokeWidth). https://konvajs.org/docs/events/Custom_Hit_Region.html  
[^14]: Listen or Don't Listen to Events (listening property). https://konvajs.org/docs/events/Listen_for_Events.html  
[^15]: Interactive Scatter Plot with 20000 Nodes (Event Delegation Demo). https://konvajs.org/docs/sandbox/20000_Nodes.html  
[^16]: Keyboard Events on Canvas with Konva. https://konvajs.org/docs/events/Keyboard_Events.html  
[^17]: Fire Events with Konva. https://konvajs.org/docs/events/Fire_Events.html  
[^18]: Remove Event Listener with Konva (off method). https://konvajs.org/docs/events/Remove_Event.html  
[^19]: Konva.Path API Reference (includes removeName). https://konvajs.org/api/Konva.Path.html  
[^20]: Multi-Event Binding Tutorial. https://konvajs.org/docs/events/Multi_Event.html# Konva.js Drag and Drop: A Complete Implementation and API Guide

## Executive Summary and Scope

Konva.js provides built-in drag functionality that works consistently across desktop and mobile without extra DOM plumbing. Enabling drag is a single property toggle; constraining motion, listening to lifecycle events, and simulating drop semantics are straightforward patterns built on top of Konva’s Node API. This guide consolidates how to implement drag and drop across core node types (images, groups, lines, and the stage), the events that drive interaction logic, practical constraints using simple and complex bounds, simulated drop events for target detection, and performance optimizations for smooth, scalable experiences. It also maps drag-related APIs and summarizes framework-specific practices for React and Vue.

What Konva includes natively are drag events and control over whether a node is draggable. What it does not include are native DOM-like drop events. Instead, Konva demonstrates a robust approach to simulate drop, dragenter, dragleave, and dragover using a temporary drag layer and intersection checks against main-layer content. Developers can adopt this pattern to implement precise drop targets with visual feedback and reliable hit testing.[^1][^3][^9]

How to use this guide:
- Fundamentals: Learn to enable drag, handle events, and give users visual cues like cursor changes.[^1][^3]
- Node-specific guidance: Apply patterns for images, groups, lines, and stage nodes.[^2][^4][^5][^6]
- Constraints and behavior: Use simple bounds or complex functions for constrained, snapping, and collision-aware dragging.[^7][^8][^12][^13]
- Drop simulation: Detect targets and fire simulated events with a temp layer.[^9]
- API reference: Adopt the full drag-related Node API for precise control.[^10]
- Performance: Adopt best practices to keep drag smooth with many shapes.[^11]
- Mobile and framework integration: Understand event coverage and practicalities in React/Vue.[^14][^15][^16]

Information gaps to be aware of:
- No native drop events; only simulated patterns are provided.[^9]
- Fine-grained z-index management during drag for all node types is covered implicitly through layer patterns but not exhaustively documented.
- A comprehensive global event reference for drag across all shape types is not centralized here; key events are covered.
- Full source code for all sandbox demos (for example, all snapping details) is not reproduced; patterns and principles are summarized.

---

## Enabling Drag: Fundamentals

Konva drag behavior is enabled by setting the draggable flag on a node or by calling the draggable() method. Once enabled, drag events—dragstart, dragmove, and dragend—fire at appropriate points in the interaction lifecycle. For clarity and user feedback, pair draggable nodes with cursor styling on hover. While the exact signature of the foundational “Drag and Drop” tutorial page failed to extract, the accompanying code examples clearly demonstrate these fundamentals.[^1][^3]

- Enable drag: set draggable: true in the node’s config or call node.draggable(true).
- Listen to lifecycle events: node.on('dragstart' | 'dragmove' | 'dragend', handler).
- Provide user feedback: change the cursor on mouseover/mouseout for intuitive affordance.[^1][^3]

### Enabling and Detecting Drag Events

Konva’s event model uses node.on(type, handler). For drag:
- dragstart fires once when dragging begins—use it to set initial state, raise z-order, or update UI.
- dragmove fires repeatedly during drag—use it for continuous updates, bounds enforcement, or collision feedback.
- dragend fires once when dragging finishes—use it to persist position, run cleanup, or trigger simulated drop logic.[^3]

This consistent lifecycle is the backbone for real-time constraints and visual feedback.

### Cursor Styling for Visual Feedback

Visual cues reduce friction. Konva examples commonly set document.body.style.cursor to 'pointer' on mouseover and 'default' on mouseout. For containers like groups, a 'move' cursor can signal that the entire group is draggable.[^1][^4][^5] This pattern works across frameworks and clearly indicates interactivity.

---

## Dragging Specific Node Types

Dragging works across Konva nodes with consistent semantics, but each node type has nuances.

- Image: Set draggable: true on a Konva.Image; dragging translates the image by x/y while the underlying image data remains unchanged.[^2]
- Group: Drag a group to move all children together; the group’s x/y change, not the children’s.[^4]
- Line: Dragging a Konva.Line changes its x/y position, not the points array.[^5]
- Stage: Make the entire stage draggable; interaction with any portion of the stage initiates drag.[^6]

To summarize these differences at a glance, Table 1 captures the key semantics.

Table 1. Drag semantics by node type

| Node Type | Draggable Configuration | What Changes During Drag | Typical UX Cues |
|---|---|---|---|
| Image | draggable: true or node.draggable(true) | x/y translate; image data unchanged | 'pointer' cursor on hover; optional drag layer for performance[^2][^11] |
| Group | draggable: true on group | group x/y; child positions unchanged relative to group | 'move' cursor on hover; drag group as a unit[^4] |
| Line | draggable: true on line | x/y translate; points array unchanged | 'pointer' on hover; thick stroke aids selection[^5] |
| Stage | draggable: true on stage | stage position (pan); content moves as a whole | Indicate panning; consider bounded stage for navigation[^6][^20] |

As shown in Table 1, the fundamental semantics are consistent: nodes move via x/y translation. The conceptual differences—images vs lines vs containers vs stage—are about what remains invariant (image data, line points, child local coordinates) and the natural UX that follows.

### Drag an Image

Images are made draggable via draggable: true. Cursor changes on hover improve discoverability. For performance with many shapes, use a dedicated drag layer and move the image into it on dragstart, returning it on dragend. This isolates redraws and keeps motion smooth.[^2][^11]

### Drag a Group

Groups encapsulate children. Set group.draggable(true) to drag the collection as a unit; its x/y change while children’s relative positions remain intact. Use 'move' cursor on hover to signal the container’s draggability. Z-order adjustments can be applied on dragstart (for example, moveToTop) to keep the group above others during interaction.[^4][^19]

### Drag a Line

Lines are draggable like other shapes. Dragging updates x/y, not points. This preserves the intended geometry while allowing the line to be repositioned in the scene. A thicker stroke improves hit-testing and user control, and hover cursors can be applied for feedback.[^5]

### Drag a Stage

Stages can be draggable. When enabled, any part of the stage can initiate a pan. This is useful for large canvases and scrollable or zoomable scenes. Stage dragging is conceptually distinct from dragging nodes within a layer: the entire content moves, which can be bounded or combined with scrolling/zoom patterns.[^6][^20]

---

## Drag Events Lifecycle and Interaction

Konva’s drag lifecycle is split across three events. Use them to structure state and feedback:

- dragstart: Initialize state, capture starting positions, raise z-order, or allocate resources.
- dragmove: Apply continuous logic—bounds constraints, snapping, collision detection, or dynamic highlighting.
- dragend: Persist final positions, run cleanup, and emit simulated drop events.[^3]

Table 2 summarizes recommended uses.

Table 2. Drag event lifecycle and recommended uses

| Event | Frequency | Recommended Use Cases |
|---|---|---|
| dragstart | Once at drag start | Raise z-order; save origin; update UI status; move to drag layer |
| dragmove | Repeated during drag | Enforce bounds; snap to grid/guides; compute intersections and highlight; live status updates |
| dragend | Once at drag end | Persist position; cleanup; move back to main layer; fire simulated drop |

This event-driven approach yields predictable behavior and clean separation of concerns.[^3]

---

## Simple Drag Constraints (Simple Drag Bounds)

Many UIs need to constrain motion to an axis or a region. Konva demonstrates enforcing constraints by overriding position during dragmove. Simple bounds can restrict to horizontal or vertical axes, or clamp within a rectangular region. Developers may use either relative x/y assignment or absolutePosition(), depending on scene transforms and nested containers.[^7][^10]

Practical patterns include:
- Horizontal-only drag: lock y to a fixed value while updating x.
- Vertical-only drag: lock x to a fixed value while updating y.
- Box constraints: clamp x/y within min/max boundaries.
- Alternative to direct assignment: set dragBoundFunc on the node for reusable constraints (for example, vertical-only drag by returning an absolute position with fixed x).[^10]

Table 3 outlines simple bound patterns and their trade-offs.

Table 3. Simple bound patterns

| Constraint | Pattern Summary | Pros | Cons | Use When |
|---|---|---|---|---|
| Horizontal-only | In dragmove, set node.y(constant) | Simple; clear intent | Tightly couples logic to event handler | Toolbars, sliders |
| Vertical-only | In dragmove, set node.x(constant) | Simple; clear intent | Same as above | Navigation rails |
| Box bounds | Clamp node.x()/y() or absolutePosition() to min/max | Flexible; keeps nodes in view | Requires boundary math | Canvas limits, panels |
| dragBoundFunc | Return constrained absolute position | Reusable; encapsulated | Slightly more abstract | Shared across components |

The choice depends on complexity and reuse. dragBoundFunc centralizes constraint logic for reuse across frameworks; dragmove overrides offer rapid iteration within a specific component.[^7][^10]

---

## Complex Drag Bounds and Snapping

When simple bounds are insufficient, Konva patterns demonstrate constraining motion to geometric regions and coupling drag with snapping to guides. The key is to compute based on absolutePosition() so constraints remain correct under transforms and nesting.

- Constrain below a horizontal line: enforce y >= threshold in dragmove.[^8]
- Constrain within a circle: compute distance from the circle center; if beyond radius, scale position back to the boundary and adjust both x and y.[^8]
- Snapping to edges and other objects: calculate offsets to stage edges and adjacent shapes; snap when within a tolerance.[^12]

Table 4 summarizes complex constraint types.

Table 4. Complex constraint types

| Region / Logic | Core Computation | Outcome |
|---|---|---|
| Below horizontal line | Compare absolute y to threshold; clamp | Node stays at or below line |
| Inside circle | Distance from center; scale position to radius boundary | Node stays within circular region |
| Snapping to edges | Compute deltas to stage/object edges; apply tolerance | Node snaps to guides when close |

These patterns translate directly to React/Vue by binding dragmove handlers or assigning dragBoundFunc in configuration. They are the building blocks for precision interactions like CAD-like placement and diagram editors.[^8][^12]

### Snapping to Stage and Object Edges

The snapping demo shows snapping to stage edges (0, midpoints, and full width/height) and to the edges of other objects, using a small tolerance (for example, GUIDELINE_OFFSET = 5). During dragmove, compute the nearest guides and adjust the node’s position if within the tolerance.[^12] This reduces cognitive load and improves alignment without requiring pixel-perfect placement.

---

## Simulating Drop Events and Drop Targets

Konva does not natively implement DOM drop events (drop, dragenter, dragleave, dragover). Instead, it demonstrates a reliable simulation pattern:

- Use a temporary drag layer that sits above the main layer during drag.
- On dragstart, move the dragging node to the temp layer.
- During dragmove, check for intersections against main-layer shapes with layer.getIntersection(pos). Based on enter/leave transitions, manually fire simulated dragenter, dragleave, and dragover on the detected targets to update visuals (for example, change fill).
- On dragend, perform a final intersection check; if a target is found, fire simulated drop on it. Move the dragging node back to the main layer.[^9]

Table 5 maps simulation steps to actions.

Table 5. Drop event simulation steps

| Phase | Action | Implementation Notes |
|---|---|---|
| dragstart | Move node to temp layer | Ensures correct z-order and avoids self-hits |
| dragmove | Detect intersection; update target visuals; fire enter/leave/over | Use stage.getPointerPosition() and layer.getIntersection() |
| dragend | Final intersection; fire drop; move node back to main layer | Clean up visuals and restore scene graph |

This approach is deterministic, works across frameworks, and is compatible with visual feedback and validation logic.[^9]

---

## Performance Optimization for Drag Operations

Smooth dragging with many nodes requires minimizing redraw scope and event processing overhead. Konva’s performance guidance highlights practical techniques:

- Move the dragged node to a dedicated drag layer during drag and move it back on dragend. This avoids redrawing the entire main layer each move cycle.[^11]
- Disable listening on layers and shapes that don’t need events (layer.listening(false), shape.listening(false)). This reduces event checking overhead.[^11]
- Cache complex shapes and groups (shape.cache()) to reduce drawing cost.[^11]
- Disable perfect drawing when acceptable (perfectDrawEnabled(false)) to avoid extra compositing overhead.[^11]
- Be mindful of total computation and draw volume; small per-event costs accumulate quickly with many shapes.[^11]

Table 6 summarizes these techniques.

Table 6. Performance techniques for drag

| Technique | What It Does | When to Use |
|---|---|---|
| Drag layer isolation | Limits redraw scope during drag | Many shapes; complex layers |
| Disable layer/shape listening | Reduces event checking overhead | Non-interactive layers/shapes |
| Shape caching | Draws from an off-screen cache | Complex shapes/groups |
| Disable perfect drawing | Lowers compositing overhead | Visuals tolerant of slight differences |
| Compute less, draw less | Reduces per-event work | Large scenes or high-frequency moves |

Adopt these patterns early; retrofitting into complex scenes is costlier.[^11][^18]

---

## Cross-Platform Mobile Touch Events

Konva’s drag events—dragstart, dragmove, dragend—are supported on mobile, alongside touch events like touchstart, touchmove, touchend, tap, and dbltap. This unified model allows desktop and mobile interactions to share the same handlers where appropriate, simplifying cross-platform code. Advanced gestures (rotate, pinch zoom) are demonstrated in separate demos and are orthogonal to basic drag semantics.[^14]

---

## Framework Integration: React and Vue Patterns

The draggable prop enables drag in React; use onDragStart, onDragMove, and onDragEnd handlers for lifecycle logic. Vue follows similar patterns using declarative configuration and event handlers in component methods. Cursor changes, z-order adjustments (for example, moveToTop), and state updates to persist final positions are common across frameworks.[^15][^16]

Table 7 maps core events and props across frameworks.

Table 7. Framework event/prop mapping

| Concern | Vanilla Konva | React (react-konva) | Vue (vue-konva) |
|---|---|---|---|
| Enable drag | node.draggable(true) | <Node draggable /> | config: { draggable: true } |
| Drag lifecycle | node.on('dragstart/move/end', fn) | onDragStart/Move/End props | @dragstart/moveend handlers |
| Cursor feedback | mouseover/mouseout events | onMouseEnter/Leave | @mouseenter/mouseleave |
| Persistence | Read node.x()/y() on dragend | e.target.x()/y() in onDragEnd | e.target.x()/y() in handlers |
| Group z-order | group.moveToTop() on dragstart | Reorder state or layer children | Reorder state or layer children |

These patterns keep framework integrations aligned with Konva’s underlying API.[^15][^16]

---

## Collision Detection and Multiple Draggable Shapes

When dragging many shapes, it is common to highlight intersections in real time. The collision detection demo uses bounding boxes to identify overlaps, changing fill color for intersecting shapes during dragmove. For rotated rectangles, the axis-aligned bounding box is computed from the corners; the overlap test then proceeds with standard rectangle logic. This approach is fast and adequate for many interaction models, though it may over-report intersections for complex shapes.[^13]

Managing multiple shapes involves keeping each shape draggable, raising the dragged shape to the top of its layer on dragstart, and removing shapes via dblclick/dbltap. State is held in component-level arrays (React) or refs (Vue) and updated on dragend or double-tap events. Cursor changes during hover and drag complete the user experience.[^17]

Table 8 outlines bounding-box collision logic and where to compute it.

Table 8. Collision detection logic

| Component | Inputs | Test | Where to Compute |
|---|---|---|---|
| Bounding box intersection | r1 = {x, y, w, h}, r2 = {x, y, w, h} | Non-overlap checks: r2 left/right/above/below r1; otherwise intersect | dragmove for continuous feedback |
| Rotated rect AABB | Corner points → min/max x/y | Use AABB for both shapes, then apply above test | dragmove for continuous feedback |

These techniques provide a responsive, lightweight alternative to pixel-perfect collision, which is often unnecessary for drag feedback.[^13][^17]

---

## Related Patterns: Stage Dragging and Canvas Scrolling

Stage dragging enables panning across large canvases. Combined with scrolling emulation, it supports navigation without traditional scrollbars. Konva’s scrolling demo illustrates making a large stage, enabling stage drag for navigation, and emulating scrollbar behavior—useful for UI consoles, diagram editors, and maps. Consider bounded stage dragging to avoid losing content off-canvas.[^20][^6]

---

## Drag-Related API Reference (Konva.Node)

Konva.Node exposes properties, methods, and events for full control over drag behavior.

Table 9. Drag API summary

| Name | Type | Purpose | Notes / Example |
|---|---|---|---|
| draggable | Property (Boolean) | Enable/disable dragging | node.draggable(true); stages can be draggable[^10][^6] |
| dragDistance | Property/Method (Number) | Minimum pointer movement to start drag | node.dragDistance(3); or set globally Konva.dragDistance = 3[^10] |
| dragBoundFunc | Property/Method (Function) | Override drag position with custom constraint | Receives absolute position; return constrained absolute position[^10] |
| startDrag() | Method | Initiate drag programmatically | node.startDrag()[^10] |
| stopDrag() | Method | Stop an active drag | node.stopDrag()[^10] |
| isDragging() | Method | Query drag state | Returns Boolean[^10] |
| Events: dragstart, dragmove, dragend | Events | Lifecycle hooks | Use node.on(...); framework props mirror these[^10][^3] |

Adopt dragBoundFunc for reusable constraints (for example, vertical-only drag by returning {x: this.absolutePosition().x, y: pos.y}).[^10]

---

## Implementation Checklist

- Enable drag: set draggable or use draggable() on the target node.
- Add lifecycle handlers: dragstart for initialization, dragmove for continuous logic (bounds, snapping, collisions), dragend for persistence and cleanup.[^3]
- Provide UX feedback: cursor changes on hover; consider visual highlights for potential drop targets.[^1]
- Define constraints: use dragmove overrides or dragBoundFunc for simple or complex bounds; implement snapping where needed.[^7][^8][^12]
- Simulate drop events: use a temporary drag layer and intersection checks to fire drop, dragenter, dragleave, and dragover on targets.[^9]
- Optimize performance: use a drag layer; disable listening on non-interactive layers/shapes; cache complex shapes; disable perfect drawing when acceptable.[^11]
- Mobile coverage: dragstart, dragmove, dragend are supported alongside touch events.[^14]
- Framework specifics: adopt draggable props and event handlers in React/Vue; maintain state arrays/refs for multiple shapes; adjust z-order via moveToTop or reordering.[^15][^16][^17]

---

## References

[^1]: HTML5 Canvas Drag and Drop Tutorial. https://konvajs.org/docs/drag_and_drop/Drag_and_Drop.html  
[^2]: HTML5 Canvas Drag and Drop an Image. https://konvajs.org/docs/drag_and_drop/Drag_an_Image.html  
[^3]: HTML5 Canvas Drag and Drop Events. https://konvajs.org/docs/drag_and_drop/Drag_Events.html  
[^4]: HTML5 Canvas Drag and Drop a Group Tutorial. https://konvajs.org/docs/drag_and_drop/Drag_a_Group.html  
[^5]: HTML5 Canvas Drag and Drop a Line. https://konvajs.org/docs/drag_and_drop/Drag_a_Line.html  
[^6]: HTML5 Canvas Drag and Drop the Stage. https://konvajs.org/docs/drag_and_drop/Drag_a_Stage.html  
[^7]: HTML5 Canvas Simple Drag Bounds Tutorial. https://konvajs.org/docs/drag_and_drop/Simple_Drag_Bounds.html  
[^8]: HTML5 Canvas Complex Drag and Drop Bounds. https://konvajs.org/docs/drag_and_drop/Complex_Drag_and_Drop.html  
[^9]: HTML5 Canvas Drop Events. https://konvajs.org/docs/drag_and_drop/Drop_Events.html  
[^10]: Konva.Node | Konva - JavaScript Canvas 2d Library. https://konvajs.org/api/Konva.Node.html  
[^11]: HTML5 Canvas All Konva performance tips list. https://konvajs.org/docs/performance/All_Performance_Tips.html  
[^12]: How to snap shapes positions on dragging with Konva? https://konvajs.org/docs/sandbox/Objects_Snapping.html  
[^13]: Drag and Drop Collision Detection Demo. https://konvajs.org/docs/sandbox/Collision_Detection.html  
[^14]: HTML5 Canvas Mobile Touch Events Tutorial. https://konvajs.org/docs/events/Mobile_Events.html  
[^15]: Drag and drop canvas shapes - React. https://konvajs.org/docs/react/Drag_And_Drop.html  
[^16]: How to implement drag and drop for canvas shapes with Vue and Konva. https://konvajs.org/docs/vue/Drag_And_Drop.html  
[^17]: Drag and Drop Multiple Shapes. https://konvajs.org/docs/sandbox/Drag_and_Drop_Multiple_Shapes.html  
[^18]: Drag and Drop Stress Test with 10000 Shapes. https://konvajs.org/docs/sandbox/Drag_and_Drop_Stress_Test.html  
[^19]: Shape Groups | Konva - JavaScript Canvas 2d Library. https://konvajs.org/docs/groups_and_layers/Groups.html  
[^20]: HTML5 Large Canvas Scrolling Demo. https://konvajs.org/docs/sandbox/Canvas_Scrolling.html# Konva Transformer: Complete Transformation Guide (Concepts, API, Recipes)

## Executive Summary

Konva’s Transformer is a specialized UI tool that enables interactive resizing, rotation, and manipulation of canvas nodes (shapes, text, groups). It is implemented as a special Konva.Group that renders handles around selected nodes and translates drag operations into changes in node scale and rotation, rather than altering a node’s width and height directly. This fundamental behavior—resizing by scale rather than by geometry—simplifies the manipulation model, supports uniform and non-uniform scaling, and underpins advanced features such as snapping, rotation constraints, and stroke handling for precise editor behaviors. [^8]

This guide consolidates the core concepts, practical behaviors, configuration flags, and production-ready recipes for building robust editors with Konva. It explains:
- What the Transformer is and how it attaches to nodes.
- How selection, resizing, and rotation work.
- How to manage aspect ratio, centered scaling, and modifier-key interactions.
- How to style anchors and borders, including advanced per-anchor customization.
- How transform events enable dynamic feedback and validation.
- How to enforce limits, implement snapping (resize and rotation), stop transformations programmatically, and force updates.
- Best practices for resizing text without changing font size and for stroke preservation.

Where the official documentation leaves edge cases unspecified, the guide calls them out and suggests prudent defaults for production deployments. For API specifics, always consult the official Konva.Transformer reference. [^8]



## Foundations: Transformer Basics and Core Mechanics

Konva.Transformer is added to a layer like any other node and is “attached” to one or more target nodes via its nodes() method. While attached, it renders a selection UI (border and anchors) and handles pointer interactions to scale and rotate the targets. Resizing changes scaleX and scaleY of the target node(s); rotation changes rotation. This scale-based approach avoids direct geometry edits and works uniformly for simple shapes, images, text, and groups. [^8]

Selection models are flexible: single selection by clicking a shape, multi-selection with modifier keys (SHIFT/CTRL/CMD), and area selection via a draggable selection rectangle. Clicking empty canvas space clears selection. This pattern is demonstrated across the basic demo, which also illustrates event wiring and selecting/deselecting with a selection rectangle. [^1]



### Table 1. Key configuration flags and default effects

The following flags shape fundamental Transformer behavior. Defaults are as documented in the API reference. [^8]

| Flag | Purpose | Default |
|---|---|---|
| resizeEnabled | Enables/disables resizing anchors. | true |
| rotateEnabled | Enables/disables the rotation handle. | true |
| rotateLineVisible | Shows/hides the line from the transformer to the rotation handle. | true |
| rotationSnaps | An array of angles (degrees) to snap to. | [] |
| rotationSnapTolerance | Max distance (degrees) within which snapping occurs. | 5 |
| rotateAnchorOffset | Distance of the rotation handle from the node. | 50 |
| padding | Padding around the transformed nodes (affects handle positions). | 0 |
| borderEnabled | Shows/hides the transformer’s border. | true |
| borderStroke | Border stroke color. | — |
| borderStrokeWidth | Border stroke width. | — |
| borderDash | Border dash pattern. | — |
| anchorFill | Anchor fill color. | — |
| anchorStroke | Anchor stroke color. | — |
| anchorStrokeWidth | Anchor stroke width. | — |
| anchorCornerRadius | Anchor corner radius (e.g., circles when set appropriately). | — |
| anchorSize | Anchor size (default is 10). | 10 |
| keepRatio | Maintain aspect ratio when using corner anchors. | true |
| centeredScaling | Resize relative to node center. | false |
| enabledAnchors | Restrict which anchors are active. | — |
| flipEnabled | Allow flipping/mirroring via transform. | true |
| boundBoxFunc | Validate or constrain proposed bounding boxes. | — |
| ignoreStroke | Ignore stroke size during transform (used with strokeScaleEnabled). | false |
| useSingleNodeRotation | For a single attached node, align transformer rotation with that node. | — |
| shouldOverdrawWholeArea | Enable dragging transformer by empty space between nodes (may disable node events). | — |



### Single vs Multi-Selection

In multi-selection, the Transformer derives a bounding box from all attached nodes. The API exposes nodes() to get or set attached nodes; passing an array switches between single and multi-selection without additional logic. The basic demo provides selection rectangle code and patterns for toggling selection with modifier keys and for updating transformer.nodes([...]) accordingly. [^1] [^8]



### Area Selection Pattern

The basic demo shows a complete area-selection workflow:
- A selection rectangle is drawn on mousedown/mousemove.
- On mouseup, the demo uses Konva.Util.haveIntersection between the selection rectangle’s client rect and each shape’s client rect to determine selected shapes.
- transformer.nodes([...]) is then updated to the selected shapes, and the selection rectangle is hidden. [^1]

This pattern generalizes to most editors: it decouples selection logic from the Transformer, keeps event handling straightforward, and is easy to test.



## Resizing Model and Aspect Ratio Control

Konva resizes by adjusting scaleX/scaleY, not width/height. Aspect ratio control and centered scaling determine how those scales evolve as you drag anchors.

- Aspect ratio preservation (keepRatio). The Transformer preserves aspect ratio when dragging corner anchors; you can disable it by setting keepRatio to false. The SHIFT key temporarily overrides keepRatio when false, preserving ratio while held. Corner anchors refer to the eight standard resize handles (top-left, top-right, bottom-left, bottom-right; and the mid-edge anchors). [^3] [^8]
- Centered scaling. With centeredScaling true, dragging an anchor scales the node equally in both directions from the center. Even with centeredScaling false, holding ALT while dragging triggers centered scaling for that operation. [^2] [^8]



### Table 2. Aspect ratio control quick reference

| Control | Effect | Default/Typical Usage |
|---|---|---|
| keepRatio: true | Preserves aspect ratio when using corner anchors. | Default behavior for corner anchors. [^3] [^8] |
| keepRatio: false | Allows free scaling without aspect preservation. | Disable for freeform resizes. [^3] |
| SHIFT while dragging | Temporarily preserves aspect ratio even if keepRatio is false. | Override for precision. [^3] |
| enabledAnchors | Restrict to specific anchors (e.g., left/right for width-only edits). | Useful with text resizing. [^8] [^12] |

Together, these controls enable precise, predictable resizes with minimal code.



### Keep Ratio Details

- Default behavior for corner anchors is to preserve the aspect ratio without extra configuration. [^3]
- Explicitly setting keepRatio to false disables it. [^3]
- Holding SHIFT while resizing restores aspect preservation even when keepRatio is false. [^3]



### Centered Scaling Details

- When centeredScaling is true, the node scales equally outward in both directions from its center as you drag any anchor. [^2]
- When centeredScaling is false, you can still achieve centered scaling for a specific drag by holding the ALT key. [^2]



## Transformer Styling and Complex Customization

Konva provides a layered styling model: global appearance properties for anchors and borders, and an advanced per-anchor hook for deep customization.



### Table 3. Transformer styling properties quick reference

| Property | Purpose |
|---|---|
| borderStroke, borderStrokeWidth, borderDash | Controls the border’s stroke color, width, and dash pattern. |
| anchorFill, anchorStroke, anchorStrokeWidth, anchorSize, anchorCornerRadius | Control anchor appearance, including size and rounded/circled anchors. |

These properties are sufficient for most branding and usability needs and are documented in the Styling guide. [^4]



### Advanced per-anchor customization

The anchorStyleFunc hook enables deep, per-anchor customization. It is invoked for each anchor after default attributes are set, receiving the anchor as a Konva.Rect. You can:
- Detect anchors by name and adjust fill, stroke, scale, or visibility.
- Make all anchors circular via cornerRadius; hide or shrink specific anchors for constrained editing. [^5]

This approach is ideal for:
- Distinguishing rotation handles visually.
- Hiding anchors that would create ambiguous interactions in specialized tools.
- Enforcing design consistency across editor modes. [^5]



## Transform Events and Control

Konva.Transformer emits three primary lifecycle events: transformstart, transform, and transformend. They are emitted on the Transformer itself and also triggered on the attached node(s), enabling centralized or node-level handling. These events underpin real-time feedback, continuous validation, and post-transform reconciliation. [^6]



### Table 4. Transform event lifecycle and typical uses

| Event | Trigger | Typical usage |
|---|---|---|
| transformstart | Beginning of a transform operation. | Initialize state, cache pre-transform values, show guides or hints. [^6] |
| transform | Continuously during drag. | Live validation, snapping, bounds checking, updating overlays. [^6] |
| transformend | End of a transform operation. | Commit changes, reset temporary state, finalize computed geometry. [^6] |

In practice, transformend is a natural place to normalize geometry (e.g., convert scales to width/height for persistence or to reset stroke scaling modes), while transform is where you enforce dynamic constraints or snapping.



### Runtime control and forced updates

Two methods support runtime control:
- stopTransform() immediately halts the active transform (e.g., when a size limit is exceeded). It is commonly invoked during transform based on computed dimensions. [^7]
- forceUpdate() recomputes the Transformer’s handles and bounding box. It is necessary when the Transformer is attached to a Group and the Group’s internal children change in ways the Transformer cannot auto-detect (e.g., text content updates). [^8]

These methods are essential for building robust editors where user actions or external state can change node geometry outside the Transformer’s direct scale/rotation operations.



## Constraints, Limits, and Snapping

Editors feel polished when resize/rotate operations adhere to rules and snap to meaningful values. Konva exposes flexible hooks for this.



### Resize limits with boundBoxFunc

boundBoxFunc(oldBox, newBox) receives the proposed bounding box in absolute coordinates and returns either oldBox (to block the change) or a modified newBox (to allow it). Typical uses include minimum size constraints, aspect-ratio constraints beyond keepRatio, or max width/height rules. The function receives absolute width/height, which already include scale. [^8] [^7]



### Rotation snapping

rotationSnaps defines the target angles (degrees); rotationSnapTolerance defines the “sticky” range around those angles. Common sets include [0, 90, 180, 270]. With appropriate tolerance, rotations naturally snap to cardinally important angles without additional code. [^9] [^8]



### Resize snapping with anchorDragBoundFunc

anchorDragBoundFunc(oldAbsPos, newAbsPos, event) constrains and customizes anchor dragging logic in absolute coordinates. This is the correct place to implement grid or guide snapping for resizing (for example, snapping an edge to the stage center or to a guide line when within a tolerance). [^10] [^8]



### Table 5. Snapping parameters reference

| Parameter | Purpose | Typical values |
|---|---|---|
| rotationSnaps | Target angles for snapping (degrees). | [0, 90, 180, 270] |
| rotationSnapTolerance | Tolerance (degrees) for snapping. | 5–30 |
| anchorDragBoundFunc | Custom anchor drag logic in absolute coordinates. | E.g., snap to x = stageCenterX within tolerance. |

These hooks—used together—yield predictable, editor-like behavior.



### Table 6. Coordinate systems quick reference

| Hook | Coordinate system | Typical use |
|---|---|---|
| boundBoxFunc | Absolute coordinates. | Enforce min/max dimensions, complex box constraints. [^8] |
| anchorDragBoundFunc | Absolute coordinates. | Guide/grid snapping for anchors during resize. [^8] |



### Practical considerations

- Absolute vs relative coordinates: boundBoxFunc and anchorDragBoundFunc operate in absolute coordinates, which simplifies geometric checks but requires attention when converting to/from node-relative positions. [^8]
- Interaction with keepRatio and centeredScaling: snapping can be applied orthogonally to these behaviors; consider combining keepRatio with anchor snapping to achieve “locked aspect + grid alignment” workflows. [^3] [^2] [^8]



## Recipes: Production Patterns for Real-World Use

The following patterns consolidate the concepts above into robust editor behaviors.



### Pattern A: Enforce width limit and stop transform

Use the transform event to compute current width from node.width() * scaleX; if it exceeds the limit, call stopTransform(). This pattern is demonstrated in the Stop Transform guide for a 200px width limit. [^7]

Example outline:
- Attach Transformer to node.
- On node.transform (or Transformer.transform), compute width = node.width() * node.scaleX().
- If width > limit: transformer.stopTransform().



### Pattern B: Snap rotation to common angles

Apply rotationSnaps and rotationSnapTolerance so rotations “stick” to 0/90/180/270 within a tolerance. The Rotation Snaps demo uses [0, 90, 180, 270] with a typical tolerance, enabling practical alignment with minimal friction. [^9]

Example outline:
- new Konva.Transformer({ rotationSnaps: [0, 90, 180, 270], rotationSnapTolerance: 30 });



### Pattern C: Snap resizing to guides via anchorDragBoundFunc

Implement anchorDragBoundFunc to snap anchor x/y to a guide or grid when within a tolerance. For example, snap to the stage center line horizontally if the anchor is within a small radius. [^10]

Example outline:
- transformer.anchorDragBoundFunc((oldAbsPos, newAbsPos) => {
    const centerX = stage.width() / 2;
    if (Math.abs(newAbsPos.x - centerX) < tolerance) {
      return { x: centerX, y: newAbsPos.y };
    }
    return newAbsPos;
  });

This is the resize counterpart to dragging objects to guides and can be combined with visual guide lines for user feedback. [^16]



### Pattern D: Resize text by width without changing font size

Transformer modifies scaleX/scaleY on text nodes. To change the text box width while preserving font size, update width and reset scaleX during transform. A common recipe is to constrain anchors to left/right only (enabledAnchors) and implement transform logic: compute newWidth = text.width() * text.scaleX(); set text.width(newWidth); text.scaleX(1). The Resize Text guide illustrates the pattern with cross-framework examples. [^12]

Example outline:
- Set Transformer enabledAnchors to ['middle-left', 'middle-right'].
- On transform: node.width(node.width() * node.scaleX()); node.scaleX(1).



### Pattern E: Ignore stroke scaling on transform

There are two supported approaches:
1) Convert scale to geometry on transformend: width *= scaleX; height *= scaleY; then reset scaleX/scaleY to 1. This yields stable stroke width and persists “actual” size. [^11]
2) Disable stroke scaling on the shape (strokeScaleEnabled(false)) and set Transformer ignoreStroke(true). This leaves the node’s scale altered, but the stroke itself does not scale visually. [^11] [^8]

Example outline (approach 2):
- Shape: { strokeScaleEnabled: false }.
- Transformer: { ignoreStroke: true }.



### Pattern F: Force update after group child changes

When a Transformer is attached to a Group, it cannot automatically detect deep changes inside the group (e.g., text content altering the group’s bounds). After such changes, call transformer.forceUpdate() to recalculate handles and bounding box. [^13] [^8]

Example outline:
- Update child node (e.g., change text content).
- transformer.forceUpdate().



### Pattern G: Area selection and multi-select workflow

Implement a selection rectangle:
- Draw on mousedown/mousemove.
- On mouseup, compute intersections with shape clientRects.
- Set transformer.nodes([selectedShapes]).
- Hide the selection rectangle. [^1]

This approach scales to multi-select and mixes cleanly with SHIFT/CTRL selection.



### Table 7. Recipe-to-API mapping

| Recipe | Key APIs/Events | Behavior summary |
|---|---|---|
| A. Width limit + stop | transform event; stopTransform() | Compute width on the fly; halt transform when limit exceeded. [^7] |
| B. Rotation snaps | rotationSnaps; rotationSnapTolerance | Stick to target angles within tolerance. [^9] [^8] |
| C. Resize snaps | anchorDragBoundFunc | Snap anchors to guides/grid in absolute coords. [^10] [^8] |
| D. Text width-only | enabledAnchors; transform; width and scaleX | Update width and reset scaleX to preserve font size. [^12] |
| E. Ignore stroke | strokeScaleEnabled(false); ignoreStroke(true) OR convert scale to geometry | Prevent stroke scaling or bake scale into geometry. [^11] [^8] |
| F. Force update | forceUpdate() | Recompute transformer after group internal changes. [^13] [^8] |
| G. Area selection | selection rectangle; nodes() | Multi-select via intersection, update transformer nodes. [^1] [^8] |



### Framework notes (Vanilla, React, Vue)

The official demos provide complete examples across Vanilla JavaScript, React, and Vue for most patterns:
- Basic selection, area selection, and multi-select are demonstrated across frameworks in the Basic Demo. [^1]
- React-specific Transformer usage patterns are described in the React guide. [^15]
- Each recipe here maps to the documented demos: stop transform (Vanilla/React/Vue), rotation snaps (Vanilla/React/Vue), resize snaps (React/Vue demos include the anchorDragBoundFunc example), text resizing, ignore stroke, and force update. [^7] [^9] [^10] [^12] [^11] [^13] [^14]

In React/Vue, access the Transformer node via refs and call methods directly (e.g., trRef.current.stopTransform()) or set configuration props accordingly.



## Complete API Reference: Config, Methods, Events

This quick reference consolidates the most commonly used configuration, methods, and events. For the authoritative list and signatures, always consult the official API reference. [^8]



### Configuration parameters

| Name | Type | Default | Notes |
|---|---|---|---|
| resizeEnabled | Boolean | true | Show/hide resize anchors. |
| rotateEnabled | Boolean | true | Show/hide rotation handle. |
| rotateLineVisible | Boolean | true | Show/hide rotation connection line. |
| rotationSnaps | Array | [] | Angles in degrees to snap to. |
| rotationSnapTolerance | Number | 5 | Degrees within which snapping occurs. |
| rotateAnchorOffset | Number | 50 | Distance of rotation handle. |
| rotateAnchorCursor | String | 'crosshair' | Cursor for rotation anchor. |
| padding | Number | 0 | Padding around targets for handle placement. |
| borderEnabled | Boolean | true | Show/hide border. |
| borderStroke | String | — | Border color. |
| borderStrokeWidth | Number | — | Border width. |
| borderDash | Array | — | Border dash pattern. |
| anchorFill | String | — | Anchor fill color. |
| anchorStroke | String | — | Anchor stroke color. |
| anchorStrokeWidth | Number | — | Anchor stroke width. |
| anchorCornerRadius | Number | — | Anchor corner radius. |
| anchorSize | Number | 10 | Anchor size. |
| keepRatio | Boolean | true | Preserve aspect ratio on corner anchors. |
| shiftBehavior | String | 'default' | How SHIFT modifies behavior at corners. |
| centeredScaling | Boolean | false | Scale from center during resize. |
| enabledAnchors | Array | — | Restrict active anchors by name. |
| flipEnabled | Boolean | true | Allow flipping/mirroring. |
| boundBoxFunc | Function | — | Validate/limit proposed bounding box (absolute). |
| ignoreStroke | Boolean | false | Ignore stroke size during transform (use with strokeScaleEnabled). |
| useSingleNodeRotation | Boolean | — | Align transformer rotation to single attached node. |
| shouldOverdrawWholeArea | Boolean | — | Enable dragging the transformer via empty space; may disable node events. |



### Methods

| Method | Purpose |
|---|---|
| attachTo(node) | Attach a node (deprecated alias). Use nodes([node]) instead. |
| getActiveAnchor() | Returns current active anchor name or null. |
| detach() | Detach current attached node(s). |
| on(evt, handler) | Bind event handler to the transformer. |
| forceUpdate() | Recompute transformer bounds (necessary for deep Group changes). |
| isTransforming() | Returns whether a transform is in progress. |
| stopTransform() | Immediately stop the current transform. |
| enabledAnchors(array?) | Get/set enabled anchor names. |
| flipEnabled(flag?) | Get/set flipping enabled. |
| resizeEnabled(enabled?) | Get/set resizing enabled. |
| anchorSize(size?) | Get/set anchor size. |
| rotateEnabled(enabled?) | Get/set rotation enabled. |
| rotateLineVisible(enabled?) | Get/set rotation line visibility. |
| rotationSnaps(array?) | Get/set rotation snap angles. |
| rotateAnchorOffset(offset?) | Get/set rotation handle offset. |
| rotateAnchorCursor(name?) | Get/set rotation handle cursor. |
| rotationSnapTolerance(tolerance?) | Get/set rotation snap tolerance. |
| borderEnabled(enabled?) | Get/set border visibility. |
| anchorStroke(color?) | Get/set anchor stroke color. |
| anchorStrokeWidth(width?) | Get/set anchor stroke width. |
| anchorFill(color?) | Get/set anchor fill color. |
| anchorCornerRadius(radius?) | Get/set anchor corner radius. |
| borderStroke(color?) | Get/set border stroke color. |
| borderStrokeWidth(width?) | Get/set border stroke width. |
| borderDash(dash?) | Get/set border dash array. |
| keepRatio(flag?) | Get/set keepRatio behavior. |
| shiftBehavior(mode?) | Get/set shift-key behavior. |
| centeredScaling(flag?) | Get/set centered scaling. |
| ignoreStroke(flag?) | Get/set ignoreStroke. |
| padding(value?) | Get/set padding. |
| nodes(array?) | Get/set attached nodes. |
| boundBoxFunc(func?) | Get/set boundBoxFunc. |
| anchorDragBoundFunc(func?) | Get/set anchorDragBoundFunc. |
| anchorStyleFunc(func?) | Get/set anchorStyleFunc. |
| shouldOverdrawWholeArea(flag?) | Get/set shouldOverdrawWholeArea. |
| useSingleNodeRotation(flag?) | Get/set useSingleNodeRotation. |



### Events

| Event | Notes |
|---|---|
| transformstart | Emitted on transformer and attached nodes at the start of a transform. [^6] [^8] |
| transform | Emitted continuously during transform. [^6] [^8] |
| transformend | Emitted on transformer and attached nodes at the end of a transform. [^6] [^8] |
| dragstart / dragmove / dragend | Emitted for transformer dragging interactions. [^8] |



## Appendices: Related Guides and Edge Cases

- Dragging vs transforming. While this guide focuses on transforming, snapping during dragging is a related pattern. The sandbox demonstrates object-to-object and object-to-stage-edge snapping, which pairs well with the anchorDragBoundFunc approach for resizing. [^16]
- Platform-specific notes. The official docs include framework-specific tutorials (e.g., React). At runtime, ensure your framework wrapper exposes the underlying Konva node for method calls such as stopTransform, forceUpdate, and for accessing methods via refs. [^15]
- Sandboxes and full examples. The documentation site references working sandboxes for text resizing and other topics; use them to validate edge cases across devices and browsers. [^12] [^14]



### Known gaps and caveats

- Rotation anchor styles. The anchorStyleFunc example shows rotation handle customization via anchor names; the full list of anchor names is not enumerated in the collected materials. If you need per-anchor logic beyond the examples (e.g., targeting a “rotater” by name), verify the specific anchor names in the current Konva version. [^5] [^8]
- Area selection bounding boxes. The Basic Demo includes helper functions for computing bounding boxes of rotated rectangles. Those helper utilities are framework-specific and not documented as part of the core API; treat them as patterns rather than contract. [^1]
- shouldOverdrawWholeArea event side effects. Enabling shouldOverdrawWholeArea may temporarily disable events on attached nodes. Plan testing around this if your editor relies on node-specific events during transforms. [^8]
- Uncaught exceptions in callbacks. boundBoxFunc, anchorDragBoundFunc, and anchorStyleFunc are user-defined; validate inputs and handle errors to avoid breaking interaction loops. [^8]
- forceUpdate in complex groups. In deeply nested Groups or when multiple children change, consider calling forceUpdate once per change batch to avoid excessive recomputation. [^13] [^8]
- Stroke preservation consistency. If you mix strokeScaleEnabled(false) + ignoreStroke(true) with other transforms, verify final visual outcomes across layers and groups, especially when exporting to images or when measuring clientRect. [^11] [^8]



## References

[^1]: HTML5 Canvas Shape select, resize and rotate (Basic demo). https://konvajs.org/docs/select_and_transform/Basic_demo.html  
[^2]: HTML5 Canvas Shape Resize Relative to Center (Centered Scaling). https://konvajs.org/docs/select_and_transform/Centered_Scaling.html  
[^3]: HTML5 Canvas Shape Resize With Ratio Preserved (Keep Ratio). https://konvajs.org/docs/select_and_transform/Keep_Ratio.html  
[^4]: Style Konva Transformer (Transformer Styling). https://konvajs.org/docs/select_and_transform/Transformer_Styling.html  
[^5]: Deep Style Konva Transformer (Complex Transformer Styling). https://konvajs.org/docs/select_and_transform/Transformer_Complex_Styling.html  
[^6]: HTML5 Canvas Transform and Resize events (Transform Events). https://konvajs.org/docs/select_and_transform/Transform_Events.html  
[^7]: HTML5 Canvas Stop Shape Transform (Stop Transform). https://konvajs.org/docs/select_and_transform/Stop_Transform.html  
[^8]: Konva.Transformer API Reference. https://konvajs.org/api/Konva.Transformer.html  
[^9]: HTML5 Canvas Shape Snap Rotation (Rotation Snaps). https://konvajs.org/docs/select_and_transform/Rotation_Snaps.html  
[^10]: HTML5 Canvas Shape Resize Snapping (Resize Snaps). https://konvajs.org/docs/select_and_transform/Resize_Snaps.html  
[^11]: How to resize shape on canvas without changing its stroke (Ignore Stroke). https://konvajs.org/docs/select_and_transform/Ignore_Stroke_On_Transform.html  
[^12]: How to resize text on canvas? (Resize Text). https://konvajs.org/docs/select_and_transform/Resize_Text.html  
[^13]: HTML5 Canvas Force Update Tutorial (Force Update). https://konvajs.org/docs/select_and_transform/Force_Update.html  
[^14]: How to limit dragging and resizing of shapes by canvas (Limited Drag and Resize). https://konvajs.org/docs/sandbox/Limited_Drag_And_Resize.html  
[^15]: React Konva Transformer Guide. https://konvajs.org/docs/react/Transformer.html  
[^16]: How to snap shapes positions on dragging with Konva? https://konvajs.org/docs/sandbox/Objects_Snapping.html  
[^17]: HTML5 Canvas Shape Resize and Transform Limits (Resize Limits). https://konvajs.org/docs/select_and_transform/Resize_Limits.html# Konva Clipping, Containers, Groups, Layering, and Performance: Complete Documentation Blueprint

## Executive Summary and Scope

This blueprint consolidates and systematizes Konva’s clipping, container, grouping, layering, and performance documentation into a cohesive, implementation-ready reference for frontend engineers, technical artists, and visualization developers. It draws on the official Konva API for core semantics and augments them with official tutorials that explain practical usage patterns, common pitfalls, and performance strategies.

The scope includes: simple rectangular clipping with Konva.Container and Konva.Group; advanced clipping using clipFunc; moving nodes between containers; group hierarchy, transformations, events, and clipping; z-order principles distinct from CSS; Layer management, including batching and hit detection; and performance techniques such as caching, listening(false), drag layers, pixelRatio tuning, and shape-level optimizations. Where specific tutorial pages were not available or could not be fetched, we acknowledge gaps and rely on official API documentation as the canonical source of truth.[^1][^2][^3]

Information gaps and implications:
- A dedicated “Layer Management” tutorial URL was not retrieved; we rely on the official Layer API and the general performance tips to define best practices.[^3][^9]
- No context-specific images were provided for the concepts; none are embedded in this blueprint.
- The Container API page lists clipFunc return styles but without exhaustive, official examples; code examples here stay conservative and aligned with canonical patterns.[^2]
- No quantitative performance benchmarks are available in the referenced materials; recommendations are qualitative and based on official guidance.[^9][^10]

## Foundations: Konva Node Hierarchy and Rendering Model

Konva’s rendering model is defined by a tree of nodes. At the top sits Konva.Stage. Beneath it, Konva.Layer instances encapsulate drawing surfaces and interaction graphs. Groups (Konva.Group) and shapes descend from containers (Konva.Container) and ultimately attach to a layer for rendering. The stage anchors the entire scene, layers map to actual canvases, and groups provide logical packaging and transformation scopes for shapes.[^2][^3][^4][^5]

Two principles matter most for predictable composition:
- Rendering order is the insertion order. A node’s zIndex within its parent’s children array determines draw order relative to siblings; Konva draws nodes in the strict order defined by the node tree.[^7] There is no notion of absolute “CSS-like” z-index spanning unrelated branches; layering is always relative among siblings.
- Transforms propagate down the tree. When a group is moved, rotated, or scaled, its children follow suit. This nested transform composition is central to how clipping boundaries and hit detection interact.[^2][^4]

This hierarchy clarifies where clipping applies (containers and layers) and where interaction behavior is determined (listening flags and hit canvases). It also explains why moving a node across layers or containers changes its drawing and event behavior.

### Stage, Layer, Group, and Shape: Roles and Relationships

- Stage is the top-level root for a canvas scene.
- Layer is bound to a canvas and manages both the scene and hit graphs. It is the primary unit of drawing and redraw control.
- Group is a container for organizing shapes and other groups. It applies collective transforms and can define clipping.
- Shapes are the drawable primitives (rectangles, circles, text, images, etc.). They inherit from Node and are added to containers, eventually attached to a layer.[^2][^3][^4][^5]

Containers (Layer and Group) add, remove, and find children, manage clipping, and provide batchDraw semantics for efficient redraws.[^2][^3]

## Simple Clipping (Rectangular Regions)

Clipping limits rendering to a rectangular region. On Konva.Container and Konva.Group (and therefore Konva.Layer by inheritance), you can define a clip with either:
- A clip object: { x, y, width, height }
- Discrete setters: clipX, clipY, clipWidth, clipHeight

The region is interpreted in the local coordinate space of the container. Clipping affects rendering of the container’s children; it does not change their underlying geometry or hit regions.[^2][^4][^6]

To illustrate the API surface, the following summary consolidates the rectangle clipping methods.

Table 1. Rectangular clipping methods on Container/Group/Layer
| API            | Purpose                                            | Typical Usage Pattern                              |
|----------------|----------------------------------------------------|----------------------------------------------------|
| clip(obj)      | Get or set clip region                             | container.clip({ x, y, width, height })            |
| clipX(number)  | Get or set clip x                                  | container.clipX(10)                                |
| clipY(number)  | Get or set clip y                                  | container.clipY(20)                                |
| clipWidth(n)   | Get or set clip width                              | container.clipWidth(200)                           |
| clipHeight(n)  | Get or set clip height                             | container.clipHeight(150)                          |

These methods are available across Group and Layer through inheritance from Container.[^2][^3][^4]

#### Practical Examples

- Rectangle clip on a group: create a Konva.Group, set its clip to a rectangle, then add shapes. Only portions inside the clip render. This is ideal for preview windows, scrollable panels, or masking content without altering shape geometry.[^2][^6]
- Rectangle clip on a layer: define a clip on a layer to confine everything drawn on that layer to a fixed region. This can simplify compositing and isolate layers visually.[^3][^6]

Coordinate interpretation belongs to the container’s local space, not the global stage coordinates. If the container is moved or scaled, the clip moves and scales with it because it is subject to the same transform stack.[^2]

## Advanced Clipping via clipFunc

When rectangles are insufficient, use clipFunc. It receives the 2D rendering context (ctx) and allows you to define arbitrary paths (single or multiple) that become the clipping region. Any content drawn as a child of that container is clipped to the union of the paths you construct with Canvas 2D commands such as beginPath, arc, rect, and closePath.[^2][^8]

Complex, multi-region clips are straightforward: compose several subpaths in one clipFunc. Konva will apply the combined clip to children. This is particularly useful for “cutouts,” window frames with holes, or disjoint apertures (e.g., two circles) that expose content only in select areas.[^8]

Table 2. clipFunc capabilities matrix
| Path Type/Technique           | Canvas 2D commands used in clipFunc         | Practical Use-Case                                  |
|------------------------------|----------------------------------------------|-----------------------------------------------------|
| Single path (rectangle)      | ctx.rect(...)                                | Panel window, card mask                             |
| Single path (circle)         | ctx.arc(...)                                 | Round thumbnail, porthole view                      |
| Multi-path union             | ctx.beginPath(); ctx.arc(...); ctx.arc(...); | Two portholes, multi-slit mask                      |
| Compound subpaths            | ctx.moveTo/lineTo/bezierCurveTo + closePath  | Custom silhouette outlines                          |
| Path2D objects (where used)  | return [Path2D, 'evenodd'] or similar        | Advanced compositing with even-odd fill rule        |

Note: The Container API references returning a [Path2D, 'evenodd'] array from clipFunc; however, explicit, official examples are limited. Use this pattern cautiously and test for expected results.[^2]

### Code Patterns for clipFunc

- Two circular clip regions: define two arcs in one beginPath and rely on the browser’s default nonzero winding rule for clipping. Children render only within the union of those circles.[^8]
- Arbitrary custom paths: combine lines and curves to match a design mask. Maintain consistent path orientation and call closePath where appropriate to avoid unexpected fill-rule effects.[^8]

## Change Containers: Moving Nodes Between Containers

Konva nodes can be re-parented at runtime via moveTo(newContainer). The method accepts any container (Stage, Layer, or Group) and detaches the node from its current parent before attaching to the new one. This is the canonical approach to restructure the scene graph without recreating shapes.[^1][^2][^3]

Table 3. moveTo use-cases and expected behavior
| Source → Target        | Practical Effect                                                       |
|------------------------|------------------------------------------------------------------------|
| Group → Layer          | Node joins the layer’s children; may affect draw order and hit testing |
| Group → Group          | Node changes logical packaging and inherits new group transforms       |
| Shape → Layer          | Removes from prior parent; directly composes under the layer           |
| Shape → Group          | Brings shape under a new transform scope and clip context              |
| Layer ↔ Group          | Moves nodes between layers and groups for organization or performance  |

Re-parenting preserves the node’s absolute visual position (when possible), but event behavior and draw order derive from the new parent and its siblings. As a rule, re-parent sparingly and batch any subsequent draw operations.[^1][^2]

## Groups: Functionality, Hierarchy, Transformations, Events

Groups are the workhorse of scene composition. They package shapes and nested groups, share transforms as a unit, and can define clipping for contained content.[^4]

Hierarchically, groups support:
- Child management: add, getChildren (with optional filter), hasChildren, removeChildren, destroyChildren.[^2][^4]
- Search and ancestry: find, findOne; isAncestorOf; findAncestors, findAncestor; getParent, getLayer, getStage; getDepth.[^2][^4]
- Z-order relative to siblings: zIndex, moveToTop, moveUp, moveDown, moveToBottom.[^2][^4]

Transformations applied to a group cascade to children. Position (x, y), rotation, scale (x, y), skew (x, y), and offset shift the entire subtree. Dragging can be enabled on a group so that all contained shapes move together. For performance, transformsEnabled('position') can restrict calculations to positional transforms only, omitting rotation and skew.[^4]

Groups also inherit Node event semantics: listening controls whether the group and its children participate in hit detection and receive events; binding and firing are supported at the group level with namespacing. A node can fire events and control bubbling via the event object.[^2][^4]

Table 4. Group child management methods
| Method             | Description                                                  | Typical Use-Cases                         |
|--------------------|--------------------------------------------------------------|-------------------------------------------|
| add(node(s))       | Adds one or more children to the container                   | Building groups of shapes                 |
| getChildren(fn?)   | Returns direct children, optionally filtered                 | Iterating specific subtypes               |
| hasChildren()      | Checks for any direct children                               | Guarded destruction or reflow             |
| removeChildren()   | Removes all children (nodes remain in memory)                | Detaching without destruction             |
| destroyChildren()  | Destroys all children (memory is released)                   | Cleaning up or resetting a group          |
| find(selector)     | Descendant search by string or function                      | Selecting by id, name, or type            |
| findOne(selector)  | First match for find                                         | Targeted lookup                           |

Table 5. Transformation properties and methods (group-level)
| Property/Method              | Effect on Group/Children                                      |
|-----------------------------|---------------------------------------------------------------|
| x, y                        | Translates the group and its subtree                          |
| rotation                    | Rotates the group and its subtree (degrees)                   |
| scale, scaleX, scaleY       | Scales the group and its subtree                              |
| skew, skewX, skewY          | Skews the group and its subtree                               |
| offset, offsetX, offsetY    | Shifts rotation/scale pivot for the group                     |
| position(), absolutePosition() | Sets local or absolute position                             |
| move(delta)                 | Incremental translation                                       |
| rotate(theta)               | Incremental rotation                                          |
| transformsEnabled('position') | Performance mode: only position is enabled                  |
| draggable, dragBoundFunc    | Enables drag and constrains movement                          |

### Performance Features in Groups

Konva provides group-level optimizations:
- cache() draws the group into an offscreen canvas, accelerating redraws and enabling filters. clearCache() and isCached() manage the lifecycle. Configuration includes bounds, pixelRatio, and smoothing flags.[^4]
- listening(false) removes the group and its children from the hit graph, greatly reducing hit detection overhead, especially for static elements.[^4]
- transformsEnabled('position') limits computation to positional transforms when you do not need rotation or skew.[^4]
- Exporting (toCanvas, toDataURL, toImage, toBlob) can rasterize stable content for faster painting.[^4]

Table 6. Caching configuration options and effects
| Option                     | Meaning                                              | Performance Impact                           |
|---------------------------|------------------------------------------------------|----------------------------------------------|
| x, y, width, height       | Bounds of cached region                              | Fit bounds to minimize rasterized area       |
| offset                    | Offset applied to the cached content                 | Aligns visual output                         |
| pixelRatio                | Scale factor for internal rasterization              | Higher ratios improve fidelity, cost more    |
| imageSmoothingEnabled     | Smoothing for rasterized content                     | Visual quality vs. crispness                 |
| hitCanvasPixelRatio       | Resolution of hit canvas if used                     | Hit accuracy vs. compute cost                |
| drawBorder                | Debugging border around cache                        | Visualize cache bounds during development    |

Avoid getAllIntersections for bulk queries; it clears and redraws temporary canvases and performs poorly. Prefer Stage.getIntersection for topmost hit testing, which is optimized.[^2][^3]

## Layering and z-order

Konva’s layering methods adjust sibling order to control stacking:
- zIndex(index) sets or gets the index within the parent’s children array.
- moveToTop(), moveToBottom(), moveUp(), moveDown() adjust relative position among siblings.[^7]

Critically, z-order is not absolute across the scene: it is always relative to siblings in the same parent. There is no global z-index like in CSS. Nodes are drawn in the strict order defined by the node tree.[^7]

Table 7. Layering methods quick reference
| Method        | Effect                                  | When to Use                                           |
|---------------|------------------------------------------|--------------------------------------------------------|
| zIndex(n)     | Set/get sibling index                    | Explicit ordering or sorting among siblings            |
| moveToTop()   | Move to end of parent's children         | Bring element above all siblings                       |
| moveToBottom()| Move to start of parent's children       | Send element below all siblings                        |
| moveUp()      | Increment sibling index by one           | Promote one step in stacking                           |
| moveDown()    | Decrement sibling index by one           | Demote one step in stacking                            |

A practical rule: when in doubt, call moveToTop on the node you want on top, or moveToBottom for the opposite. For fine control (e.g., insertion into the middle), use zIndex with awareness of the sibling array length.[^7]

## Layer Management and Optimization

Konva.Layer sits at the intersection of drawing and interaction. Each layer has its own canvas and manages both the scene (visible graphics) and the hit graph (interaction detection). It is the primary unit for redraw control and performance tuning.[^3]

Key capabilities include:
- add and manage children, hierarchical queries via find/findOne, and ancestor traversal inherited from Container and Node.[^2][^3]
- batchDraw() for redraw scheduling into the next animation frame (requestAnimFrame), smoothing high-frequency updates (e.g., mousemove). In modern Konva (v8+), automatic batching covers most cases; batchDraw remains relevant when autoDraw is disabled or for manual control.[^10]
- clearBeforeDraw (default true) to clear the canvas before each draw; setting to false can avoid redundant clears if you repaint the entire layer anyway.[^3]
- imageSmoothingEnabled to control smoothing on the layer’s canvas.[^3]
- cache/clearCache/isCached, transformsEnabled, and listening inherited from Node for performance.[^3]

Table 8. Layer performance levers
| Lever                    | What it Does                                         | Typical Scenario                                     |
|--------------------------|-------------------------------------------------------|------------------------------------------------------|
| batchDraw()              | Schedules draw next animation frame                   | High-frequency updates without jank                  |
| clearBeforeDraw          | Clears canvas before draw                             | Disable if you fully repaint the layer               |
| imageSmoothingEnabled    | Smoothing for images on the canvas                    | Toggle for crisp vs. smooth visuals                  |
| listening(true/false)    | Enables/disables hit detection on the layer           | Improve performance by disabling static layers       |
| cache()/clearCache()     | Offscreen rendering for fast redraw                   | Complex groups or layers that benefit from caching   |
| transformsEnabled(...)   | Limits enabled transforms                             | Simplify math for positional-only transforms         |

Table 9. Layer hit detection API comparison
| Method                     | Performance Notes                                   | Notes                                              |
|---------------------------|------------------------------------------------------|----------------------------------------------------|
| getIntersection(pos)      | Optimized; returns topmost visible shape            | Preferred for single-point hit tests               |
| getAllIntersections(pos)  | Performs poorly; clears and redraws temporary canvas| Avoid for bulk queries; not recommended            |
| getHitCanvas()            | Access to internal hit canvas                       | For debugging or advanced introspection            |
| toggleHitCanvas()         | Visualizes hit canvas over the stage                | Useful for debugging custom hit logic              |
| isListening()             | Checks listening, considering ancestors             | Returns true only if node and ancestors listen     |

#### Batch Draw vs. Automatic Batching

- batchDraw(): schedule redraw into the next animation frame; avoids “jumpy animations” during rapid updates. It is essential when Konva.autoDrawEnabled = false or for explicit control across versions.[^10]
- Konva v8+: automatic batching is enabled by default for changes, reducing the need to call batchDraw manually. Developers should still consider batchDraw when orchestrating many changes in a tight loop or when integrating with non-Konva animation loops.[^10]

## Performance Techniques: Layer Optimization

The overarching principles are compute less and draw less. The official performance guidance emphasizes mobile viewport configuration, stage sizing discipline, layer economy, and selective event listening.[^9]

Table 10. Performance techniques by scope
| Scope   | Technique                                | Benefit                                     | Caveats                                      |
|---------|------------------------------------------|---------------------------------------------|----------------------------------------------|
| Stage   | Optimize stage size                      | Less data moved to screen                    | Avoid mega-stages; consider canvas scrolling |
| Stage   | Mobile viewport configuration             | Prevents costly scaling                      | Must align with responsive design            |
| Stage   | Konva.pixelRatio = 1 on retina           | Lower scaling overhead                       | Potential quality trade-off                  |
| Layer   | Minimize number of layers                | Less canvas overhead                         | Balance with selective refresh needs         |
| Layer   | Use layer.listening(false)               | Skips hit graph updates for static content   | Disables pointer/touch events                 |
| Layer   | Drag layer pattern                        | Avoids redrawing entire layer during drags   | Requires re-parenting during/after drag      |
| Node    | cache() on shapes/groups                  | Faster redraw via rasterization              | Cached bounds must be managed                |
| Node    | listening(false)                         | Reduces per-frame hit checks                 | Disables events on the node and its children |
| Node    | perfectDrawEnabled(false)                | Reduces extra drawing work                   | May affect visuals in edge cases             |
| Node    | strokeHitEnabled(false) or shadow tuning | Avoids extra stroke shadow passes            | Impacts stroke visuals                        |
| Node    | Hide or remove unused content            | Lower existence and draw cost                | Don’t hide things users expect to interact   |

### Drag Layer Pattern

During drag operations, many frameworks redraw the entire source layer per move event, which is expensive. Konva’s performance guide recommends moving the dragged entity to a dedicated dragLayer for the duration of the drag and returning it to the main layer on drag end. This minimizes redraw cost and keeps interactions smooth.[^9]

## Event Handling and Hit Detection

Konva’s event model is consistent across Node types. The listening flag determines whether a node (and its subtree, in the case of containers) participates in hit detection and responds to events. Binding and unbinding are supported via on/off, and events can be fired programmatically. Namespacing allows granular control over listener removal. Event objects include target, currentTarget, and the native event; setting evt.cancelBubble = true halts propagation.[^2][^4]

Two helper functions merit special attention:
- Stage/Layer getIntersection(pos): the preferred method for topmost hit testing under a point; efficient and recommended for interactive selection logic.[^3]
- Container getAllIntersections(pos): convenient but performs poorly due to temporary canvas redraws; avoid for frequent or bulk queries.[^2][^3]

Table 11. Event-related performance considerations
| API/Feature                 | Impact on Performance                              |
|----------------------------|-----------------------------------------------------|
| listening(false)           | Removes subtree from hit graph; significant savings |
| perfectDrawEnabled(false)  | Reduces extra draw passes on complex shapes         |
| strokeHitEnabled(false)    | Avoids extra stroke rendering for hit detection     |
| getAllIntersections        | Costly; use sparingly or prefer getIntersection     |
| batchDraw()                | Smooths redraws under high-frequency updates        |

### Recommended Practices

- For static or non-interactive layers and groups, set listening(false) to avoid costly hit graph maintenance.[^9]
- Disable perfectDrawEnabled(false) when you can tolerate minor visual differences to reduce draw overhead on complex shapes.[^9]
- Use drag layers during drag operations to avoid redrawing entire layers on every move.[^9]
- Avoid getAllIntersections in hot paths; prefer optimized getIntersection methods on Stage or Layer.[^2][^3]

## Appendix: Method Reference Index

The following quick reference consolidates the methods and patterns discussed across the blueprint. Use it to accelerate implementation and code review.

Table 12. Consolidated quick reference
| Method/Property                    | Belongs To         | Purpose                                             | Notes                                               |
|-----------------------------------|--------------------|-----------------------------------------------------|-----------------------------------------------------|
| clip(obj)/clipX/clipY/w/h         | Container/Group/Layer | Rectangular clipping                             | Inherited by Group and Layer from Container         |
| clipFunc(fn)                      | Container/Group/Layer | Custom clipping via Canvas 2D paths               | Combine subpaths for complex masks                  |
| add(), getChildren(), hasChildren | Container/Layer/Group | Child management                                  | filterFunc optional for getChildren                 |
| removeChildren(), destroyChildren | Container/Layer/Group | Child removal/destruction                         | removeChildren keeps nodes in memory                |
| find(selector), findOne(selector) | Container/Layer/Group | Descendant queries                                | Selector by id, name, type, or function             |
| isAncestorOf(), getParent()       | Container/Node     | Ancestry checks                                    | Also findAncestors, findAncestor                    |
| getLayer(), getStage()            | Node               | Fetch ancestors                                    | Layer returns itself for Layer nodes                |
| zIndex(), moveToTop/Up/Down/Bottom| Node               | Sibling ordering                                   | Relative within parent; no absolute z-index         |
| batchDraw()                       | Layer              | Schedule draw in next frame                        | Use manually if autoDraw disabled or for fine control|
| clearBeforeDraw                   | Layer              | Clear canvas before draw                           | Disable to avoid redundant clears                   |
| getIntersection(pos)              | Stage/Layer        | Topmost hit at a point                             | Preferred over getAllIntersections                  |
| getAllIntersections(pos)          | Container          | All hits at a point                                | Performs poorly; avoid in hot paths                 |
| getHitCanvas(), toggleHitCanvas   | Layer              | Hit graph access and debugging                     | For visual debugging of hit logic                   |
| cache()/clearCache()/isCached     | Node               | Offscreen rasterization for performance            | Configure bounds, pixelRatio, smoothing             |
| transformsEnabled('position')     | Node               | Restrict transforms to position only               | Performance mode                                    |
| listening(true/false)             | Node               | Enable/disable hit detection                       | Improves performance on static content              |
| draggable, dragBoundFunc          | Node               | Drag interaction                                   | Combine with drag layer pattern                     |
| on(evt, handler), off(evt)        | Node               | Bind/unbind events                                 | Namespaces supported; bubbling controllable         |

---

## References

[^1]: Move Shape to Another Container | Konva - JavaScript Canvas 2d Library. https://konvajs.org/docs/groups_and_layers/Change_Containers.html  
[^2]: Konva.Container | API Reference. https://konvajs.org/api/Konva.Container.html  
[^3]: Konva.Layer | API Reference. https://konvajs.org/api/Konva.Layer.html  
[^4]: Konva.Group | API Reference. https://konvajs.org/api/Konva.Group.html  
[^5]: Shapes Category | Konva Docs. https://konvajs.org/category/shapes  
[^6]: HTML5 Canvas Simple Clipping tutorial - Konva.js. https://konvajs.org/docs/clipping/Clipping_Regions.html  
[^7]: Understanding Node zIndex | Konva - JavaScript Canvas 2d Library. https://konvajs.org/docs/groups_and_layers/zIndex.html  
[^8]: Clipping Functions Tutorial | Konva - JavaScript Canvas 2d Library. https://konvajs.org/docs/clipping/Clipping_Function.html  
[^9]: HTML5 Canvas All Konva performance tips list. https://konvajs.org/docs/performance/All_Performance_Tips.html  
[^10]: HTML5 Canvas Batch Draw Tip - Konva.js. https://konvajs.org/docs/performance/Batch_Draw.html  
[^11]: Shape Layering | Konva - JavaScript Canvas 2d Library. https://konvajs.org/docs/groups_and_layers/Layering.html  
[^12]: Shape Groups | Konva - JavaScript Canvas 2d Library. https://konvajs.org/docs/groups_and_layers/Groups.html# Konva.js Filters: Comprehensive Technical Documentation and Implementation Guide

## Executive Summary and Scope

This report provides a comprehensive, authoritative guide to image filters in the Konva.js 2D canvas library. It synthesizes the complete filter catalog, clarifies the distinction between deprecated and modern brightness controls, documents all configurable parameters and their types/ranges, and codifies mandatory usage patterns (notably caching and filter chaining). It is intended for engineers and technical writers who need precise, implementation-ready guidance for working with Konva filters across vanilla JavaScript, React, and Vue integrations.

Two high-level points set the tone for the entire guide. First, every filter in Konva requires the target node—typically a Konva.Image—to be explicitly cached via node.cache() before filters can be applied. Without this step, filters either fail silently or do not operate on the expected pixel buffer. Second, filter chaining is accomplished by passing an array of filter constructors to node.filters([...]) and the order of filters in that array determines the sequence in which pixels are processed. Both of these principles are repeated throughout the documentation and illustrated with framework-specific examples. [^1][^2]

In addition to the modern filter set, this guide explicitly covers the deprecated Brighten filter and the current Brightness filter, explaining the parameter differences and the migration path. Finally, the guide includes a dedicated section for building custom filters, including the ImageData contract, array indexing patterns, and integration with Konva’s caching and application model. [^2][^11]


## Methodology and Source Reliability

The analysis draws exclusively from the Konva official documentation and API pages for filters, together with the individual tutorial pages for each filter. These sources include the Filters API reference, filter-specific tutorials for Blur, Brighten, Brightness, Contrast, Emboss, Enhance, Grayscale, HSL, HSV, Invert, Kaleidoscope, Mask, Multiple Filters, Noise, Pixelate, RGB, Sepia, Solarize, and Threshold, and the Custom Filter tutorial. These pages collectively define the capabilities and usage contract for Konva filters. [^1][^2][^3][^4][^5][^6][^7][^8][^9][^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^21]

Citations follow a minimal-necessary rule: we cite the smallest set of sources required to substantiate a claim. Where a parameter range or behavior is consistent across multiple filter pages, we cite the API reference once for brevity.


## Filters Fundamentals: Caching, Application, and Chaining

Filters in Konva operate on the pixel buffer of a cached node. Caching is therefore mandatory in practice. After caching, you assign filters using node.filters([...]) and adjust parameters using the corresponding node methods. The following pattern holds across all tutorials:

- Cache the node: node.cache()
- Assign filters: node.filters([Konva.Filters.X, ...])
- Set parameters: node.paramName(value) or via component props in React/Vue
- Redraw: layer.batchDraw() after changing filter parameters (especially relevant in frameworks and when updating values dynamically)

The tutorial on multiple filters emphasizes that the order in the array dictates application order. For interactive UIs, use layer.batchDraw() to refresh the scene after parameter changes. [^1][^2][^14]

To make these requirements explicit, Table 1 summarizes the common pattern.

Table 1. Common filter usage pattern (universal across filters)

| Step | API / Code Hook | Notes |
|---|---|---|
| Cache the node | node.cache() | Must be called before filters take effect |
| Assign filters | node.filters([Konva.Filters.X, Konva.Filters.Y]) | Order is application order |
| Set parameters | node.paramName(value) | Each filter exposes parameters via methods or props |
| Redraw | layer.batchDraw() | Ensures the scene reflects updated parameters |

The universal pattern, together with the need to recache after certain property changes in component-based integrations, is reinforced by framework-specific guidance (e.g., Vue’s recommendation to recache nodes when styles change). [^22]


## Filter Catalog Overview

Konva provides a rich set of image effects spanning simple color transforms (Invert, Grayscale, Sepia), spatial and tonal manipulations (Blur, Brightness, Contrast, Enhance, Noise, Pixelate), color-space adjustments (RGB, HSL, HSV), thresholding and solarization, stylistic transforms (Emboss, Kaleidoscope), and background masking (Mask). Parameterization is uniform across frameworks: use node methods in vanilla JavaScript (e.g., node.brightness(1.2)), and props in React/Vue (e.g., brightness={value}). [^1][^2]

To give a concise map of the catalog, Table 2 groups filters by category and summarizes their key parameters and usage notes.

Table 2. Filter catalog matrix

| Filter | Category | Key parameters (name/type/range) | Defaults in examples | Notes |
|---|---|---|---|---|
| Blur | Spatial/smoothing | blurRadius (number, 0–40) | 10 | Gaussian-like blur; set via node.blurRadius(value). [^3] |
| Brightness (modern) | Tone mapping | brightness (number, 0–2) | 1.5 | Replaces deprecated Brighten; 0=black, 1=original, >1 brightens. [^4] |
| Brighten (deprecated) | Tone mapping | brightness (number, -1 to 1) | 0.3 | Use Brightness instead; keep legacy support only if unavoidable. [^5] |
| Contrast | Tone mapping | contrast (number, -100 to 100) | 30–50 | Positive increases contrast; negative decreases. [^6] |
| Enhance | Tone mapping | enhance (number, -1 to 1) | 0.4 | Stretches color range; examples use 0.1 step. [^7] |
| Noise | Texture/noise | noise (number, 0–1) | 0.3–0.5 | Adds grain; set via node.noise(value). [^17] |
| Pixelate | Spatial/effect | pixelSize (number, ≥1) | 8 | Larger values produce more pronounced blocks. [^18] |
| Grayscale | Color transform | none | n/a | Applies directly; no parameters. [^8] |
| Invert | Color transform | none | n/a | Inverts RGB channels. [^12] |
| Sepia | Color transform | none | n/a | Applies brown-yellow tone. [^19] |
| RGB | Color channels | red/green/blue (number, typically 0–255) | 100 | Channel multipliers; set via node.red()/green()/blue(). [^16] |
| HSL | Color space | hue (deg, -180 to 180), saturation (% -100 to 100), luminance (% -100 to 100) | 0 | Adjusts hue, saturation, and luminance. [^9] |
| HSV | Color space | hue (deg, -180 to 180), saturation (-2 to 10), value (-2 to 2) | 0 | Adjusts hue, saturation, and value/brightness. [^10] |
| Threshold | Binarization | threshold (number, 0–1) | 0.5 | Pixels above threshold become white; below black. [^21] |
| Solarize | Tone/effect | threshold (number, typically 0–1) | 0.5 | Inverts highlights above threshold. [^20] |
| Emboss | Stylistic | embossStrength (0–1), embossWhiteLevel (0–1), embossDirection (e.g., 'top-left'), embossBlend (0–1) | 0.5 | Controls intensity, white contribution, lighting direction, and blending. [^13] |
| Kaleidoscope | Geometric | kaleidoscopePower (int, ~2–8), kaleidoscopeAngle (0–360) | 3, 0 | Segments and rotation angle. [^15] |
| Mask | Segmentation/alpha | threshold (number, 0–255) | 10 | Samples corners, masks similar pixels; refines mask to reduce noise. [^24] |
| Multiple Filters | Chaining | array of filter constructors | n/a | Order determines processing sequence. [^14] |
| Custom Filter | Developer-defined | User-defined parameters | n/a | Function(imageData) mutates imageData.data (Uint8ClampedArray, RGBA). [^11] |

This matrix highlights two recurring ideas: (1) the same fundamental steps (cache → filters → set params → redraw) apply everywhere; (2) parameter ranges are intentionally compact and predictable to make interactive tuning straightforward.


## Deprecated vs. Modern Brightness Controls

Konva offers two brightness-related filters: Brighten (deprecated) and Brightness (modern). The modern Brightness filter brings the library closer to CSS filter semantics, and Brighten exists only for backward compatibility. Teams should migrate to Brightness in all new development.

- Brightness (Konva.Filters.Brightness). Parameter brightness: 0 to 2. A value of 0 produces black; 1 preserves the original image; values above 1 brighten the image. This aligns with CSS filter: brightness(). Introduced in Konva 10.0.0. [^4]
- Brighten (Konva.Filters.Brighten, deprecated). Parameter brightness: -1 to 1. Negative values darken; positive values brighten. Marked as deprecated with removal in a future release. [^5]

Table 3 clarifies the differences and migration mapping.

Table 3. Brighten (deprecated) vs Brightness (modern)

| Aspect | Brighten (deprecated) | Brightness (modern) | Migration guidance |
|---|---|---|---|
| Parameter name | brightness | brightness | Same property name; different semantics |
| Range | -1 to 1 | 0 to 2 | Map old values: 0 → 1 (no change), +0.3 → ~1.3, -0.3 → ~0.7 |
| CSS equivalence | None (legacy) | CSS filter: brightness() | Use Brightness to match CSS behavior |
| Status | Deprecated; slated for removal | Active; introduced in Konva 10.0.0 | Replace all Brighten usage with Brightness |
| Typical default | 0.3 | 1.5 | Choose 1.0 for neutral, >1 to brighten, <1 to darken |

The key practical difference is range and calibration. Because Brightness uses a 0–2 scale, it is easier to reason about “50% brightness” (0.5) or “120% brightness” (1.2) and align with CSS mental models. The Brighten filter’s -1 to 1 range is less intuitive and inconsistently aligned with CSS expectations. Migration requires adjusting defaults and UI sliders but delivers a consistent, forward-compatible implementation. [^4][^5]


## Filter Reference (by Type)

Each reference below provides purpose, required parameters and ranges, usage patterns, and framework-specific notes. In all cases, remember the universal pattern: cache the node, assign the filter array, set parameters, and trigger a redraw when changing values.

### Blur

Purpose and behavior. Blur applies a gaussian-like smoothing effect to the image. It is frequently used to simulate depth-of-field or to soften visual noise. [^3]

Parameters and defaults. blurRadius: number (0–40). Examples commonly start at 10. [^3]

Usage.
- Cache the node: image.cache()
- Apply: image.filters([Konva.Filters.Blur])
- Tune: image.blurRadius(value)

Framework notes. In React/Vue, bind blurRadius as a prop and update it reactively. After changing blurRadius, call layer.batchDraw() to refresh the scene.

Table 4. Blur parameter details

| Name | Type | Range | Default in examples | Notes |
|---|---|---|---|---|
| blurRadius | number | 0–40 | 10 | Larger values increase blur intensity; tune with small steps (e.g., 1). [^3] |


### Brightness (Modern) and Brighten (Deprecated)

Modern Brightness (recommended). Purpose: scale overall luminance uniformly. Range 0–2, where 0 is black, 1 is original, and values above 1 brighten. Equivalent in spirit to CSS filter: brightness(). Introduced in Konva 10.0.0. [^4]

Deprecated Brighten. Purpose: legacy brightness control. Range -1 to 1; negative darkens, positive brightens. Status: deprecated with removal planned. Migrate to Brightness. [^5]

Usage.
- Cache the node and assign filters: image.cache(); image.filters([Konva.Filters.Brightness])
- Set parameter: image.brightness(value) or brightness={value} in React/Vue

Migration notes. Replace Brighten with Brightness and update slider ranges and defaults. Table 5 outlines example mappings.

Table 5. Brightness vs Brighten: parameter comparison and mapping examples

| Effect | Brighten (deprecated) | Brightness (modern) | Notes |
|---|---|---|---|
| No change | 0 | 1 | Use 1.0 as neutral |
| Slight brighten | +0.3 | ~1.3 | Adjust slider to 0–2 scale |
| Slight darken | -0.3 | ~0.7 | Choose 0.7 as new default |

Adopt Brightness in all new UI controls to align with CSS expectations and future-proof implementations. [^4][^5]


### Contrast

Purpose and behavior. Adjusts the separation between light and dark tones. Positive values increase contrast; negative values decrease it. [^6]

Parameters and ranges. contrast: number (-100 to 100). Examples commonly initialize at 30–50 for a noticeable effect. [^6]

Usage.
- Apply: image.filters([Konva.Filters.Contrast])
- Tune: image.contrast(value)

Table 6. Contrast parameter details

| Name | Type | Range | Typical defaults | Notes |
|---|---|---|---|---|
| contrast | number | -100 to 100 | 30–50 | 0 = no change; positive increases, negative decreases. [^6] |


### Emboss

Purpose and behavior. Creates a raised relief effect by modeling directional lighting and blending with the original. [^13]

Parameters.
- embossStrength: number (0–1). Controls intensity.
- embossWhiteLevel: number (0–1). Controls the whiteness of lit edges.
- embossDirection: string (e.g., 'top-left'). Light direction.
- embossBlend: number (0–1). Blends emboss with original. [^13]

Usage.
- Apply: image.filters([Konva.Filters.Emboss])
- Configure: image.embossStrength(v), image.embossWhiteLevel(v), image.embossDirection('top-left'), image.embossBlend(v)

Table 7. Emboss parameters

| Name | Type | Range | Default in examples | Notes |
|---|---|---|---|---|
| embossStrength | number | 0–1 | 0.5 | Higher values intensify the effect |
| embossWhiteLevel | number | 0–1 | 0.5 | Controls whiteness in relief |
| embossDirection | string | enumerated (e.g., 'top-left') | 'top-left' | Light azimuth |
| embossBlend | number | 0–1 | 0.5 | Mix with original image |


### Enhance

Purpose and behavior. Stretches color values to span the widest possible dynamic range, improving apparent contrast and colorfulness. Examples show a practical range from -1 to 1 with small steps (e.g., 0.1). [^7]

Parameters and usage.
- enhance: number (-1 to 1)
- Apply: image.filters([Konva.Filters.Enhance]); image.enhance(value)

Table 8. Enhance parameter details

| Name | Type | Range | Step | Default in examples | Notes |
|---|---|---|---|---|---|
| enhance | number | -1 to 1 | 0.1 | 0.4 | Useful for subtle corrections; avoid extreme values. [^7] |


### Grayscale

Purpose and behavior. Converts colors to shades of gray. No parameters. [^8]

Usage.
- Apply: image.filters([Konva.Filters.Grayscale])

Table 9. Grayscale overview

| Parameters | Notes |
|---|---|
| None | Applied directly; often used as a stylistic baseline or for accessibility previews. [^8] |


### HSL (Hue, Saturation, Luminance)

Purpose and behavior. Adjusts hue (angle on the color wheel), saturation (color intensity), and luminance (perceived brightness). [^9]

Parameters and ranges.
- hue: number (degrees, -180 to 180)
- saturation: number (percentage, -100 to 100)
- luminance: number (percentage, -100 to 100)

Usage.
- Apply: image.filters([Konva.Filters.HSL])
- Tune: image.hue(value), image.saturation(value), image.luminance(value)

Table 10. HSL parameters

| Name | Type | Unit | Range | Default |
|---|---|---|---|---|
| hue | number | degrees | -180 to 180 | 0 |
| saturation | number | % | -100 to 100 | 0 |
| luminance | number | % | -100 to 100 | 0 |


### HSV (Hue, Saturation, Value)

Purpose and behavior. Adjusts hue, saturation, and value (brightness-like) with independent controls for hue rotation and channel scaling. [^10]

Parameters and ranges.
- hue: number (degrees, -180 to 180)
- saturation: number (-2 to 10)
- value: number (-2 to 2)

Usage.
- Apply: image.filters([Konva.Filters.HSV])
- Tune: image.hue(value), image.saturation(value), image.value(value)

Table 11. HSV parameters

| Name | Type | Unit | Range | Default |
|---|---|---|---|---|
| hue | number | degrees | -180 to 180 | 0 |
| saturation | number | scalar | -2 to 10 | 0 |
| value | number | scalar | -2 to 2 | 0 |


### Invert

Purpose and behavior. Inverts all color channels, creating a photo-negative-like effect. No parameters. [^12]

Usage.
- Apply: image.filters([Konva.Filters.Invert])

Table 12. Invert overview

| Parameters | Notes |
|---|---|
| None | Often used for visual emphasis or theming; order matters when chaining. [^12] |


### Kaleidoscope

Purpose and behavior. Generates a kaleidoscopic effect by reflecting segments of the image around a center. Controlled by two properties: number of segments (power) and rotation angle. [^15]

Parameters and ranges.
- kaleidoscopePower: number (integer, ~2–8, step 1). Default example: 3.
- kaleidoscopeAngle: number (0–360, step 0.1). Default example: 0.

Usage.
- Apply: image.filters([Konva.Filters.Kaleidoscope])
- Tune: image.kaleidoscopePower(value), image.kaleidoscopeAngle(value)

Table 13. Kaleidoscope parameters

| Name | Type | Range | Step | Default in examples |
|---|---|---|---|---|
| kaleidoscopePower | number | 2–8 | 1 | 3 |
| kaleidoscopeAngle | number | 0–360 | 0.1 | 0 |


### Mask

Purpose and behavior. Removes background by sampling the four image corners, inferring a background color if corners are similar, and then masking pixels similar to that background to transparent. The mask is refined via erosion/dilation-like steps to reduce noise and smooth edges. [^24]

Parameters and ranges.
- threshold: number (0–255). Lower values remove only very similar colors; higher values remove a broader range. Examples often start near 10. [^24]

Usage.
- Apply: image.filters([Konva.Filters.Mask])
- Tune: image.threshold(value)

Table 14. Mask parameter

| Name | Type | Range | Default in examples | Notes |
|---|---|---|---|---|
| threshold | number | 0–255 | 10 | Higher thresholds aggressively mask more pixels; tune carefully for complex backgrounds. [^24] |


### Multiple Filters (Chaining)

Purpose and behavior. Chains multiple filters by passing an array of filter constructors to node.filters([...]). The order in the array is the order of application. [^14]

Usage.
- Cache the node: image.cache()
- Apply: image.filters([Konva.Filters.Blur, Konva.Filters.Brightness, Konva.Filters.Contrast])
- Set values per filter and call layer.batchDraw()

Interactive patterns. Tutorials show toggling filters with checkboxes and adjusting values with sliders. In frameworks, compute the active filter array from component state and pass it to the Image component. [^14]

Table 15. Example filter chains

| Purpose | Array order | Expected outcome |
|---|---|---|
| Subtle smoothing + brightness | [Blur, Brightness] | First blur, then brighten to maintain perceived luminance |
| High-contrast mono look | [Grayscale, Contrast] | Convert to grayscale, then increase contrast |
| Stylized focus | [Brightness, Blur] | Brighten first to reduce noise visibility, then blur |


### Noise

Purpose and behavior. Adds random variations in pixel intensities to simulate film grain or texture. [^17]

Parameters and ranges.
- noise: number (0–1). Defaults in examples range from 0.3 to 0.5. [^17]

Usage.
- Apply: image.filters([Konva.Filters.Noise])
- Tune: image.noise(value)

Table 16. Noise parameter

| Name | Type | Range | Typical defaults | Notes |
|---|---|---|---|---|
| noise | number | 0–1 | 0.3–0.5 | Use small increments; values near 1 can overwhelm detail. [^17] |


### Pixelate

Purpose and behavior. Produces a blocky, low-resolution look by enlarging pixels. [^18]

Parameters and ranges.
- pixelSize: number (≥1). Common example starts at 8. [^18]

Usage.
- Apply: image.filters([Konva.Filters.Pixelate])
- Tune: image.pixelSize(value)

Table 17. Pixelate parameter

| Name | Type | Range | Default in examples | Notes |
|---|---|---|---|---|
| pixelSize | number | ≥1 | 8 | Larger sizes produce more pronounced pixelation. [^18] |


### RGB (Channel Adjustments)

Purpose and behavior. Scales individual red, green, and blue channels, allowing color casting and per-channel gain control. [^16]

Parameters and ranges.
- red/green/blue: number (typically 0–255). Examples start at 100. [^16]

Usage.
- Apply: image.filters([Konva.Filters.RGB])
- Tune: image.red(value), image.green(value), image.blue(value)

Table 18. RGB parameters

| Name | Type | Range | Default in examples | Notes |
|---|---|---|---|---|
| red | number | 0–255 | 100 | Increase to warm; decrease to neutralize |
| green | number | 0–255 | 100 | Increase to lift greens |
| blue | number | 0–255 | 100 | Increase to cool; decrease to reduce cast |


### Sepia

Purpose and behavior. Applies a sepia tone effect. No tunable parameters in the documentation. [^19]

Usage.
- Apply: image.filters([Konva.Filters.Sepia])

Table 19. Sepia overview

| Parameters | Notes |
|---|---|
| None | Fixed tonal mapping; often used for vintage styling. [^19] |


### Solarize

Purpose and behavior. Inverts portions of the image that exceed a threshold, a classic photographic solarization effect. [^20]

Parameters and ranges.
- threshold: number (0–1). Example default around 0.5. [^20]

Usage.
- Apply: image.filters([Konva.Filters.Solarize])
- Tune: image.threshold(value)

Table 20. Solarize parameter

| Name | Type | Range | Default in examples | Notes |
|---|---|---|---|---|
| threshold | number | 0–1 | 0.5 | Lower thresholds solarize more highlights; raise to reduce effect. [^20] |


### Threshold

Purpose and behavior. Produces a binary (black/white) image. Pixels with intensity above the threshold become white; others become black. [^21]

Parameters and ranges.
- threshold: number (0–1). Example default around 0.5. [^21]

Usage.
- Apply: image.filters([Konva.Filters.Threshold])
- Tune: image.threshold(value)

Table 21. Threshold parameter

| Name | Type | Range | Default in examples | Notes |
|---|---|---|---|---|
| threshold | number | 0–1 | 0.5 | Raise to convert more pixels to white; lower for more black. [^21] |


### Custom Filter (Developer-Defined)

Purpose and behavior. A custom filter is any JavaScript function that accepts an ImageData object and directly mutates its data. The data buffer is a Uint8ClampedArray of RGBA values, four entries per pixel. Konva exposes this via node.cache(), then node.filters([MyFilter]). [^11]

Contract and pattern.
- Signature: function(imageData)
- Mutability: Mutate imageData.data in place
- Array layout: For pixel i, indices are [i*4 + 0] (R), [i*4 + 1] (G), [i*4 + 2] (B), [i*4 + 3] (A)

A canonical example is RemoveAlpha, which sets alpha to fully opaque for every pixel:

- For i from 0 to data.length - 1 step 4: data[i + 3] = 255

Integration steps.
- Define: Konva.Filters.MyFilter = function(imageData) { /* mutate imageData.data */ }
- Apply: image.cache(); image.filters([Konva.Filters.MyFilter])
- Recache or redraw as needed when parameters change

Table 22. ImageData array layout

| Index offset | Channel | Meaning |
|---|---|---|
| i + 0 | Red | 0–255 |
| i + 1 | Green | 0–255 |
| i + 2 | Blue | 0–255 |
| i + 3 | Alpha | 0–255 |

Custom filters inherit the same performance and ordering considerations as built-in filters: keep operations tight, chain only what you need, and batch draws in interactive scenarios. [^11]


## Framework Integration Patterns (React & Vue)

While the filter APIs are identical across environments, the mechanics of reactivity differ between vanilla JavaScript and component frameworks. The guidance below distills robust patterns.

React. Use a ref for the image node, cache in a useEffect hook when the image is ready, and pass both filters and filter-specific props to the <Image> component. Update parameters via state setters (e.g., setBrightness) and let the component rerender. Always ensure the node is cached before filters are applied. [^4][^5][^14]

Vue. Use a ref for the image node, watch the image asset, and cache within nextTick after the image becomes available. Pass filters and parameters via the :config prop on v-image. Recache if you change styles that affect the node’s renderability. The Vue filters guide explicitly recommends recaching nodes when styles update. [^22]

Recaching policy. Recache when:
- The image source changes
- Any property that influences the cached bitmap changes
- Framework lifecycle or asset loading requires it (e.g., mounted/mounted hooks, watch on image assets)

Table 23 summarizes a recommended recache policy.

Table 23. Recommended recache policy across frameworks

| Trigger | Vanilla JS | React | Vue |
|---|---|---|---|
| Image load | Call node.cache() after onload | useEffect(() => node.cache(), [image]) | Watch image; cache in nextTick |
| Property changes | If filter or geometry changes, recache; else just batchDraw | Recache only if required; prefer prop changes and batchDraw | Recache if styles change; otherwise batchDraw |
| Filter parameters | batchDraw after change | batchDraw via rerender or explicit draw | batchDraw via watcher or explicit draw |

These patterns ensure the cached pixel buffer stays synchronized with your scene graph and that UI interactions remain responsive. [^14][^22]


## Best Practices, Performance, and Edge Considerations

- Recache on image/asset changes. If the underlying image changes, call node.cache() again; otherwise the filter continues to process the old buffer. [^14]
- Chaining sequence matters. The order in node.filters([...]) determines how effects stack. For example, apply expensive noise after cheaper adjustments so that final compositing minimizes artifacts. [^14]
- Avoid redundant work. Prefer batchDraw over full scene redraws. If you update multiple parameters in a row, batch them and draw once. [^14]
- Moderate thresholds for Mask. A threshold that is too high can remove wanted detail; too low may leave background artifacts. Start near 10 and tune by small increments. [^24]
- Embrace CSS-like semantics for Brightness. Brightness aligns with CSS filter: brightness(); adopt a 0–2 scale and interpret values as multipliers for more intuitive controls. [^4]
- Fall back deliberately. If you must support Brighten for legacy content, isolate its usage and plan a controlled migration to Brightness. [^5]
- Treat enhance cautiously. Small values often suffice; large magnitudes can produce unnatural colors. Use step sizes around 0.1 for precise control. [^7]

Collectively, these practices improve both performance and visual predictability, especially in interactive tools where users adjust multiple parameters in real time.


## Appendix: Parameter Ranges and Defaults Quick Reference

Table 24 collects parameter ranges, units, and defaults as observed in examples across the tutorials. Treat defaults as typical starting points, not hard specifications.

Table 24. Master parameter table

| Filter | Parameter | Type | Range | Unit | Default (examples) | Notes |
|---|---|---|---|---|---|---|
| Blur | blurRadius | number | 0–40 | px | 10 | Larger values intensify blur. [^3] |
| Brightness | brightness | number | 0–2 | scale | 1.5 | 0=black, 1=original, >1 brighten. [^4] |
| Brighten (dep.) | brightness | number | -1 to 1 | scale | 0.3 | Deprecated; migrate to Brightness. [^5] |
| Contrast | contrast | number | -100 to 100 | n/a | 30–50 | 0 = no change. [^6] |
| Enhance | enhance | number | -1 to 1 | n/a | 0.4 | Step 0.1 typical. [^7] |
| Noise | noise | number | 0–1 | n/a | 0.3–0.5 | Grain strength. [^17] |
| Pixelate | pixelSize | number | ≥1 | n/a | 8 | Block size. [^18] |
| HSL | hue | number | -180 to 180 | deg | 0 | Color wheel rotation. [^9] |
| HSL | saturation | number | -100 to 100 | % | 0 | Color intensity. [^9] |
| HSL | luminance | number | -100 to 100 | % | 0 | Perceived brightness. [^9] |
| HSV | hue | number | -180 to 180 | deg | 0 | Color wheel rotation. [^10] |
| HSV | saturation | number | -2 to 10 | n/a | 0 | Saturation scaling. [^10] |
| HSV | value | number | -2 to 2 | n/a | 0 | Brightness-like channel. [^10] |
| RGB | red | number | 0–255 | n/a | 100 | Channel gain. [^16] |
| RGB | green | number | 0–255 | n/a | 100 | Channel gain. [^16] |
| RGB | blue | number | 0–255 | n/a | 100 | Channel gain. [^16] |
| Emboss | strength | number | 0–1 | n/a | 0.5 | Intensity. [^13] |
| Emboss | whiteLevel | number | 0–1 | n/a | 0.5 | Whitness of edges. [^13] |
| Emboss | direction | string | enum | n/a | 'top-left' | Light direction. [^13] |
| Emboss | blend | number | 0–1 | n/a | 0.5 | Mix with original. [^13] |
| Kaleidoscope | power | number | 2–8 | n/a | 3 | Number of segments. [^15] |
| Kaleidoscope | angle | number | 0–360 | deg | 0 | Rotation. [^15] |
| Mask | threshold | number | 0–255 | n/a | 10 | Background similarity cutoff. [^24] |
| Threshold | threshold | number | 0–1 | n/a | 0.5 | Binarization cutoff. [^21] |
| Solarize | threshold | number | 0–1 | n/a | 0.5 | Highlight inversion point. [^20] |


## References

[^1]: Konva.Filters | Konva - JavaScript Canvas 2d Library. https://konvajs.org/api/Konva.Filters.html  
[^2]: Filters Documentation landing page (Docs). https://konvajs.org/docs/filters/  
[^3]: HTML5 Canvas Blur Image Filter Tutorial. https://konvajs.org/docs/filters/Blur.html  
[^4]: HTML5 Canvas Brightness Image Filter Tutorial. https://konvajs.org/docs/filters/Brightness.html  
[^5]: HTML5 Canvas Brighten Image Filter Tutorial (Deprecated). https://konvajs.org/docs/filters/Brighten.html  
[^6]: HTML5 Canvas Contrast filter Image Tutorial. https://konvajs.org/docs/filters/Contrast.html  
[^7]: HTML5 Canvas Enhance Image Filter Tutorial. https://konvajs.org/docs/filters/Enhance.html  
[^8]: HTML5 Canvas Grayscale Image Filter Tutorial. https://konvajs.org/docs/filters/Grayscale.html  
[^9]: HTML5 Canvas HSL filter Image Tutorial. https://konvajs.org/docs/filters/HSL.html  
[^10]: HTML5 Canvas HSV filter Image Tutorial. https://konvajs.org/docs/filters/HSV.html  
[^11]: HTML5 Canvas Custom Filter Tutorial. https://konvajs.org/docs/filters/Custom_Filter.html  
[^12]: HTML5 Canvas Invert Image Filter Tutorial. https://konvajs.org/docs/filters/Invert.html  
[^13]: HTML5 Canvas Emboss filter Image Tutorial. https://konvajs.org/docs/filters/Emboss.html  
[^14]: HTML5 Canvas Multiple Filters Tutorial. https://konvajs.org/docs/filters/Multiple_Filters.html  
[^15]: HTML5 Canvas Kaleidoscope Image Filter Tutorial. https://konvajs.org/docs/filters/Kaleidoscope.html  
[^16]: HTML5 Canvas RGB filter Image Tutorial. https://konvajs.org/docs/filters/RGB.html  
[^17]: HTML5 Canvas Noise filter Image Tutorial. https://konvajs.org/docs/filters/Noise.html  
[^18]: HTML5 Canvas Pixelate filter Image Tutorial. https://konvajs.org/docs/filters/Pixelate.html  
[^19]: HTML5 Canvas Sepia filter Image Tutorial. https://konvajs.org/docs/filters/Sepia.html  
[^20]: HTML5 Canvas Solarize filter Image Tutorial. https://konvajs.org/docs/filters/Solarize.html  
[^21]: HTML5 Canvas Threshold filter Image Tutorial. https://konvajs.org/docs/filters/Threshold.html  
[^22]: How to apply canvas filters with Vue and Konva. https://konvajs.org/docs/vue/Filters.html  
[^23]: Konva.Node API. https://konvajs.org/api/Konva.Node.html  
[^24]: HTML5 Canvas Mask Image Filter Tutorial. https://konvajs.org/docs/filters/Mask.html

---

### Information Gaps Noted

- No explicit performance benchmarks across filters and chains.  
- No mobile GPU acceleration notes.  
- No official TypeScript typings coverage.  
- No complete algorithm details for Emboss and Mask beyond parameters and behavior.  
- No cross-browser visual parity notes.  
- No hardening guidance for Mask under complex backgrounds beyond threshold tuning.# Konva.js Tweens and Animations: Comprehensive Technical Documentation

## Executive Summary and Scope

Konva.js provides two complementary animation systems for HTML5 Canvas: frame-based animations via Konva.Animation and property tweening via Konva.Tween. This guide synthesizes official documentation into a cohesive, example-driven reference for building smooth, performant motion in Vanilla JavaScript, React, and Vue environments. It covers controls, easings (including Linear), advanced tweening (e.g., gradients), text animations, frame and time management, property and method catalogs, and optimization best practices.

Two primary constructs power most animations:
- Konva.Animation for frame-based updates and manual control of time, position, and properties per tick.[^1]
- Konva.Tween for interpolating numeric properties between states with built-in easing and lifecycle controls.[^2]

These constructs can be combined or used separately depending on use case complexity, performance requirements, and the developer’s need for timeline control.[^3]

To orient implementation choices, Table 1 compares the two systems across common criteria.

Table 1. Konva.Animation vs Konva.Tween: quick comparison

| Criterion | Konva.Animation | Konva.Tween |
|---|---|---|
| Execution model | Per-frame function invoked by Konva’s engine | Property interpolation over a duration |
| Time handling | frame.time, frame.timeDiff, frame.frameRate | Duration in seconds; internal time managed by tween |
| Use cases | Custom logic, physics, trajectories, continuous updates | Simple property transitions with easing (e.g., x, y, scale, rotation, opacity) |
| Built-in redraw | Yes; manages layer redraws if layers are attached | Yes; property updates trigger redraws |
| Timeline control | Manual via start/stop; developer computes progress | Built-in play/pause/reverse/seek/reset/finish |
| Complexity | Higher for multi-step sequences (manual) | Lower for simple transitions (declarative config) |

In practice:
- Use Konva.Tween for simple, single-property or multi-property transitions with easing (e.g., move a rectangle to a target position with EaseInOut).
- Use Konva.Animation for custom frame logic (e.g., parametric motion, rotations based on timeDiff, or dynamic render-time effects).
- Combine them when needed (e.g., tween properties while manually updating complex gradients per frame).[^1][^2][^3]

## Foundations: Konva Animation Model

Konva.Animation is a constructor that takes an update function and optional layer(s). Konva calls the update function on each animation frame, passing a frame object. The developer updates node properties inside this function; Konva handles the redraws when layers are attached. The update function should not perform manual redraws; it should only mutate properties.[^1][^4]

The frame object provides three key fields for time-based logic:
- frame.time: total milliseconds since the animation started.
- frame.timeDiff: milliseconds since the previous frame.
- frame.frameRate: current frames per second (FPS).[^1]

These values enable frame-rate independent motion. For example, to rotate a shape at a constant angular speed regardless of FPS, compute the angle delta using timeDiff and convert milliseconds to seconds.

Table 2. Konva.Animation frame object fields and semantics

| Field | Type | Description |
|---|---|---|
| time | number (ms) | Total elapsed time since animation start |
| timeDiff | number (ms) | Delta since last frame; drives frame-rate independent updates |
| frameRate | number (FPS) | Current measured frame rate |

Konva.Animation lifecycle is controlled via start() and stop(). setLayers(), addLayer(), and getLayers() manage which layers are redrawn each frame. isRunning() reports current state.[^1] The attached layers determine redraw scope; omitting them can suppress visual updates unless the app manually draws.

### Frame-Based Motion Fundamentals

Because frame rate varies across devices and load conditions, use timeDiff to normalize motion. A simple conversion is: seconds = timeDiff / 1000. For constant speed v (in pixels per second) over time delta dt: deltaX = v * dt. Converting to milliseconds yields deltaX = v * (timeDiff / 1000). This ensures smoothness across FPS fluctuations.[^1]

For example, rotation with angularSpeed in degrees per second: angleDiff = (angularSpeed * timeDiff) / 1000. Applying shape.rotate(angleDiff) each frame yields a uniform rotation independent of FPS.[^6]

## Tweening Fundamentals

Konva.Tween animates numeric properties from their current values to target values over a specified duration, using a selected easing function. By default, tweens use Linear easing.[^2][^7] You configure a tween by passing a config object to new Konva.Tween(config). Common target properties include x, y, rotation, scaleX, scaleY, width, height, radius, strokeWidth, opacity, offsetX, and offsetY.[^7]

Developers can create tweens directly or use the node.to(config) convenience method to start a tween immediately on a node. node.to(...) is ideal for simple, single-use transitions, while constructing Konva.Tween enables reuse and more granular control (e.g., pause(), reverse(), seek()).[^2][^3]

Table 3. Commonly tweened properties and expected value types

| Property | Type | Notes |
|---|---|---|
| x, y | number | Position |
| rotation | number (degrees) | Rotation angle |
| scaleX, scaleY | number | Scaling factors; 1 = no scale |
| width, height | number | Size |
| radius | number | For circles/shapes using radius |
| strokeWidth | number | Stroke thickness |
| opacity | number (0–1) | Transparency |
| offsetX, offsetY | number | Transform origin offsets |

Konva’s tween config object also accepts parameters such as duration (seconds) and easing (a Konva.Easings function), enabling predictable timing and motion characteristics.[^2][^7] While the full config schema is not enumerated in the extracted API, these fields are consistently used across tutorials and examples.[^7]

### Linear Easing (Default)

Linear easing produces uniform progression of a property over time. It is the default if no easing is specified, and can also be set explicitly via Konva.Easings.Linear.[^2][^7] Linear motion is suitable for steady movement, fades, or any property where constant rate is desired.

Table 4. Linear vs common non-linear easings (conceptual overview)

| Easing | Motion Character | Typical Use Cases |
|---|---|---|
| Linear | Uniform rate | Movement, fades, simple transitions |
| EaseIn | Slow start, accelerates | Emphasize onset (e.g., dropdowns) |
| EaseOut | Fast start, decelerates | Emphasize finish (e.g., landing) |
| EaseInOut | Slow start and end, faster middle | Natural feel for UI transitions |

The key takeaway: select easing to match the desired motion narrative; use Linear when uniform rate is appropriate and non-linear easings when you want acceleration/deceleration effects.[^9]

## Animation Controls

Konva.Tween exposes lifecycle controls: play(), pause(), reverse(), reset(), finish(), and seek().[^8] These methods enable timeline manipulation and user interactions such as scrubbing, pausing on navigation, or reversing direction mid-animation.

Table 5. Tween controls: method, purpose, and parameters

| Method | Purpose | Parameter(s) | Notes |
|---|---|---|---|
| play() | Start or resume | None | Continues from current time |
| pause() | Pause | None | Freezes progress |
| reverse() | Reverse direction | None | Swaps progression direction |
| reset() | Reset to initial state | None | Rewinds to start values |
| finish() | Jump to final state | None | Applies end values immediately |
| seek(position) | Jump to position | position: number (tutorial states normalized 0–1) | Moves to specific progress point[^8] |

The seek() parameter semantics are described in the tutorial using normalized positions (0 to 1), mapping to 0% and 100% of the tween’s duration.[^8] When implementing scrubbing or progress sliders, use normalized positions with reset()/play() as needed for user-driven navigation.

## Easings: Complete Catalog and Common Usage

Konva groups easing functions into categories that reflect their motion character. The All Easings tutorial enumerates the full set.[^10]

Table 6. Easing catalog by category (from All Easings)

| Category | Functions |
|---|---|
| Linear | Linear |
| Ease | EaseIn, EaseOut, EaseInOut |
| Back | BackEaseIn, BackEaseOut, BackEaseInOut |
| Elastic | ElasticEaseIn, ElasticEaseOut, ElasticEaseInOut |
| Bounce | BounceEaseIn, BounceEaseOut, BounceEaseInOut |
| Strong | StrongEaseIn, StrongEaseOut, StrongEaseInOut |

Commonly used easings in applications include Linear, EaseIn, EaseOut, and EaseInOut.[^9] The Ease family provides smooth acceleration/deceleration curves that feel natural for UI elements. Back and Elastic easings add overshoot or spring-like effects for playful or attention-grabbing transitions. Bounce easings emulate physical impact bounces. Strong easings provide amplified acceleration/deceleration characteristics.

Table 7. Common easings and motion character

| Easing | Motion Narrative | Example Use Case |
|---|---|---|
| Linear | Constant rate | Sliding panels, fading |
| EaseIn | Accelerating start | Drop-in menus |
| EaseOut | Decelerating end | Tooltip pop-ins |
| EaseInOut | Smooth in/out | Card transitions |

Selecting easings is an editorial choice. Use Linear for functional motion where predictability matters; choose EaseInOut for natural, pleasing motion that avoids abrupt starts or stops.[^9][^10]

## Animation Types: Practical Recipes

Konva.Animation drives movement, rotation, and scaling through property updates on each frame. These tutorials present idiomatic patterns that generalize across frameworks.[^4][^5][^6]

### Create an Animation

The constructor takes an update function and optional layer(s). The function receives the frame object and should update node properties. Avoid manual redraw calls; let Konva handle layer redraws when layers are attached.[^4][^1]

Table 8. Konva.Animation constructor and control methods

| Item | Signature / Method | Notes |
|---|---|---|
| Constructor | new Konva.Animation(func, layers?) | layers may be a Layer or array of Layers |
| Control | start(), stop() | Start begins ticks; stop halts |
| Layer management | setLayers(layers), addLayer(layer), getLayers() | Manage redraw scope |
| Status | isRunning() | Boolean running state |
| Frame fields | frame.time, frame.timeDiff, frame.frameRate | Time and rate context |

Typical usage: create the animation, start() it, and stop() on component unmount or user action to avoid unnecessary CPU usage and memory retention.[^4][^5]

### Moving (Position Animation)

To animate a shape’s position, update x and y per frame. Use frame.time to drive parametric motion such as sine-based oscillation. The common pattern sets an amplitude and period to compute x over time.[^5]

Table 9. Position animation variables and calculation

| Variable | Meaning |
|---|---|
| amplitude | Maximum displacement from origin |
| period | Duration of one full cycle (ms) |
| x formula | amplitude * Math.sin((frame.time * 2π) / period) + initial_x |

The sine-based path produces smooth oscillation. If you need circular motion, compute both x and y using cosine and sine respectively with the same period and radius.[^5]

### Rotation

Rotation is controlled with shape.rotate(angleDiff). To rotate around a point other than the default top-left corner, set the shape’s offset. The default offset is {x: 0, y: 0}; center rotation uses offset = {width/2, height/2}. External rotation points are set by positioning the offset relative to the shape’s position.[^6]

Table 10. Rotation configuration options

| Option | Effect |
|---|---|
| offset {x: 0, y: 0} | Rotate around top-left corner |
| offset {width/2, height/2} | Rotate around center |
| Custom offset | Rotate around an external pivot point |

Because Konva accepts angle differences per frame rather than absolute angles, use frame.timeDiff to compute angleDiff = (angularSpeed * timeDiff) / 1000 for consistent angular velocity.[^6]

### Scaling

Scaling uses scaleX, scaleY, or scale({x, y}). You can scale uniformly or independently per axis. A common pattern uses a sinusoidal calculation to produce periodic scale changes.[^6]

Table 11. Scaling variations

| Property | Description |
|---|---|
| scaleX | Scale along X-axis |
| scaleY | Scale along Y-axis |
| scale({x, y}) | Uniform or independent scaling via object |

For example, scale = Math.sin(frame.time * 2π / period) + 2 produces a periodic expansion and contraction with an offset to keep values positive.[^6]

### Stop Animation

To stop a running animation, call stop(); to restart, call start(). This is typically invoked on user actions or component teardown to prevent memory and CPU waste.[^5]

Table 12. Start/stop behaviors and invocation patterns

| Action | Method | Typical Trigger |
|---|---|---|
| Halt | stop() | Button click, unmount |
| Resume | start() | Button click |

### Text Animations (charRenderFunc)

From Konva v10.0.0, the charRenderFunc property enables character-by-character rendering customization. The function is executed for each character before draw, exposing char, index, positions, and context. Developers can apply per-character transformations, opacity, or effects.[^11]

Table 13. charRenderFunc parameters and effects

| Parameter | Meaning |
|---|---|
| char | Character string |
| index | Character index in text |
| x, y | Render position |
| lineIndex, column | Line and column positions |
| isLastInLine | Boolean flag for line end |
| width | Character width |
| context | Canvas 2D context (apply transforms/opacity) |

Common patterns include sequential fades or wave-like effects by modulating context.globalAlpha or applying context.translate() per character index over time. charRenderFunc integrates naturally with Konva.Animation, enabling dynamic text reveal effects.[^11]

## Finish Event and Completion Handling

The All Controls tutorial documents finish() for immediate completion and seek() for timeline scrubbing.[^8] However, the complete tween config schema—including onFinish, onUpdate, or other callbacks—is not fully enumerated in the extracted content. In the interim, common completion strategies include:

- Using finish() to jump to the final state and then destroy() the tween instance to release resources.[^2][^13]
- For chained sequences, start the next tween inside the prior tween’s completion path as shown in complex tweening patterns.[^12] (Note: if using a GreenSock plugin, follow its chaining mechanism.)
- Where node.to(config) is used for convenience, ensure that subsequent actions are triggered by external cues (e.g., user interaction) or combine with Konva.Animation when dynamic timing is needed.[^3]

Table 14. Completion handling strategies

| Strategy | Mechanism | Notes |
|---|---|---|
| Immediate finish | tween.finish() | Jump to end state; pair with destroy() |
| Scrubbing | tween.seek(position) | Normalized 0–1 progress; hook to UI |
| Chaining | Start next tween on first’s end | Pattern demonstrated in complex tutorial[^12] |
| Lifecycle cleanup | tween.destroy() | Avoid leaks; essential after completion[^13] |

## Advanced Techniques: Complex Tweening and Filter/Gradient Animation

Konva’s built-in tweens handle most numeric property transitions, but certain advanced scenarios require additional work. The Complex Tweening tutorial demonstrates two important patterns:[^12]

- Chained tweens: start one tween, then another on completion (e.g., scale up then scale down).
- Gradient tweening via Konva.Animation: tweening fillLinearGradientColorStops—a complex array of positions and colors—by updating it manually inside a frame loop while using tweens for other properties.

Table 15. Gradient tweening approach

| Component | Approach | Notes |
|---|---|---|
| fillLinearGradientColorStops | Update per frame using Konva.Animation | Because the property is an array of color stops, manual updates in the update function are used |
| Other properties | Use Konva.Tween | Combine with frame updates for complex effects |
| Tooling | GreenSock Konva Plugin | Recommended for power users requiring timeline features beyond Konva’s built-in tweens[^12][^14] |

When standard tweens reach their limits—particularly for timelines, complex sequencing, or advanced interpolation—consider the GreenSock Konva Plugin.[^14] It offers richer controls and performance-oriented features tailored for complex motion graphics.[^12][^14]

## Tween API: Properties, Methods, and Usage Patterns

Konva.Tween’s constructor is new Konva.Tween(config). Typical usage patterns include:
- node.to(config) for quick, one-off transitions.
- Constructing a Konva.Tween instance for reuse and timeline control (play, pause, reverse, seek, reset, finish).[^2][^8]

Table 16. Konva.Tween methods and semantics

| Method | Semantics |
|---|---|
| play() | Start or resume |
| pause() | Pause progress |
| reverse() | Reverse direction |
| reset() | Return to initial state |
| finish() | Jump to final state |
| seek(position) | Move to normalized position (0–1) |
| destroy() | Release the instance; avoid leaks |

Common configuration parameters (as seen across tutorials and API):
- node: target Konva node.
- duration: seconds for the tween.
- easing: Konva.Easings function.
- Target property values (e.g., x, y, scaleX, rotation, opacity).[^2][^7][^9]

Table 17. Tween configuration parameters (commonly used)

| Parameter | Type | Purpose |
|---|---|---|
| node | Konva.Node | Target to animate |
| duration | number (seconds) | Total time |
| easing | Konva.Easings function | Motion curve |
| …targets | number/object | Final values (e.g., x, y, scale({x, y})) |

Destroying tweens after completion or cancellation is a best practice to prevent memory leaks.[^13] This is especially important in single-page applications or long-running dashboards where many tweens may be created during navigation or interactions.

## Performance Optimization for Animations

Performance is paramount for smooth animation. Konva’s guidance emphasizes minimizing computation, limiting redraw scope, and reducing per-frame overhead.[^15]

Key practices:
- Prefer Konva.Animation over raw requestAnimationFrame for animation handling and to avoid unnecessary redraws.[^16]
- Cache complex shapes via shape.cache() to avoid recomposition cost each frame.[^17]
- Minimize animated nodes and only update properties that change.[^16]
- Manage layers and listening flags to reduce event processing overhead.[^15]
- On high-DPI devices, consider Konva.pixelRatio = 1 to trade some visual fidelity for performance.[^15]
- Avoid memory leaks by destroying tweens and removing nodes no longer needed.[^13][^15]

Table 18. Optimization techniques and expected impact

| Technique | Impact | Notes |
|---|---|---|
| Use Konva.Animation | High | Engine-managed ticks; fewer redundant draws[^16] |
| Animate only necessary properties | Medium | Less per-frame computation[^16] |
| Shape caching (cache()) | High | Significant gains for complex shapes[^17] |
| Minimize animated nodes | High | Lower draw and update load[^16] |
| Layer management | Medium | Fewer canvases and redraw scopes[^15] |
| layer.listening(false) | Medium | Avoid event processing when not needed[^15] |
| Disable perfect draw | Medium | Skip extra work when acceptable[^15] |
| Optimize strokes | Medium | Reduce shadow + stroke extra draw[^15] |
| Drag layer optimization | Medium | Reduce drag redraws by moving to a dedicated layer[^15] |
| pixelRatio = 1 | Medium | Less work on retina devices[^15] |
| Destroy tweens / nodes | High | Avoid leaks; keep memory stable[^13][^15] |

Table 19. Memory management checklist

| Action | Purpose | API |
|---|---|---|
| Destroy tweens | Release references | tween.destroy()[^13] |
| Remove nodes | Detach from layer | node.remove()[^13] |
| Stop animations | Avoid stray ticks | anim.stop()[^5] |
| Clean up on unmount | Prevent leaks | Call stop()/destroy() in teardown[^5][^13] |

Taken together, these practices reduce CPU/GPU load and keep memory bounded, producing consistently smooth motion even under load.

## Appendix: Reference Links and Glossary

Glossary
- Konva.Animation: Frame-based animation constructor that invokes an update function per tick, with managed redraws when layers are attached.[^1]
- Konva.Tween: Property interpolation engine that animates numeric node properties over a duration with an easing function.[^2]
- frame.time: Milliseconds since animation start; used for parametric motion.[^1]
- frame.timeDiff: Milliseconds since the prior frame; used for frame-rate independent updates.[^1]
- frame.frameRate: Current FPS; can inform adaptive logic.[^1]
- easing: Function that maps progress to motion curve (e.g., Linear, EaseInOut).[^10]
- offset: Transform origin offset for rotation/scaling; determines pivot point.[^6]
- cache(): Shape method to prerender into a buffer for faster drawing.[^17]
- perfectDrawEnabled: Flag to enable/disable additional drawing work for canvas consistency; disabling can improve performance.[^15]

Notes on information gaps
- The full Tween config schema—including onFinish/onUpdate callbacks—is not captured in the extracted API content. Use finish(), destroy(), and chaining patterns as interim completion handling.
- seek() semantics are tutorial-normalized (0–1); the precise internal mapping across all overloads is not fully detailed in the extracted sources.

---

## References

[^1]: Konva.Animation API. https://konvajs.org/api/Konva.Animation.html  
[^2]: Konva.Tween API. https://konvajs.org/api/Konva.Tween.html  
[^3]: Create an Animation Tutorial. https://konvajs.org/docs/animations/Create_an_Animation.html  
[^4]: Create an Animation Tutorial (update function and layers). https://konvajs.org/docs/animations/Create_an_Animation.html  
[^5]: Animate Position (Moving) Tutorial. https://konvajs.org/docs/animations/Moving.html  
[^6]: Rotation Animation Tutorial. https://konvajs.org/docs/animations/Rotation.html  
[^7]: Basic Tweening (Linear Easing) Tutorial. https://konvajs.org/docs/tweens/Linear_Easing.html  
[^8]: All Tween Controls Tutorial. https://konvajs.org/docs/tweens/All_Controls.html  
[^9]: Simple (Common) Easings Tutorial. https://konvajs.org/docs/tweens/Common_Easings.html  
[^10]: All Easings Tutorial. https://konvajs.org/docs/tweens/All_Easings.html  
[^11]: Text Animations Tutorial (charRenderFunc). https://konvajs.org/docs/animations/Text_Animations.html  
[^12]: Complex Tweening Tutorial (Chaining, Gradient tweening via Konva.Animation). https://konvajs.org/docs/tweens/Complex_Tweening.html  
[^13]: Avoid Memory Leaks (Tween cleanup and node removal/destroy). https://konvajs.org/docs/performance/Avoid_Memory_Leaks.html  
[^14]: GreenSock Konva Plugin (GitHub). https://github.com/konvajs/greensock-plugin  
[^15]: All Performance Tips (Stage, Layer, Shape, Animation optimizations). https://konvajs.org/docs/performance/All_Performance_Tips.html  
[^16]: Optimize Animation Performance Tip. https://konvajs.org/docs/performance/Optimize_Animation.html  
[^17]: Shape Caching Performance Tip. https://konvajs.org/docs/performance/Shape_Caching.html# Konva.js Selectors and Data Serialization: A Complete Guide with Best Practices

## Executive Summary and Scope

This guide is a practitioner’s manual for selecting, serializing, loading, and exporting HTML5 Canvas scenes built with Konva.js. It consolidates the official selector patterns (by name, by type, and by id), explains the role and usage of find() and findOne(), clarifies what toJSON() does and does not serialize, and details robust workflows for simple and complex loads. It also explains high-quality export techniques, including pixelRatio tuning and security constraints when exporting stage content to image data URLs. Finally, it distills Konva’s performance advice into concrete, selection- and serialization-aware recommendations.

Key takeaways:
- Use container-scoped queries and prefer findOne() when you expect a single match. Track names and ids diligently and avoid global selectors across very large stage trees to minimize traversal overhead.[^7][^9]
- Serialize only what you need. node.toJSON() captures attributes but not event handlers or images; manage state outside the canvas and reconstruct nodes as needed.[^1]
- For exports, Stage.toDataURL() requires a callback. Tune pixelRatio for crisp output on high-density displays and ensure image assets respect same-origin rules to avoid security errors.[^4][^5]
- For complex loads that include images and event bindings, apply post-load wiring: rebind events and reattach image sources after Node.create(); in frameworks, treat direct JSON deserialization as an anti-pattern and render from state instead.[^3][^6][^10]

The scope covers: selector APIs and syntax; Stage serialization with toJSON(); simple versus complex loading; data URL exports; performance practices; and framework-specific cautions (React/Vue). Where the official documentation is silent, known gaps are flagged for engineering judgment and testing.

## Konva Node Model and Selector Primitives

Konva’s node hierarchy—Stage at the root, with Layer and Group containers hosting Shape nodes—forms a tree in which selection is a fundamental operation. Any node can act as a selector root: invoking find() or findOne() from a container (Stage, Layer, or Group) searches within that subtree. This design is intentional: it bounds the search space and encourages locality-aware queries, which is a core performance tactic in large scenes.[^7][^8][^9]

Konva supports CSS-like selection semantics:
- Select by name using the dot (.) prefix, e.g., layer.find('.myCircle').[^7]
- Select by type/class using the class name, e.g., layer.find('Circle').[^8]
- Select by id using the hash (#) prefix, e.g., layer.find('#rectId'). For single matches, findOne('#id') is idiomatic.[^9]

These string selectors are available on any Container (Stage, Layer, Group, FastLayer) via the find() method, which returns an array of matching nodes. A function predicate is also supported for advanced filters, though most applications rely on the string form.[^11][^12]

To anchor terminology and expected return types, Table 1 summarizes the selector syntax and usage.

Table 1. Selector syntax cheat sheet

| Selector target | Syntax example      | Scope                    | Return type                     | Typical usage                                      | Reference |
|-----------------|---------------------|--------------------------|----------------------------------|----------------------------------------------------|-----------|
| Name            | '.myCircle'         | Container (Stage/Layer/Group) | Array of Nodes                   | Group operations on logically related shapes       | [^7]      |
| Type/Class      | 'Circle'            | Container                | Array of Nodes                   | Bulk operations by shape class (all circles)       | [^8]      |
| ID              | '#rectId'           | Container                | Array of Nodes (find) / single Node (findOne) | Precise access to a unique node; prefer findOne for single matches | [^9]      |
| Function predicate | (node) => {...}  | Container                | Array of Nodes                   | Complex filtering not expressible via selectors    | [^11][^12]|

### Selector Return Types and Practical Implications

Because find() always returns an array, code that assumes a single result must either guard the result set or use findOne(), which returns the first match. When uniqueness is guaranteed by design (for example, an id assigned to a single shape), findOne('#id') is clearer and avoids defensive array indexing. Operationally, array returns support bulk operations—efficiently iterating over all circles or all nodes with a given name—which is especially useful for styling, animations, and analytics traversals.[^9]

## Selecting by Name

The name attribute is a semantic label for grouping. Assign names to shapes that belong to logical units (e.g., “myCircle”) and then select by prefixing the name with a dot (.) in find(). This returns every matching node within the searched container subtree and enables bulk operations without manually maintaining lists.[^7]

Practical patterns include: animating all nodes named “myCircle”, toggling visibility for all nodes named “ui:control”, or applying a shared style. The approach composes well with container scoping: if the scene has multiple layers, start the search from the specific layer containing the target group to limit traversal.

Framework-aware usage:
- In React and Vue, invoke find() on the underlying Konva node obtained from refs. This preserves the locality of selection and avoids global searches.[^7]
- In frameworks, avoid coupling selection logic to component lifecycle in ways that cause dangling references; prefer small, focused containers for selection to reduce re-render side effects.

## Selecting by Type (Class Name)

Konva classes (e.g., Circle, Rect, Line) can be selected directly by their class name. Invoking layer.find('Circle') returns all circle nodes under that layer. This is particularly effective for batch operations like scaling or color changes, and for computing aggregates such as bounding boxes or hit statistics.[^8]

As with name-based selection, the primary performance lever is scope: search within the smallest relevant container (often a Layer) to reduce the traversal cost. This is aligned with Konva’s general performance guidance to draw as little as possible and compute as little as possible—selecting only what you need is a direct application of that principle.[^8][^14]

## Selecting by ID

IDs are unique identifiers. Use them when you need predictable, single-node access. The idiomatic pattern is findOne('#myId'), which returns the single node directly. If you use find('#myId'), remember it returns an array and extract the first element.[^9]

Recommended practices:
- Keep ids stable and human-readable for debugging and post-load wiring.
- Scope queries to the smallest applicable container; even with unique ids, scoping reduces traversal work.
- In frameworks, prefer findOne() to avoid incidental array handling in event handlers and effect logic.[^9]

## Selection Utilities and Advanced Patterns

Most applications rely on string selectors, but Konva’s function predicate support in find() enables arbitrary filters—for example, selecting all shapes with non-zero stroke width, or all nodes within a certain bounds. This is useful for operations that cannot be expressed via name, id, or class alone. Combine predicates with container scoping for predictable performance, and avoid global Stage searches in large scenes unless necessary. All Container types expose find(), and many expose additional selection nuances; consult the Container API for details on multiple selector support and return behavior.[^11][^12][^13]

## Serialization Fundamentals: toJSON() and Its Limits

Konva provides toJSON() on nodes to capture a JSON representation of the scene tree, including node attributes. This is convenient for small demos and simple saves. However, toJSON() does not serialize event handlers, and it does not serialize images or their pixel data. As a result, any deserialization must reattach images and rebind events. In framework-based applications, directly serializing the Konva stage is discouraged; instead, serialize your application state and render Konva nodes from that state.[^1]

To clarify scope and gaps, Table 2 summarizes serialization coverage.

Table 2. Serialization coverage matrix

| Entity/Capability    | Serialized by toJSON()? | Notes and workarounds                                | Reference |
|----------------------|-------------------------|------------------------------------------------------|-----------|
| Node attributes      | Yes                     | Positions, styles, sizes, text, etc.                 | [^1]      |
| Event handlers       | No                      | Rebind events after load using selectors             | [^1]      |
| Image sources        | No                      | Reload images and set .image() after load            | [^1][^6]  |
| Framework state      | No (recommended not to serialize stage) | Serialize app state; render Konva nodes from state | [^1][^10] |

When toJSON() is insufficient:
- Images require post-load source setting (for example, HTMLImageElement or Canvas).
- Events must be rebound by locating nodes via selectors and attaching listeners again.[^1]
- In React/Vue, treat stage JSON as a persistence detail, not the source of truth.[^10]

## Simple Load: Basic Patterns with Node.create()

For basic scenes, Konva.Node.create(json, containerId) reconstructs a Stage from a JSON string. The JSON typically includes className and attrs fields for the Stage, its Layers, and Shapes. This method is synchronous and returns a Stage instance bound to the specified container.[^2]

Two caveats:
- Direct use of Node.create() is considered an anti-pattern in React and Vue. Manage shape data in your framework state and render Konva components from that state; Node.create() bypasses reconciliation and can create lifetime and testing issues.[^2][^10]
- Keep the JSON minimal for small apps. If your scene includes images or events, use the Complex Load workflow instead.[^2][^6]

## Complex Load: Images, Events, and State-Driven Reconstruction

When scenes include images or custom event bindings, Node.create() reconstructs the structure but does not restore images or handlers. After creation, you must:
- Locate nodes via selectors (by id or type) and attach events.
- Set image sources (and any filters) explicitly.[^6][^1]

In frameworks, prefer a state-driven approach. Load your domain data into state and render the scene from that state. This aligns with the “Best Practices” guidance: save only critical application state, and implement create/update functions that construct or mutate Konva nodes accordingly. Avoid destroying and recreating the entire scene for minor changes; instead, update node properties in place.[^6][^10]

## Stage Data URL: Exporting to Images

Konva exposes toDataURL() to export canvas content as image data URLs. The semantics differ by target:
- Stage.toDataURL() requires a callback function to receive the data URL. This is a Stage-specific requirement.[^4]
- For Layers, Groups, and Shapes, toDataURL() does not require a callback and returns the data URL directly.[^4]

The options object supports mimeType (e.g., image/jpeg) and quality (0–1 for lossy formats). A critical security constraint applies: any images drawn on the canvas must originate from the same domain as the executing code; otherwise, a SECURITY_ERR may be thrown. Asset hosting and CDN configuration must satisfy same-origin policy to enable clean exports.[^4]

Table 3 captures the key differences.

Table 3. toDataURL() by node type

| Node type | Callback required | Return value        | Supported options                 | Security notes                            | Reference |
|-----------|-------------------|---------------------|-----------------------------------|-------------------------------------------|-----------|
| Stage     | Yes               | Passed to callback  | mimeType, quality, pixelRatio     | Images must be same-origin                | [^4]      |
| Layer     | No                | String              | mimeType, quality, pixelRatio     | Images must be same-origin                | [^4]      |
| Group     | No                | String              | mimeType, quality, pixelRatio     | Images must be same-origin                | [^4]      |
| Shape     | No                | String              | mimeType, quality, pixelRatio     | Images must be same-origin                | [^4]      |

Patterns for opening or downloading the image include writing the data URL into a new window or using an anchor element with a download attribute. The exact implementation varies by application architecture.[^4]

## High-Quality Export: pixelRatio and HDPI Considerations

By default, Konva’s export pixelRatio is 1, producing an image that matches the stage’s pixel dimensions. For high-density displays (for example, Retina screens), set pixelRatio to a higher value—often 2—to produce a crisper output at double the linear resolution. Vector nodes scale gracefully; bitmap images and cached nodes have different quality behaviors, so verify output visually.[^5]

Practical guidance:
- Start with pixelRatio = 2 for crisp desktop exports, and adjust upward for print or special needs. Balance resolution against file size and performance.[^5]
- Be mindful of devicePixelRatio when targeting screens. If performance is a concern, Konva’s performance tips suggest capping pixelRatio and evaluating visual trade-offs.[^5][^14]
- If you need to export to a programmatic image target instead of a data URL, use stage.toImage() with appropriate options.[^5]

Table 4 illustrates how pixelRatio affects output dimensions.

Table 4. pixelRatio scenarios for a 400×400 stage

| pixelRatio | Output dimensions | Typical use case                          | Notes                                  | Reference |
|------------|-------------------|-------------------------------------------|----------------------------------------|-----------|
| 1          | 400×400           | Default screen previews                   | Smallest file; may look soft on HDPI   | [^5]      |
| 2          | 800×800           | Crisp exports for HDPI displays           | 4× the pixels; better clarity          | [^5]      |
| 3          | 1200×1200         | High-detail archives or print tests       | Larger files; test performance         | [^5]      |

## Best Practices and Performance Tips Relevant to Selectors and Serialization

Konva’s performance doctrine is simple: compute as little as possible and draw as little as possible. Selection and serialization workflows intersect with this doctrine in several ways.[^14]

- Scope selections to Containers. Avoid global Stage.find(...) in massive scenes. Search the smallest relevant Layer or Group.[^11][^14]
- Batch operations with find() when you need bulk changes (e.g., recoloring all circles). Reducing the number of rendering cycles compounds performance benefits.[^8][^14]
- In React/Vue, prefer state-driven rendering over Node.create(). Keep stage JSON out of component state; render nodes from your app state, and apply create/update functions for reconstruction only when necessary.[^10]
- Manage assets and events outside serialization. Load images once, reuse sources, and rebind events post-load. Serialize minimal state and reconstruct non-serializable parts in code.[^1][^6][^10]
- Mobile and HDPI settings matter. Set viewport meta tags appropriately to avoid unnecessary scaling work. Consider Konva.pixelRatio = 1 on retina devices when performance is priority, confirming that output quality remains acceptable for your use case.[^14]
- Consider layer listening flags and drag optimization in selection-heavy apps. If a layer is purely visual, disable listening to reduce hit-testing overhead. For drag-heavy interactions, a temporary dragLayer can reduce redraws.[^14]

Table 5 maps tactics to impact.

Table 5. Selection/serialization performance checklist

| Action                                           | Expected impact                                         | Caveats/notes                                | Reference |
|--------------------------------------------------|---------------------------------------------------------|----------------------------------------------|-----------|
| Scope find() to a Layer or Group                 | Lower traversal cost; faster selection                  | Requires careful node organization           | [^11][^14]|
| Use findOne() for unique ids                     | Avoids array handling and index assumptions             | Enforce unique ids in design                 | [^9]      |
| Batch process results of find('Type')            | Fewer redraws, less per-frame computation              | Validate visual outcomes in bulk updates     | [^8][^14] |
| Keep stage JSON minimal; serialize app state     | Smaller payloads; simpler undo/redo                     | Requires create/update functions             | [^10]     |
| Rebind images/events post-load                   | Restores interactivity and media                        | Add post-load wiring steps                   | [^1][^6]  |
| Tune pixelRatio for exports                      | Crisper images on HDPI                                  | Larger files; test performance               | [^5][^14] |
| Disable layer/shape listening where unused       | Less hit-testing overhead                               | Must re-enable where interaction is needed   | [^14]     |
| Use dragLayer during drag operations             | Reduces per-move redraws                                | Requires move/restore logic                  | [^14]     |
| Cache complex shapes/groups                      | Lower per-frame drawing cost                            | Invalidate cache when geometry changes       | [^14]     |

### Framework-Specific Guidance (React/Vue)

- Avoid direct stage serialization in React/Vue. Treat the canvas as a view; serialize your domain state and render Konva nodes accordingly. This improves testability, reduces lifetime pitfalls, and aligns with framework reconciliation.[^10]
- For complex loads, avoid Node.create() in components. Instead, load data into state and render. For small demos, Node.create() is acceptable, but large apps should use create/update functions that reconstruct or patch nodes as needed.[^10][^2]

## End-to-End Workflows

The following workflows synthesize the practices above into actionable steps.

Simple Save/Load:
1. Save minimal state (positions, ids, names, key attributes).
2. To reconstruct a basic scene, use Node.create(json, containerId).
3. Post-load wiring: none for basic shapes; rebind events if needed.[^2]

Complex Save/Load with Images and Events:
1. Serialize only essential app state; do not attempt to store images or handlers.
2. Use Node.create() to reconstruct the node tree.
3. Reload images and set them on Konva.Image nodes; attach events via selectors (findOne('#id') or find('Type')).[^6][^1]

Export Pipeline:
1. For Stages, call toDataURL() with a callback; for other nodes, call toDataURL() directly.
2. Choose mimeType and quality for JPEG outputs; set pixelRatio for crispness on HDPI.
3. Open or download the data URL. Verify same-origin image constraints before calling toDataURL().[^4][^5]

## Common Pitfalls and Troubleshooting

Export security errors (SECURITY_ERR):
- Cause: Cross-origin images drawn on the canvas taint the context.
- Fix: Host images on the same domain or configure servers/CDNs to serve images with appropriate CORS headers, allowing same-origin reads for canvas content.[^4]

toJSON() missing handlers or images:
- Cause: By design, toJSON() does not include events or image pixel data.
- Fix: Store and rebind event handlers post-load; reload and set image sources explicitly.[^1][^6]

Framework issues:
- Cause: Node.create() bypasses framework reconciliation.
- Fix: Serialize state, render from state, and reserve create/update functions for reconstruction when needed.[^10]

Performance regressions:
- Cause: Overly broad selections and unnecessary redraws.
- Fix: Scope queries to containers, batch updates, cache complex shapes, and apply layer-level optimizations such as disabling listening and dragLayer strategies.[^14]

## Appendix: API Quick Reference and Glossary

Table 6. API quick reference

| Method                   | Target                     | Signature (indicative)                        | Return type     | Notes                                                      | Reference      |
|--------------------------|----------------------------|-----------------------------------------------|-----------------|------------------------------------------------------------|----------------|
| find()                   | Container (Stage/Layer/Group/FastLayer) | find(selector: string | function(node): boolean) | Array<Node>      | Scoped traversal; string or predicate; “compute as little as possible” | [^11][^12][^13] |
| findOne()                | Container                  | findOne(selector: string | function(node): boolean) | Node             | Returns first match; ideal for id-based single selection   | [^9][^11]      |
| toJSON()                 | Node                       | toJSON(): string                              | string          | Serializes attributes; excludes events and images          | [^1]           |
| Node.create()            | Konva (static)             | Node.create(json: string, containerId: string): Stage | Stage           | Reconstructs stage from JSON; post-load wiring required for images/events | [^2][^6]       |
| toDataURL()              | Stage/Layer/Group/Shape    | toDataURL(options?: { mimeType?, quality?, pixelRatio? }, callback?) | string or void | Stage requires callback; returns string for other nodes    | [^4]           |
| toImage()                | Stage                      | toImage(options?: { pixelRatio?, mimeType?, quality? }, callback?)  | void            | Programmatic image export; options similar to toDataURL()  | [^5]           |

Glossary:
- Container: A node that can have children (Stage, Layer, Group, FastLayer).
- Selector: A string or predicate used by find() to match nodes.
- Name: A user-defined label on a node used for logical grouping.
- ID: A unique identifier for a node.
- Data URL: A base64-encoded image represented as a data: URL string.
- pixelRatio: A scaling factor that increases output resolution for exports.
- Same-origin policy: Browser security requirement that images must be served from the same domain to be drawable and exportable without security errors.

## Information Gaps

- A complete enumerated list of Konva selector utilities beyond find() and findOne() is not consolidated in the sources cited here.
- The full options matrix for Node.create() (e.g., all supported keys/overloads) is not detailed in the provided documentation.
- Exhaustive API signatures for stage.toImage() beyond basic usage are not included.
- Edge cases and cross-browser nuances for toDataURL() (e.g., maximum canvas dimensions, legacy browser behavior) are not covered.
- The performance tips page highlights selection-related tactics but does not provide an exhaustive catalog of selection-only optimizations; broader performance guidance applies.[^14]

## References

[^1]: HTML5 Canvas Stage Serialization Tutorial — https://konvajs.org/docs/data_and_serialization/Serialize_a_Stage.html  
[^2]: Load Simple HTML5 Canvas Stage from JSON Tutorial — https://konvajs.org/docs/data_and_serialization/Simple_Load.html  
[^3]: Load HTML5 Canvas Stage from JSON Tutorial (Complex Load) — https://konvajs.org/docs/data_and_serialization/Complex_Load.html  
[^4]: HTML5 Canvas to Data URL Tutorial — https://konvajs.org/docs/data_and_serialization/Stage_Data_URL.html  
[^5]: HTML5 Canvas Export to High Quality Image Tutorial — https://konvajs.org/docs/data_and_serialization/High-Quality-Export.html  
[^6]: Load HTML5 Canvas Stage from JSON Tutorial (Complex Load) — https://konvajs.org/docs/data_and_serialization/Complex_Load.html  
[^7]: HTML5 Canvas Select Shape by Name Tutorial — https://konvajs.org/docs/selectors/Select_by_Name.html  
[^8]: HTML5 Canvas Select Shape by Type Tutorial — https://konvajs.org/docs/selectors/Select_by_Type.html  
[^9]: HTML5 Canvas Select Shape by id Tutorial — https://konvajs.org/docs/selectors/Select_by_id.html  
[^10]: Save and Load HTML5 Canvas Stage Best Practices — https://konvajs.org/docs/data_and_serialization/Best_Practices.html  
[^11]: Konva.Container | Konva - JavaScript Canvas 2d Library — https://konvajs.org/api/Konva.Container.html  
[^12]: Konva.Layer | Konva - JavaScript Canvas 2d Library — https://konvajs.org/api/Konva.Layer.html  
[^13]: Konva.FastLayer | Konva - JavaScript Canvas 2d Library — https://konvajs.org/api/Konva.FastLayer.html  
[^14]: HTML5 Canvas All Konva performance tips list — https://konvajs.org/docs/performance/All_Performance_Tips.html# Konva.js Performance Optimization: A Complete, Practical Guide

## Executive Summary: Performance Objectives, Rules, and ROI

Konva runs on the HTML5 Canvas model, where the cost of drawing accumulates quickly as visual complexity rises. Two forces dominate: compute (CPU/GPU work to prepare pixels) and draw (moving bytes from memory to screen). Every optimization either reduces the work you ask the engine to do or reduces the number of pixels you move and composite each frame. The official guidance in Konva’s performance tips crystallizes this into two rules: compute as little as possible, and draw as little as possible. Taken together, these rules provide a simple lens through which to evaluate every change you make: will this reduce calculations or avoid drawing work, and by how much?[^1]

A high-level playbook emerges from Konva’s performance documentation:

- Reduce what is drawn and how often. Split static and animated content across layers, minimize layers, and prefer batched redraws to per-event draws. Use a dedicated drag layer to avoid redrawing unrelated content while dragging.[^1][^6][^2]
- Avoid unnecessary event detection. Disable listening on layers and shapes that do not need pointer interactions.[^1][^7]
- Reduce per-frame recomputation. Cache complex shapes or groups so Konva reuses a precomputed buffer instead of redrawing from primitives each frame. Cache is especially effective for filters and heavy geometry.[^1][^9]
- Eliminate expensive visual pipelines when acceptable. Disable “perfect draw” if minor visual artifacts at opacity boundaries are tolerable. Disable stroke shadows when not required.[^1][^3][^10]
- Manage stage size and pixel ratio pragmatically. Huge stages and high device pixel ratios increase the cost of moving pixels. On mobile, set the viewport to avoid scaling overhead; on retina displays, consider Konva.pixelRatio = 1 if framerate is more important than maximal crispness.[^1]
- Prevent leaks. Destroy nodes that are no longer needed and explicitly destroy Tweens to avoid accumulating handlers and orphaned references.[^1][^5]

Return on investment comes from fewer redraws (batchDraw, layer separation, listening=false), less redrawing per frame (cache), and avoiding costly rendering sub-pipelines (perfect draw off, stroke shadows off), with stage size and pixel ratio serving as upstream multipliers on all draw work. The rest of this guide explains the mechanisms and shows how to apply them in real apps, including React and Vue idioms.

Note on information gaps. Konva’s docs do not provide quantitative FPS/memory benchmarks for each setting, nor complete code in every snippet. The “Canvas Scrolling” reference is noted but not analyzed here. Details of Konva.Animation’s internal frame budgeting and the exact internal batching thresholds are not specified. Always measure on your workload and device mix.[^1]


## Stage-Level Optimizations: Size, Viewport, and Pixel Ratio

Stage size is a first-order driver of draw cost. A larger stage means more pixels to clear, composite, and present each frame. Konva’s performance tips advise avoiding overly large stages and treating very large scrollable canvases with dedicated patterns rather than simply making the stage huge.[^1] On mobile, an improper viewport forces the browser to scale your canvas, adding unnecessary work; set the viewport meta tag to prevent scaling overhead.[^1] On high-DPI (retina) displays, Konva scales for crispness; if this hurts framerate, consider setting Konva.pixelRatio = 1 to reduce scaling work, trading some visual sharpness for speed.[^1]

To make the trade-offs concrete, the following table summarizes the key stage-level settings.

Table 1. Stage-level settings and their performance impact

| Setting                         | What it does                                                          | When to use                                                                 | Performance trade-off                                |
|---------------------------------|------------------------------------------------------------------------|-----------------------------------------------------------------------------|------------------------------------------------------|
| Stage size (width/height)       | Controls pixel dimensions of the main canvas                           | Keep stages as small as your UI allows; avoid giant canvases               | Larger stages increase per-frame pixel movement[^1] |
| Mobile viewport meta tag        | Prevents browser scaling of the page                                   | Always set on mobile to width=device-width and disable user scaling         | Removes expensive scaling overhead[^1]               |
| Konva.pixelRatio = 1            | Limits device-pixel scaling for crispness                              | On retina devices when framerate is more important than ultra-sharp text   | Reduces scaling work, smaller visual fidelity[^1]    |

### Stage Size and Scaling

The practical implication is straightforward: model your stage after your viewport, not the other way around. For designs that suggest “infinite” canvases, treat scrolling as a UX and rendering problem with dedicated techniques rather than creating a massive stage. The goal is to keep the number of screen pixels updated per frame as low as possible.[^1]

### Viewport Meta Tag

On mobile, include a viewport meta tag that locks the page to device width and prevents user scaling. This removes implicit scaling work that otherwise compounds every draw.[^1]

### Konva.pixelRatio on Retina

High-DPI devices multiply pixel counts. Konva handles pixel ratio for crisp output, but if you observe performance issues, override with Konva.pixelRatio = 1 to reduce pixel processing. Confirm acceptability with design; crispness of thin strokes and small text may be reduced.[^1]


## Layer Management: The Most Important Performance Lever

Each Konva Layer is its own Canvas element. This is the core mechanism for selective redrawing: animate and update only the layers that change, leaving static content untouched. The guidance is explicit: this is the most important performance consideration in Konva apps. Keep the total number of layers modest—typically three to five—to balance selective redraws against the overhead of multiple canvases.[^1][^6]

A canonical pattern is to separate static UI (labels, legends, backgrounds) from animated or frequently updated shapes. Static layers never need to redraw during animations, which reduces work significantly.[^6]

Table 2. Recommended layer separation patterns

| Pattern                                   | Static layer contents                          | Dynamic layer contents                | Benefit                                                |
|-------------------------------------------|-----------------------------------------------|--------------------------------------|--------------------------------------------------------|
| Static UI + Animated shapes                | Text, legends, axes, backgrounds               | Moving/rotating shapes, particles    | Static layer draws once; only animated layer repaints[^6] |
| Frequent updates + Infrequent updates      | Infrequently changed visuals                   | Sliders, timers, live indicators     | Avoids repainting expensive, unchanged visuals         |
| Drag-heavy interaction                    | Non-dragged content                            | Active draggable item(s)             | Keeps unrelated layers from repainting during drag     |

Limiting layers to a small set preserves the performance upside of separation while avoiding the management and memory overhead of many canvases.[^1][^6]

### Drag Layer Optimization

While dragging a shape, the layer it lives on is repainted on every move event. To avoid repainting unrelated content, move the dragged node to a dedicated drag layer on dragstart and move it back at dragend. This confines repainting to the minimal visual region and layer.[^1]


## Batch Draw and AutoDraw: Controlling Redraw Frequency

Konva automatically batches redraws when autoDraw is enabled (the default), aligning redraws with frame availability. In Konva v8 and later, automatic batching means you generally do not need to call layer.draw() repeatedly; Konva will limit redraws per second based on browser frame capacity. If you disable autoDraw (Konva.autoDrawEnabled = false), explicitly call layer.batchDraw() to coalesce updates and prevent excessive redraws.[^2]

In practice, drag and mousemove events can fire far more often than frames. batchDraw prevents “jumpy” animations and wasted work by ensuring the number of repaints matches what the display can actually show.[^2]

Table 3. Redraw control settings

| Setting/API                    | Default behavior                  | When to use manual batchDraw                 | Expected benefit                                    |
|--------------------------------|-----------------------------------|----------------------------------------------|-----------------------------------------------------|
| Konva.autoDrawEnabled          | Enabled (Konva v8+)               | If you set it to false                       | With autoDraw on, Konva limits redraws automatically[^2] |
| layer.batchDraw()              | N/A                               | After mutating nodes with autoDraw disabled  | Coalesces redraws; prevents overdraw on events[^2]  |


## Disable Perfect Drawing: When Visual Perfection Is Optional

When a shape uses fill, stroke, and opacity, half the stroke width overlaps the fill, which can darken intersections. Konva’s “perfect drawing” addresses this by drawing the shape on a buffer canvas without opacity, applying opacity on the layer, and then compositing the buffer to the layer. This pipeline avoids visual artifacts but costs performance. If you can tolerate minor artifacts, disable perfect drawing with shape.perfectDrawEnabled(false) to bypass the buffer step and improve throughput.[^3]

### Mechanism and Visual Trade-offs

The buffer sequence—draw to buffer, fill/stroke without opacity, apply layer opacity, composite buffer—trades CPU/GPU work for visual correctness. When you disable it, you skip the buffer, reducing draw cost at the expense of potential edge-case artifacts where stroke meets fill under opacity.[^3]

### When to Disable

Use this optimization when the visual difference is imperceptible in your app or acceptable compared to the performance headroom you gain. It is especially effective on heavy scenes or mobile devices where the buffer overhead materially reduces framerate.[^3]


## Event Listening Optimization: listening(false)

Konva attaches hit detection to shapes and layers. On large scenes, evaluating pointer events for every shape can dominate work, even when no events are needed. Disable listening on shapes and layers that do not require interactions. When listening = false, those nodes are ignored during event detection.[^7][^1]

Table 4. Where to set listening(false) and impact

| Scope   | What changes                                           | Typical use-case                                        | Expected impact                                 |
|---------|---------------------------------------------------------|----------------------------------------------------------|-------------------------------------------------|
| Layer   | Layer and its children skip hit detection               | Backgrounds, static UI, purely visual layers             | Removes a large chunk of event processing[^7]  |
| Shape   | Individual shape skips hit detection                    | Non-interactive decorative shapes within interactive UI  | Reduces per-node event checks[^7]               |

Measure on your data; the win is proportional to scene size and the frequency of pointer events.[^7]


## Animation Optimization: Konva.Animation and Focused Updates

Use Konva.Animation instead of manual requestAnimationFrame. Konva’s animation system integrates with layer redraws and provides a frame object with time information for deterministic motion. Focus updates on the properties that change; avoid animating properties that do not affect visuals. Cache complex shapes to reduce per-frame redraw cost, and minimize the number of nodes included in the animation loop.[^8][^1]

Table 5. Animation do’s and don’ts

| Practice                                 | Why it helps                                              |
|------------------------------------------|-----------------------------------------------------------|
| Use Konva.Animation                      | Integrates redraws and time handling cleanly[^8]          |
| Animate only properties that change      | Avoids unnecessary work and potential invalidations[^1]   |
| Cache complex shapes/groups              | Reuses buffer instead of redrawing complex geometry[^8][^1] |
| Minimize nodes in the animation loop     | Reduces per-frame update and draw work[^1]               |

A typical loop uses the frame’s time to compute rotations or positions deterministically. Start the animation when ready and stop it when no longer needed to free resources.[^8]


## Stroke Optimization: shadowForStrokeEnabled(false)

If a shape has both a stroke and a shadow, Konva performs an extra internal drawing to achieve the expected look. This extra pass is costly at scale. If your design does not require shadows on strokes, disable it with shadowForStrokeEnabled(false). The performance gain is significant on scenes with many stroked shapes.[^10][^1]

Table 6. Stroke shadow behavior and performance impact

| Configuration                                  | Behavior                                              | Performance impact                           |
|------------------------------------------------|--------------------------------------------------------|----------------------------------------------|
| shadowForStrokeEnabled: true (default when shadow is set) | Stroke casts shadow with an extra drawing pass         | Extra per-shape draw cost[^10]               |
| shadowForStrokeEnabled: false                  | Stroke does not cast shadow; skips extra pass          | Reduced draw cost; faster frames[^10]        |


## Shape Caching: cache() and clearCache()

Caching draws a shape (or group) onto an internal canvas buffer. Subsequent frames use the buffer, avoiding recomposition from drawing commands. This is particularly effective for complex shapes and any shape using filters. The trade-off is memory: cached nodes create and hold buffers. Apply caching judiciously, measure on your workload, and prefer caching groups when that captures the visual unit you reuse.[^9][^1]

Table 7. Caching strategies and memory implications

| Strategy                                 | Use-case                                           | Memory implications                      |
|------------------------------------------|----------------------------------------------------|------------------------------------------|
| Cache a single complex shape             | Heavy geometry or filters applied                   | Holds buffer(s) for that shape[^9]       |
| Cache a group of shapes                  | Composite visuals reused or rotated together        | One buffer for the group; often efficient[^9] |
| Do not cache simple shapes               | Trivial shapes without filters                      | Direct draw may be faster; less memory[^9] |

Call cache() to create the buffer and clearCache() to remove it and revert to normal drawing. Evaluate FPS and memory with and without caching for your specific scene.[^9]


## Memory Management: Avoid Memory Leaks

Konva exposes lifecycle methods that, when used correctly, prevent common leaks. Use remove() when a node might be reused later; it detaches the node from its parent but keeps internal references. Use destroy() when the node is truly done; it removes all references within the Konva engine and is the correct way to avoid leaks on permanent removal. Konva.Tween instances must be destroyed after use to prevent accumulation of handlers and orphaned references.[^5][^1]

Table 8. remove() vs destroy()

| Method    | Purpose                                         | Reuse scenario                     | Leak risk if misused                                  |
|-----------|--------------------------------------------------|------------------------------------|-------------------------------------------------------|
| remove()  | Detach from parent; keep internal references     | Node will be re-added elsewhere    | References persist; may leak if reused incorrectly[^5] |
| destroy() | Remove all internal references; fully delete     | Node is no longer needed           | Avoids leaks when followed by proper cleanup[^5]      |

In frameworks, let component lifecycle govern node creation and destruction. In React and Vue examples, conditional rendering and teardown handlers are used to add/remove shapes and clean up animations. Always destroy Tweens after they complete or are no longer needed.[^5]


## Performance APIs Quick Reference

To consolidate the techniques above, the following index maps each API/setting to its optimization goal and typical use.

Table 9. API/Setting index

| Name/Setting                      | Category   | Purpose                                             | Performance impact                                 | Docs |
|-----------------------------------|------------|-----------------------------------------------------|----------------------------------------------------|------|
| layer.batchDraw()                 | Layer      | Coalesce redraws when autoDraw is disabled          | Prevents overdraw on frequent events               | [^2] |
| Konva.autoDrawEnabled             | Stage/Layer| Enables automatic redraw batching                   | Limits redraws per second; smoother animations     | [^2] |
| shape.perfectDrawEnabled(false)   | Shape      | Disable perfect drawing pipeline                    | Skips buffer compositing; reduces draw cost        | [^3] |
| layer.listening(false)            | Layer      | Disable hit detection for layer and children        | Removes event processing cost for the layer        | [^7] |
| shape.listening(false)            | Shape      | Disable hit detection for a single shape            | Reduces per-node event checks                      | [^7] |
| shape.cache() / group.cache()     | Shape/Group| Draw into internal buffer for reuse                 | Avoids recomposition; faster redraws               | [^9] |
| shape.clearCache() / group.clearCache() | Shape/Group | Remove cached buffer and revert to direct draw | Frees buffers; returns to normal rendering         | [^9] |
| shadowForStrokeEnabled(false)     | Shape      | Disable stroke shadow rendering                     | Skips extra stroke shadow draw pass                | [^10] |
| Konva.pixelRatio = 1              | Stage      | Reduce device-pixel scaling on retina               | Lower pixel workload; may reduce sharpness         | [^1] |
| drag layer pattern                | Layer      | Move dragged node to dedicated layer during drag   | Limits repaint scope during drag                   | [^1] |


## Implementation Playbook: Patterns and Integration

Applying these techniques together yields compounding wins. The following playbooks outline practical patterns for Vanilla Konva and framework integrations (React, Vue). The intent is not to be exhaustive; it is to anchor the above techniques in common app flows.

Stage and layer setup. Create a small number of layers, isolating static UI and animated content. Place non-interactive visuals on layers with listening=false. For drag-heavy UIs, add a dedicated drag layer and move nodes into it on dragstart and back on dragend.[^1][^6][^7]

Caching and perfect draw. Cache groups of complex shapes that move or rotate together; clear caches when content changes. Disable perfect draw for shapes with fill+stroke+opacity if visual artifacts are acceptable.[^9][^3]

Animation hygiene. Use Konva.Animation, animate only the properties that change, and minimize the node set in the loop. Cache the shapes that are expensive to redraw.[^8][^1]

Framework notes. In React and Vue, treat Konva nodes as view-managed resources. Use refs to access nodes for configuration and to call cache()/clearCache() or to move nodes across layers. Ensure Tweens are destroyed and animations are stopped on unmount or when inputs change such that nodes are removed or no longer need updates.[^5][^8]

Table 10. Checklist mapping: configuration and expected impact

| Configuration                                    | Expected impact                                          |
|--------------------------------------------------|----------------------------------------------------------|
| Separate static and animated layers              | Fewer layer redraws; stable FPS during animations[^6]    |
| Limit total layers to a small set                | Avoids overhead of many canvases; preserves gains[^1]    |
| listening=false on static layers and shapes      | Removes unnecessary hit detection work[^7]               |
| dragLayer pattern                                | Reduces redraw scope during drag operations[^1]          |
| batchDraw when autoDraw is disabled              | Prevents overdraw on high-frequency events[^2]           |
| cache() for complex groups; clearCache on change | Reduces redraw cost; predictable memory usage[^9]        |
| perfectDrawEnabled=false                         | Skips buffer pipeline where artifacts are tolerable[^3]  |
| shadowForStrokeEnabled=false                     | Removes extra stroke shadow pass at scale[^10]           |
| Konva.pixelRatio=1 on retina                     | Reduces pixel workload; improves framerate[^1]           |

### Vanilla Konva Pattern

- Create a small number of layers: static, main, and drag.
- Disable listening on background and purely visual layers.
- Cache composite groups that rotate or move; clear caches when content changes.
- Disable perfect draw on shapes with opacity where acceptable; disable stroke shadows if not needed.
- Use Konva.Animation with focused property updates and minimal node sets. If autoDraw is off, call batchDraw() after mutations.[^1][^2][^3][^6][^7][^8][^9][^10]

### React Integration

- Use refs to access nodes for configuration and to call cache()/clearCache().
- Move nodes to/from a drag layer in dragstart/dragend handlers.
- Manage animation lifecycle in effects: start on mount, stop and destroy Tweens on unmount or state changes that remove nodes.
- Keep layers few and listening=false on non-interactive layers.[^1][^5][^8]

### Vue Integration

- Use refs to access layer and shape nodes for batchDraw calls and for moving nodes across layers.
- Cache groups via refs; watch flags to toggle cache()/clearCache().
- Start/stop animations in onMounted/onUnmounted. Destroy Tweens on teardown.
- Keep layer counts modest and listening disabled where appropriate.[^1][^5][^8]


## Validation and Performance Measurement

The only reliable way to confirm gains is to measure before and after, under representative conditions. Use frame-rate feedback, CPU/GPU profiles, and memory monitors. The official documentation provides stress tests—e.g., drag-and-drop with many shapes—that can help exercise the system beyond typical usage.[^4][^9]

Table 11. Measurement plan

| Scenario                                   | Metrics to track                 | Tools/Methods                            | Success criteria                                  |
|--------------------------------------------|----------------------------------|-------------------------------------------|---------------------------------------------------|
| Drag many shapes                           | FPS, input latency, CPU          | Konva stress demo, devtools profiling     | Stable FPS; no overdraw on unrelated layers[^4]   |
| Rotate cached group with filters           | FPS, memory usage                | Animation frameRate, browser task manager | Higher FPS with controlled memory[^9]             |
| Batch vs draw under high-frequency events  | FPS, jank count                  | Compare batchDraw vs draw calls           | Fewer redraws; smoother visuals[^2]               |
| Disable perfect draw and stroke shadows    | FPS, artifacts acceptance        | Visual inspection plus frame-rate         | Acceptable visuals with higher FPS[^3][^10]       |
| Pixel ratio adjustment on retina           | FPS vs perceived sharpness       | Visual QA plus frame-rate                 | Improved FPS with acceptable crispness[^1]        |


## Risks, Trade-offs, and Best Practices

- Caching trades memory for speed. Cached nodes hold buffers. Over-caching can inflate memory use and hurt performance. Measure, cache composites when possible, and clear caches when content changes.[^9]
- Disabling perfect draw trades visual perfection for performance. Artifacts may appear at stroke/fill boundaries under opacity. Confirm acceptability with design and users.[^3]
- Pixel ratio reduction improves framerate at the cost of crispness. Evaluate on target devices, especially for small text and thin strokes.[^1]
- listening(false) removes interactivity. Ensure that no interaction is required for the shapes or layers you silence.[^7]
- Keep layer counts modest. While selective redrawing is powerful, many layers introduce overhead. The guidance is to keep to a small number—typically three to five.[^1][^6]

Note the following information gaps to keep in mind during planning: there are no quantitative FPS/memory benchmarks per setting, and the “Canvas Scrolling” technique is referenced but not analyzed in the sources provided. The exact internal throttling thresholds and budgeting of the animation engine are not described. Validate choices empirically on your workload and device mix.[^1]


## References

[^1]: HTML5 Canvas All Konva performance tips list. https://konvajs.org/docs/performance/All_Performance_Tips.html  
[^2]: HTML5 Canvas Batch Draw Tip. https://konvajs.org/docs/performance/Batch_Draw.html  
[^3]: HTML5 Canvas Disable Perfect Drawing Tip. https://konvajs.org/docs/performance/Disable_Perfect_Draw.html  
[^4]: Drag and Drop Stress Test with 10000 Shapes. https://konvajs.org/docs/sandbox/Drag_and_Drop_Stress_Test.html  
[^5]: HTML5 Canvas How to avoid Memory leaks Tip. https://konvajs.org/docs/performance/Avoid_Memory_Leaks.html  
[^6]: HTML5 Canvas Layer Management Performance Tip. https://konvajs.org/docs/performance/Layer_Management.html  
[^7]: HTML5 Canvas Listening False Performance Tip. https://konvajs.org/docs/performance/Listening_False.html  
[^8]: HTML5 Canvas Optimize Animation Performance Tip. https://konvajs.org/docs/performance/Optimize_Animation.html  
[^9]: HTML5 Canvas Shape Caching Performance Tip. https://konvajs.org/docs/performance/Shape_Caching.html  
[^10]: HTML5 Canvas Optimize Strokes Performance Tip. https://konvajs.org/docs/performance/Optimize_Strokes.html# Konva Framework Integration Documentation: React, Vue, Angular, Svelte, and Node.js

## Executive Summary

Konva is a high-level 2D canvas framework that brings structured scene management, layering, events, and animation to HTML5 Canvas for the web and Node.js. Its bindings for React, Vue, Angular, and Svelte expose the same core primitives—Stage, Layer, and Shape nodes—as framework-native components or props, allowing teams to build interactive vector UIs with familiar state and lifecycle patterns. At a high level, Konva acts as the scene graph and rendering engine while each framework supplies the component model, reactivity, and tooling. This duality is deliberate: Konva provides the Canvas “DOM,” and each integration provides the idiomatic way to mount it, update it, and respond to its events. [^1]

Across frameworks, the key integration concepts are consistent:
- Stage and Layer are the top-level containers that manage canvas sizing and redraw boundaries.
- Shapes (Rect, Circle, Text, Image, Path, and others) are nodes that render graphics and handle input.
- Events propagate through the node tree and are handled in the framework via declarative bindings or callbacks.
- Transformer is a specialized node that attaches to selected shapes for resize/rotate interactions.
- Custom shapes can be defined via scene functions for advanced graphics.

Where the frameworks diverge is in “glue” patterns:
- React exposes Konva nodes as React components. State drives rendering order and zIndex; conditional rendering can manage layering; event props attach listeners directly. React Native is explicitly unsupported. [^3]
- Vue components are prefixed with “v-” and use a config prop to pass Konva node configuration. Transformer attachment is manual (node selection drives the binding). [^4]
- Angular components are prefixed with “ko-” and accept [config] bindings. Drag-and-drop is enabled via a draggable property and events; custom shapes use a sceneFunc on a Custom/Core shape component. [^5]
- Svelte passes props to components that correspond 1:1 with Konva nodes. Events are handled via an on prop; bubbling is controllable with cancelBubble; Transformer attachment and prop synchronization require direct Konva API usage. [^6][^13]

For Node.js, Konva operates headlessly. You can choose the Canvas backend for broad compatibility or the Skia backend for better performance. Export is done via stage.toDataURL(), and you must be mindful of memory and SSR constraints (prefer client-side rendering for framework SSR unless you explicitly handle canvas under Node). [^2]

Top risks and non-negotiables:
- React Native is not supported by react-konva. [^3]
- Transformer patterns require direct Konva API usage in Vue and Svelte (manual node attachment); React is more declarative through props. [^7][^13]
- SSR frameworks should render canvas content client-side when using Konva in Node.js; export should use toDataURL and manage memory for batch jobs. [^2]

Recommended starting points:
- React: install react-konva and konva; render Stage/Layer/Shape; manage z-order via JSX order and state; wire events via props. [^3][^8]
- Vue: register VueKonva; use v-stage/v-layer/v-* shapes with config; attach Transformer to selected nodes. [^4][^9][^7]
- Angular: use ng2-konva components; bind [config] for Stage and shapes; implement drag-and-drop via draggable and events; create custom shapes via sceneFunc. [^5][^10][^11][^12]
- Svelte: import components that mirror Konva nodes; use on for events; handle bubbling with cancelBubble; attach Transformer nodes via Konva API; consult SvelteKit docs for SSR nuances. [^6][^14][^15][^13]
- Node.js: install konva and a backend; instantiate Stage; draw; export toDataURL; consider Skia backend for performance; avoid SSR pitfalls. [^2]

To orient teams quickly, the cross-framework cheat sheet below summarizes naming conventions, setup steps, event handling, transformer usage, and custom shapes.

Table 1. Cross-Framework Integration Cheat Sheet

| Topic | React | Vue | Angular | Svelte | Node.js |
|---|---|---|---|---|---|
| Setup package | react-konva, konva | vue-konva, konva | ng2-konva, konva | svelte-konva, konva | konva + backend (canvas or skia) |
| Component prefix | None (Stage/Layer/Shape) [^3] | v- (v-stage, v-*, etc.) [^4] | ko- (ko-stage, ko-*, etc.) [^5] | None (mirrors Konva) [^6] | N/A |
| Config pattern | Props on components [^3] | config prop [^4] | [config] binding [^5] | Props [^6] | Stage config (container ignored) [^2] |
| Stage init | Stage width/height props [^3] | v-stage with config [^4] | ko-stage [config] [^5] | Stage props [^6] | Stage(width, height) [^2] |
| Event handling | Props (e.g., onClick) [^3] | Component events (per doc topic) [^4][^14] | [config] events and handlers [^5][^12] | on prop with callback; cancelBubble [^14] | Direct node.on(...) or equivalent [^2][^14] |
| Transformer | Declarative props [^3] | Manual attachment via Konva API [^7] | Transformer component [^5] | Manual attachment; prop sync on transformend [^13] | N/A (headless) [^2] |
| Custom shape | sceneFunc or custom component (via Konva) [^3] | v-shape with drawing function [^18] | Custom/Core component with sceneFunc [^12] | Custom via Konva node component [^6] | Draw via Konva nodes; export [^2] |
| SSR support | React Native unsupported; SSR OK client-only [^3][^2] | Standard Vue app registration [^4] | Angular SSR via Angular platform (canvas client-only) [^5][^2] | SvelteKit SSR nuances (see docs) [^6][^13] | Use Canvas/Skia backend; toDataURL export [^2] |

This report proceeds from conceptual foundations to per-framework guides, then Node.js SSR, cross-cutting event and transformer patterns, serialization best practices, and a decision guide to choose the right framework for a given use case.

---

## Konva Core Concepts and Mental Model

Konva extends the HTML5 Canvas with a structured scene graph. At its core are three primitives that organize rendering and input:

- Stage: The root container that holds Layers and defines the drawing surface size. It does not draw itself but orchestrates its children.
- Layer: A rendering boundary tied to its own canvas. Layers contain Groups and Shapes and define redraw regions. Organizing content into layers is essential for performance and interactivity management. [^16]
- Shapes: The graphical nodes (Rect, Circle, Text, Image, Path, and more) that render and handle events.

Konva’s layering and z-ordering methods—moveToTop, moveToBottom, moveUp, moveDown, or zIndex—control the stacking order within a layer. These methods are fundamental when you need to change visual stacking without re-rendering the entire scene. [^8]

Events propagate up the node tree. When a shape is clicked, the event bubbles unless stopped, and you can stop propagation by setting cancelBubble on the event object. This behavior is available in all framework bindings. [^14]

The Transformer is a specialized node that attaches to selected shapes and enables resize and rotate interactions. In React, the Transformer can be treated largely as a component with props. In Vue and Svelte, manual attachment to the selected node(s) via Konva’s API is the documented approach, with prop synchronization occurring at transformend for Svelte when props are bound. [^7][^13]

Custom shapes are created by defining a scene function (sceneFunc) that draws with the 2D canvas context. Helpers like fillStrokeShape can streamline styling. This pattern is framework-agnostic—each integration exposes a way to attach a sceneFunc to a custom shape component. [^12][^18]

To clarify component mappings across integrations, the table below outlines the principal Konva primitives and their framework equivalents.

Table 2. Core Konva Primitives and Framework Mapping

| Konva Primitive | Purpose | React | Vue | Angular | Svelte |
|---|---|---|---|---|---|
| Stage | Root container, manages size | Stage component [^3] | v-stage with config [^4] | ko-stage with [config] [^5] | Stage component [^6] |
| Layer | Rendering boundary, redraw control | Layer component [^3] | v-layer [^4] | ko-layer [^5] | Layer component [^6] |
| Shapes | Graphics and input | Rect, Circle, Text, etc. [^3] | v-rect, v-circle, v-text, etc. [^9] | ko-rect, ko-circle, ko-text, etc. [^5] | Rect, Circle, Text, etc. [^6] |
| Transformer | Resize/rotate selection | Transformer component [^3] | v-transformer (manual attachment) [^7] | Transformer component [^5] | Transformer (manual attachment) [^13] |
| Custom shape | Specialized drawing | Custom component/sceneFunc [^3] | v-shape with drawing function [^18] | Custom/Core with sceneFunc [^12] | Konva node component [^6] |

Understanding this mapping prevents leaky abstractions. You can reason about the scene graph in Konva terms, then apply the appropriate binding idiom in your framework to attach, update, and interact with nodes. [^1][^16][^8]

---

## Framework Integrations

### React: react-konva

React bindings expose Konva nodes as React components. You build the scene declaratively in JSX: Stage wraps Layers, Layers wrap Shapes, and you manage state as the single source of truth. This approach blends naturally with React’s data-flow model and minimizes imperative canvas code. [^3]

Installation and setup are straightforward:
- Install react-konva and konva.
- Import Stage, Layer, and Shape components.
- Render Stage with width/height; Layers hold Shapes.

Event handling is done via props such as onClick, onDragEnd, etc., directly on the shape components. This aligns with React’s callback model and keeps event logic close to the node definition. [^3]

Layering and z-order are controlled by rendering order in JSX. While Konva provides API methods for z-order, React typically prefers declarative ordering: the last shape rendered appears on top. The official layering tutorial demonstrates toggling a boolean to change rendering order (conditional rendering) rather than calling zIndex methods directly. [^8]

Transformer usage is component-based. You include a Transformer component and attach selected nodes via props or node refs. For complex interactions, you may combine local state (selected node ID) with effect hooks to synchronize the transformer’s attachment and redraw. [^3]

Custom shapes can be implemented by creating a component that sets a sceneFunc on a Shape, or by using a dedicated custom component pattern when preferred. Within the sceneFunc, use the 2D context to draw and apply helper methods to fill/stroke. [^3]

What is explicitly not supported: React Native. If your target is native, react-konva will not work, and you should consider alternatives. [^3]

Known gaps: The primary “getting started” page does not enumerate React-specific hooks (such as useKonva or useStage) in the provided content. Teams should consult the react-konva repository and examples for hook-based patterns beyond what is covered here. [^19]

To orient quickly, the following mapping ties common Konva nodes to React components and shows a minimal prop sketch.

Table 3. React Components Mapping and Typical Props

| Konva Node | react-konva Component | Key Props (Illustrative) |
|---|---|---|
| Stage | Stage | width, height, onMouseDown, onTouchStart [^3] |
| Layer | Layer | onMouseMove, onDragMove, listening [^3] |
| Rect | Rect | x, y, width, height, fill, stroke, strokeWidth, draggable, onClick [^3] |
| Circle | Circle | x, y, radius, fill, stroke, onDragEnd [^3] |
| Text | Text | text, fontSize, fill, x, y [^3] |
| Transformer | Transformer | nodes, rotateEnabled, enabledHandlers [^3] |

React Integration Guide

- Installation: Add react-konva and konva to your project. [^3]
- Minimal Stage/Layer/Shape: Render Stage with width and height; add Layer; add Rect/Circle/Text with positions and fills. [^3]
- Events: Attach onClick/onDrag* props to shapes; keep handlers with the node or lift state as needed. [^3]
- Layering: Control stacking by JSX order or conditional rendering; use state to toggle which shape renders last. [^8]
- Transformer: Track selected node IDs in state; attach Transformer to that node via props/refs and update when selection changes. [^3]
- Custom Shapes: Provide sceneFunc in a custom component; draw with context; leverage fillStrokeShape for styling consistency. [^3]
- React Native: Not supported; plan alternatives if targeting native. [^3]

References: getting started and layering tutorial. [^3][^8][^19]

### Vue: vue-konva

Vue bindings follow a config-driven approach. Components are prefixed with “v-” (v-stage, v-layer, v-rect, etc.), and Konva node parameters are passed via a config prop. This keeps template markup clean and aligns with Vue’s prop-based configuration. [^4][^9]

Installation involves registering the plugin and using the components in templates. Setup typically includes importing VueKonva and calling app.use(VueKonva) in your application entry. [^4]

Event handling and lifecycle patterns are idiomatic to Vue: use ref for mutable node lists, onMounted to initialize content, and reactive data to update shapes. The draggable stars example demonstrates reactive lists, dragstart/dragend handlers, and updating list order during drag. [^4]

Transformer usage is not purely declarative. The documented pattern is to create a v-transformer component and manually attach it to the selected Konva node. Attach on selection, update as needed, and detach when selection clears. [^7]

Custom shapes use v-shape and a drawing function that receives a renderer with access to the 2D context; fillStrokeShape helps apply consistent styling. [^18]

Table 4. Vue Components Mapping

| Konva Node | vue-konva Component | Config Pattern |
|---|---|---|
| Stage | v-stage | config = { width, height } [^4] |
| Layer | v-layer | config = { listening } [^4] |
| Rect | v-rect | config = { x, y, width, height, fill, draggable } [^9] |
| Circle | v-circle | config = { x, y, radius, fill } [^9] |
| Text | v-text | config = { text, fontSize, fill } [^9] |
| Transformer | v-transformer | Attach manually to node via Konva API [^7] |
| Custom | v-shape | Provide drawing function (sceneFunc) [^18] |

Vue Integration Guide

- Plugin setup: Import and register VueKonva. [^4]
- Component usage: Use v-stage/v-layer/v-* shapes; pass config props for positioning and styling. [^4][^9]
- Drag-and-drop: Set draggable in config; handle dragstart/dragend to update state and list order. [^4]
- Transformer: Manually attach/detach v-transformer to selected node(s). [^7]
- Custom shapes: Use v-shape with a drawing function; leverage fillStrokeShape for styling. [^18]
- Save/Load: Consult Vue Save & Load for JSON workflows. [^17]

References: getting started, shapes, transformer, custom shape. [^4][^9][^7][^18][^17]

### Angular: ng2-konva

Angular bindings use components prefixed with “ko-” (ko-stage, ko-rect, ko-circle, etc.) and bind Konva node configurations via [config]. This keeps templates readable and type-safe. The documentation specifies Angular version 20+. [^5]

Drag-and-drop is enabled by setting draggable: true in the shape’s config and handling drag events to update component state. The stage’s [config] typically defines width and height, and layers are declared as children in the template. [^10]

Transformer is provided as a component that attaches to selected nodes, enabling resize and rotate operations. Selection management is implemented in the component class, maintaining the selected node reference and updating the transformer accordingly. [^11]

Custom shapes are created using a Custom/Core shape component with a sceneFunc in the config. The sceneFunc receives the canvas context and shape, allowing direct drawing commands. [^12]

Table 5. Angular Components Mapping

| Konva Node | ng2-konva Component | Config Pattern |
|---|---|---|
| Stage | ko-stage | [config] = { width, height } [^5] |
| Layer | ko-layer | [config] = { listening } [^5] |
| Rect | ko-rect | [config] = { x, y, width, height, fill, draggable } [^5] |
| Circle | ko-circle | [config] = { x, y, radius, fill } [^5] |
| Text | ko-text | [config] = { text, fontSize, fill } [^5] |
| Transformer | ko-transformer | Attach to selected node via config/state [^11] |
| Custom shape | Custom/Core shape component | [config] with sceneFunc: (context, shape) => {...} [^12] |

Angular Integration Guide

- Install ng2-konva and konva; use Angular 20+. [^5]
- Stage and layers: Bind [config] on ko-stage; include ko-layer with shapes as children. [^5]
- Drag-and-drop: Set draggable in [config]; handle drag events in the component to update state. [^10]
- Transformer: Maintain selection state; attach/detach ko-transformer to the selected node. [^11]
- Custom shapes: Define sceneFunc in a Custom/Core shape’s config; draw with context APIs. [^12]
- Event handling: Bind events via templates; use component methods for shape-level interactions. [^12]

References: getting started, drag and drop, transformer, custom shape, events. [^5][^10][^11][^12]

### Svelte: svelte-konva

Svelte bindings mirror Konva components directly and pass parameters as props. The integration is designed to be declarative and reactive, matching Svelte’s compile-time reactivity model. [^6]

Event handling uses an on prop pattern: you pass a callback for a given event (click, dblclick, mouseover, tap, dbltap, touchstart, dragstart, dragmove, dragend), and the callback receives the Konva event object. By default, events bubble; to prevent bubbling, set cancelBubble to true in the callback. [^14]

Transformer usage requires direct Konva API interaction. You attach nodes to the transformer via nodes() and, if relevant props are bound, the library automatically synchronizes component props with the Konva node upon transformend. A detailed example demonstrates the selection and transformation lifecycle. [^13]

Custom shapes and advanced features (cache, filters, images, labels, save and load, zIndex, SvelteKit) are documented as separate topics. The “Import and use svelte konva components” section in the provided content is empty; therefore, teams should rely on the component mapping principle and the events page for immediate usage, and consult the repository examples and the SvelteKit doc for SSR nuances. [^6][^13]

Table 6. Svelte Components Mapping

| Konva Node | svelte-konva Component | Key Props |
|---|---|---|
| Stage | Stage | width, height, on:eventname [^6] |
| Layer | Layer | on:eventname [^6] |
| Rect | Rect | x, y, width, height, fill, draggable, on:click [^14] |
| Circle | Circle | x, y, radius, fill, on:dragend [^14] |
| Text | Text | text, fontSize, fill, on:mouseover [^14] |
| Transformer | Transformer | nodes() attachment; transformend prop sync [^13] |
| Custom | Konva node component | Props; sceneFunc via component usage [^6] |

Svelte Integration Guide

- Install svelte-konva and konva. [^6]
- Component usage: Import components that mirror Konva nodes; pass props for node configuration. [^6]
- Events: Use the on prop with callbacks; manage bubbling via cancelBubble. [^14]
- Transformer: Attach nodes via Konva API; rely on transformend synchronization when props are bound. [^13]
- Custom shapes: Use Konva node components with sceneFunc as needed. [^6]
- SvelteKit and SSR: Consult the SvelteKit doc and examples for build and SSR specifics. [^13][^15]

References: getting started, events, transformer, repo. [^6][^14][^13][^15]

---

## Node.js: SSR and Canvas Backends

Konva runs in Node.js without a DOM by selecting an appropriate backend. The setup guide outlines two options for Konva v10+:

- Canvas backend (default): npm install konva canvas
- Skia backend (better performance): npm install konva skia-canvas

Import the backend before using Konva; the container option is ignored under Node. Instantiate Stage with width and height, draw the scene, and export via stage.toDataURL(). Memory management is critical when batching image generation or processing many canvases. [^2]

SSR considerations are straightforward: Konva itself does not require a DOM, but framework SSR (e.g., Next.js) may complicate canvas rendering. The safest path is to perform canvas rendering client-side when using framework SSR. If you must render under Node (e.g., headless generation), isolate Konva code to the server environment and export images, then hydrate the client separately. [^2]

Table 7. Node.js Backend Options

| Backend | Install | Import Pattern | Performance Notes | Use Cases |
|---|---|---|---|---|
| Canvas (default) | npm install konva canvas | import 'konva/canvas-backend'; Konva... [^2] | Broad compatibility; suitable for many workloads | General image generation, charts |
| Skia | npm install konva skia-canvas | import 'konva/skia-backend'; Konva... [^2] | Better performance reported | Batch processing, heavy graphics |
| Legacy (≤ v9) | npm install konva | require('konva'); Konva... [^2] | Older API; no backend selection | Migration/legacy support |

Node Integration Guide

- Install Konva and backend: choose canvas or skia; import backend module before Konva. [^2]
- Create Stage: provide width/height; container is ignored. [^2]
- Draw and export: render shapes; call stage.toDataURL() to get a data URI or write to a file via Node streams. [^2]
- SSR strategy: avoid rendering canvas content in framework SSR pipelines; render client-side or headless and inject results. [^2]

---

## Cross-Cutting Topics

### Events and Bubbling

Konva events bubble up the node tree by default. In Svelte, you manage this with cancelBubble on the event object; the same concept applies in other frameworks since it is a Konva-level behavior. For precise interaction control, stop propagation on child nodes to keep handlers specific and predictable. [^14]

Table 8. Event Handling Patterns by Framework

| Framework | Declaration | Bubbling Control | Common Events |
|---|---|---|---|
| React | Props on shapes (onClick, onDragEnd) [^3] | Stop propagation in handlers; rely on JSX order | click, dragstart/move/end |
| Vue | Component events; config-driven | Attach/detach Transformer; manage selection [^7] | click, dragstart/move/end |
| Angular | [config] bindings and template handlers [^12] | Prevent bubbling within handler methods | click, dragstart/move/end |
| Svelte | on:eventname prop with callback [^14] | e.cancelBubble = true [^14] | click, dblclick, mouseover, tap, dbltap, touchstart, dragstart/move/end |

### Transformer Usage Patterns

The Transformer requires explicit node attachment in Vue and Svelte. In React, it is a component that can be bound via props; in Angular, the Transformer component is attached to selected nodes similar to other shapes. The general pattern is consistent: maintain a selection model in your framework state, attach the transformer to the selected node(s), and update component props to reflect changes. [^7][^13][^11][^3]

Table 9. Transformer Attachment Patterns

| Framework | Attachment Method | Sync Strategy |
|---|---|---|
| React | Component props/refs to nodes [^3] | State drives selection; props update automatically |
| Vue | Manual v-transformer attachment [^7] | Update on selection change; detach on clear |
| Angular | ko-transformer attached to selection [^11] | Maintain selection state; update transformer config |
| Svelte | nodes() function; transformend prop sync [^13] | Attach nodes; props synchronized on transformend |

### Custom Shapes

Custom shapes are defined via sceneFunc in all frameworks. Provide a drawing routine using the 2D context and apply styling with helpers. This is useful for bespoke graphics or specialized visualizations beyond built-in shapes. [^12][^18]

Table 10. Custom Shape Creation by Framework

| Framework | Component | Key API |
|---|---|---|
| React | Custom component / Shape with sceneFunc [^3] | sceneFunc(context, shape) |
| Vue | v-shape [^18] | Drawing function with context; fillStrokeShape |
| Angular | Custom/Core shape component [^12] | sceneFunc(context, shape) |
| Svelte | Konva node component [^6] | sceneFunc via component props |

### Save/Load and Serialization

Konva supports serialization via node.toJSON() and reconstruction via Node.create(json). The general best practice is to separate data from presentation: store your scene’s declarative state as JSON or your own domain models, then render it via framework components. This supports undo/redo, persistence, and complex workflows. For Vue-specific save/load workflows, consult the dedicated docs page. [^17]

---

## Decision Guide and Best Practices

Selecting the right integration depends on team expertise, framework constraints, and interaction complexity. Use the following guidelines:

- If your team is deeply React-centric and values declarative composition, react-konva is the natural choice. You gain component parity, event props, and straightforward layering via JSX order, with explicit caveats around React Native. [^3]
- If you prefer Vue’s config-driven templates and plugin registration, vue-konva aligns well. Remember that Transformer attachment is manual; plan for selection management in your component state. [^4][^7]
- Angular teams benefit from [config] bindings and componentized patterns. ng2-konva provides clear separation between logic and template, and custom shapes via sceneFunc integrate directly into Angular components. [^5][^12]
- If you favor Svelte’s reactivity and minimal boilerplate, svelte-konva is a good fit. You will use the on prop for events and direct Konva API calls for Transformer attachment, with cancelBubble to control bubbling. [^6][^14][^13]
- For server-side generation, choose Konva’s Canvas backend for compatibility or Skia for performance; export with toDataURL. If your app uses SSR frameworks, render canvas content client-side or run headless generation and hydrate the client with produced assets. [^2]

Common pitfalls:
- z-order confusion: remember that rendering order dictates z-order in React; leverage conditional rendering. In other frameworks, explicitly manage zIndex or use Konva layering methods. [^8]
- Transformer attachment gaps: in Vue and Svelte, ensure you attach/detach nodes correctly and synchronize props on transformend. [^7][^13]
- SSR pitfalls: avoid running canvas rendering inside framework SSR pipelines unless you fully control the environment; prefer client-side rendering or headless Node generation with Konva. [^2]
- React Native: unsupported; avoid attempting react-konva in native contexts. [^3]
- Hooks availability in React: hooks are not enumerated in the getting started content; consult the repo for up-to-date patterns. [^19]

Recommended starting points by use case:
- Rapid prototyping (React): start with Stage/Layer/Shape components; add Transformer and event props; manage state with useState. [^3][^8]
- Rich templates (Vue): use v-stage/v-layer/v-* shapes with config; implement Transformer with manual node attachment; reactive lists for drag-and-drop. [^4][^7]
- Enterprise Angular apps: adopt ng2-konva components with [config]; build feature modules around layers; centralize selection state for Transformer; implement custom shapes with sceneFunc. [^5][^11][^12]
- Svelte reactive UIs: leverage on prop events, cancelBubble for fine-grained control, and the Konva API for Transformer nodes; consult SvelteKit docs for SSR. [^6][^14][^13]
- Server-side image generation: choose backend (Skia for performance), run headless, export via toDataURL, manage memory and batch pipelines. [^2]

Table 11. Framework Selection Checklist

| Criterion | React | Vue | Angular | Svelte | Node.js |
|---|---|---|---|---|---|
| Team expertise | Strong React community | Vue templating familiarity | Angular enterprise patterns | Svelte reactivity | Node runtime |
| Interaction complexity | Declarative props | Manual transformer | Componentized config | Event prop + Konva API | Headless generation |
| SSR needs | Client-only recommended [^2] | Standard Vue client rendering | Angular SSR via platform; canvas client-only [^2] | SvelteKit nuances; client-only recommended [^2] | Headless with backend |
| Performance concerns | JSX-driven layering | Config-driven updates | [config] binding efficiency | Compile-time reactivity | Skia backend [^2] |
| Custom shapes | sceneFunc | v-shape + drawing function | Custom/Core + sceneFunc | Konva node component | sceneFunc under Node |

---

## Appendix: Source Index and Completeness Notes

This documentation synthesizes the official “getting started” guides for React, Vue, Angular, Svelte, and Node.js, along with core Konva concepts, layering, event bubbling, transformer patterns, custom shapes, and save/load best practices. It is designed to give developers a cohesive, actionable blueprint for integrating Konva across frameworks.

Information gaps present in the provided sources:
- React hooks specifics are not documented in the “getting started” page; teams should consult the react-konva repository for advanced patterns. [^19]
- The Svelte “Import and use svelte konva components” section is empty; rely on component mapping and events docs and repository examples for detailed usage. [^6][^14][^15]
- Angular SSR specifics are not covered in the Angular getting started; adhere to general Node.js SSR guidance (prefer client-side rendering for canvas content). [^5][^2]
- Performance benchmarks comparing Canvas vs Skia backends are not provided; select based on documented performance notes and workload. [^2]
- Vue event binding specifics are referenced by topics but not fully detailed in the provided pages; use Shapes and Transformer docs for orientation. [^9][^7]

Future enhancements:
- Add a consolidated API crosswalk table that maps Konva node methods to framework props/refs.
- Extend performance guidance with test scenarios comparing Canvas vs Skia backends for common workloads.
- Provide a detailed SSR blueprint for Next.js and SvelteKit with code samples for client-only canvas rendering.

References

[^1]: Konva Framework Overview. https://konvajs.org/docs/overview.html  
[^2]: Node.js Setup. https://konvajs.org/docs/nodejs/nodejs-setup  
[^3]: Getting started with React and Canvas via Konva. https://konvajs.org/docs/react/index.html  
[^4]: Getting started with Vue and Canvas via Konva. https://konvajs.org/docs/vue/index.html  
[^5]: Getting started with Angular and Canvas via Konva. https://konvajs.org/docs/angular/index.html  
[^6]: Getting started with Svelte and canvas via Konva. https://konvajs.org/docs/svelte/index.html  
[^7]: Vue Transformer Tutorial. https://konvajs.org/docs/vue/Transformer.html  
[^8]: Shape Layering. https://konvajs.org/docs/groups_and_layers/Layering.html  
[^9]: Drawing canvas shapes with Vue. https://konvajs.org/docs/vue/Shapes.html  
[^10]: Angular Konva Drag and Drop Tutorial. https://konvajs.org/docs/angular/Drag_And_Drop.html  
[^11]: Angular Konva Transformer Tutorial. https://konvajs.org/docs/angular/Transformer.html  
[^12]: Angular Konva Custom Shape Tutorial. https://konvajs.org/docs/angular/Custom_Shape.html  
[^13]: Svelte Transformer Tutorial. https://konvajs.org/docs/svelte/Transformer.html  
[^14]: Svelte Events Tutorial. https://konvajs.org/docs/svelte/Events.html  
[^15]: svelte-konva GitHub Repository. https://github.com/konvajs/svelte-konva  
[^16]: Konva.Layer API. https://konvajs.org/api/Konva.Layer.html  
[^17]: Save and Load HTML5 Canvas Stage Best Practices. https://konvajs.org/docs/data_and_serialization/Best_Practices.html  
[^18]: Vue Custom Shape Tutorial. https://konvajs.org/docs/vue/Custom_Shape.html  
[^19]: react-konva GitHub Repository. https://github.com/konvajs/react-konva

## Sources

[1] [Konva.js Documentation - Main Index](https://konvajs.org/docs/index.html) - High Reliability - Official documentation
[2] [Konva.js Overview Documentation](https://konvajs.org/docs/overview.html) - High Reliability - Official documentation
[3] [AI Tools Documentation](https://konvajs.org/docs/ai_tools.html) - High Reliability - Official documentation
[4] [Support Documentation](https://konvajs.org/docs/support.html) - High Reliability - Official documentation
[5] [Donation Documentation](https://konvajs.org/docs/donate.html) - High Reliability - Official documentation
[6] [Styling - Fill Documentation](https://konvajs.org/docs/styling/Fill.html) - High Reliability - Official documentation
[7] [Events Documentation](https://konvajs.org/docs/events/Binding_Events.html) - High Reliability - Official documentation
[8] [Drag and Drop Documentation](https://konvajs.org/docs/drag_and_drop/Drag_and_Drop.html) - High Reliability - Official documentation
[9] [Select and Transform Documentation](https://konvajs.org/docs/select_and_transform/Basic_demo.html) - High Reliability - Official documentation
[10] [Clipping Documentation](https://konvajs.org/docs/clipping/Clipping_Function.html) - High Reliability - Official documentation
[11] [Groups and Layers Documentation](https://konvajs.org/docs/groups_and_layers/Change_Containers.html) - High Reliability - Official documentation
[12] [Filters Documentation](https://konvajs.org/docs/filters/Blur.html) - High Reliability - Official documentation
[13] [Tweens Documentation](https://konvajs.org/docs/tweens/All_Controls.html) - High Reliability - Official documentation
[14] [Animations Documentation](https://konvajs.org/docs/animations/Create_an_Animation.html) - High Reliability - Official documentation
[15] [Demos and Examples](https://konvajs.org/docs/sandbox.html) - High Reliability - Official documentation
[16] [Selectors Documentation](https://konvajs.org/docs/selectors/Select_by_Name.html) - High Reliability - Official documentation
[17] [Data and Serialization Documentation](https://konvajs.org/docs/data_and_serialization/Best_Practices.html) - High Reliability - Official documentation
[18] [Performance Documentation](https://konvajs.org/docs/performance/All_Performance_Tips.html) - High Reliability - Official documentation
[19] [React Integration Documentation](https://konvajs.org/docs/react/index.html) - High Reliability - Official documentation
[20] [Vue Integration Documentation](https://konvajs.org/docs/vue/index.html) - High Reliability - Official documentation
[21] [Angular Integration Documentation](https://konvajs.org/docs/angular/index.html) - High Reliability - Official documentation
[22] [Svelte Integration Documentation](https://konvajs.org/docs/svelte/index.html) - High Reliability - Official documentation
[23] [Node.js Documentation](https://konvajs.org/docs/nodejs/nodejs-setup) - High Reliability - Official documentation
[24] [API Reference Documentation](https://konvajs.org/api/Konva.html) - High Reliability - Official documentation
[25] [Tools Documentation](https://konvajs.org/docs/tools.html) - High Reliability - Official documentation
[26] [Konva.Tag API Documentation](https://konvajs.org/api/Konva.Tag.html) - High Reliability - Official documentation
[27] [Konva.Text API Documentation](https://konvajs.org/api/Konva.Text.html) - High Reliability - Official documentation
[28] [Konva.TextPath API Documentation](https://konvajs.org/api/Konva.TextPath.html) - High Reliability - Official documentation
[29] [Konva.Transform API Documentation](https://konvajs.org/api/Konva.Transform.html) - High Reliability - Official documentation
[30] [Konva.Transformer API Documentation](https://konvajs.org/api/Konva.Transformer.html) - High Reliability - Official documentation
[31] [Konva.Tween API Documentation](https://konvajs.org/api/Konva.Tween.html) - High Reliability - Official documentation
[32] [Konva.Util API Documentation](https://konvajs.org/api/Konva.Util.html) - High Reliability - Official documentation
[33] [Konva.Wedge API Documentation](https://konvajs.org/api/Konva.Wedge.html) - High Reliability - Official documentation

[34] [HTML5 Canvas Set Fill Tutorial](https://konvajs.org/docs/styling/Fill.html) - High Reliability - Official documentation
[35] [HTML5 Canvas Set Shape Stroke Color and Width Tutorial](https://konvajs.org/docs/styling/Stroke.html) - High Reliability - Official documentation
[36] [HTML5 Canvas Set Shape Opacity Tutorial](https://konvajs.org/docs/styling/Opacity.html) - High Reliability - Official documentation
[37] [HTML5 Canvas Shadows Tutorial](https://konvajs.org/docs/styling/Shadow.html) - High Reliability - Official documentation
[38] [HTML5 Canvas Line Join Tutorial](https://konvajs.org/docs/styling/Line_Join.html) - High Reliability - Official documentation
[39] [HTML5 Canvas Hide and Show Shape Tutorial](https://konvajs.org/docs/styling/Hide_and_Show.html) - High Reliability - Official documentation
[40] [HTML5 Canvas Change Mouse Cursor Style](https://konvajs.org/docs/styling/Mouse_Cursor.html) - High Reliability - Official documentation
[41] [HTML5 Canvas Blend Modes](https://konvajs.org/docs/styling/Blend_Mode.html) - High Reliability - Official documentation
[42] [Fill and stroke order demo](https://konvajs.org/docs/styling/Fill_Stroke_Order.html) - High Reliability - Official documentation
[43] [Konva Framework Overview](https://konvajs.org/docs/overview.html) - High Reliability - Official documentation
[44] [Konva.Arc API Reference](https://konvajs.org/api/Konva.Arc.html) - High Reliability - Official documentation
[45] [HTML5 Canvas Shape Events - Binding Events Tutorial](https://konvajs.org/docs/events/Binding_Events.html) - High Reliability - Official documentation
[46] [Cancel Event Bubble Propagation Tutorial](https://konvajs.org/docs/events/Cancel_Propagation.html) - High Reliability - Official documentation
[47] [Custom Hit Detection Function Tutorial](https://konvajs.org/docs/events/Custom_Hit_Region.html) - High Reliability - Official documentation
[48] [Desktop and Mobile Events Support Tutorial](https://konvajs.org/docs/events/Desktop_and_Mobile.html) - High Reliability - Official documentation
[49] [Event Delegation Tutorial](https://konvajs.org/docs/events/Event_Delegation.html) - High Reliability - Official documentation
[50] [Fire Events Tutorial](https://konvajs.org/docs/events/Fire_Events.html) - High Reliability - Official documentation
[51] [Image Events Tutorial](https://konvajs.org/docs/events/Image_Events.html) - High Reliability - Official documentation
[52] [Keyboard Events Tutorial](https://konvajs.org/docs/events/Keyboard_Events.html) - High Reliability - Official documentation
[53] [Listen or Don't Listen to Events Tutorial](https://konvajs.org/docs/events/Listen_for_Events.html) - High Reliability - Official documentation
[54] [Mobile Touch Events Tutorial](https://konvajs.org/docs/events/Mobile_Events.html) - High Reliability - Official documentation
[55] [Mobile Scrolling and Native Events Tutorial](https://konvajs.org/docs/events/Mobile_Scrolling.html) - High Reliability - Official documentation
[56] [Multi-Event Binding Tutorial](https://konvajs.org/docs/events/Multi_Event.html) - High Reliability - Official documentation
[57] [Pointer Events Tutorial](https://konvajs.org/docs/events/Pointer_Events.html) - High Reliability - Official documentation
[58] [Remove Event Listener Tutorial](https://konvajs.org/docs/events/Remove_Event.html) - High Reliability - Official documentation
[59] [Special Stage Events Tutorial](https://konvajs.org/docs/events/Stage_Events.html) - High Reliability - Official documentation

[60] [Konva Framework Overview](https://konvajs.org/docs/overview.html) - High Reliability - Official documentation
[61] [Konva Shapes Category](https://konvajs.org/category/shapes) - High Reliability - Official documentation
[62] [Rectangle Shape Documentation](https://konvajs.org/docs/shapes/Rect.html) - High Reliability - Official documentation
[63] [Circle Shape Documentation](https://konvajs.org/docs/shapes/Circle.html) - High Reliability - Official documentation
[64] [Ellipse Shape Documentation](https://konvajs.org/docs/shapes/Ellipse.html) - High Reliability - Official documentation
[65] [Star Shape Documentation](https://konvajs.org/docs/shapes/Star.html) - High Reliability - Official documentation
[66] [Arc Shape Documentation](https://konvajs.org/docs/shapes/Arc.html) - High Reliability - Official documentation
[67] [Ring Shape Documentation](https://konvajs.org/docs/shapes/Ring.html) - High Reliability - Official documentation
[68] [Wedge Shape Documentation](https://konvajs.org/docs/shapes/Wedge.html) - High Reliability - Official documentation
[69] [Regular Polygon Shape Documentation](https://konvajs.org/docs/shapes/RegularPolygon.html) - High Reliability - Official documentation
[70] [Arrow Shape Documentation](https://konvajs.org/docs/shapes/Arrow.html) - High Reliability - Official documentation
[71] [Text Shape Documentation](https://konvajs.org/docs/shapes/Text.html) - High Reliability - Official documentation
[72] [TextPath Shape Documentation](https://konvajs.org/docs/shapes/TextPath.html) - High Reliability - Official documentation
[73] [Label Shape Documentation](https://konvajs.org/docs/shapes/Label.html) - High Reliability - Official documentation
[74] [Group Shape Documentation](https://konvajs.org/docs/shapes/Group.html) - High Reliability - Official documentation
[75] [Image Shape Documentation](https://konvajs.org/docs/shapes/Image.html) - High Reliability - Official documentation
[76] [Sprite Shape Documentation](https://konvajs.org/docs/shapes/Sprite.html) - High Reliability - Official documentation
[77] [Path Shape Documentation](https://konvajs.org/docs/shapes/Path.html) - High Reliability - Official documentation
[78] [Line Shape Documentation](https://konvajs.org/docs/shapes/Line.html) - High Reliability - Official documentation
[79] [Simple Line Documentation](https://konvajs.org/docs/shapes/Line_-_Simple_Line.html) - High Reliability - Official documentation
[80] [Spline Line Documentation](https://konvajs.org/docs/shapes/Line_-_Spline.html) - High Reliability - Official documentation
[81] [Polygon Line Documentation](https://konvajs.org/docs/shapes/Line_-_Polygon.html) - High Reliability - Official documentation
[82] [Blob Line Documentation](https://konvajs.org/docs/shapes/Line_-_Blob.html) - High Reliability - Official documentation
[83] [Custom Shape Documentation](https://konvajs.org/docs/shapes/Custom.html) - High Reliability - Official documentation

[84] [HTML5 Canvas Drag and Drop Tutorial](https://konvajs.org/docs/drag_and_drop/Drag_and_Drop.html) - High Reliability - Official documentation
[85] [HTML5 Canvas Drag and Drop an Image](https://konvajs.org/docs/drag_and_drop/Drag_an_Image.html) - High Reliability - Official documentation
[86] [HTML5 Canvas Drag and Drop a Group Tutorial](https://konvajs.org/docs/drag_and_drop/Drag_a_Group.html) - High Reliability - Official documentation
[87] [HTML5 Canvas Drag and Drop a Line](https://konvajs.org/docs/drag_and_drop/Drag_a_Line.html) - High Reliability - Official documentation
[88] [HTML5 Canvas Drag and Drop the Stage](https://konvajs.org/docs/drag_and_drop/Drag_a_Stage.html) - High Reliability - Official documentation
[89] [HTML5 Canvas Drag and Drop Events](https://konvajs.org/docs/drag_and_drop/Drag_Events.html) - High Reliability - Official documentation
[90] [HTML5 Canvas Simple Drag Bounds Tutorial](https://konvajs.org/docs/drag_and_drop/Simple_Drag_Bounds.html) - High Reliability - Official documentation
[91] [HTML5 Canvas Complex Drag and Drop Bounds](https://konvajs.org/docs/drag_and_drop/Complex_Drag_and_Drop.html) - High Reliability - Official documentation
[92] [HTML5 Canvas Drop Events](https://konvajs.org/docs/drag_and_drop/Drop_Events.html) - High Reliability - Official documentation
[93] [Konva.Node API Reference](https://konvajs.org/api/Konva.Node.html) - High Reliability - Official documentation
[94] [Drag and Drop Multiple Shapes Demo](https://konvajs.org/docs/sandbox/Drag_and_Drop_Multiple_Shapes.html) - High Reliability - Official documentation
[95] [Drag and Drop Collision Detection Demo](https://konvajs.org/docs/sandbox/Collision_Detection.html) - High Reliability - Official documentation
[96] [Objects Snapping Demo](https://konvajs.org/docs/sandbox/Objects_Snapping.html) - High Reliability - Official documentation
[97] [HTML5 Canvas Mobile Touch Events Tutorial](https://konvajs.org/docs/events/Mobile_Events.html) - High Reliability - Official documentation
[98] [All Konva Performance Tips](https://konvajs.org/docs/performance/All_Performance_Tips.html) - High Reliability - Official documentation

[99] [Basic demo: transformer basics](https://konvajs.org/docs/select_and_transform/Basic_demo.html) - High Reliability - Official documentation
[100] [Centered Scaling: center-based scaling](https://konvajs.org/docs/select_and_transform/Centered_Scaling.html) - High Reliability - Official documentation
[101] [Keep Ratio: aspect ratio preservation](https://konvajs.org/docs/select_and_transform/Keep_Ratio.html) - High Reliability - Official documentation
[102] [Styling: transformer appearance](https://konvajs.org/docs/select_and_transform/Transformer_Styling.html) - High Reliability - Official documentation
[103] [Complex Transformer Styling: advanced styling options](https://konvajs.org/docs/select_and_transform/Transformer_Complex_Styling.html) - High Reliability - Official documentation
[104] [Transform Events: transformation events](https://konvajs.org/docs/select_and_transform/Transform_Events.html) - High Reliability - Official documentation
[105] [Resize Limits: size constraints](https://konvajs.org/docs/select_and_transform/Resize_Limits.html) - High Reliability - Official documentation
[106] [Resize Snaps: snap-to-grid functionality](https://konvajs.org/docs/select_and_transform/Resize_Snaps.html) - High Reliability - Official documentation
[107] [Rotation Snaps: angle snapping](https://konvajs.org/docs/select_and_transform/Rotation_Snaps.html) - High Reliability - Official documentation
[108] [Stop Transform: transformation control](https://konvajs.org/docs/select_and_transform/Stop_Transform.html) - High Reliability - Official documentation
[109] [Force Update: manual transformer updates](https://konvajs.org/docs/select_and_transform/Force_Update.html) - High Reliability - Official documentation
[110] [Resize Text: text resizing](https://konvajs.org/docs/select_and_transform/Resize_Text.html) - High Reliability - Official documentation
[111] [Ignore Stroke: stroke exclusion](https://konvajs.org/docs/select_and_transform/Ignore_Stroke_On_Transform.html) - High Reliability - Official documentation
[112] [Complete Konva.Transformer API Documentation](https://konvajs.org/api/Konva.Transformer.html) - High Reliability - Official documentation

[113] [HTML5 Canvas Blur Image Filter Tutorial](https://konvajs.org/docs/filters/Blur.html) - High Reliability - Official documentation
[114] [HTML5 Canvas Brighten Image Filter Tutorial](https://konvajs.org/docs/filters/Brighten.html) - High Reliability - Official documentation
[115] [HTML5 Canvas Brightness Image Filter Tutorial](https://konvajs.org/docs/filters/Brightness.html) - High Reliability - Official documentation
[116] [HTML5 Canvas Contrast filter Image Tutorial](https://konvajs.org/docs/filters/Contrast.html) - High Reliability - Official documentation
[117] [HTML5 Canvas Custom Filter Tutorial](https://konvajs.org/docs/filters/Custom_Filter.html) - High Reliability - Official documentation
[118] [HTML5 Canvas Emboss filter Image Tutorial](https://konvajs.org/docs/filters/Emboss.html) - High Reliability - Official documentation
[119] [HTML5 Canvas Enhance Image Filter Tutorial](https://konvajs.org/docs/filters/Enhance.html) - High Reliability - Official documentation
[120] [HTML5 Canvas Grayscale Image Filter Tutorial](https://konvajs.org/docs/filters/Grayscale.html) - High Reliability - Official documentation
[121] [HTML5 Canvas HSL filter Image Tutorial](https://konvajs.org/docs/filters/HSL.html) - High Reliability - Official documentation
[122] [HTML5 Canvas HSV filter Image Tutorial](https://konvajs.org/docs/filters/HSV.html) - High Reliability - Official documentation
[123] [HTML5 Canvas Invert Image Filter Tutorial](https://konvajs.org/docs/filters/Invert.html) - High Reliability - Official documentation
[124] [HTML5 Canvas Kaleidoscope Image Filter Tutorial](https://konvajs.org/docs/filters/Kaleidoscope.html) - High Reliability - Official documentation
[125] [HTML5 Canvas Mask Image Filter Tutorial](https://konvajs.org/docs/filters/Mask.html) - High Reliability - Official documentation
[126] [HTML5 Canvas Multiple Filters Tutorial](https://konvajs.org/docs/filters/Multiple_Filters.html) - High Reliability - Official documentation
[127] [HTML5 Canvas Noise filter Image Tutorial](https://konvajs.org/docs/filters/Noise.html) - High Reliability - Official documentation
[128] [HTML5 Canvas Pixelate filter Image Tutorial](https://konvajs.org/docs/filters/Pixelate.html) - High Reliability - Official documentation
[129] [HTML5 Canvas RGB filter Image Tutorial](https://konvajs.org/docs/filters/RGB.html) - High Reliability - Official documentation
[130] [HTML5 Canvas Sepia filter Image Tutorial](https://konvajs.org/docs/filters/Sepia.html) - High Reliability - Official documentation
[131] [HTML5 Canvas Solarize filter Image Tutorial](https://konvajs.org/docs/filters/Solarize.html) - High Reliability - Official documentation
[132] [HTML5 Canvas Threshold filter Image Tutorial](https://konvajs.org/docs/filters/Threshold.html) - High Reliability - Official documentation
[133] [Konva.Filters API Reference](https://konvajs.org/api/Konva.Filters.html) - High Reliability - Official documentation

[134] [All Tween Controls Tutorial](https://konvajs.org/docs/tweens/All_Controls.html) - High Reliability - Official documentation
[135] [Basic Tweening Tutorial - Linear Easing](https://konvajs.org/docs/tweens/Linear_Easing.html) - High Reliability - Official documentation
[136] [Complex Tweening Tutorial](https://konvajs.org/docs/tweens/Complex_Tweening.html) - High Reliability - Official documentation
[137] [Konva.Tween API Documentation](https://konvajs.org/api/Konva.Tween.html) - High Reliability - Official documentation
[138] [Konva.Animation API Documentation](https://konvajs.org/api/Konva.Animation.html) - High Reliability - Official documentation
[139] [Create Animation Tutorial](https://konvajs.org/docs/animations/Create_an_Animation.html) - High Reliability - Official documentation
[140] [Animate Position Tutorial](https://konvajs.org/docs/animations/Moving.html) - High Reliability - Official documentation
[141] [Rotation Animation Tutorial](https://konvajs.org/docs/animations/Rotation.html) - High Reliability - Official documentation
[142] [Scale Animation Tutorial](https://konvajs.org/docs/animations/Scaling.html) - High Reliability - Official documentation
[143] [Stop Animation Tutorial](https://konvajs.org/docs/animations/Stop_Animation.html) - High Reliability - Official documentation
[144] [Text Animations Tutorial](https://konvajs.org/docs/animations/Text_Animations.html) - High Reliability - Official documentation
[145] [More Easing Functions Tutorial](https://konvajs.org/docs/tweens/All_Easings.html) - High Reliability - Official documentation
[146] [Simple Easings Tutorial](https://konvajs.org/docs/tweens/Common_Easings.html) - High Reliability - Official documentation
[147] [Optimize Animation Performance](https://konvajs.org/docs/performance/Optimize_Animation.html) - High Reliability - Official documentation
[148] [All Performance Tips](https://konvajs.org/docs/performance/All_Performance_Tips.html) - High Reliability - Official documentation
[149] [Avoid Memory Leaks](https://konvajs.org/docs/performance/Avoid_Memory_Leaks.html) - High Reliability - Official documentation

[150] [HTML5 Canvas Select Shape by Name Tutorial](https://konvajs.org/docs/selectors/Select_by_Name.html) - High Reliability - Official documentation
[151] [HTML5 Canvas Select Shape by Type Tutorial](https://konvajs.org/docs/selectors/Select_by_Type.html) - High Reliability - Official documentation
[152] [HTML5 Canvas Select Shape by id Tutorial](https://konvajs.org/docs/selectors/Select_by_id.html) - High Reliability - Official documentation
[153] [HTML5 Canvas Stage Serialization Tutorial](https://konvajs.org/docs/data_and_serialization/Serialize_a_Stage.html) - High Reliability - Official documentation
[154] [HTML5 Canvas to Data URL Tutorial](https://konvajs.org/docs/data_and_serialization/Stage_Data_URL.html) - High Reliability - Official documentation
[155] [Load Simple HTML5 Canvas Stage from JSON Tutorial](https://konvajs.org/docs/data_and_serialization/Simple_Load.html) - High Reliability - Official documentation
[156] [Load HTML5 Canvas Stage from JSON Tutorial](https://konvajs.org/docs/data_and_serialization/Complex_Load.html) - High Reliability - Official documentation
[157] [HTML5 Canvas Export to High Quality Image Tutorial](https://konvajs.org/docs/data_and_serialization/High-Quality-Export.html) - High Reliability - Official documentation
[158] [Save and Load HTML5 Canvas Stage Best Practices](https://konvajs.org/docs/data_and_serialization/Best_Practices.html) - High Reliability - Official documentation
[159] [HTML5 Canvas All Konva performance tips list](https://konvajs.org/docs/performance/All_Performance_Tips.html) - High Reliability - Official documentation

[160] [Getting started with React and Canvas via Konva](https://konvajs.org/docs/react/index.html) - High Reliability - Official documentation
[161] [Getting started with Vue and Canvas via Konva](https://konvajs.org/docs/vue/index.html) - High Reliability - Official documentation
[162] [Getting started with Angular and Canvas via Konva](https://konvajs.org/docs/angular/index.html) - High Reliability - Official documentation
[163] [Getting started with Svelte and canvas via Konva](https://konvajs.org/docs/svelte/index.html) - High Reliability - Official documentation
[164] [Node.js Setup for Konva](https://konvajs.org/docs/nodejs/nodejs-setup) - High Reliability - Official documentation
[165] [Drawing canvas shapes with Vue - Konva.js](https://konvajs.org/docs/vue/Shapes.html) - High Reliability - Official documentation
[166] [How to resize and rotate canvas shapes with Vue and Konva](https://konvajs.org/docs/vue/Transformer.html) - High Reliability - Official documentation
[167] [How to draw custom canvas shape with Vue](https://konvajs.org/docs/vue/Custom_Shape.html) - High Reliability - Official documentation
[168] [Angular Konva Drag and Drop Tutorial](https://konvajs.org/docs/angular/Drag_And_Drop.html) - High Reliability - Official documentation
[169] [Angular Konva Events Tutorial](https://konvajs.org/docs/angular/Events.html) - High Reliability - Official documentation
[170] [Angular Konva Custom Shape Tutorial](https://konvajs.org/docs/angular/Custom_Shape.html) - High Reliability - Official documentation
[171] [Shape Layering with React hooks](https://konvajs.org/docs/groups_and_layers/Layering.html) - High Reliability - Official documentation
[172] [Svelte Event Handling with Konva](https://konvajs.org/docs/svelte/Events.html) - High Reliability - Official documentation
[173] [Svelte Transformer Component Usage](https://konvajs.org/docs/svelte/Transformer.html) - High Reliability - Official documentation

[174] [All Konva Performance Tips](https://konvajs.org/docs/performance/All_Performance_Tips.html) - High Reliability - Official documentation
[175] [How to Avoid Memory Leaks](https://konvajs.org/docs/performance/Avoid_Memory_Leaks.html) - High Reliability - Official documentation
[176] [Batch Draw Optimization](https://konvajs.org/docs/performance/Batch_Draw.html) - High Reliability - Official documentation
[177] [Disable Perfect Drawing](https://konvajs.org/docs/performance/Disable_Perfect_Draw.html) - High Reliability - Official documentation
[178] [Layer Management Performance](https://konvajs.org/docs/performance/Layer_Management.html) - High Reliability - Official documentation
[179] [Listening False Performance Optimization](https://konvajs.org/docs/performance/Listening_False.html) - High Reliability - Official documentation
[180] [Optimize Animation Performance](https://konvajs.org/docs/performance/Optimize_Animation.html) - High Reliability - Official documentation
[181] [Optimize Strokes Performance](https://konvajs.org/docs/performance/Optimize_Strokes.html) - High Reliability - Official documentation
[182] [Shape Caching Performance](https://konvajs.org/docs/performance/Shape_Caching.html) - High Reliability - Official documentation
