# Konva.js Complete Documentation

**Extracted on:** October 25, 2025  
**Source:** https://konvajs.org

---

## Table of Contents

1. [Introduction](#introduction)
2. [API Reference](#api-reference)
3. [Shapes](#shapes)
4. [Styling](#styling)
5. [Events](#events)
6. [Drag and Drop](#drag-and-drop)
7. [Select and Transform](#select-and-transform)
8. [Clipping](#clipping)
9. [Groups and Layers](#groups-and-layers)
10. [Filters](#filters)
11. [Tweens](#tweens)
12. [Animations](#animations)
13. [Selectors](#selectors)
14. [Data and Serialization](#data-and-serialization)
15. [Performance](#performance)
16. [Framework Integrations](#framework-integrations)

---

## Introduction

### What's Konva?

Konva is an HTML5 Canvas JavaScript framework that extends the 2d context by enabling canvas interactivity for desktop and mobile applications.

Konva enables high performance animations, transitions, node nesting, layering, filtering, caching, event handling for desktop and mobile applications, and much more.

You can draw things onto the stage, add event listeners to them, move them, scale them, and rotate them independently from other shapes to support high performance animations, even if your application uses thousands of shapes.

### Installation

**NPM:**
```bash
npm install konva
```

**Script Tag:**
```html
<script src="https://unpkg.com/konva@10/konva.min.js"></script>
```

**CDN:**
- Full version: konva.js
- Min version: konva.min.js

---

## API Reference

### Konva Core

**Global Properties:**

- `Konva.autoDrawEnabled` (default: true) - Should Konva automatically update canvas on any changes
- `Konva.hitOnDragEnabled` (default: false) - Should we enable hit detection while dragging?
- `Konva.capturePointerEventsEnabled` (default: false) - Should we capture touch events and bind them to the touchstart target?
- `Konva.legacyTextRendering` (default: false) - Use legacy text rendering with "middle" baseline by default
- `Konva.pixelRatio` (default: undefined) - Global pixel ratio configuration
- `Konva.dragDistance` (default: 0) - Drag distance property
- `Konva.angleDeg` (default: true) - Use degree values for angle properties
- `Konva.showWarnings` (default: true) - Show different warnings about errors or wrong API usage
- `Konva.dragButtons` (default: [0]) - Configure what mouse buttons can be used for drag and drop
- `Konva.releaseCanvasOnDestroy` (default: true) - Should Konva release canvas elements on destroy

**Methods:**

- `Konva.isDragging()` - returns whether or not drag and drop is currently active
- `Konva.isDragReady()` - returns whether or not a drag and drop operation is ready

---

### Animation

```javascript
new Konva.Animation(config)
```

Animation constructor executed on each animation frame.

**Parameters:**
- `func` (AnimationFn) - function executed on each frame with frame object containing:
  - `timeDiff` - milliseconds since last frame
  - `time` - time elapsed from animation start
  - `lastTime` - time value from previous frame
  - `frameRate` - current frame rate in frames/second
- `layers` (Konva.Layer|Array) (optional) - layer(s) to redraw on each frame

**Methods:**
- `setLayers(layers)` - set layers to be redrawn
- `getLayers()` - get layers (returns Array)
- `addLayer(layer)` - add layer, returns true if added
- `isRunning()` - returns Bool
- `start()` - start animation (returns this)
- `stop()` - stop animation (returns this)

---

### Arc

```javascript
new Konva.Arc(config)
```

Arc constructor.

**Parameters:**
- `angle` (Number) - in degrees
- `innerRadius` (Number)
- `outerRadius` (Number)
- `clockwise` (Boolean) (optional)
- Plus all standard shape styling properties (fill, stroke, shadow, etc.)

---

### Arrow

```javascript
new Konva.Arrow(config)
```

Arrow constructor.

**Parameters:**
- `points` (Array) - Flat array of coordinates [x1, y1, x2, y2, x3, y3]
- `tension` (Number) (optional) - Higher values = more curvy. Default: 0
- `pointerLength` (Number) - Arrow pointer length. Default: 10
- `pointerWidth` (Number) - Arrow pointer width. Default: 10
- `pointerAtBeginning` (Boolean) - Draw pointer at beginning? Default: false
- `pointerAtEnding` (Boolean) - Draw pointer at ending? Default: true
- Plus all standard shape styling properties

---

### Canvas

```javascript
new Konva.Canvas(config)
```

Canvas Renderer constructor - wrapper around native canvas element.

**Parameters:**
- `width` (Number)
- `height` (Number)
- `pixelRatio` (Number)

**Methods:**
- `getContext()` - get canvas context (returns CanvasContext)
- `getPixelRatio()` - get pixel ratio (returns Number)
- `setPixelRatio(pixelRatio)` - set pixel ratio
- `toDataURL(mimeType, quality)` - convert to data URL

---

### Circle

```javascript
new Konva.Circle(config)
```

Circle constructor.

**Parameters:**
- `radius` (Number)
- Plus all standard shape styling properties (fill, stroke, shadow, position, etc.)

---

### Container

```javascript
new Konva.Container(config)
```

Container constructor for containing nodes or other containers.

**Parameters:**
- Standard node properties (x, y, width, height, visible, listening, id, name, opacity, scale, rotation, offset, draggable, clip, etc.)

**Methods:**
- `getChildren(filterFunc)` - returns array of direct descendants
- `hasChildren()` - returns Boolean
- `removeChildren()` - remove all children (keeps in memory)
- `destroyChildren()` - destroy all children nodes
- `add(children)` - add child(ren) into container
- `find(selector)` - return array of nodes matching selector (#id, .name, Type)
- `findOne(selector)` - return first node matching selector
- `isAncestorOf(node)` - determine if node is ancestor of descendant
- `getAllIntersections(pos)` - get all shapes that intersect a point
- `clip(clip)` - get/set clip region

---

### Context

```javascript
new Konva.Context(config)
```

Konva wrapper around native 2d canvas context with additional API.

**Methods:**
- `fillShape(shape)` - fill shape
- `strokeShape(shape)` - stroke shape
- `fillStrokeShape(shape)` - fill then stroke
- `reset()` - reset canvas context transform
- `getCanvas()` - get canvas wrapper (returns Konva.Canvas)
- `clear(bounds)` - clear canvas
- All native 2d context methods: arc(), arcTo(), beginPath(), bezierCurveTo(), clearRect(), closePath(), createImageData(), createLinearGradient(), createPattern(), createRadialGradient(), drawImage(), ellipse(), isPointInPath(), fillRect(), strokeRect(), fillText(), measureText(), getImageData(), lineTo(), moveTo(), rect(), roundRect(), putImageData(), quadraticCurveTo(), restore(), rotate(), save(), scale(), setLineDash(), getLineDash(), setTransform(), stroke(), strokeText(), transform(), translate()

---

### Easings

Namespace for easing functions.

**Methods:**
- `BackEaseIn()` - back ease in
- `BackEaseOut()` - back ease out
- `BackEaseInOut()` - back ease in out
- `ElasticEaseIn()` - elastic ease in
- `ElasticEaseOut()` - elastic ease out
- `ElasticEaseInOut()` - elastic ease in out
- `BounceEaseOut()` - bounce ease out
- `BounceEaseIn()` - bounce ease in
- `BounceEaseInOut()` - bounce ease in out
- `EaseIn()` - ease in
- `EaseOut()` - ease out
- `EaseInOut()` - ease in out
- `StrongEaseIn()` - strong ease in
- `StrongEaseOut()` - strong ease out
- `StrongEaseInOut()` - strong ease in out
- `Linear()` - linear

---

### Ellipse

```javascript
new Konva.Ellipse(config)
```

Ellipse constructor.

**Parameters:**
- `radius` (Object) - defines x and y radius
- Plus all standard shape styling properties

---

### FastLayer

```javascript
new Konva.FastLayer(config)
```

**DEPRECATED!** Use `Konva.Layer({ listening: false })` instead.

FastLayer constructor for layers without node nesting, mouse/touch interactions, or event pub/sub. Renders ~2x faster than normal layers.

---

### Filters

Namespace for image filters.

**Available Filters:**

1. **Blur(imageData)**
   ```javascript
   node.cache();
   node.filters([Konva.Filters.Blur]);
   node.blurRadius(10);
   ```

2. **Brighten(imageData)** - DEPRECATED
   ```javascript
   node.cache();
   node.filters([Konva.Filters.Brighten]);
   node.brightness(0.8);
   ```

3. **Brightness(imageData)** - CSS-compatible multiplicative brightness
   ```javascript
   node.cache();
   node.filters([Konva.Filters.Brightness]);
   node.brightness(1.5); // 50% brighter
   ```

4. **Contrast(imageData)**
   ```javascript
   node.cache();
   node.filters([Konva.Filters.Contrast]);
   node.contrast(10);
   ```

5. **Emboss(imageData)**
   ```javascript
   node.cache();
   node.filters([Konva.Filters.Emboss]);
   node.embossStrength(0.8);
   node.embossWhiteLevel(0.3);
   node.embossDirection('right');
   node.embossBlend(true);
   ```

6. **Enhance(imageData)** - Adjusts colors to span widest range (0-255)
   ```javascript
   node.cache();
   node.filters([Konva.Filters.Enhance]);
   node.enhance(0.4);
   ```

7. **Grayscale(imageData)**
   ```javascript
   node.cache();
   node.filters([Konva.Filters.Grayscale]);
   ```

8. **HSL(imageData)** - Adjust hue, saturation, luminance
   ```javascript
   image.filters([Konva.Filters.HSL]);
   image.luminance(0.2);
   ```

9. **HSV(imageData)** - Adjust hue, saturation, value
   ```javascript
   image.filters([Konva.Filters.HSV]);
   image.value(200);
   ```

10. **Invert(imageData)**
    ```javascript
    node.cache();
    node.filters([Konva.Filters.Invert]);
    ```

11. **Mask(imageData)**
    ```javascript
    node.cache();
    node.filters([Konva.Filters.Mask]);
    node.threshold(200);
    ```

12. **Noise(imageData)** - Randomly adds/subtracts to color channels
    ```javascript
    node.cache();
    node.filters([Konva.Filters.Noise]);
    node.noise(0.8);
    ```

13. **Pixelate(imageData)** - Averages pixel groups
    ```javascript
    node.cache();
    node.filters([Konva.Filters.Pixelate]);
    node.pixelSize(10);
    ```

14. **Posterize(imageData)** - Limit channel values
    ```javascript
    node.cache();
    node.filters([Konva.Filters.Posterize]);
    node.levels(0.8); // between 0 and 1
    ```

15. **RGB(imageData)**
    ```javascript
    node.cache();
    node.filters([Konva.Filters.RGB]);
    node.blue(120);
    node.green(200);
    ```

16. **RGBA(imageData)**
    ```javascript
    node.cache();
    node.filters([Konva.Filters.RGBA]);
    node.blue(120);
    node.green(200);
    node.alpha(0.3);
    ```

17. **Sepia(imageData)**
    ```javascript
    node.cache();
    node.filters([Konva.Filters.Sepia]);
    ```

18. **Solarize(imageData)**
    ```javascript
    node.cache();
    node.filters([Konva.Filters.Solarize]);
    ```

19. **Threshold(imageData)** - Pushes values above/below midpoint to max/min
    ```javascript
    node.cache();
    node.filters([Konva.Filters.Threshold]);
    node.threshold(0.1);
    ```

---

### Group

```javascript
new Konva.Group(config)
```

Group constructor for containing shapes or other groups.

**Parameters:**
- Standard container properties (x, y, width, height, visible, listening, id, name, opacity, scale, rotation, offset, draggable, clip, etc.)

**Inherited Methods:** All Container methods (getChildren, add, find, etc.)

---

### Image

```javascript
new Konva.Image(config)
```

Image constructor.

**Parameters:**
- `image` (Image) - HTML Image object
- `crop` (Object) (optional) - crop region
- Plus all standard shape styling properties

---

### Label

```javascript
new Konva.Label(config)
```

Label constructor - groups containing Text and Tag shape.

**Parameters:**
- Standard group properties

**Methods:**
- `getText()` - get Text shape
- `getTag()` - get Tag shape

---

### Layer

```javascript
new Konva.Layer(config)
```

Layer constructor tied to own canvas element for containing groups or shapes.

**Parameters:**
- `clearBeforeDraw` (Boolean) (optional) - Default: true
- Plus standard container properties

**Methods:**
- `getCanvas()` - get layer canvas wrapper
- `getNativeCanvasElement()` - get native canvas element
- `getHitCanvas()` - get layer hit canvas
- `getContext()` - get layer canvas context
- `width()` - get/set width (returns Number)
- `height()` - get/set height (returns Number)
- `batchDraw()` - schedule drawing to next tick (returns this)
- `getIntersection(pos)` - get visible intersection shape (returns Konva.Node)
- `enableHitGraph()` - DEPRECATED! Use layer.listening(true)
- `disableHitGraph()` - DEPRECATED! Use layer.listening(false)
- `toggleHitCanvas()` - Show/hide hit canvas for debugging
- `imageSmoothingEnabled(enabled)` - get/set imageSmoothingEnabled flag
- `clearBeforeDraw(clearBeforeDraw)` - get/set clearBeforeDraw flag
- `hitGraphEnabled(enabled)` - DEPRECATED! Use layer.listening()

---

### Line

```javascript
new Konva.Line(config)
```

Line constructor defined by array of points and tension.

**Parameters:**
- `points` (Array) - Flat array [x1, y1, x2, y2, x3, y3]
- `tension` (Number) (optional) - Higher = more curvy. Default: 0
- `closed` (Boolean) (optional) - Create polygon/blob
- `bezier` (Boolean) (optional) - Draw as bezier using passed points
- Plus all standard shape styling properties

---

### Node

```javascript
new Konva.Node(config)
```

Node constructor - base for entities that can be transformed, layered, and have bound events.

**Parameters:**
- `x`, `y` (Number) (optional)
- `width`, `height` (Number) (optional)
- `visible` (Boolean) (optional)
- `listening` (Boolean) (optional)
- `id` (String) (optional) - unique id
- `name` (String) (optional) - non-unique name
- `opacity` (Number) (optional) - between 0 and 1
- `scale` (Object) (optional) - {x, y}
- `scaleX`, `scaleY` (Number) (optional)
- `rotation` (Number) (optional) - in degrees
- `offset` (Object) (optional) - {x, y}
- `offsetX`, `offsetY` (Number) (optional)
- `draggable` (Boolean) (optional)
- `dragDistance` (Number) (optional)
- `dragBoundFunc` (function) (optional)

**Methods:**
- `clearCache()` - clear cached canvas (returns this)
- `cache(config)` - cache node to improve performance
  - config.x, config.y, config.width, config.height (optional)
  - config.offset (Number) (optional) - increase canvas size
  - config.drawBorder (Boolean) (optional) - draw red debug border
  - config.pixelRatio (Number) (optional) - change cache quality
  - config.imageSmoothingEnabled (Boolean) (optional)
  - config.hitCanvasPixelRatio (Number) (optional)
- `isCached()` - determine if node is cached (returns Boolean)
- `getClientRect(config)` - return client rectangle {x, y, width, height}
  - config.skipTransform, config.skipShadow, config.skipStroke (Boolean) (optional)
  - config.relativeTo (Object) (optional)
- `on(evtStr, handler)` - bind events (mouseover, mousemove, mouseout, mouseenter, mouseleave, mousedown, mouseup, wheel, contextmenu, click, dblclick, touchstart, touchmove, touchend, tap, dbltap, dragstart, dragmove, dragend)
- `off(evtStr)` - remove event bindings
- `fire(eventType, evt)` - trigger event
- `draw()` - draw node
- `getAttr(attr)` - get attribute
- `setAttr(attr, val)` - set attribute
- `setAttrs(attrs)` - set multiple attributes
- `to(params)` - tween node to new state
- `destroy()` - remove and destroy node
- `remove()` - remove node from parent
- `moveToTop()` - move to top of siblings
- `moveToBottom()` - move to bottom
- `moveUp()` - move up one position
- `moveDown()` - move down one position
- `zIndex(index)` - get/set zIndex
- `getAbsolutePosition()` - get absolute position
- `setAbsolutePosition(pos)` - set absolute position
- `clone(attrs)` - clone node
- `toJSON()` - convert to JSON string
- `toObject()` - convert to object

---

### Path

```javascript
new Konva.Path(config)
```

Path constructor for SVG paths.

**Parameters:**
- `data` (String) - SVG data string
- Plus all standard shape styling properties

---

### Rect

```javascript
new Konva.Rect(config)
```

Rectangle constructor.

**Parameters:**
- `cornerRadius` (Number or Array) (optional) - Can be number or [topLeft, topRight, bottomRight, bottomLeft]
- Plus all standard shape styling properties

---

### RegularPolygon

```javascript
new Konva.RegularPolygon(config)
```

RegularPolygon constructor for triangles, squares, pentagons, hexagons, etc.

**Parameters:**
- `cornerRadius` (Number) (optional)
- `sides` (Number)
- `radius` (Number)
- Plus all standard shape styling properties

---

### Ring

```javascript
new Konva.Ring(config)
```

Ring constructor.

**Parameters:**
- `innerRadius` (Number)
- `outerRadius` (Number)
- Plus all standard shape styling properties

---

### Shape

```javascript
new Konva.Shape(config)
```

Shape constructor for primitive objects.

**Parameters:**
- `fill` (String) (optional) - fill color
- `fillPatternImage` (Image) (optional)
- `fillPatternX`, `fillPatternY` (Number) (optional)
- `fillPatternOffset` (Object) (optional)
- `fillPatternScale` (Object) (optional)
- `fillPatternRotation` (Number) (optional)
- `fillPatternRepeat` (String) (optional) - "repeat", "repeat-x", "repeat-y", "no-repeat"
- `fillLinearGradientStartPoint`, `fillLinearGradientEndPoint` (Object) (optional)
- `fillLinearGradientColorStops` (Array) (optional)
- `fillRadialGradientStartPoint`, `fillRadialGradientEndPoint` (Object) (optional)
- `fillRadialGradientStartRadius`, `fillRadialGradientEndRadius` (Number) (optional)
- `fillRadialGradientColorStops` (Array) (optional)
- `fillEnabled` (Boolean) (optional) - Default: true
- `fillPriority` (String) (optional) - "color", "linear-gradient", "radial-gradient", "pattern"
- `stroke` (String) (optional) - stroke color
- `strokeWidth` (Number) (optional)
- `fillAfterStrokeEnabled` (Boolean) (optional) - Default: false
- `hitStrokeWidth` (Number) (optional) - Default: "auto"
- `strokeHitEnabled` (Boolean) (optional) - Default: true
- `perfectDrawEnabled` (Boolean) (optional) - Default: true
- `shadowForStrokeEnabled` (Boolean) (optional) - Default: true
- `strokeScaleEnabled` (Boolean) (optional) - Default: true
- `strokeEnabled` (Boolean) (optional) - Default: true
- `lineJoin` (String) (optional) - "miter", "round", "bevel"
- `lineCap` (String) (optional) - "butt", "round", "square"
- `shadowColor` (String) (optional)
- `shadowBlur` (Number) (optional)
- `shadowOffset` (Object) (optional)
- `shadowOpacity` (Number) (optional) - between 0 and 1
- `shadowEnabled` (Boolean) (optional) - Default: true
- `dash` (Array) (optional)
- `dashEnabled` (Boolean) (optional) - Default: true
- Plus all standard node properties

---

### Sprite

```javascript
new Konva.Sprite(config)
```

Sprite constructor for sprite animations.

**Parameters:**
- `animation` (String) - animation key
- `animations` (Object) - animation map
- `frameIndex` (Integer) (optional)
- `image` (Image) - image object
- `frameRate` (Integer) (optional)
- Plus all standard shape styling properties

---

### Stage

```javascript
new Konva.Stage(config)
```

Stage constructor to contain multiple layers.

**Parameters:**
- `container` (String|Element) - Container selector or DOM element
- Plus standard container properties

**Methods:**
- `setContainer(container)` - set container DOM element
- `clear()` - clear all layers
- `getPointerPosition()` - returns ABSOLUTE pointer position (returns Vector2d|null)
- `getIntersection(pos)` - get visible intersection shape (returns Konva.Node)
- `getLayers()` - returns array of layers
- `setPointersPositions(event)` - manually register pointers positions
- `batchDraw()` - batch draw (returns this)
- `container()` - get/set container DOM element

---

### Star

```javascript
new Konva.Star(config)
```

Star constructor.

**Parameters:**
- `numPoints` (Integer)
- `innerRadius` (Number)
- `outerRadius` (Number)
- Plus all standard shape styling properties

---

### Tag

```javascript
new Konva.Tag(config)
```

Tag constructor with optional pointer element.

**Parameters:**
- `pointerDirection` (String) (optional) - "up", "right", "down", "left", "none"
- `pointerWidth` (Number) (optional)
- `pointerHeight` (Number) (optional)
- `cornerRadius` (Number or Array) (optional)

**Methods:**
- `pointerDirection(direction)` - get/set pointer direction
- `pointerWidth(width)` - get/set pointer width
- `pointerHeight(height)` - get/set pointer height
- `cornerRadius(radius)` - get/set corner radius (can be array)

---

### Text

```javascript
new Konva.Text(config)
```

Text constructor.

**Parameters:**
- `direction` (String) (optional) - Default: "inherit"
- `fontFamily` (String) (optional) - Default: "Arial"
- `fontSize` (Number) (optional) - Default: 12
- `fontStyle` (String) (optional) - "normal", "italic", "bold", "500", "italic bold"
- `fontVariant` (String) (optional) - "normal", "small-caps"
- `textDecoration` (String) (optional) - "line-through", "underline", ""
- `text` (String)
- `align` (String) (optional) - "left", "center", "right", "justify"
- `verticalAlign` (String) (optional) - "top", "middle", "bottom"
- `padding` (Number) (optional)
- `lineHeight` (Number) (optional) - Default: 1
- `wrap` (String) (optional) - "word", "char", "none"
- `ellipsis` (Boolean) (optional) - Default: false
- Plus all standard shape styling properties

---

### TextPath

```javascript
new Konva.TextPath(config)
```

TextPath constructor for text along a path.

**Parameters:**
- `fontFamily` (String) (optional) - Default: "Arial"
- `fontSize` (Number) (optional) - Default: 12
- `fontStyle` (String) (optional)
- `fontVariant` (String) (optional)
- `textBaseline` (String) (optional) - "top", "bottom", "middle", "alphabetic", "hanging"
- `text` (String)
- `data` (String) - SVG data string
- `kerningFunc` (function) - getter for kerning values
- Plus all standard shape styling properties

---

### Transform

```javascript
new Konva.Transform(config)
```

Transform constructor for manual calculations.

**Parameters:**
- `m` (Array) (optional) - six-element matrix

**Methods:**
- `copy()` - copy Transform object (returns Konva.Transform)
- `point(point)` - transform point (returns Object {x, y})
- `translate(x, y)` - apply translation (returns this)
- `scale(sx, sy)` - apply scale (returns this)
- `rotate(rad)` - apply rotation in radians (returns this)
- `getTranslation()` - returns translation (Object {x, y})
- `skew(sx, sy)` - apply skew (returns this)
- `multiply(matrix)` - transform multiplication (returns this)
- `invert()` - invert the matrix (returns this)
- `getMatrix()` - return matrix
- `decompose()` - convert transformation matrix to node attributes (returns this)

---

### Transformer

```javascript
new Konva.Transformer(config)
```

Transformer constructor for transforming primitives and shapes. Changes scaleX/scaleY, not width/height.

**Parameters:**
- `resizeEnabled` (Boolean) (optional) - Default: true
- `rotateEnabled` (Boolean) (optional) - Default: true
- `rotateLineVisible` (Boolean) (optional) - Default: true
- `rotationSnaps` (Array) (optional) - angles for rotation snaps. Default: []
- `rotationSnapTolerance` (Number) (optional) - Default: 5
- `rotateAnchorOffset` (Number) (optional) - Default: 50
- `rotateAnchorCursor` (String) (optional) - Default: "crosshair"
- `padding` (Number) (optional) - Default: 0
- `borderEnabled` (Boolean) (optional) - Default: true
- `borderStroke` (String) (optional)
- `borderStrokeWidth` (Number) (optional)
- `borderDash` (Array) (optional)
- `anchorFill` (String) (optional)
- `anchorStroke` (String) (optional)
- `anchorCornerRadius` (String) (optional)
- `anchorStrokeWidth` (Number) (optional)
- `anchorSize` (Number) (optional) - Default: 10
- `keepRatio` (Boolean) (optional) - Default: true
- `shiftBehavior` (String) (optional) - Default: "default"
- `centeredScaling` (Boolean) (optional) - Default: false
- `enabledAnchors` (Array) (optional)
- `flipEnabled` (Boolean) (optional) - Default: true
- `boundBoxFunc` (function) (optional)
- `ignoreStroke` (function) (optional) - Default: false
- `useSingleNodeRotation` (Boolean) (optional)
- `shouldOverdrawWholeArea` (Boolean) (optional)

**Methods:**
- `attachTo()` - alias to tr.nodes([shape]) - DEPRECATED
- `getActiveAnchor()` - return name of current active anchor
- `detach()` - detach from attached node (returns this)
- `on(evtStr, handler)` - bind events (transform, transformstart, transformend, dragstart, dragmove, dragend)
- `forceUpdate()` - force update of transformer
- `isTransforming()` - determine if transformer is in active transform (returns Boolean)
- `stopTransform()` - stop active transform action (returns Boolean)
- `enabledAnchors(array)` - get/set enabled handlers
- `flipEnabled(flag)` - get/set flip enabled
- `resizeEnabled(enabled)` - get/set resize ability
- `anchorSize(size)` - get/set anchor size
- `rotateEnabled(enabled)` - get/set ability to rotate

---

### Tween

```javascript
new Konva.Tween(config)
```

Tween constructor for animating nodes between states. Default easing is linear.

**Methods:**
- `play()` - play (returns Tween)
- `reverse()` - reverse (returns Tween)
- `reset()` - reset (returns Tween)
- `seek(t)` - seek to time in seconds (returns Tween)
- `pause()` - pause (returns Tween)
- `finish()` - finish (returns Tween)
- `destroy()` - destroy

---

### Util

Utility namespace.

**Methods:**
- `getRandomColor()` - return random hex color
- `getRGB(color)` - get RGB components {r, g, b}
- `haveIntersection(r1, r2)` - check intersection of two client rectangles

---

### Wedge

```javascript
new Konva.Wedge(config)
```

Wedge (pie piece) constructor.

**Parameters:**
- `angle` (Number) - in degrees
- `radius` (Number)
- `clockwise` (Boolean) (optional)
- Plus all standard shape styling properties

---

## Shapes

### Rectangle

To create a rectangle:

```javascript
const rect = new Konva.Rect({
  x: 20,
  y: 20,
  width: 100,
  height: 50,
  fill: 'green',
  stroke: 'black',
  strokeWidth: 4,
  cornerRadius: 10 // Can be number or array [topLeft, topRight, bottomRight, bottomLeft]
});
```

### Circle

To create a circle:

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

### Ellipse

To create an ellipse:

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

### Star

To create a star:

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

### Line - Simple Line

To create a simple line:

```javascript
const line = new Konva.Line({
  points: [5, 70, 140, 23, 250, 60, 300, 20],
  stroke: 'red',
  strokeWidth: 15,
  lineCap: 'round',
  lineJoin: 'round'
});
```

### Line - Polygon

To create a polygon (closed line):

```javascript
const polygon = new Konva.Line({
  points: [73, 192, 73, 160, 340, 23, 500, 109, 499, 139, 342, 93],
  fill: '#00D2FF',
  stroke: 'black',
  strokeWidth: 5,
  closed: true
});
```

### Line - Spline

To create a spline (curved line):

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

### Line - Blob

To create a blob (closed curved line):

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

### Arrow

To create an arrow:

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

### Path

To create a custom path using SVG data:

```javascript
const path = new Konva.Path({
  x: 50,
  y: 50,
  data: 'M12.582,9.551C3.251,16.237...',
  fill: 'green',
  scale: { x: 2, y: 2 }
});
```

### Wedge

To create a wedge (pie piece):

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

### Image

To create an image:

```javascript
const imageObj = new Image();
imageObj.onload = function() {
  const image = new Konva.Image({
    x: 50,
    y: 50,
    image: imageObj,
    width: 106,
    height: 118
  });
  layer.add(image);
};
imageObj.src = 'path/to/image.jpg';

// Alternative API:
Konva.Image.fromURL('path/to/image.jpg', function(imageNode) {
  imageNode.setAttrs({
    x: 200,
    y: 50,
    scaleX: 0.5,
    scaleY: 0.5
  });
  layer.add(imageNode);
});
```

### Text

To create text:

```javascript
const text = new Konva.Text({
  x: 20,
  y: 60,
  text: 'Hello World!',
  fontSize: 18,
  fontFamily: 'Calibri',
  fill: '#555',
  width: 300,
  padding: 20,
  align: 'center'
});
```

### Sprite

To create an animated sprite:

```javascript
const animations = {
  idle: [2, 2, 70, 119, 71, 2, 74, 119],
  punch: [2, 138, 74, 122, 76, 138, 84, 122]
};

const sprite = new Konva.Sprite({
  x: 50,
  y: 50,
  image: imageObj,
  animation: 'idle',
  animations: animations,
  frameRate: 7,
  frameIndex: 0
});

sprite.start();
```

### Custom Shape

To create a custom shape:

```javascript
const triangle = new Konva.Shape({
  sceneFunc: function(context, shape) {
    context.beginPath();
    context.moveTo(20, 50);
    context.lineTo(220, 80);
    context.lineTo(100, 150);
    context.closePath();
    // Konva specific method
    context.fillStrokeShape(shape);
  },
  fill: '#00D2FF',
  stroke: 'black',
  strokeWidth: 4
});
```

**Best practices for custom shapes:**
1. Optimize - function called many times per second
2. No side effects - don't move shapes, attach events, or change app state
3. Define custom hitFunc when applying complex styles or images
4. Don't manually apply position/scaling - let Konva handle it
5. Use context.fillStrokeShape(shape) for styling
6. Reference Konva core shapes for examples

---

## Styling

### Fill

Konva supports colors, patterns, linear gradients, and radial gradients for fills.

**Color Fill:**
```javascript
pentagon.fill('blue');
```

**Pattern Fill:**
```javascript
const pattern = new Konva.RegularPolygon({
  fillPatternImage: imageObj,
  fillPatternOffset: { x: -220, y: 70 }
});
```

**Linear Gradient:**
```javascript
const gradient = new Konva.RegularPolygon({
  fillLinearGradientStartPoint: { x: -50, y: -50 },
  fillLinearGradientEndPoint: { x: 50, y: 50 },
  fillLinearGradientColorStops: [0, 'red', 1, 'yellow']
});
```

**Radial Gradient:**
```javascript
const radial = new Konva.RegularPolygon({
  fillRadialGradientStartPoint: { x: 0, y: 0 },
  fillRadialGradientStartRadius: 0,
  fillRadialGradientEndPoint: { x: 0, y: 0 },
  fillRadialGradientEndRadius: 70,
  fillRadialGradientColorStops: [0, 'red', 0.5, 'yellow', 1, 'blue']
});
```

### Stroke

To set stroke color and width:

```javascript
pentagon.stroke('blue');
pentagon.strokeWidth(20);
```

### Opacity

Set opacity between 0 (fully transparent) and 1 (fully opaque):

```javascript
shape.opacity(0.5);
```

### Shadow

To apply shadows:

```javascript
const shape = new Konva.Rect({
  shadowColor: 'black',
  shadowBlur: 10,
  shadowOffset: { x: 10, y: 10 },
  shadowOpacity: 0.5
});
```

### Line Join

Set line join style to miter, bevel, or round:

```javascript
triangle.lineJoin('round');
```

### Hide and Show

To hide and show shapes:

```javascript
rect.hide();
rect.show();
// or
rect.visible(false);
rect.visible(true);
```

### Mouse Cursor

To change mouse cursor:

```javascript
pentagon.on('mouseover', function(e) {
  e.target.getStage().container().style.cursor = 'pointer';
});

pentagon.on('mouseout', function(e) {
  e.target.getStage().container().style.cursor = 'default';
});
```

### Blend Mode

Set blending mode using `globalCompositeOperation`:

```javascript
const rect = new Konva.Rect({
  x: 50,
  y: 50,
  width: 100,
  height: 100,
  fill: 'red',
  draggable: true,
  globalCompositeOperation: 'xor'
});
```

**Available blend modes:**
- `source-over` (default)
- `source-in`
- `source-out`
- `source-atop`
- `destination-over`
- `destination-in`
- `destination-out`
- `destination-atop`
- `lighter`
- `copy`
- `xor`
- `multiply`
- `screen`
- `overlay`
- `darken`
- `lighten`
- `color-dodge`
- `color-burn`
- `hard-light`
- `soft-light`
- `difference`
- `exclusion`
- `hue`
- `saturation`
- `color`
- `luminosity`

---

## Events

### Binding Events

To bind events to shapes:

```javascript
// Mouse events
shape.on('mouseover', handler);
shape.on('mouseout', handler);
shape.on('mouseenter', handler);
shape.on('mouseleave', handler);
shape.on('mousemove', handler);
shape.on('mousedown', handler);
shape.on('mouseup', handler);
shape.on('wheel', handler);
shape.on('click', handler);
shape.on('dblclick', handler);

// Touch events
shape.on('touchstart', handler);
shape.on('touchmove', handler);
shape.on('touchend', handler);
shape.on('tap', handler);
shape.on('dbltap', handler);

// Pointer events
shape.on('pointerdown', handler);
shape.on('pointermove', handler);
shape.on('pointerup', handler);
shape.on('pointercancel', handler);
shape.on('pointerover', handler);
shape.on('pointerenter', handler);
shape.on('pointerout', handler);
shape.on('pointerleave', handler);
shape.on('pointerclick', handler);
shape.on('pointerdblclick', handler);

// Drag events
shape.on('dragstart', handler);
shape.on('dragmove', handler);
shape.on('dragend', handler);

// Transform events
shape.on('transformstart', handler);
shape.on('transform', handler);
shape.on('transformend', handler);

// Attribute change events
shape.on('xChange', handler);
shape.on('fillChange', handler);
// etc.

// Multiple events
shape.on('mouseenter mouseleave', handler);

// Namespaced events
shape.on('click.namespace', handler);
```

**Get Pointer Position:**
```javascript
const mousePos = stage.getPointerPosition();
console.log(mousePos.x, mousePos.y);
```

### Cancel Event Propagation

To cancel event bubble propagation, set the `cancelBubble` property to true:

```javascript
circle.on('click', function (evt) {
  alert('You clicked on the circle');
  // stop event bubble
  evt.cancelBubble = true;
});

layer.on('click', function () {
  alert('You clicked on the layer'); // Won't trigger if circle clicked
});
```

### Custom Hit Region

**Using hitFunc:**

Custom hit detection function for easier interaction or better performance:

```javascript
star.hitFunc(function (context) {
  context.beginPath();
  context.arc(0, 0, 70, 0, Math.PI * 2, true);
  context.closePath();
  context.fillStrokeShape(this);
});
```

**Using hitStrokeWidth:**

Make lines easier to interact with:

```javascript
const line = new Konva.Line({
  points: [-50, -50, 50, 50],
  stroke: 'black',
  strokeWidth: 2,
  hitStrokeWidth: 20 // Larger hit area
});
```

### Desktop and Mobile Events

Use paired events for cross-platform compatibility:

```javascript
// Works on both desktop and mobile
circle.on('mousedown touchstart', function () {
  writeMessage('Mousedown or touchstart');
});

circle.on('mouseup touchend', function () {
  writeMessage('Mouseup or touchend');
});
```

**Note:** Modern browsers support pointer events, which are recommended for cross-platform apps.

### Event Delegation

Get the event target to implement delegation:

```javascript
layer.on('click', function (evt) {
  const shape = evt.target;
  console.log('click on ' + shape.getClassName());
});
```

### Fire Events

Programmatically trigger events:

```javascript
// Fire built-in events
circle.fire('click');

// Fire custom events
circle.on('customEvent', function (evt) {
  alert('custom event fired');
});

circle.fire('customEvent', {
  bubbles: true
});
```

**Note:** It's generally better to use built-in interaction events rather than custom events.

### Image Events

Detect events only on non-transparent pixels using `drawHitFromCache()`:

```javascript
const lion = new Konva.Image({
  x: 320,
  y: 50,
  image: imageObj,
  width: 200,
  height: 200
});

lion.on('mouseover', function () {
  console.log('mouseover lion');
});

// Create precise hit region (ignores transparent pixels)
lion.cache();
lion.drawHitFromCache();
```

**Note:** Requires image to be hosted on same domain or with CORS enabled.

### Keyboard Events

Konva doesn't have built-in keyboard events. Add them via:

**1. Listen to window:**
```javascript
window.addEventListener('keydown', (e) => {
  // Handle keyboard
});
```

**2. Make stage container focusable:**
```javascript
stage.container().tabIndex = 1;
stage.container().focus();

stage.container().addEventListener('keydown', (e) => {
  if (e.keyCode === 37) { // left arrow
    circle.x(circle.x() - 10);
  }
  // ... other keys
});
```

### Listen for Events

Control whether nodes listen to events:

```javascript
oval.listening(false); // Disable event listening
oval.listening(true);  // Enable event listening

// Must redraw hit graph after changing
layer.drawHit();
```

### Mobile Touch Events

Bind touch-specific events:

```javascript
triangle.on('touchmove', function () {
  const touchPos = stage.getPointerPosition();
  console.log('x: ' + touchPos.x + ', y: ' + touchPos.y);
});

circle.on('touchstart', function () {
  console.log('touchstart circle');
});

circle.on('touchend', function () {
  console.log('touchend circle');
});
```

Supported mobile events: `touchstart`, `touchmove`, `touchend`, `tap`, `dbltap`, `dragstart`, `dragmove`, `dragend`

### Mobile Scrolling

Control whether shapes prevent default scrolling behavior:

```javascript
// Green rectangle - prevents scrolling (default)
const greenRect = new Konva.Rect({
  fill: 'green',
  // preventDefault: true (default)
});

// Red rectangle - allows native scrolling
const redRect = new Konva.Rect({
  fill: 'red',
  preventDefault: false
});
```

### Multi-Event Binding

Bind multiple events to one handler:

```javascript
circle.on('mouseover mousedown mouseup', function (evt) {
  console.log('event: ' + evt.type);
});
```

### Pointer Events

Use pointer events for unified desktop/mobile handling:

```javascript
triangle.on('pointermove', function () {
  const pos = stage.getPointerPosition();
  console.log('x: ' + pos.x + ', y: ' + pos.y);
});
```

Supported pointer events: `pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `pointerover`, `pointerenter`, `pointerout`, `pointerleave`, `pointerclick`, `pointerdblclick`

### Remove Event Listener

Remove event bindings:

```javascript
// Remove all click listeners
circle.off('click');

// Remove specific listener
circle.off('click', myHandler);
```

### Remove Event by Name

Use namespaced events for selective removal:

```javascript
circle.on('click.event1', function () {
  alert('first click listener');
});

circle.on('click.event2', function () {
  alert('second click listener');
});

// Remove only first listener
circle.off('click.event1');

// Remove only second listener
circle.off('click.event2');
```

**Note:** Event namespacing is vanilla JS feature, not recommended for React/Vue.

### Stage Events

Events on empty stage areas trigger on Stage, not Layer:

```javascript
stage.on('click', function (e) {
  if (e.target === stage) {
    console.log('clicked on empty stage');
    return;
  }
  console.log('clicked on ' + e.target.name());
});
```

---

## Drag and Drop

### Basic Drag and Drop

To enable drag and drop:

```javascript
const shape = new Konva.Circle({
  draggable: true
});

// or
shape.draggable(true);

// Add cursor styling
shape.on('mouseover', function() {
  document.body.style.cursor = 'pointer';
});

shape.on('mouseout', function() {
  document.body.style.cursor = 'default';
});
```

**Note:** Draggable works automatically for both desktop and mobile applications.

### Drag an Image

Images can be made draggable just like any other shape:

```javascript
const yoda = new Konva.Image({
  x: 50,
  y: 50,
  image: imageObj,
  width: 106,
  height: 118,
  draggable: true
});

// Add cursor styling
yoda.on('mouseover', function () {
  document.body.style.cursor = 'pointer';
});

yoda.on('mouseout', function () {
  document.body.style.cursor = 'default';
});
```

### Drag a Group

Groups can be dragged, moving all children together:

```javascript
const group = new Konva.Group({
  draggable: true
});

// Add shapes to group
group.add(box1);
group.add(box2);
group.add(box3);

// Add cursor styling
group.on('mouseover', function () {
  document.body.style.cursor = 'move';
});

group.on('mouseout', function () {
  document.body.style.cursor = 'default';
});
```

**Note:** Dragging a group does NOT change x and y of children. Only the group's position changes.

### Drag a Line

Lines can be dragged:

```javascript
const redLine = new Konva.Line({
  x: 50,
  y: 50,
  points: [0, 0, 150, 0],
  stroke: 'red',
  strokeWidth: 15,
  draggable: true
});
```

**Note:** Dragging a line will NOT change the `points` property. Instead, `x` and `y` properties of the line are changed.

### Drag the Stage

The entire stage can be made draggable:

```javascript
const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight,
  draggable: true
});
```

**Note:** Unlike other nodes, you can drag the stage by dragging ANY portion of it.

### Drag Events

```javascript
shape.on('dragstart', function() {
  console.log('drag started');
});

shape.on('dragmove', function() {
  console.log('dragging');
});

shape.on('dragend', function() {
  console.log('drag ended');
});
```

### Simple Drag Bounds

Constrain drag movement using the `dragmove` event:

**Horizontal only:**
```javascript
horizontalText.on('dragmove', function () {
  this.y(50); // Lock y position
});
```

**Vertical only:**
```javascript
verticalText.on('dragmove', function () {
  this.x(200); // Lock x position
});
```

**Tip:** Use `shape.absolutePosition()` to get/set absolute position instead of relative x and y.

### Complex Drag Bounds

Use `dragBoundFunc` for complex constraints:

```javascript
shape.dragBoundFunc(function(pos) {
  // Constrain to box
  const x = Math.max(0, Math.min(pos.x, stageWidth - shapeWidth));
  const y = Math.max(0, Math.min(pos.y, stageHeight - shapeHeight));
  return { x, y };
});
```

### Drop Events

Konva doesn't have built-in drop events, but you can implement them:

```javascript
const layer = new Konva.Layer();
const tempLayer = new Konva.Layer(); // For dragging objects

star.on('dragstart', () => {
  star.moveTo(tempLayer); // Move to temp layer while dragging
});

star.on('dragmove', (e) => {
  const pos = stage.getPointerPosition();
  const shape = layer.getIntersection(pos);
  
  if (shape) {
    shape.fire('dragenter', { evt: e.evt }, true);
  }
});

star.on('dragend', (e) => {
  const pos = stage.getPointerPosition();
  const shape = layer.getIntersection(pos);
  
  if (shape) {
    shape.fire('drop', { evt: e.evt }, true);
  }
  
  star.moveTo(layer); // Move back to main layer
});

// Listen for custom drop events
targetShape.on('dragenter', () => {
  targetShape.fill('green');
});

targetShape.on('dragleave', () => {
  targetShape.fill('blue');
});

targetShape.on('drop', () => {
  targetShape.fill('red');
});
```

---

## Select and Transform

### Basic Transformer

To enable selection, resizing, and rotation:

```javascript
// Create shapes
const rect = new Konva.Rect({
  x: 60,
  y: 60,
  width: 100,
  height: 90,
  fill: 'red',
  draggable: true
});

// Create transformer
const tr = new Konva.Transformer();
layer.add(tr);

// Attach to shape
tr.nodes([rect]);

// Or use selection logic
stage.on('click', function(e) {
  if (e.target === stage) {
    tr.nodes([]);
    return;
  }
  tr.nodes([e.target]);
});
```

**Note:** Transformer changes scaleX/scaleY properties, not width/height.

### Multi-Selection

Select multiple shapes with SHIFT/CTRL:

```javascript
stage.on('click tap', function (e) {
  // If click on empty area - remove all selections
  if (e.target === stage) {
    tr.nodes([]);
    return;
  }

  // Do we pressed shift or ctrl?
  const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
  const isSelected = tr.nodes().indexOf(e.target) >= 0;

  if (!metaPressed && !isSelected) {
    // Select just one
    tr.nodes([e.target]);
  } else if (metaPressed && isSelected) {
    // Remove from selection
    const nodes = tr.nodes().slice();
    nodes.splice(nodes.indexOf(e.target), 1);
    tr.nodes(nodes);
  } else if (metaPressed && !isSelected) {
    // Add to selection
    const nodes = tr.nodes().concat([e.target]);
    tr.nodes(nodes);
  }
});
```

### Selection Rectangle

Implement drag-to-select:

```javascript
let selectionRectangle = new Konva.Rect({
  fill: 'rgba(0,0,255,0.5)',
  visible: false
});
layer.add(selectionRectangle);

let x1, y1, x2, y2;

stage.on('mousedown touchstart', (e) => {
  if (e.target !== stage) return;
  
  x1 = stage.getPointerPosition().x;
  y1 = stage.getPointerPosition().y;
  
  selectionRectangle.setAttrs({
    x: x1,
    y: y1,
    width: 0,
    height: 0,
    visible: true
  });
});

stage.on('mousemove touchmove', () => {
  if (!selectionRectangle.visible()) return;
  
  x2 = stage.getPointerPosition().x;
  y2 = stage.getPointerPosition().y;
  
  selectionRectangle.setAttrs({
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1)
  });
});

stage.on('mouseup touchend', () => {
  if (!selectionRectangle.visible()) return;
  
  setTimeout(() => {
    selectionRectangle.visible(false);
  });
  
  const shapes = stage.find('.selectable');
  const box = selectionRectangle.getClientRect();
  
  const selected = shapes.filter((shape) =>
    Konva.Util.haveIntersection(box, shape.getClientRect())
  );
  
  tr.nodes(selected);
});
```

### Centered Scaling

Resize from center instead of corners:

```javascript
const tr = new Konva.Transformer({
  nodes: [text],
  centeredScaling: true
});
```

**Tip:** Even if `centeredScaling` is false, holding ALT key enables centered scaling.

### Keep Ratio

Control aspect ratio preservation:

```javascript
// Keep ratio by default (default behavior)
const tr1 = new Konva.Transformer({
  nodes: [shape1]
});

// Don't keep ratio
const tr2 = new Konva.Transformer({
  nodes: [shape2],
  keepRatio: false
});
```

**Tips:**
- By default, corner anchors preserve ratio
- Set `keepRatio: false` to allow free resizing
- Hold SHIFT to temporarily keep ratio even when `keepRatio: false`

### Transformer Styling

Customize transformer appearance with various styling properties.

**Vanilla JavaScript Example:**

```javascript
import Konva from 'konva';

const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight,
});

const layer = new Konva.Layer();
stage.add(layer);

const rect = new Konva.Rect({
  x: 60,
  y: 60,
  width: 100,
  height: 90,
  fill: 'red',
  name: 'rect',
  draggable: true,
});
layer.add(rect);

const tr = new Konva.Transformer({
  nodes: [rect],
  // Border styling
  borderStroke: 'black',
  borderStrokeWidth: 3,
  // Anchor styling
  anchorFill: 'white',
  anchorStroke: 'black',
  anchorStrokeWidth: 2,
  anchorSize: 20,
  // Make anchors circular
  anchorCornerRadius: 50,
});
layer.add(tr);
```

**React Example:**

```javascript
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import { useRef, useEffect } from 'react';

const App = () => {
  const rectRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    trRef.current.nodes([rectRef.current]);
  }, []);

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Rect
          x={60}
          y={60}
          width={100}
          height={90}
          fill="red"
          draggable
          ref={rectRef}
        />
        <Transformer
          ref={trRef}
          borderStroke="black"
          borderStrokeWidth={3}
          anchorFill="white"
          anchorStroke="black"
          anchorStrokeWidth={2}
          anchorSize={20}
          anchorCornerRadius={50}
        />
      </Layer>
    </Stage>
  );
};
```

**Available Styling Properties:**
- `borderStroke` - Border color (default: 'rgb(0, 161, 255)')
- `borderStrokeWidth` - Border thickness (default: 1)
- `borderDash` - Border dash pattern (e.g., [4, 4])
- `anchorFill` - Anchor fill color
- `anchorStroke` - Anchor stroke color
- `anchorStrokeWidth` - Anchor stroke width
- `anchorSize` - Anchor size in pixels
- `anchorCornerRadius` - Anchor corner radius (50 makes circular)
- `rotateAnchorOffset` - Distance of rotation anchor from shape
- `rotateAnchorCursor` - CSS cursor for rotation anchor
- `enabledAnchors` - Array of enabled anchors
- `padding` - Padding around shape

### Transform Events

Transformer emits three key events during transformation operations. These events fire on BOTH the Transformer object AND the attached node(s).

**Event Types:**
- `transformstart` - Fires when transformation begins
- `transform` - Fires continuously during transformation
- `transformend` - Fires when transformation completes

**Vanilla JavaScript Example:**

```javascript
import Konva from 'konva';

const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight,
});

const layer = new Konva.Layer();
stage.add(layer);

const rect = new Konva.Rect({
  x: 60,
  y: 60,
  width: 100,
  height: 90,
  fill: 'red',
  draggable: true,
});
layer.add(rect);

const tr = new Konva.Transformer({
  nodes: [rect],
});
layer.add(tr);

// Events on transformer
tr.on('transformstart', () => {
  console.log('transformer: transformstart');
});

tr.on('transform', () => {
  console.log('transformer: transform');
});

tr.on('transformend', () => {
  console.log('transformer: transformend');
});

// Events on shape
rect.on('transformstart', () => {
  console.log('rect: transformstart');
});

rect.on('transform', () => {
  console.log('rect: transform');
});

rect.on('transformend', () => {
  console.log('rect: transformend');
});
```

**React Example:**

```javascript
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import { useRef, useEffect } from 'react';

const App = () => {
  const rectRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    trRef.current.nodes([rectRef.current]);
  }, []);

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Rect
          x={60}
          y={60}
          width={100}
          height={90}
          fill="red"
          draggable
          ref={rectRef}
          onTransformStart={() => console.log('rect: transformstart')}
          onTransform={() => console.log('rect: transform')}
          onTransformEnd={() => console.log('rect: transformend')}
        />
        <Transformer
          ref={trRef}
          onTransformStart={() => console.log('transformer: transformstart')}
          onTransform={() => console.log('transformer: transform')}
          onTransformEnd={() => console.log('transformer: transformend')}
        />
      </Layer>
    </Stage>
  );
};
```

**Use Cases:**
- Track user transformations
- Save state changes during transformation
- Trigger actions based on transform state
- Implement undo/redo functionality
- Update UI elements based on shape properties
- Validate transformations before completion

### Resize Limits

Use `boundBoxFunc` to constrain resize and transform behavior. This function receives the old and new bounding box parameters and returns the final box dimensions.

**Function Signature:**
```javascript
boundBoxFunc: (oldBox, newBox) => {
  // oldBox and newBox contain: {x, y, width, height, rotation}
  // Return oldBox to reject transformation
  // Return newBox to accept transformation
  // Return modified box for custom constraints
  return modifiedBox;
}
```

**Vanilla JavaScript Example (Limit Maximum Width):**

```javascript
import Konva from 'konva';

const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight,
});

const layer = new Konva.Layer();
stage.add(layer);

const rect = new Konva.Rect({
  x: 60,
  y: 60,
  width: 100,
  height: 90,
  fill: 'red',
  draggable: true,
});
layer.add(rect);

const tr = new Konva.Transformer({
  nodes: [rect],
  boundBoxFunc: (oldBox, newBox) => {
    // Limit width to maximum 200px
    if (newBox.width > 200) {
      return oldBox; // Reject transformation
    }
    return newBox; // Accept transformation
  },
});
layer.add(tr);
```

**React Example:**

```javascript
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import { useRef, useEffect } from 'react';

const App = () => {
  const rectRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    trRef.current.nodes([rectRef.current]);
  }, []);

  const handleBoundBox = (oldBox, newBox) => {
    if (newBox.width > 200) {
      return oldBox;
    }
    return newBox;
  };

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Rect
          x={60}
          y={60}
          width={100}
          height={90}
          fill="red"
          draggable
          ref={rectRef}
        />
        <Transformer ref={trRef} boundBoxFunc={handleBoundBox} />
      </Layer>
    </Stage>
  );
};
```

**Common Use Cases:**
- Limit minimum/maximum size
- Enforce aspect ratios
- Constrain to specific dimensions
- Prevent transformations outside boundaries
- Create custom transformation rules

**Note:** Works similarly to `dragBoundFunc` for drag operations.

### Resize Snaps

Use `anchorDragBoundFunc` to snap anchor positions during resize operations. This enables magnetic snapping to guide lines or grid positions.

**Function Signature:**
```javascript
anchorDragBoundFunc: (oldAbsPos, newAbsPos, event) => {
  // Return constrained position {x, y}
  return { x: constrainedX, y: constrainedY };
}
```

**Vanilla JavaScript Example (Snap to Center Line):**

```javascript
import Konva from 'konva';

const width = window.innerWidth;
const height = window.innerHeight;

const stage = new Konva.Stage({
  container: 'container',
  width: width,
  height: height,
});

const layer = new Konva.Layer();
stage.add(layer);

// Create guide lines
const verticalLine = new Konva.Line({
  points: [width / 2, 0, width / 2, height],
  stroke: 'rgb(0, 161, 255)',
  strokeWidth: 1,
  dash: [4, 6],
});
layer.add(verticalLine);

const horizontalLine = new Konva.Line({
  points: [0, height / 2, width, height / 2],
  stroke: 'rgb(0, 161, 255)',
  strokeWidth: 1,
  dash: [4, 6],
});
layer.add(horizontalLine);

const rect = new Konva.Rect({
  x: 60,
  y: 60,
  width: 100,
  height: 90,
  fill: 'red',
  draggable: true,
});
layer.add(rect);

const tr = new Konva.Transformer({
  nodes: [rect],
  anchorDragBoundFunc: (oldPos, newPos, event) => {
    // Calculate distance to vertical center line
    const dist = Math.sqrt(
      Math.pow(newPos.x - width / 2, 2)
    );
    
    // Snap when within 10px of center line
    if (dist < 10) {
      return {
        x: width / 2,
        y: newPos.y,
      };
    }
    
    return newPos;
  },
});
layer.add(tr);
```

**React Example:**

```javascript
import { Stage, Layer, Rect, Line, Transformer } from 'react-konva';
import { useRef, useEffect } from 'react';

const App = () => {
  const rectRef = useRef();
  const trRef = useRef();
  const width = window.innerWidth;
  const height = window.innerHeight;

  useEffect(() => {
    trRef.current.nodes([rectRef.current]);
  }, []);

  const handleAnchorDrag = (oldPos, newPos) => {
    const dist = Math.sqrt(Math.pow(newPos.x - width / 2, 2));
    
    if (dist < 10) {
      return {
        x: width / 2,
        y: newPos.y,
      };
    }
    
    return newPos;
  };

  return (
    <Stage width={width} height={height}>
      <Layer>
        <Line
          points={[width / 2, 0, width / 2, height]}
          stroke="rgb(0, 161, 255)"
          strokeWidth={1}
          dash={[4, 6]}
        />
        <Line
          points={[0, height / 2, width, height / 2]}
          stroke="rgb(0, 161, 255)"
          strokeWidth={1}
          dash={[4, 6]}
        />
        <Rect
          x={60}
          y={60}
          width={100}
          height={90}
          fill="red"
          draggable
          ref={rectRef}
        />
        <Transformer ref={trRef} anchorDragBoundFunc={handleAnchorDrag} />
      </Layer>
    </Stage>
  );
};
```

**Use Cases:**
- Grid snapping during resize
- Alignment to guide lines
- Proportional resizing constraints
- Custom snap points
- Magnetic positioning behavior
- Precise shape alignment

**Distance Calculation:**
```javascript
// Distance from point to vertical line
const distX = Math.sqrt(Math.pow(newPos.x - targetX, 2));

// Distance from point to horizontal line
const distY = Math.sqrt(Math.pow(newPos.y - targetY, 2));

// Full 2D distance
const dist = Math.sqrt(
  Math.pow(newPos.x - targetX, 2) + 
  Math.pow(newPos.y - targetY, 2)
);
```

### Rotation Snaps

Enable snapping to specific rotation angles using `rotationSnaps` and `rotationSnapTolerance`. Snapping makes rotation "sticky" near provided values, similar to rounding.

**How it Works:**
- If rotation is within tolerance of a snap point, it snaps to that exact value
- If rotation is too far from all snap points, it moves freely
- Most common snap points: 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°

**Vanilla JavaScript Example:**

```javascript
import Konva from 'konva';

const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight,
});

const layer = new Konva.Layer();
stage.add(layer);

const rect = new Konva.Rect({
  x: 50,
  y: 50,
  width: 100,
  height: 50,
  fill: 'yellow',
  stroke: 'black',
  draggable: true,
});
layer.add(rect);

const tr = new Konva.Transformer({
  nodes: [rect],
  rotationSnaps: [0, 90, 180, 270], // Snap to 90-degree intervals
  rotationSnapTolerance: 30, // Snap within 30 degrees
});
layer.add(tr);
```

**React Example:**

```javascript
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import { useRef, useEffect } from 'react';

const App = () => {
  const rectRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    trRef.current.nodes([rectRef.current]);
  }, []);

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Rect
          x={50}
          y={50}
          width={100}
          height={50}
          fill="yellow"
          stroke="black"
          draggable
          ref={rectRef}
        />
        <Transformer
          ref={trRef}
          rotationSnaps={[0, 90, 180, 270]}
          rotationSnapTolerance={30}
        />
      </Layer>
    </Stage>
  );
};
```

**Vue Example:**

```vue
<template>
  <v-stage :config="stageSize">
    <v-layer>
      <v-rect :config="rectConfig" ref="rectRef" />
      <v-transformer :config="transformerConfig" ref="transformerRef" />
    </v-layer>
  </v-stage>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const stageSize = {
  width: window.innerWidth,
  height: window.innerHeight
};

const rectConfig = {
  x: 50,
  y: 50,
  width: 100,
  height: 50,
  fill: 'yellow',
  stroke: 'black',
  draggable: true
};

const transformerConfig = {
  rotationSnaps: [0, 90, 180, 270],
  rotationSnapTolerance: 30
};

const rectRef = ref(null);
const transformerRef = ref(null);

onMounted(() => {
  transformerRef.value.getNode().nodes([rectRef.value.getNode()]);
});
</script>
```

**Properties:**
- `rotationSnaps` - Array of angles (in degrees) to snap to
- `rotationSnapTolerance` - Distance (in degrees) within which snapping occurs

**Common Snap Configurations:**

```javascript
// 90-degree snaps (cardinal directions)
rotationSnaps: [0, 90, 180, 270]

// 45-degree snaps (all octants)
rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315]

// 30-degree snaps (clock positions)
rotationSnaps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]

// Custom snaps
rotationSnaps: [0, 15, 75, 180]
```

**Use Cases:**
- Align shapes to cardinal directions
- Create precise angular layouts
- Simplify rotation for users
- Enforce specific rotation constraints
- Improve UX with predictable snapping

### Stop Transform

Programmatically stop an active transformation using the `stopTransform()` method. Useful for implementing custom constraints or validation during transformations.

**Vanilla JavaScript Example:**

```javascript
import Konva from 'konva';

const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight,
});

const layer = new Konva.Layer();
stage.add(layer);

const rect = new Konva.Rect({
  x: 50,
  y: 50,
  width: 100,
  height: 100,
  fill: 'yellow',
  stroke: 'black',
  draggable: true,
});
layer.add(rect);

const tr = new Konva.Transformer({
  nodes: [rect],
});
layer.add(tr);

// Stop transformation if width exceeds 200px
rect.on('transform', function () {
  const width = rect.width() * rect.scaleX();
  if (width > 200) {
    tr.stopTransform();
  }
});
```

**React Example:**

```javascript
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import { useRef, useEffect } from 'react';

const App = () => {
  const rectRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    trRef.current.nodes([rectRef.current]);
  }, []);

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Rect
          x={50}
          y={50}
          width={100}
          height={100}
          fill="yellow"
          stroke="black"
          draggable
          ref={rectRef}
          onTransform={() => {
            const node = rectRef.current;
            const width = node.width() * node.scaleX();
            if (width > 200) {
              trRef.current.stopTransform();
            }
          }}
        />
        <Transformer ref={trRef} />
      </Layer>
    </Stage>
  );
};
```

**Vue Example:**

```vue
<template>
  <v-stage :config="stageSize">
    <v-layer>
      <v-rect
        :config="rectConfig"
        @transform="handleTransform"
        ref="rectRef"
      />
      <v-transformer :config="transformerConfig" ref="transformerRef" />
    </v-layer>
  </v-stage>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const stageSize = {
  width: window.innerWidth,
  height: window.innerHeight
};

const rectConfig = {
  x: 50,
  y: 50,
  width: 100,
  height: 100,
  fill: 'yellow',
  stroke: 'black',
  draggable: true
};

const transformerConfig = {};

const rectRef = ref(null);
const transformerRef = ref(null);

const handleTransform = () => {
  const node = rectRef.value.getNode();
  const width = node.width() * node.scaleX();
  if (width > 200) {
    transformerRef.value.getNode().stopTransform();
  }
};

onMounted(() => {
  transformerRef.value.getNode().nodes([rectRef.value.getNode()]);
});
</script>
```

**Use Cases:**
- Enforce maximum/minimum size constraints
- Stop transformation on validation failure
- Implement custom transformation limits
- Prevent invalid shape states
- Create dynamic constraint systems
- Trigger alerts when limits are reached

**Checking Transform State:**

```javascript
// Check if actively transforming
if (tr.isTransforming()) {
  tr.stopTransform();
}
```

### Force Update

Transformer automatically tracks properties of attached nodes, but cannot track deep changes inside Groups. Use `forceUpdate()` to manually update the transformer when node properties change programmatically.

**When to Use:**
- After changing Group children properties
- After programmatic shape modifications
- When transformer doesn't auto-update
- After deep property changes

**Vanilla JavaScript Example:**

```javascript
import Konva from 'konva';

const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight,
});

const layer = new Konva.Layer();
stage.add(layer);

const group = new Konva.Group({
  x: 50,
  y: 50,
  draggable: true,
});
layer.add(group);

const text = new Konva.Text({
  text: 'Some text here',
  fontSize: 24,
});
group.add(text);

const rect = new Konva.Rect({
  width: text.width(),
  height: text.height(),
  fill: 'yellow',
});
group.add(rect);
rect.moveToBottom();

const tr = new Konva.Transformer({
  nodes: [group],
  padding: 5,
  enabledAnchors: ['middle-left', 'middle-right'],
});
layer.add(tr);

// Button to change text
const button = document.createElement('button');
button.innerHTML = 'Change text';
document.body.appendChild(button);

button.addEventListener('click', () => {
  text.text('Something else is here');
  rect.width(text.width());
  
  // Must manually update transformer
  tr.forceUpdate();
});
```

**React Example:**

```javascript
import { Stage, Layer, Text, Rect, Group, Transformer } from 'react-konva';
import { useState, useRef, useEffect } from 'react';

const App = () => {
  const [text, setText] = useState('Some text here');
  const groupRef = useRef();
  const trRef = useRef();

  const handleClick = () => {
    setText('Something else is here');
  };

  useEffect(() => {
    if (trRef.current) {
      trRef.current.nodes([groupRef.current]);
    }
  }, []);

  return (
    <>
      <button onClick={handleClick}>Change text</button>
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          <Group x={50} y={50} draggable ref={groupRef}>
            <Rect
              width={text.length * 10}
              height={30}
              fill="yellow"
            />
            <Text text={text} fontSize={24} />
          </Group>
          <Transformer
            ref={trRef}
            padding={5}
            enabledAnchors={['middle-left', 'middle-right']}
          />
        </Layer>
      </Stage>
    </>
  );
};
```

**Vue Example:**

```vue
<template>
  <div>
    <button @click="changeText">Change text</button>
    <v-stage :config="stageSize">
      <v-layer>
        <v-group :config="groupConfig" ref="groupRef">
          <v-rect :config="rectConfig" />
          <v-text :config="textConfig" />
        </v-group>
        <v-transformer :config="transformerConfig" ref="transformerRef" />
      </v-layer>
    </v-stage>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const stageSize = {
  width: window.innerWidth,
  height: window.innerHeight
};

const text = ref('Some text here');
const groupRef = ref(null);
const transformerRef = ref(null);

const groupConfig = {
  x: 50,
  y: 50,
  draggable: true
};

const textConfig = computed(() => ({
  text: text.value,
  fontSize: 24
}));

const rectConfig = computed(() => ({
  width: text.value.length * 10,
  height: 30,
  fill: 'yellow'
}));

const transformerConfig = {
  padding: 5,
  enabledAnchors: ['middle-left', 'middle-right']
};

const changeText = () => {
  text.value = 'Something else is here';
};

onMounted(() => {
  if (transformerRef.value && groupRef.value) {
    transformerRef.value.getNode().nodes([groupRef.value.getNode()]);
  }
});
</script>
```

**Key Points:**
- Transformer auto-tracks simple property changes
- Cannot auto-track Group children changes
- Call `forceUpdate()` after programmatic modifications
- Essential for dynamic content updates
- Required when shape dimensions change programmatically

### Resize Text

When transforming text, Transformer changes `scaleX` and `scaleY` properties. To resize text properly (changing width without scaling the font), reset scale back to 1 and adjust width accordingly.

**Problem:** Default transformer scales text, making font size appear larger/smaller
**Solution:** Reset scale and adjust width on transform event

**Vanilla JavaScript Example:**

```javascript
import Konva from 'konva';

const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight,
});

const layer = new Konva.Layer();
stage.add(layer);

const text = new Konva.Text({
  x: 50,
  y: 50,
  text: 'Hello from Konva! Try to resize me.',
  fontSize: 24,
  draggable: true,
  width: 200,
});
layer.add(text);

const tr = new Konva.Transformer({
  nodes: [text],
  // Enable only horizontal anchors to see effect clearly
  enabledAnchors: ['middle-left', 'middle-right'],
});
layer.add(tr);

// Reset scale on transform
text.on('transform', function () {
  text.setAttrs({
    width: text.width() * text.scaleX(),
    scaleX: 1,
  });
});
```

**React Example:**

```javascript
import { Stage, Layer, Text, Transformer } from 'react-konva';
import { useRef, useEffect, useState } from 'react';

const App = () => {
  const [textWidth, setTextWidth] = useState(200);
  const textRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    trRef.current.nodes([textRef.current]);
  }, []);

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Text
          x={50}
          y={50}
          text="Hello from Konva! Try to resize me."
          fontSize={24}
          draggable
          width={textWidth}
          ref={textRef}
          onTransform={() => {
            const node = textRef.current;
            setTextWidth(node.width() * node.scaleX());
            node.scaleX(1);
          }}
        />
        <Transformer
          ref={trRef}
          enabledAnchors={['middle-left', 'middle-right']}
        />
      </Layer>
    </Stage>
  );
};
```

**Vue Example:**

```vue
<template>
  <v-stage :config="stageSize">
    <v-layer>
      <v-text
        :config="textConfig"
        @transform="handleTransform"
        ref="textRef"
      />
      <v-transformer :config="transformerConfig" ref="transformerRef" />
    </v-layer>
  </v-stage>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const stageSize = {
  width: window.innerWidth,
  height: window.innerHeight
};

const textWidth = ref(200);

const textConfig = computed(() => ({
  x: 50,
  y: 50,
  text: 'Hello from Konva! Try to resize me.',
  fontSize: 24,
  draggable: true,
  width: textWidth.value
}));

const transformerConfig = {
  enabledAnchors: ['middle-left', 'middle-right']
};

const textRef = ref(null);
const transformerRef = ref(null);

const handleTransform = () => {
  const node = textRef.value.getNode();
  textWidth.value = node.width() * node.scaleX();
  node.scaleX(1);
};

onMounted(() => {
  transformerRef.value.getNode().nodes([textRef.value.getNode()]);
});
</script>
```

**Key Concepts:**

1. **Default Behavior:**
   - Transformer changes `scaleX` and `scaleY`
   - Text font size appears to change with scale

2. **Proper Text Resize:**
   - Calculate new width: `newWidth = width * scaleX`
   - Set width to calculated value
   - Reset scale back to 1

3. **Why Only Horizontal Anchors:**
   - Text typically reflows based on width
   - Height adjusts automatically based on content
   - Vertical scaling would scale font size

**Use Cases:**
- Text editors with resize handles
- Resizable text boxes
- Dynamic text containers
- Text wrapping controls
- Typography tools

### Ignore Stroke on Transform

By default, when transforming a shape, its stroke scales proportionally. There are two ways to prevent stroke scaling:

**Method 1: Reset Scale on Transform End**
- Reset scale to 1 after transformation
- Manually adjust width/height

**Method 2: Disable Stroke Scaling**
- Set `strokeScaleEnabled: false` on shape
- Set `ignoreStroke: true` on transformer

**Vanilla JavaScript Example (Both Methods):**

```javascript
import Konva from 'konva';

const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight,
});

const layer = new Konva.Layer();
stage.add(layer);

// METHOD 1: Reset scale on transform end
const rect1 = new Konva.Rect({
  x: 50,
  y: 50,
  width: 100,
  height: 100,
  fill: '#00ff00',
  stroke: 'black',
  strokeWidth: 5,
  draggable: true,
});
layer.add(rect1);

const tr1 = new Konva.Transformer({
  nodes: [rect1],
});
layer.add(tr1);

rect1.on('transformend', () => {
  // Reset scale and adjust dimensions
  rect1.width(rect1.width() * rect1.scaleX());
  rect1.height(rect1.height() * rect1.scaleY());
  rect1.scaleX(1);
  rect1.scaleY(1);
});

// METHOD 2: Disable stroke scaling
const rect2 = new Konva.Rect({
  x: 200,
  y: 50,
  width: 100,
  height: 100,
  fill: '#ff0000',
  stroke: 'black',
  strokeWidth: 5,
  draggable: true,
  strokeScaleEnabled: false, // Disable stroke scaling
});
layer.add(rect2);

const tr2 = new Konva.Transformer({
  nodes: [rect2],
  ignoreStroke: true, // Ignore stroke in bounding box
});
layer.add(tr2);
```

**React Example:**

```javascript
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import { useRef, useEffect, useState } from 'react';

const App = () => {
  const [rect1Size, setRect1Size] = useState({
    width: 100,
    height: 100,
  });

  const rect1Ref = useRef();
  const rect2Ref = useRef();
  const tr1Ref = useRef();
  const tr2Ref = useRef();

  useEffect(() => {
    tr1Ref.current.nodes([rect1Ref.current]);
    tr2Ref.current.nodes([rect2Ref.current]);
  }, []);

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        {/* Method 1: Reset scale */}
        <Rect
          x={50}
          y={50}
          width={rect1Size.width}
          height={rect1Size.height}
          fill="#00ff00"
          stroke="black"
          strokeWidth={5}
          draggable
          ref={rect1Ref}
          onTransformEnd={(e) => {
            const node = rect1Ref.current;
            setRect1Size({
              width: node.width() * node.scaleX(),
              height: node.height() * node.scaleY(),
            });
            node.scaleX(1);
            node.scaleY(1);
          }}
        />
        <Transformer ref={tr1Ref} />

        {/* Method 2: Disable stroke scaling */}
        <Rect
          x={200}
          y={50}
          width={100}
          height={100}
          fill="#ff0000"
          stroke="black"
          strokeWidth={5}
          draggable
          strokeScaleEnabled={false}
          ref={rect2Ref}
        />
        <Transformer ref={tr2Ref} ignoreStroke={true} />
      </Layer>
    </Stage>
  );
};
```

**Vue Example:**

```vue
<template>
  <v-stage :config="stageSize">
    <v-layer>
      <v-rect
        :config="rect1Config"
        @transformend="handleTransformEnd"
        ref="rect1Ref"
      />
      <v-transformer :config="tr1Config" ref="tr1Ref" />

      <v-rect :config="rect2Config" ref="rect2Ref" />
      <v-transformer :config="tr2Config" ref="tr2Ref" />
    </v-layer>
  </v-stage>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const stageSize = {
  width: window.innerWidth,
  height: window.innerHeight
};

const rect1Size = ref({ width: 100, height: 100 });

const rect1Config = {
  x: 50,
  y: 50,
  width: rect1Size.value.width,
  height: rect1Size.value.height,
  fill: '#00ff00',
  stroke: 'black',
  strokeWidth: 5,
  draggable: true
};

const rect2Config = {
  x: 200,
  y: 50,
  width: 100,
  height: 100,
  fill: '#ff0000',
  stroke: 'black',
  strokeWidth: 5,
  draggable: true,
  strokeScaleEnabled: false
};

const tr1Config = {};
const tr2Config = { ignoreStroke: true };

const rect1Ref = ref(null);
const rect2Ref = ref(null);
const tr1Ref = ref(null);
const tr2Ref = ref(null);

const handleTransformEnd = () => {
  const node = rect1Ref.value.getNode();
  rect1Size.value = {
    width: node.width() * node.scaleX(),
    height: node.height() * node.scaleY()
  };
  node.scaleX(1);
  node.scaleY(1);
};

onMounted(() => {
  tr1Ref.value.getNode().nodes([rect1Ref.value.getNode()]);
  tr2Ref.value.getNode().nodes([rect2Ref.value.getNode()]);
});
</script>
```

**Comparison:**

| Approach | Pros | Cons |
|----------|------|------|
| Reset Scale | Full control, works universally | Requires transformend handler, more code |
| Disable Stroke Scaling | Simple, declarative, less code | Shape must support strokeScaleEnabled |

**Common Use Cases:**
- Design tools where stroke width should remain constant
- UI elements with borders
- Icons with fixed outlines
- Technical drawings
- CAD applications
- Vector graphic editors

**Note:** The green rectangle (method 1) resets scale on transformend, while the red rectangle (method 2) simply disables stroke scaling via properties.

---

## Clipping

### Clipping Functions

To clip nodes with custom regions:

```javascript
const group = new Konva.Group({
  clipFunc: function(ctx) {
    ctx.beginPath();
    ctx.arc(200, 120, 50, 0, Math.PI * 2, false);
    ctx.arc(280, 120, 50, 0, Math.PI * 2, false);
  }
});

// Add shapes to group - they'll be clipped
group.add(shape1);
group.add(shape2);
```

**You can apply clip functions to:**
- Groups
- Layers

**Use cases:**
- Complex clipping regions
- Multiple clipping areas
- Custom shape clipping
- Artistic effects

---

## Groups and Layers

### Groups

To group shapes together:

```javascript
const group = new Konva.Group({
  x: 50,
  y: 50,
  draggable: true
});

const circle = new Konva.Circle({
  x: 40,
  y: 40,
  radius: 30,
  fill: 'red'
});

const rect = new Konva.Rect({
  x: 80,
  y: 20,
  width: 100,
  height: 50,
  fill: 'green'
});

group.add(circle);
group.add(rect);
layer.add(group);
```

**Benefits of grouping:**
- Transform multiple shapes together
- Apply effects to all children
- Organize complex scenes
- Nested groups for hierarchies

### Change Containers

Move shapes between containers using `moveTo()`:

```javascript
const group1 = new Konva.Group();
const group2 = new Konva.Group();

// Add shape to group1
const redBox = new Konva.Rect({
  fill: 'red',
  width: 30,
  height: 30
});
group1.add(redBox);

// Move to group2
redBox.moveTo(group2);

// Can also move to layers directly
redBox.moveTo(layer);
```

**You can move:**
- Shapes between groups
- Shapes between layers
- Groups between layers
- Groups into other groups

### Layering (Z-Index)

Control draw order with layering methods:

```javascript
// Move to top/bottom
yellowBox.moveToTop();
yellowBox.moveToBottom();

// Move up/down one position
yellowBox.moveUp();
yellowBox.moveDown();

// Set specific zIndex
yellowBox.zIndex(5);

// Get current zIndex
const index = yellowBox.zIndex();
```

**Layering methods work on:**
- Shapes within layers
- Shapes within groups
- Groups within layers
- Layers within stages

---

## Filters

To apply filters, cache the node first:

```javascript
image.cache();
image.filters([Konva.Filters.Blur]);
image.blurRadius(10);
```

See API Reference section for all available filters.

---

## Tweens

### Tween Controls

Control tween playback with methods:

```javascript
const tween = new Konva.Tween({
  node: circle,
  duration: 2,
  x: 400,
  easing: Konva.Easings.EaseInOut
});

// Start or resume
tween.play();

// Pause
tween.pause();

// Reverse direction
tween.reverse();

// Reset to initial state
tween.reset();

// Jump to final state
tween.finish();

// Seek to specific time (in seconds)
tween.seek(1.5);
```

### Common Easings

To create tweens with easing:

```javascript
const tween = new Konva.Tween({
  node: box,
  duration: 1,
  x: width - 150,
  easing: Konva.Easings.EaseInOut
}).play();
```

**Available easings:**
- Linear
- EaseIn
- EaseOut
- EaseInOut
- StrongEaseIn
- StrongEaseOut
- StrongEaseInOut
- BackEaseIn
- BackEaseOut
- BackEaseInOut
- ElasticEaseIn
- ElasticEaseOut
- ElasticEaseInOut
- BounceEaseIn
- BounceEaseOut
- BounceEaseInOut

### Shorter Syntax

```javascript
circle.to({
  duration: 1,
  fill: 'green'
});
```

### Tween Events

Listen to tween lifecycle:

```javascript
tween.on('onFinish', function() {
  console.log('Tween finished');
});

tween.on('onUpdate', function() {
  console.log('Tween updating');
});
```

### Complex Tweening

Tween multiple properties:

```javascript
const tween = new Konva.Tween({
  node: shape,
  duration: 2,
  x: 300,
  y: 200,
  rotation: 180,
  scaleX: 2,
  scaleY: 2,
  opacity: 0.5,
  easing: Konva.Easings.ElasticEaseOut
});

tween.play();
```

### Filter Tweening

Animate filter properties:

```javascript
image.cache();
image.filters([Konva.Filters.Blur]);

const tween = new Konva.Tween({
  node: image,
  duration: 2,
  blurRadius: 20
});

tween.play();
```

---

## Animations

### Create Animation

To create custom animations:

```javascript
const anim = new Konva.Animation(function(frame) {
  const time = frame.time;
  const timeDiff = frame.timeDiff;
  const frameRate = frame.frameRate;
  
  // Update shape properties
  box.rotation(time * 0.1);
}, layer);

anim.start();

// Stop animation
anim.stop();
```

---

## Selectors

### Select by ID

```javascript
const shape = layer.findOne('#myRect');
```

### Select by Name

```javascript
const shapes = layer.find('.myName');
```

### Select by Type

```javascript
const circles = layer.find('Circle');
```

### Select with Function

```javascript
const groups = stage.find(node => {
  return node.getType() === 'Group';
});
```

---

## Data and Serialization

### Simple Load

To load a stage from JSON:

```javascript
const json = '{"attrs":{"width":400,"height":400},"className":"Stage",...}';
const stage = Konva.Node.create(json, 'container');
```

**Note:** In React/Vue, manage state separately instead of using Konva.Node.create().

### Serialize Stage

```javascript
const json = stage.toJSON();
```

---

## Performance

### Shape Caching

Cache complex shapes to improve performance:

```javascript
group.cache();

// Clear cache when needed
group.clearCache();
```

**When to cache:**
- Complex shapes with many drawing operations
- Shapes with filters
- Shapes that don't change often but redraw frequently

**Guidelines:**
- Don't cache simple shapes without filters
- Every cached node creates several canvas buffers
- Better to cache groups than individual shapes
- Always measure performance with and without caching

### Batch Draw

Use batchDraw() to schedule drawing:

```javascript
layer.batchDraw();
```

### Listening False

Disable event listening for better performance:

```javascript
shape.listening(false);
```

---

## Framework Integrations

### React

Install:
```bash
npm install react-konva konva --save
```

Basic usage:
```jsx
import React from 'react';
import { Stage, Layer, Rect, Circle } from 'react-konva';

const App = () => {
  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Rect 
          x={20} 
          y={50} 
          width={100} 
          height={100} 
          fill="red" 
          draggable 
        />
        <Circle 
          x={200} 
          y={100} 
          radius={50} 
          fill="green" 
          draggable 
        />
      </Layer>
    </Stage>
  );
};
```

### Vue

Install:
```bash
npm install vue-konva konva --save
```

Setup:
```javascript
import { createApp } from 'vue';
import VueKonva from 'vue-konva';

const app = createApp(App);
app.use(VueKonva);
app.mount('#app');
```

Basic usage:
```vue
<template>
  <v-stage :config="stageSize">
    <v-layer>
      <v-circle :config="circleConfig" />
      <v-rect :config="rectConfig" />
    </v-layer>
  </v-stage>
</template>

<script setup>
const stageSize = {
  width: window.innerWidth,
  height: window.innerHeight
};

const circleConfig = {
  x: 100,
  y: 100,
  radius: 70,
  fill: 'red',
  stroke: 'black',
  strokeWidth: 4
};
</script>
```

---

## Selectors

### Select by Name

You can select shapes by their `name` property using the `find()` method with a dot (`.`) prefix:

```javascript
// Set names on shapes
var circle1 = new Konva.Circle({
  name: 'myCircle',
  radius: 30,
  fill: 'red'
});

var circle2 = new Konva.Circle({
  name: 'myCircle',
  radius: 30,
  fill: 'blue'
});

// Find all shapes with name='myCircle'
var circles = layer.find('.myCircle'); // Returns array of nodes

// Example: Animate all circles with the same name
circles.forEach(circle => {
  circle.to({
    scaleX: 2,
    scaleY: 2,
    duration: 1
  });
});
```

**Key Points:**
- Use dot prefix (`.`) for name selector
- Returns array of all matching nodes
- Can be used on any container (Layer, Group, Stage)
- Names don't need to be unique

### Select by Type

Select all shapes of a specific type/class using `find()` with the class name:

```javascript
// Find all Circle shapes
var circles = layer.find('Circle'); // Returns array of all Circle nodes

// Find all Rect shapes
var rects = layer.find('Rect');

// Example: Scale all circles
circles.forEach(circle => {
  circle.scale({ x: 1.5, y: 1.5 });
});
```

**Supported Type Names:**
- `'Circle'`, `'Rect'`, `'Line'`, `'Ellipse'`, `'RegularPolygon'`
- `'Star'`, `'Ring'`, `'Arc'`, `'Wedge'`, `'Path'`
- `'Image'`, `'Text'`, `'Label'`, `'Sprite'`
- `'Group'`, `'Layer'`, `'Shape'` (custom shapes)

---

## Data and Serialization

### Best Practices for Save/Load

**Important:** `toJSON()` and `Node.create()` should **NOT** be used for complex applications, especially with frameworks like React/Vue.

**Why?**
1. **Visual complexity ≠ State complexity** - Most visual properties (shadows, strokes, sizes, colors) don't need serialization. Only serialize core state.
2. **Frameworks handle rendering** - React/Vue already manage state and rendering, so duplicating this with Konva's serialization is an anti-pattern.

**Recommended Pattern:**

```javascript
// Keep minimal state
const state = [
  { x: 10, y: 10 },
  { x: 50, y: 50 }
];

// Create shapes from state
function create(state) {
  return state.map(item => new Konva.Circle({
    x: item.x,
    y: item.y,
    radius: 50,
    fill: 'green',
    draggable: true
  }));
}

// Update state from shapes
function update() {
  return layer.children.map(shape => ({
    x: shape.x(),
    y: shape.y()
  }));
}

// Undo/Redo implementation
let history = [state];
let historyStep = 0;

function save() {
  const newState = update();
  historyStep++;
  history = history.slice(0, historyStep);
  history.push(newState);
}

function undo() {
  if (historyStep === 0) return;
  historyStep--;
  layer.destroyChildren();
  create(history[historyStep]).forEach(shape => layer.add(shape));
}

function redo() {
  if (historyStep === history.length - 1) return;
  historyStep++;
  layer.destroyChildren();
  create(history[historyStep]).forEach(shape => layer.add(shape));
}
```

**React/Vue Pattern:**

```javascript
// React example
const [circles, setCircles] = useState([
  { x: 50, y: 50, id: 1 },
  { x: 150, y: 100, id: 2 }
]);

// Render from state
{circles.map(circle => (
  <Circle
    key={circle.id}
    x={circle.x}
    y={circle.y}
    radius={50}
    fill="green"
    draggable
    onDragEnd={(e) => {
      const updatedCircles = circles.map(c =>
        c.id === circle.id
          ? { ...c, x: e.target.x(), y: e.target.y() }
          : c
      );
      setCircles(updatedCircles);
    }}
  />
))}
```

### Complex Load (Node.create)

For **simple apps only**, you can use `Konva.Node.create()` to deserialize JSON:

```javascript
// Serialize
const json = stage.toJSON();

// Deserialize
const stage = Konva.Node.create(json, 'container');

// Note: Must manually restore:
// 1. Images (reload image sources)
// 2. Event handlers (not serializable)
```

**WARNING:** This is an **anti-pattern for React/Vue**. Frameworks should manage state separately, not use Node.create().

### High Quality Export

Export canvas at higher resolution using `pixelRatio`:

```javascript
// Default: 1x resolution (500x500 stage → 500x500 image)
const dataURL = stage.toDataURL();

// 2x resolution for retina displays (500x500 stage → 1000x1000 image)
const highResURL = stage.toDataURL({
  pixelRatio: 2
});

// Even higher quality
const superHighResURL = stage.toDataURL({
  pixelRatio: 3
});

// Export as JPEG with quality setting
const jpegURL = stage.toDataURL({
  mimeType: 'image/jpeg',
  quality: 0.8,
  pixelRatio: 2
});

// Download image
const downloadLink = document.createElement('a');
downloadLink.href = highResURL;
downloadLink.download = 'canvas.png';
downloadLink.click();
```

**Notes:**
- Konva stores **vector data** (except bitmaps and cached nodes), so scales beautifully
- Use `stage.toImage()` for same functionality
- Higher pixelRatio = larger file size but better quality

### Stage Data URL

Convert stage or any node to data URL for saving as image:

```javascript
// Basic usage
const dataURL = stage.toDataURL();

// Open in new window
const win = window.open();
win.document.write(`<img src="${dataURL}" alt="Stage"/>`);

// With options
const jpegURL = stage.toDataURL({
  mimeType: 'image/jpeg',
  quality: 0.8,
  pixelRatio: 2
});

// Export specific layer
const layerURL = layer.toDataURL();

// Export specific shape (must be added to layer first)
const circleURL = circle.toDataURL();
```

**React Example:**

```javascript
const stageRef = useRef(null);

const handleExport = () => {
  const dataURL = stageRef.current.toDataURL();
  
  // Download
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'stage.png';
  link.click();
};

return (
  <>
    <button onClick={handleExport}>Save as Image</button>
    <Stage ref={stageRef} width={400} height={400}>
      <Layer>
        <Rect x={100} y={100} width={100} height={100} fill="red" draggable />
      </Layer>
    </Stage>
  </>
);
```

---

## Performance

### All Performance Tips

**Why Performance Matters:**
- HTML5 canvas can handle millions of computations per second
- But thousands of shapes × frequent redraws = observable lag
- Goal: Compute as little as possible, draw as little as possible

**Two Categories of Cost:**
1. **Computation** - Processing drawing instructions
2. **Drawing** - Moving bytes from memory to screen (plus compositing, per-pixel processing)

#### Stage Optimizations

1. **Optimize Stage Size** - Avoid large stages. Moving all those pixels is expensive. Use viewport tricks instead of mega-stages.

2. **Set Viewport on Mobile:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
```
Prevents unnecessary scaling on mobile.

3. **Use Konva.pixelRatio = 1 on Retina:**
```javascript
Konva.pixelRatio = 1; // Reduces scaling work on retina displays
```
Check quality - may affect output in some cases.

#### Layer Management

1. **Minimize Layers** - Each layer = separate canvas element. Keep to 3-5 max.

2. **Use layer.listening(false)** - Disables event detection for entire layer:
```javascript
backgroundLayer.listening(false); // No event overhead
```

3. **Optimize Dragging** - Move shape to dedicated layer while dragging:
```javascript
shape.on('dragstart', () => {
  shape.moveTo(dragLayer);
});

shape.on('dragend', () => {
  shape.moveTo(mainLayer);
});
```

#### Shape Optimizations

1. **Shape Caching** - Cache complex shapes as images:
```javascript
complexShape.cache();
group.cache(); // Cache entire groups
```

2. **Hide/Remove Invisible Shapes:**
```javascript
if (shape.opacity() === 0 || shape.isOutOfView()) {
  shape.hide(); // or shape.remove()
}
```

3. **Use shape.listening(false)** - Disable events for static shapes:
```javascript
decoration.listening(false);
```

4. **Disable Perfect Drawing** - Skip extra compositing:
```javascript
shape.perfectDrawEnabled(false);
```
Safe when shape has fill, stroke, and opacity.

5. **Optimize Stroke Drawing** - Avoid shadow on stroke:
```javascript
shape.shadowForStrokeEnabled(false);
```

#### Animation Optimizations

1. **Use Konva.Animation** - Better than requestAnimationFrame
2. **Cache animated shapes** - Especially complex ones
3. **Use batchDraw()** - Lets Konva optimize redraw timing

#### Memory Management

1. **Destroy unused shapes:**
```javascript
shape.destroy(); // Not just remove()
```

2. **Destroy tweens:**
```javascript
tween.destroy(); // After tween completes
// Or use node.to() which auto-destroys
```

**Demo Example:**

```javascript
const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight
});

// Background layer - no events needed
const backgroundLayer = new Konva.Layer({ listening: false });

// Main interactive layer
const mainLayer = new Konva.Layer();

// Drag optimization layer
const dragLayer = new Konva.Layer();

stage.add(backgroundLayer, mainLayer, dragLayer);

// Cached shape with optimizations
const star = new Konva.Star({
  x: 200,
  y: 200,
  numPoints: 6,
  innerRadius: 40,
  outerRadius: 70,
  fill: 'yellow',
  stroke: 'black',
  strokeWidth: 4,
  draggable: true,
  perfectDrawEnabled: false // Performance optimization
});

star.cache(); // Cache for better performance

// Optimize dragging
star.on('dragstart', () => star.moveTo(dragLayer));
star.on('dragend', () => star.moveTo(mainLayer));

mainLayer.add(star);
```

### Avoid Memory Leaks

**Deleting Shapes:**

Two methods: `remove()` vs `destroy()`

```javascript
// remove() - Shape can be reused later
shape.remove(); // Removes from container, keeps in memory
layer.add(shape); // Can add back later

// destroy() - Completely delete
shape.destroy(); // Deletes all references from Konva engine
```

**Tweening:**

Always destroy tweens after usage:

```javascript
// BAD: Memory leak
const tween = new Konva.Tween({
  node: circle,
  x: 100,
  duration: 1
});
tween.play();

// GOOD: Manual cleanup
tween.onFinish = () => {
  tween.destroy();
};

// BEST: Use to() method (auto-destroys)
circle.to({
  x: 100,
  duration: 1
}); // Automatically destroyed when complete
```

**React Pattern:**

```javascript
const [isVisible, setIsVisible] = useState(true);

// Component automatically handles cleanup
{isVisible && (
  <Circle
    x={100}
    y={100}
    radius={30}
    fill="red"
  />
)}
```

### Batch Draw

**Update (Konva v8+):** Konva now automatically batches draws. This is only relevant if you use `Konva.autoDrawEnabled = false`.

**Problem:** Calling `draw()` on every mousemove event → hundreds of redraws/second → browser can't keep up.

**Solution:** Use `batchDraw()` which hooks into Konva's animation engine and intelligently limits redraws based on browser capability.

```javascript
Konva.autoDrawEnabled = false; // For manual control

stage.on('mousemove', () => {
  rect.rotate(5);
  layer.batchDraw(); // Intelligent batching instead of draw()
});
```

**How batchDraw() Works:**
- Batches multiple draw requests
- Limits to browser's max frame rate
- No matter how many times called, won't exceed browser capability
- Prevents jumpy animations from excessive redraws

### Layer Management

Each Konva layer = separate HTML5 canvas element.

**Benefits:**
- Update only changed layers (avoid full stage redraw)
- Separate static vs animated content

**Best Practice:** Keep layers to minimum (usually 3-5 max) since each has performance overhead.

**Example:**

```javascript
const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight
});

// Static layer - never changes
const textLayer = new Konva.Layer();
textLayer.add(new Konva.Text({
  x: 20,
  y: 20,
  text: 'Static text',
  fontSize: 16
}));

// Animated layer - updates frequently
const animLayer = new Konva.Layer();
const circle = new Konva.Circle({
  x: 100,
  y: 100,
  radius: 30,
  fill: 'red'
});
animLayer.add(circle);

stage.add(textLayer, animLayer);

// Animation only redraws animLayer, not textLayer
const anim = new Konva.Animation((frame) => {
  circle.x(100 + Math.sin(frame.time / 1000) * 100);
  circle.y(100 + Math.sin(frame.time / 2000) * 100);
}, animLayer); // Only animLayer specified

anim.start();
```

### Listening False

Disable event detection for shapes that don't need it:

```javascript
// Shape with events disabled
const decoration = new Konva.Circle({
  x: 100,
  y: 100,
  radius: 20,
  fill: 'green',
  listening: false // Ignore all events
});
```

**Performance Impact:**
- Konva checks every shape for event listeners on every event
- With many shapes (100s-1000s), this adds up
- `listening: false` removes this overhead

**Example:**

```javascript
// 100 interactive circles (with hover effects)
for (let i = 0; i < 100; i++) {
  const circle = new Konva.Circle({
    x: Math.random() * stage.width(),
    y: Math.random() * stage.height(),
    radius: 20,
    fill: 'blue',
    listening: true // Default
  });
  
  circle.on('mouseover', () => circle.fill('red'));
  circle.on('mouseout', () => circle.fill('blue'));
  
  layer.add(circle);
}

// 1000 non-interactive circles (better performance)
for (let i = 0; i < 1000; i++) {
  const circle = new Konva.Circle({
    x: Math.random() * stage.width(),
    y: Math.random() * stage.height(),
    radius: 20,
    fill: 'green',
    listening: false // No event overhead
  });
  
  layer.add(circle);
}
```

**React Example:**

```javascript
// Non-interactive decorative circles
{decorativeCircles.map(circle => (
  <Circle
    key={circle.id}
    x={circle.x}
    y={circle.y}
    radius={20}
    fill="green"
    listening={false} // Significantly better performance
  />
))}
```

### Optimize Animation

**Key Tips:**

1. Use `Konva.Animation` instead of `requestAnimationFrame`
2. Only animate properties that need to change
3. Cache complex shapes
4. Minimize number of animated nodes

**Example:**

```javascript
const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight
});

const layer = new Konva.Layer();
stage.add(layer);

// Complex shape - cache it
const star = new Konva.Star({
  x: stage.width() / 2,
  y: stage.height() / 2,
  numPoints: 6,
  innerRadius: 40,
  outerRadius: 70,
  fill: 'yellow',
  stroke: 'black',
  strokeWidth: 4
});

star.cache(); // Better performance
layer.add(star);

// Simple shape - no cache needed
const circle = new Konva.Circle({
  x: 100,
  y: 100,
  radius: 20,
  fill: 'red'
});
layer.add(circle);

// Optimized animation
const anim = new Konva.Animation((frame) => {
  // Rotate cached star
  star.rotation(frame.time * 0.1);
  
  // Move circle in pattern
  circle.x(100 + Math.cos(frame.time * 0.002) * 50);
  circle.y(100 + Math.sin(frame.time * 0.002) * 50);
}, layer);

anim.start();
```

**React Example:**

```javascript
const starRef = useRef(null);
const circleRef = useRef(null);
const animRef = useRef(null);

useEffect(() => {
  // Cache complex shape
  if (starRef.current) {
    starRef.current.cache();
  }
  
  // Create animation
  const anim = new Konva.Animation((frame) => {
    starRef.current.rotation(frame.time * 0.1);
    circleRef.current.x(100 + Math.cos(frame.time * 0.002) * 50);
    circleRef.current.y(100 + Math.sin(frame.time * 0.002) * 50);
  }, starRef.current.getLayer());
  
  animRef.current = anim;
  anim.start();
  
  return () => anim.stop();
}, []);
```

### Optimize Strokes

When a shape has both stroke and shadow, Konva does extra internal drawing to ensure the stroke's shadow renders correctly.

**Problem:** Performance cost from double-rendering.

**Solution:** Disable shadow for stroke using `shadowForStrokeEnabled(false)`:

```javascript
const circle = new Konva.Circle({
  x: 100,
  y: 100,
  radius: 50,
  fill: 'red',
  stroke: 'black',
  strokeWidth: 4,
  shadowColor: 'black',
  shadowBlur: 10,
  shadowOffset: { x: 5, y: 5 },
  shadowForStrokeEnabled: false // Better performance
});
```

**Comparison:**

```javascript
// Default (slower): Shadow applies to both fill AND stroke
const circleWithStrokeShadow = new Konva.Circle({
  radius: 50,
  fill: 'red',
  stroke: 'black',
  strokeWidth: 4,
  shadowColor: 'black',
  shadowBlur: 10
  // shadowForStrokeEnabled: true (default)
});

// Optimized (faster): Shadow only on fill, not stroke
const circleOptimized = new Konva.Circle({
  radius: 50,
  fill: 'red',
  stroke: 'black',
  strokeWidth: 4,
  shadowColor: 'black',
  shadowBlur: 10,
  shadowForStrokeEnabled: false // Skip stroke shadow
});
```

**FPS Comparison Demo:**

```javascript
const anim = new Konva.Animation((frame) => {
  circleWithStrokeShadow.rotation(frame.time * 0.1);
  circleOptimized.rotation(frame.time * 0.1);
  
  // Monitor FPS - optimized version will show better frameRate
  console.log('FPS:', frame.frameRate.toFixed(1));
}, layer);
```

### Shape Caching

Cache complex shapes as images to avoid redrawing them repeatedly.

**When to Cache:**
1. Complex shapes with many drawing operations
2. Shapes with filters
3. Shapes that don't change often but redraw frequently

**How It Works:**
1. Konva creates internal canvas buffer
2. Draws shape onto buffer once
3. Reuses cached buffer for all subsequent draws (much faster)

**Usage:**

```javascript
const complexShape = new Konva.Star({
  x: 200,
  y: 200,
  numPoints: 6,
  innerRadius: 40,
  outerRadius: 70,
  fill: 'yellow',
  stroke: 'black',
  strokeWidth: 4,
  shadowColor: 'black',
  shadowBlur: 10
});

complexShape.cache(); // Cache it!

// Clear cache if shape changes significantly
complexShape.clearCache();
```

**Guidelines:**

1. **Don't cache simple shapes** - May be slower than direct rendering
2. **Don't overuse** - Each cache = multiple canvas buffers (memory cost)
3. **Cache groups, not individual shapes** - More efficient
4. **Always measure** - Test with/without caching to verify improvement

**Performance Demo:**

```javascript
const group = new Konva.Group({
  x: stage.width() / 2,
  y: stage.height() / 2
});

// Add 5000 circles to group
for (let i = 0; i < 5000; i++) {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * 300;
  
  const circle = new Konva.Circle({
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    radius: 5 + Math.random() * 10,
    fill: Konva.Util.getRandomColor(),
    shadowColor: 'black',
    shadowBlur: 10,
    listening: false
  });
  
  group.add(circle);
}

layer.add(group);

// Animate rotation
const anim = new Konva.Animation((frame) => {
  group.rotation(frame.time * 0.05);
  
  // FPS counter shows performance
  fpsText.text('FPS: ' + frame.frameRate.toFixed(1));
}, layer);

anim.start();

// Toggle caching to see difference
const toggleCache = (enabled) => {
  if (enabled) {
    group.cache(); // Dramatically better FPS
  } else {
    group.clearCache();
  }
};
```

**React Example:**

```javascript
const groupRef = useRef(null);
const [isCached, setIsCached] = useState(false);

useEffect(() => {
  if (groupRef.current) {
    if (isCached) {
      groupRef.current.cache();
    } else {
      groupRef.current.clearCache();
    }
  }
}, [isCached]);

return (
  <>
    <label>
      <input
        type="checkbox"
        checked={isCached}
        onChange={(e) => setIsCached(e.target.checked)}
      />
      Enable Caching
    </label>
    
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Group ref={groupRef}>
          {/* 5000+ complex shapes */}
        </Group>
      </Layer>
    </Stage>
  </>
);
```

### Disable Perfect Draw

**Problem:** Some canvas drawing produces unexpected results. For example, a shape with fill + stroke + opacity shows a darker line where stroke overlaps fill.

**Konva's Fix:** Uses buffer canvas:
1. Draw shape on buffer without opacity
2. Fill and stroke it
3. Apply opacity
4. Copy to main canvas

**Cost:** Performance hit from extra canvas operations.

**Solution:** Disable perfect drawing when not needed:

```javascript
shape.perfectDrawEnabled(false);
```

**When Safe:**
- Shape has fill, stroke, AND opacity
- Visual result is acceptable without perfect drawing

**Comparison:**

```javascript
// With perfect drawing (default, slower)
const perfectCircle = new Konva.Circle({
  x: 100,
  y: 100,
  radius: 50,
  fill: 'red',
  stroke: 'black',
  strokeWidth: 10,
  opacity: 0.5
  // perfectDrawEnabled: true (default)
});

// Without perfect drawing (faster)
const nonPerfectCircle = new Konva.Circle({
  x: 250,
  y: 100,
  radius: 50,
  fill: 'red',
  stroke: 'black',
  strokeWidth: 10,
  opacity: 0.5,
  perfectDrawEnabled: false // Better performance
});
```

**Visual Difference:**
- Perfect: Clean stroke, no overlap artifacts
- Non-perfect: May show darker line where stroke meets fill
- Often the difference is negligible, so worth the performance gain

---

## Animations

### Create an Animation

Use `Konva.Animation` constructor for custom animations:

```javascript
const anim = new Konva.Animation(function(frame) {
  // frame object contains:
  // - time: milliseconds since animation start
  // - timeDiff: milliseconds since last frame
  // - frameRate: current FPS
  
  // Update shape properties (DO NOT call draw())
  const radius = 50;
  const x = radius * Math.cos(frame.time * 2 * Math.PI / 2000) + 100;
  const y = radius * Math.sin(frame.time * 2 * Math.PI / 2000) + 100;
  
  rect.position({ x, y });
}, layer); // Specify layer(s) to redraw

anim.start();
```

**Key Points:**
- Animation function receives `frame` object with timing info
- **Never call draw()** - animation engine handles that
- Only update node properties (position, rotation, scale, etc.)
- Can specify single layer or array of layers

**React Example:**

```javascript
const rectRef = useRef(null);

useEffect(() => {
  const anim = new Konva.Animation((frame) => {
    const radius = 50;
    const x = radius * Math.cos(frame.time * 2 * Math.PI / 2000) + 100;
    const y = radius * Math.sin(frame.time * 2 * Math.PI / 2000) + 100;
    
    rectRef.current.position({ x, y });
  }, rectRef.current.getLayer());
  
  anim.start();
  
  return () => anim.stop();
}, []);

return (
  <Stage width={window.innerWidth} height={window.innerHeight}>
    <Layer>
      <Rect
        ref={rectRef}
        x={50}
        y={50}
        width={50}
        height={50}
        fill="green"
      />
    </Layer>
  </Stage>
);
```

### Moving (Position Animation)

Animate shape position using sine/cosine for smooth motion:

```javascript
const circle = new Konva.Circle({
  x: 50,
  y: window.innerHeight / 2,
  radius: 30,
  fill: 'red',
  stroke: 'black',
  strokeWidth: 4
});

layer.add(circle);

const amplitude = 100;
const period = 2000; // milliseconds

const anim = new Konva.Animation(function(frame) {
  circle.x(
    amplitude * Math.sin((frame.time * 2 * Math.PI) / period) +
    window.innerWidth / 2
  );
}, layer);

anim.start();
```

**Pattern Variations:**

```javascript
// Horizontal oscillation
circle.x(centerX + Math.sin(frame.time / 1000) * amplitude);

// Vertical oscillation
circle.y(centerY + Math.sin(frame.time / 1000) * amplitude);

// Circular motion
circle.x(centerX + Math.cos(frame.time / 1000) * radius);
circle.y(centerY + Math.sin(frame.time / 1000) * radius);

// Figure-8 pattern
circle.x(centerX + Math.sin(frame.time / 1000) * scale);
circle.y(centerY + Math.sin(frame.time / 2000) * scale);
```

### Rotation Animation

Animate rotation around different pivot points using `offset`:

```javascript
// Rotate around top-left corner
const blueRect = new Konva.Rect({
  x: 50,
  y: 50,
  width: 100,
  height: 50,
  fill: '#00D2FF',
  stroke: 'black',
  strokeWidth: 4,
  offset: { x: 0, y: 0 } // Top-left pivot
});

// Rotate around center
const yellowRect = new Konva.Rect({
  x: 200,
  y: 50,
  width: 100,
  height: 50,
  fill: 'yellow',
  stroke: 'black',
  strokeWidth: 4,
  offset: { x: 50, y: 25 } // Center pivot (width/2, height/2)
});

// Rotate around external point
const redRect = new Konva.Rect({
  x: 350,
  y: 50,
  width: 100,
  height: 50,
  fill: 'red',
  stroke: 'black',
  strokeWidth: 4,
  offset: { x: -50, y: 25 } // 50px to the left
});

const angularSpeed = 90; // degrees per second

const anim = new Konva.Animation(function(frame) {
  const angleDiff = (frame.timeDiff * angularSpeed) / 1000;
  
  blueRect.rotate(angleDiff);
  yellowRect.rotate(angleDiff);
  redRect.rotate(angleDiff);
}, layer);

anim.start();
```

**Key Points:**
- Use `offset` to set rotation pivot point
- `offset: {x: width/2, y: height/2}` = center rotation
- Negative offset = external pivot point
- `rotate(degrees)` adds to current rotation
- `rotation(degrees)` sets absolute rotation

### Scaling Animation

Animate scale on x/y axes independently or together:

```javascript
// Scale both axes
const blueHex = new Konva.RegularPolygon({
  x: 50,
  y: 50,
  sides: 6,
  radius: 20,
  fill: '#00D2FF',
  draggable: true
});

// Scale Y only
const yellowHex = new Konva.RegularPolygon({
  x: 150,
  y: 50,
  sides: 6,
  radius: 20,
  fill: 'yellow',
  draggable: true
});

// Scale X only
const redHex = new Konva.RegularPolygon({
  x: 250,
  y: 50,
  sides: 6,
  radius: 20,
  fill: 'red',
  draggable: true
});

const period = 2000;

const anim = new Konva.Animation(function(frame) {
  const scale = Math.sin(frame.time * 2 * Math.PI / period) + 2;
  
  // Scale both x and y
  blueHex.scale({ x: scale, y: scale });
  
  // Scale y only
  yellowHex.scaleY(scale);
  
  // Scale x only
  redHex.scaleX(scale);
}, layer);

anim.start();
```

**Methods:**
- `shape.scale({ x: 2, y: 2 })` - Scale both axes
- `shape.scaleX(2)` - Scale x only
- `shape.scaleY(2)` - Scale y only
- Values < 1 = shrink, > 1 = grow

### Stop Animation

Control animation playback with `start()` and `stop()`:

```javascript
const circle = new Konva.Circle({
  x: stage.width() / 2,
  y: stage.height() / 2,
  radius: 30,
  fill: 'red'
});

layer.add(circle);

const amplitude = 100;
const period = 2000;

const anim = new Konva.Animation(function(frame) {
  circle.x(
    amplitude * Math.sin((frame.time * 2 * Math.PI) / period) +
    stage.width() / 2
  );
}, layer);

// Start/stop controls
document.getElementById('start').addEventListener('click', () => {
  anim.start();
});

document.getElementById('stop').addEventListener('click', () => {
  anim.stop();
});
```

**React Example:**

```javascript
const [isAnimating, setIsAnimating] = useState(false);
const animRef = useRef(null);

useEffect(() => {
  const anim = new Konva.Animation((frame) => {
    circleRef.current.x(
      amplitude * Math.sin((frame.time * 2 * Math.PI) / period) +
      window.innerWidth / 2
    );
  }, circleRef.current.getLayer());
  
  animRef.current = anim;
  
  return () => anim.stop();
}, []);

const handleStart = () => {
  animRef.current.start();
  setIsAnimating(true);
};

const handleStop = () => {
  animRef.current.stop();
  setIsAnimating(false);
};

return (
  <>
    <button onClick={handleStart} disabled={isAnimating}>
      Start Animation
    </button>
    <button onClick={handleStop} disabled={!isAnimating}>
      Stop Animation
    </button>
    <Stage>
      <Layer>
        <Circle ref={circleRef} />
      </Layer>
    </Stage>
  </>
);
```

---

## Filters (Extended)

### Brighten Filter

**Note:** Deprecated - use Brightness filter instead.

Brighten or darken images using `Konva.Filters.Brighten`:

```javascript
const imageObj = new Image();
imageObj.onload = () => {
  const image = new Konva.Image({
    x: 50,
    y: 50,
    image: imageObj,
    draggable: true
  });
  
  layer.add(image);
  
  // Must cache before applying filter
  image.cache();
  image.filters([Konva.Filters.Brighten]);
  image.brightness(0.3); // Range: -1 to 1
  
  // Negative values darken, positive brighten
};
imageObj.src = 'image.jpg';
```

**React Example:**

```javascript
const [brightness, setBrightness] = useState(0.3);
const [image] = useImage('image.jpg', 'anonymous');
const imageRef = useRef(null);

useEffect(() => {
  if (image && imageRef.current) {
    imageRef.current.cache();
  }
}, [image]);

return (
  <>
    <input
      type="range"
      min="-1"
      max="1"
      step="0.1"
      value={brightness}
      onChange={(e) => setBrightness(parseFloat(e.target.value))}
    />
    <Stage>
      <Layer>
        <Image
          ref={imageRef}
          image={image}
          filters={[Konva.Filters.Brighten]}
          brightness={brightness}
        />
      </Layer>
    </Stage>
  </>
);
```

### Grayscale Filter

Convert image to grayscale:

```javascript
const image = new Konva.Image({
  x: 50,
  y: 50,
  image: imageObj
});

layer.add(image);
image.cache();
image.filters([Konva.Filters.Grayscale]);
```

**React:**

```javascript
<Image
  image={image}
  filters={[Konva.Filters.Grayscale]}
/>
```

### Blur Filter

Apply blur effect with adjustable radius:

```javascript
const image = new Konva.Image({
  x: 50,
  y: 50,
  image: imageObj
});

layer.add(image);
image.cache();
image.filters([Konva.Filters.Blur]);
image.blurRadius(10); // Range: 0-40+
```

**With Slider:**

```javascript
const slider = document.createElement('input');
slider.type = 'range';
slider.min = '0';
slider.max = '40';
slider.value = '10';

slider.addEventListener('input', (e) => {
  image.blurRadius(parseInt(e.target.value));
});
```

### Invert Filter

Invert image colors:

```javascript
image.cache();
image.filters([Konva.Filters.Invert]);
```

Simple, no configuration needed.

### Custom Filter

Create custom filters by manipulating ImageData:

```javascript
// Define custom filter
Konva.Filters.RemoveAlpha = function(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i + 3] = 255; // Set alpha to 1 (fully opaque)
  }
};

// Apply custom filter
image.cache();
image.filters([Konva.Filters.RemoveAlpha]);
```

**Filter Function Pattern:**

```javascript
function CustomFilter(imageData) {
  const data = imageData.data; // RGBA array
  
  // data[0] = red, data[1] = green, data[2] = blue, data[3] = alpha
  // data[4] = next pixel's red, etc.
  
  for (let i = 0; i < data.length; i += 4) {
    // Manipulate pixel data
    data[i] = ...; // red
    data[i + 1] = ...; // green
    data[i + 2] = ...; // blue
    data[i + 3] = ...; // alpha
  }
}
```

### HSL Filter

Adjust Hue, Saturation, and Luminance:

```javascript
image.cache();
image.filters([Konva.Filters.HSL]);

image.hue(45); // Range: -180 to 180
image.saturation(1.5); // Range: -2 to 10
image.luminance(0.3); // Range: -2 to 2
```

**With Sliders:**

```javascript
const [hue, setHue] = useState(0);
const [saturation, setSaturation] = useState(0);
const [luminance, setLuminance] = useState(0);

<Image
  image={image}
  filters={[Konva.Filters.HSL]}
  hue={hue}
  saturation={saturation}
  luminance={luminance}
/>

<input
  type="range"
  min="-180"
  max="180"
  value={hue}
  onChange={(e) => setHue(parseInt(e.target.value))}
/>
```

### RGB Filter

Adjust red, green, and blue channels independently:

```javascript
image.cache();
image.filters([Konva.Filters.RGB]);

image.red(100); // Range: 0-255
image.green(150); // Range: 0-255
image.blue(200); // Range: 0-255
```

**React Example:**

```javascript
const [red, setRed] = useState(100);
const [green, setGreen] = useState(100);
const [blue, setBlue] = useState(100);

<Image
  image={image}
  filters={[Konva.Filters.RGB]}
  red={red}
  green={green}
  blue={blue}
/>

<div>
  Red: <input type="range" min="0" max="255" value={red} onChange={(e) => setRed(parseInt(e.target.value))} />
</div>
<div>
  Green: <input type="range" min="0" max="255" value={green} onChange={(e) => setGreen(parseInt(e.target.value))} />
</div>
<div>
  Blue: <input type="range" min="0" max="255" value={blue} onChange={(e) => setBlue(parseInt(e.target.value))} />
</div>
```

### Pixelate Filter

Create pixelated/mosaic effect:

```javascript
image.cache();
image.filters([Konva.Filters.Pixelate]);
image.pixelSize(8); // Range: 2-32 (or higher)
```

**Interactive:**

```javascript
const [pixelSize, setPixelSize] = useState(8);

<Image
  image={image}
  filters={[Konva.Filters.Pixelate]}
  pixelSize={pixelSize}
/>

<input
  type="range"
  min="2"
  max="32"
  value={pixelSize}
  onChange={(e) => setPixelSize(parseInt(e.target.value))}
/>
```

### Sepia Filter

Apply sepia tone (vintage photo effect):

```javascript
image.cache();
image.filters([Konva.Filters.Sepia]);
```

No configuration needed - applies classic sepia effect.

### Mask Filter

Remove background by detecting and masking similar colors:

```javascript
image.cache();
image.filters([Konva.Filters.Mask]);
image.threshold(10); // Range: 0-255
```

**How It Works:**
1. Samples color from four corners of image
2. If corners have similar color (within threshold), assumes it's background
3. Makes pixels matching background color transparent
4. Uses erosion/dilation to smooth edges
5. Applies refined mask to alpha channel

**Threshold:**
- Lower = only very similar colors removed
- Higher = wider range of colors removed

**Example:**

```javascript
const [threshold, setThreshold] = useState(10);

<Image
  image={image}
  filters={[Konva.Filters.Mask]}
  threshold={threshold}
/>

<input
  type="range"
  min="0"
  max="255"
  value={threshold}
  onChange={(e) => setThreshold(parseInt(e.target.value))}
/>
```

### Contrast Filter

Adjust image contrast:

```javascript
image.cache();
image.filters([Konva.Filters.Contrast]);
image.contrast(30); // Range: -100 to 100
```

**React Example:**

```javascript
const [contrast, setContrast] = useState(50);

<Image
  image={image}
  filters={[Konva.Filters.Contrast]}
  contrast={contrast}
/>

<input
  type="range"
  min="-100"
  max="100"
  value={contrast}
  onChange={(e) => setContrast(parseInt(e.target.value))}
/>
```

**Values:**
- Negative = less contrast
- 0 = no change
- Positive = more contrast

### Emboss Filter

Create embossed/raised effect:

```javascript
image.cache();
image.filters([Konva.Filters.Emboss]);

image.embossStrength(0.5); // Range: 0-1
image.embossWhiteLevel(0.5); // Range: 0-1
image.embossDirection('top-left'); // Direction
image.embossBlend(0.5); // Range: 0-1
```

**Properties:**
- `embossStrength` - Strength of emboss effect
- `embossWhiteLevel` - White level adjustment
- `embossDirection` - Direction of light source
- `embossBlend` - Blending amount

**React Example:**

```javascript
const [strength, setStrength] = useState(0.5);
const [whiteLevel, setWhiteLevel] = useState(0.5);
const [blend, setBlend] = useState(0.5);

<Image
  image={image}
  filters={[Konva.Filters.Emboss]}
  embossStrength={strength}
  embossWhiteLevel={whiteLevel}
  embossDirection="top-left"
  embossBlend={blend}
/>
```

### Enhance Filter

Enhance image details:

```javascript
image.cache();
image.filters([Konva.Filters.Enhance]);
image.enhance(0.4); // Range: -1 to 1
```

**React Example:**

```javascript
const [enhance, setEnhance] = useState(0.4);

<Image
  image={image}
  filters={[Konva.Filters.Enhance]}
  enhance={enhance}
/>

<input
  type="range"
  min="-1"
  max="1"
  step="0.1"
  value={enhance}
  onChange={(e) => setEnhance(parseFloat(e.target.value))}
/>
```

### HSV Filter

Adjust Hue, Saturation, and Value:

```javascript
image.cache();
image.filters([Konva.Filters.HSV]);

image.hue(45); // Range: -180 to 180
image.saturation(1.5); // Range: -2 to 10
image.value(0.3); // Range: -2 to 2
```

**React Example:**

```javascript
const [hue, setHue] = useState(0);
const [saturation, setSaturation] = useState(0);
const [value, setValue] = useState(0);

<Image
  image={image}
  filters={[Konva.Filters.HSV]}
  hue={hue}
  saturation={saturation}
  value={value}
/>

<div>
  Hue: <input type="range" min="-259" max="259" value={hue} onChange={(e) => setHue(parseInt(e.target.value))} />
</div>
<div>
  Saturation: <input type="range" min="-2" max="10" step="0.1" value={saturation} onChange={(e) => setSaturation(parseFloat(e.target.value))} />
</div>
<div>
  Value: <input type="range" min="-2" max="2" step="0.1" value={value} onChange={(e) => setValue(parseFloat(e.target.value))} />
</div>
```

### Kaleidoscope Filter

Create kaleidoscope mirror effect:

```javascript
image.cache();
image.filters([Konva.Filters.Kaleidoscope]);

image.kaleidoscopePower(3); // Range: 2-8 (number of reflections)
image.kaleidoscopeAngle(0); // Range: 0-360
```

**React Example:**

```javascript
const [power, setPower] = useState(3);
const [angle, setAngle] = useState(0);

<Image
  image={image}
  filters={[Konva.Filters.Kaleidoscope]}
  kaleidoscopePower={power}
  kaleidoscopeAngle={angle}
/>

<div>
  Power: <input type="range" min="2" max="8" step="1" value={power} onChange={(e) => setPower(parseInt(e.target.value))} />
</div>
<div>
  Angle: <input type="range" min="0" max="360" step="0.1" value={angle} onChange={(e) => setAngle(parseFloat(e.target.value))} />
</div>
```

### Noise Filter

Add noise/grain to image:

```javascript
image.cache();
image.filters([Konva.Filters.Noise]);
image.noise(0.3); // Range: 0-1
```

**React Example:**

```javascript
const [noise, setNoise] = useState(0.5);

<Image
  image={image}
  filters={[Konva.Filters.Noise]}
  noise={noise}
/>

<input
  type="range"
  min="0"
  max="1"
  step="0.1"
  value={noise}
  onChange={(e) => setNoise(parseFloat(e.target.value))}
/>
```

### Solarize Filter

Apply solarization effect (photo reversal):

```javascript
image.cache();
image.filters([Konva.Filters.Solarize]);
image.threshold(0.5); // Range: 0-1
```

**React Example:**

```javascript
const [threshold, setThreshold] = useState(0.5);

<Image
  image={image}
  filters={[Konva.Filters.Solarize]}
  threshold={threshold}
/>

<input
  type="range"
  min="0"
  max="1"
  step="0.1"
  value={threshold}
  onChange={(e) => setThreshold(parseFloat(e.target.value))}
/>
```

### Threshold Filter

Convert to black and white based on threshold:

```javascript
image.cache();
image.filters([Konva.Filters.Threshold]);
image.threshold(0.5); // Range: 0-1
```

**How It Works:**
- Converts image to pure black and white
- Pixels above threshold → white
- Pixels below threshold → black

**React Example:**

```javascript
const [threshold, setThreshold] = useState(0.5);

<Image
  image={image}
  filters={[Konva.Filters.Threshold]}
  threshold={threshold}
/>

<input
  type="range"
  min="0"
  max="1"
  step="0.1"
  value={threshold}
  onChange={(e) => setThreshold(parseFloat(e.target.value))}
/>
```

### Brightness Filter (New)

**Note:** Introduced in Konva 10.0.0 to replace deprecated Brighten filter.

Adjust brightness similar to CSS `filter: brightness()`:

```javascript
image.cache();
image.filters([Konva.Filters.Brightness]);
image.brightness(1.5); // Range: 0-2
```

**Values:**
- `0` - Completely black
- `1` - Original (no change)
- `> 1` - Brighter
- `2` - Very bright

**React Example:**

```javascript
const [brightness, setBrightness] = useState(1.5);

<Image
  image={image}
  filters={[Konva.Filters.Brightness]}
  brightness={brightness}
/>

<input
  type="range"
  min="0"
  max="2"
  step="0.1"
  value={brightness}
  onChange={(e) => setBrightness(parseFloat(e.target.value))}
/>
```

**Comparison with Brighten (deprecated):**
- Brighten: Range -1 to 1
- Brightness: Range 0 to 2 (CSS-compatible)

---

## Tweens (Extended)

### All Easings

Konva provides comprehensive easing functions for smooth animations:

**Easing Categories:**
1. **Linear** - Constant speed
2. **Ease** - EaseIn, EaseOut, EaseInOut
3. **Back** - BackEaseIn, BackEaseOut, BackEaseInOut
4. **Elastic** - ElasticEaseIn, ElasticEaseOut, ElasticEaseInOut
5. **Bounce** - BounceEaseIn, BounceEaseOut, BounceEaseInOut
6. **Strong** - StrongEaseIn, StrongEaseOut, StrongEaseInOut

**Example - All Easings Demo:**

```javascript
const easings = [
  'Linear',
  'EaseIn', 'EaseOut', 'EaseInOut',
  'BackEaseIn', 'BackEaseOut', 'BackEaseInOut',
  'ElasticEaseIn', 'ElasticEaseOut', 'ElasticEaseInOut',
  'BounceEaseIn', 'BounceEaseOut', 'BounceEaseInOut',
  'StrongEaseIn', 'StrongEaseOut', 'StrongEaseInOut'
];

const tweens = [];

easings.forEach((easing, i) => {
  const text = new Konva.Text({
    x: 50,
    y: 30 + i * 25,
    text: easing,
    fontSize: 16,
    fill: 'black'
  });
  
  layer.add(text);
  
  tweens.push(
    new Konva.Tween({
      node: text,
      duration: 2,
      x: stage.width() - 200,
      easing: Konva.Easings[easing]
    })
  );
});

// Play all tweens
tweens.forEach(tween => {
  tween.reset();
  tween.play();
});
```

**React Example:**

```javascript
const easings = ['Linear', 'EaseIn', 'EaseOut', 'EaseInOut', 'BackEaseIn', ...];
const textsRef = useRef([]);
const tweensRef = useRef([]);

useEffect(() => {
  tweensRef.current = textsRef.current.map((text, i) => {
    return new Konva.Tween({
      node: text,
      duration: 2,
      x: window.innerWidth - 200,
      easing: Konva.Easings[easings[i]]
    });
  });
}, []);

const handlePlay = () => {
  tweensRef.current.forEach(tween => {
    tween.reset();
    tween.play();
  });
};

return (
  <>
    <button onClick={handlePlay}>Play</button>
    <Stage>
      <Layer>
        {easings.map((easing, i) => (
          <Text
            key={i}
            ref={node => textsRef.current[i] = node}
            x={50}
            y={30 + i * 25}
            text={easing}
            fontSize={16}
            fill="black"
          />
        ))}
      </Layer>
    </Stage>
  </>
);
```

### Complex Tweening

For complex animations, combine tweens with animations or use chaining:

```javascript
const circle = new Konva.Circle({
  x: stage.width() / 2,
  y: stage.height() / 2,
  radius: 70,
  fillLinearGradientStartPoint: { x: -50, y: -50 },
  fillLinearGradientEndPoint: { x: 50, y: 50 },
  fillLinearGradientColorStops: [0, 'red', 1, 'yellow'],
  stroke: 'black',
  strokeWidth: 4,
  draggable: true
});

circle.on('click', () => {
  // Tween scale up
  const tween = new Konva.Tween({
    node: circle,
    duration: 1,
    scaleX: 1.5,
    scaleY: 1.5,
    easing: Konva.Easings.EaseInOut,
    onFinish: () => {
      // Chain: scale back with bounce
      const tween2 = new Konva.Tween({
        node: circle,
        duration: 1,
        scaleX: 1,
        scaleY: 1,
        easing: Konva.Easings.BounceEaseOut
      });
      tween2.play();
    }
  });
  tween.play();
  
  // Simultaneously: animate gradient colors
  let ratio = 0;
  const anim = new Konva.Animation((frame) => {
    ratio += frame.timeDiff / 1000;
    if (ratio > 1) ratio = 0;
    
    circle.fillLinearGradientColorStops([
      0, 'red',
      ratio, 'yellow',
      1, 'blue'
    ]);
  }, layer);
  
  anim.start();
  setTimeout(() => anim.stop(), 2000);
});
```

**Key Techniques:**
- Chain tweens using `onFinish` callback
- Combine tweens with animations
- Update complex properties manually in animation loop
- For advanced needs, consider GreenSock (GSAP) with Konva plugin

### Finish Event

Execute callback when tween completes:

```javascript
const tween = new Konva.Tween({
  node: rect,
  duration: 1,
  x: 400,
  rotation: 180,
  fill: 'blue',
  easing: Konva.Easings.EaseInOut,
  onFinish: function() {
    console.log('Tween finished!');
    
    // Chain another tween
    const tween2 = new Konva.Tween({
      node: rect,
      duration: 1,
      x: 100,
      rotation: 0,
      fill: 'red'
    });
    tween2.play();
  }
});

tween.play();
```

**React Example:**

```javascript
const handleAnimate = () => {
  const tween = new Konva.Tween({
    node: rectRef.current,
    duration: 1,
    x: 400,
    rotation: 180,
    fill: 'blue',
    onFinish: () => {
      console.log('Animation complete');
      setAnimationState('finished');
    }
  });
  
  tween.play();
};
```

---

## Selectors (Extended)

### Select by ID

Select shapes by unique `id` using `#` prefix:

```javascript
// Create shape with ID
const rect = new Konva.Rect({
  x: 100,
  y: 100,
  width: 50,
  height: 50,
  fill: 'red',
  id: 'myRect',
  draggable: true
});

// Find by ID (returns single node)
const rectangle = layer.findOne('#myRect');

// Animate it
rectangle.to({
  duration: 1,
  rotation: 360,
  fill: 'blue',
  easing: Konva.Easings.EaseInOut
});
```

**Key Methods:**
- `findOne('#id')` - Returns single node (faster for unique IDs)
- `find('#id')` - Returns array (even if only one result)

**React Example:**

```javascript
const layerRef = useRef(null);

const handleClick = () => {
  // Find by ID and animate
  const rectangle = layerRef.current.findOne('#myRect');
  rectangle.to({
    duration: 1,
    rotation: 360,
    fill: 'blue',
    easing: Konva.Easings.EaseInOut
  });
};

return (
  <>
    <button onClick={handleClick}>Activate Rectangle</button>
    <Stage>
      <Layer ref={layerRef}>
        <Rect
          x={100}
          y={100}
          width={50}
          height={50}
          fill="red"
          id="myRect"
          draggable
        />
      </Layer>
    </Stage>
  </>
);
```

**Selector Summary:**

```javascript
// By ID (unique)
layer.findOne('#myShape');

// By Name (can be multiple)
layer.find('.shapeName');

// By Type
layer.find('Circle');
layer.find('Rect');

// Combined (advanced)
layer.find('Circle.highlighted'); // Circles with name "highlighted"
```

---

## Additional Resources

- **Official Website:** https://konvajs.org
- **GitHub:** https://github.com/konvajs/konva
- **Demos:** https://konvajs.org/docs/demos/index.html
- **Community:** Stack Overflow, Discord
- **Commercial Products:** Design Editor SDK

---

*This documentation was extracted from konvajs.org and compiled for reference purposes.*
