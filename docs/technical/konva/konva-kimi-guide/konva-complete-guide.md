# Complete Konva.js Documentation Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Core Concepts](#core-concepts)
4. [Shapes](#shapes)
5. [Styling](#styling)
6. [Events](#events)
7. [Animation](#animation)
8. [Drag and Drop](#drag-and-drop)
9. [Transform](#transform)
10. [Filters](#filters)
11. [Performance](#performance)
12. [Advanced Topics](#advanced-topics)
13. [Quick Reference](#quick-reference)

---

## Introduction

Konva is an HTML5 Canvas JavaScript framework that extends the 2d context by enabling canvas interactivity for desktop and mobile applications.

### What is Konva?

Konva enables high performance animations, transitions, node nesting, layering, filtering, caching, event handling for desktop and mobile applications, and much more. You can draw things onto the stage, add event listeners to them, move them, scale them, and rotate them independently from other shapes to support high performance animations, even if your application uses thousands of shapes.

### Installation

```bash
# Using npm
npm install konva

# Using CDN
<script src="https://unpkg.com/konva@10/konva.min.js"></script>
```

---

## Getting Started

### Basic Setup

```javascript
// Create stage
const stage = new Konva.Stage({
  container: 'container-id',  // DOM element ID
  width: window.innerWidth,
  height: window.innerHeight
});

// Create layer
const layer = new Konva.Layer();
stage.add(layer);

// Create shape
const circle = new Konva.Circle({
  x: 100,
  y: 100,
  radius: 50,
  fill: 'red'
});

// Add shape to layer
layer.add(circle);
layer.draw();
```

---

## Core Concepts

### Stage
The Stage is the container for all layers and shapes in Konva.

```javascript
const stage = new Konva.Stage({
  container: 'container', // id of container <div>
  width: window.innerWidth,
  height: window.innerHeight
});
```

**Key Properties:**
- `container` - DOM container ID
- `width`, `height` - Stage dimensions
- `scaleX`, `scaleY` - Scaling

### Layer
Layers are used to group shapes and can be thought of as transparent sheets.

```javascript
const layer = new Konva.Layer();
stage.add(layer);

// Add shapes to layer
const circle = new Konva.Circle({...});
layer.add(circle);
```

**Key Properties:**
- `x`, `y` - Layer position
- `scaleX`, `scaleY` - Layer scaling
- `rotation` - Layer rotation

### Group
Groups are containers that can hold other shapes or groups.

```javascript
const group = new Konva.Group({
  x: 100,
  y: 100,
  draggable: true
});

// Add shapes to group
const circle = new Konva.Circle({...});
group.add(circle);
layer.add(group);
```

**Key Properties:**
- `x`, `y` - Group position
- `scaleX`, `scaleY` - Group scaling
- `rotation` - Group rotation
- `draggable` - Enable dragging

---

## Shapes

### Circle

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

**Properties:**
- `x`, `y` - Position coordinates
- `radius` - Circle radius
- `fill` - Fill color
- `stroke` - Stroke color
- `strokeWidth` - Stroke thickness

### Rectangle

```javascript
const rect = new Konva.Rect({
  x: 50,
  y: 50,
  width: 100,
  height: 50,
  fill: 'green',
  stroke: 'black',
  strokeWidth: 4,
  cornerRadius: 10
});
```

**Properties:**
- `width`, `height` - Rectangle dimensions
- `cornerRadius` - Rounded corners
- `fill` - Fill color
- `strokeWidth` - Stroke thickness

### Arc

```javascript
const arc = new Konva.Arc({
  x: stage.width() / 2,
  y: stage.height() / 2,
  innerRadius: 40,
  outerRadius: 70,
  angle: 60,
  fill: 'yellow',
  stroke: 'black',
  strokeWidth: 4
});
```

**Properties:**
- `innerRadius` - Inner radius of arc
- `outerRadius` - Outer radius of arc
- `angle` - Angle of arc in degrees
- `fill` - Fill color
- `stroke` - Stroke color

### Arrow

```javascript
const arrow = new Konva.Arrow({
  points: [50, 60, 150, 60],
  pointerLength: 10,
  pointerWidth: 10,
  fill: 'red',
  stroke: 'black',
  strokeWidth: 4
});
```

**Properties:**
- `points` - Array of x,y coordinates
- `pointerLength` - Length of arrow pointer
- `pointerWidth` - Width of arrow pointer
- `fill` - Fill color
- `stroke` - Stroke color

### Line

```javascript
const line = new Konva.Line({
  points: [50, 50, 150, 50, 150, 150, 50, 150],
  stroke: 'red',
  strokeWidth: 4,
  closed: true,
  tension: 0.5
});
```

**Properties:**
- `points` - Array of x,y coordinates
- `stroke` - Line color
- `strokeWidth` - Line thickness
- `closed` - Close the path
- `tension` - Create smooth curves
- `lineCap` - Line cap style
- `lineJoin` - Line join style

### Text

```javascript
const text = new Konva.Text({
  x: 50,
  y: 50,
  text: 'Hello Konva!',
  fontSize: 24,
  fontFamily: 'Arial',
  fill: 'blue',
  align: 'center'
});
```

**Properties:**
- `text` - Text content
- `fontSize` - Font size
- `fontFamily` - Font family
- `fill` - Text color
- `align` - Text alignment
- `verticalAlign` - Vertical alignment

### Image

```javascript
Konva.Image.fromURL('image.png', function(image) {
  image.setAttrs({
    x: 50,
    y: 50,
    width: 100,
    height: 100
  });
  layer.add(image);
});
```

**Properties:**
- `image` - Image object
- `width`, `height` - Display dimensions
- `crop` - Crop dimensions
- `filters` - Applied filters

### Ellipse

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

**Properties:**
- `x`, `y` - Position coordinates
- `radiusX` - Horizontal radius
- `radiusY` - Vertical radius
- `fill` - Fill color
- `stroke` - Stroke color

---

## Styling

### Fill

```javascript
// Solid fill
shape.fill('red');

// Pattern fill  
shape.fillPatternImage(imageObj);

// Gradient fill
shape.fillLinearGradientColorStops([0, 'red', 1, 'yellow']);
shape.fillLinearGradientStartPoint({x: -50, y: -50});
shape.fillLinearGradientEndPoint({x: 50, y: 50});
```

### Stroke

```javascript
shape.stroke('blue');
shape.strokeWidth(5);
shape.strokeScaleEnabled(false); // Don't scale stroke with shape
```

### Opacity and Shadow

```javascript
shape.opacity(0.5);
shape.shadowColor('black');
shape.shadowBlur(10);
shape.shadowOffset({x: 5, y: 5});
shape.shadowOpacity(0.5);
```

---

## Events

### Event Types

**Mouse Events:**
- `click` - Mouse click
- `dblclick` - Double click
- `mousedown` - Mouse button down
- `mouseup` - Mouse button up
- `mouseover` - Mouse enters shape
- `mouseout` - Mouse leaves shape
- `mousemove` - Mouse moves
- `contextmenu` - Right click

**Touch Events:**
- `touchstart` - Touch starts
- `touchmove` - Touch moves
- `touchend` - Touch ends
- `tap` - Single tap
- `dbltap` - Double tap
- `dragstart` - Drag starts
- `dragmove` - Dragging
- `dragend` - Drag ends

### Event Handling

```javascript
// Basic event handling
shape.on('click', function(evt) {
  console.log('Circle clicked!');
  circle.fill('red');
  layer.draw();
});

// Multiple events
shape.on('mouseover', function() {
  document.body.style.cursor = 'pointer';
});

shape.on('mouseout', function() {
  document.body.style.cursor = 'default';
});

// Remove event listener
shape.off('click');

// Fire custom event
shape.fire('customEvent', { data: 'value' });
```

**Event Object Properties:**
- `target` - The node that triggered the event
- `currentTarget` - The node that the listener is attached to
- `evt.evt` - The original DOM event

---

## Animation

### Tween Animation

```javascript
const tween = new Konva.Tween({
  node: circle,
  duration: 1,
  x: 200,
  y: 200,
  easing: Konva.Easings.EaseInOut
});
tween.play();
```

**Tween Options:**
- `node` - Target node
- `duration` - Animation duration in seconds
- `easing` - Easing function
- `yoyo` - Yoyo animation (true/false)
- `repeat` - Number of repeats
- `onFinish` - Callback when animation completes

### Frame-based Animation

```javascript
const anim = new Konva.Animation(function(frame) {
  // frame.time is the current time in ms
  // frame.timeDiff is the time difference from the last frame
  // frame.frameRate is the current frame rate
  
  shape.x(Math.sin(frame.time / 1000) * 100);
}, layer);

anim.start();
```

### Easing Functions

- `Konva.Easings.Linear` - Linear
- `Konva.Easings.EaseIn` - Ease In
- `Konva.Easings.EaseOut` - Ease Out
- `Konva.Easings.EaseInOut` - Ease In Out
- `Konva.Easings.Bounce` - Bounce
- `Konva.Easings.Elastic` - Elastic
- `Konva.Easings.Back` - Back
- `Konva.Easings.Strong` - Strong

---

## Drag and Drop

### Basic Drag and Drop

```javascript
// Simple draggable shape
const circle = new Konva.Circle({
  x: 100,
  y: 100,
  radius: 50,
  fill: 'green',
  draggable: true
});

// Custom drag bounds
rect.dragBoundFunc(function(pos) {
  return {
    x: Math.max(0, Math.min(stage.width() - this.width(), pos.x)),
    y: Math.max(0, Math.min(stage.height() - this.height(), pos.y))
  };
});
```

**Drag Properties:**
- `draggable` - Enable dragging (true/false)
- `dragDistance` - Minimum drag distance
- `dragBoundFunc` - Function to constrain dragging

### Drag Events

```javascript
shape.on('dragstart', function() {
  console.log('Drag started');
});

shape.on('dragmove', function() {
  console.log('Dragging');
});

shape.on('dragend', function() {
  console.log('Drag ended');
});
```

---

## Transform

### Transformer

```javascript
const transformer = new Konva.Transformer({
  nodes: [shape],
  enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
  rotateEnabled: true,
  resizeEnabled: true,
  borderEnabled: true,
  anchorSize: 10
});
layer.add(transformer);
```

**Transformer Options:**
- `nodes` - Array of nodes to transform
- `enabledAnchors` - Which anchors to show
- `rotateEnabled` - Enable rotation
- `resizeEnabled` - Enable resizing
- `borderEnabled` - Show border
- `anchorSize` - Size of control anchors

### Transform Events

```javascript
transformer.on('transformstart', function() {
  console.log('Transform started');
});

transformer.on('transform', function() {
  console.log('Transforming');
});

transformer.on('transformend', function() {
  console.log('Transform ended');
});
```

---

## Filters

### Applying Filters

```javascript
// Apply blur filter
image.filters([Konva.Filters.Blur]);
image.blurRadius(10);

// Enable/disable blur
image.blurEnabled(true);

// Multiple filters
image.filters([
  Konva.Filters.Blur,
  Konva.Filters.Grayscale
]);
```

### Available Filters

**Blur:**
```javascript
image.filters([Konva.Filters.Blur]);
image.blurRadius(10);
```

**Grayscale:**
```javascript
image.filters([Konva.Filters.Grayscale]);
image.grayscaleEnabled(true);
```

**Invert:**
```javascript
image.filters([Konva.Filters.Invert]);
image.invertEnabled(true);
```

**Sepia:**
```javascript
image.filters([Konva.Filters.Sepia]);
image.sepiaEnabled(true);
```

**Brightness:**
```javascript
image.filters([Konva.Filters.Brighten]);
image.brightness(0.5);
```

**Contrast:**
```javascript
image.filters([Konva.Filters.Contrast]);
image.contrast(0.5);
```

---

## Performance

### Shape Caching

```javascript
// Cache complex shapes
complexShape.cache();

// Cache with options
shape.cache({
  x: -50,
  y: -50,
  width: 100,
  height: 100,
  offset: 10
});

// Clear cache when needed
complexShape.clearCache();
```

### Layer Management

```javascript
// Disable hit detection for better performance
layer.listening(false);

// Don't clear canvas before drawing (if you handle it yourself)
layer.clearBeforeDraw(false);

// Batch draw operations
layer.batchDraw();
```

### Best Practices

**Do:**
- Cache complex shapes
- Batch draw operations
- Disable hit detection when not needed
- Use layers effectively
- Group static content together

**Don't:**
- Redraw everything - only redraw changed layers
- Use too many layers
- Cache everything - only cache complex shapes
- Create too many individual shapes

---

## Advanced Topics

### Clipping

```javascript
// Clip to rectangular region
group.clip({
  x: 50,
  y: 50,
  width: 200,
  height: 200
});

// Custom clip function
group.clipFunc(function(ctx) {
  ctx.arc(0, 0, 100, 0, Math.PI * 2, false);
});
```

### Serialization

```javascript
// Save stage to JSON
const json = stage.toJSON();

// Load from JSON
const stage = Konva.Node.create(json, 'container');

// Export as image
stage.toDataURL({
  mimeType: 'image/png',
  quality: 0.9,
  callback: function(dataUrl) {
    // Use dataUrl
  }
});
```

### Data URL

```javascript
stage.toDataURL({
  mimeType: 'image/png',
  quality: 0.9,
  pixelRatio: 2, // For high DPI displays
  callback: function(dataUrl) {
    // dataUrl contains the base64 encoded image
  }
});
```

---

## Quick Reference

### Common Methods

**Position & Transform:**
- `shape.x(100)` - Set x position
- `shape.y(100)` - Set y position
- `shape.position({x: 100, y: 100})` - Set both positions
- `shape.scaleX(2)` - Scale horizontally
- `shape.scaleY(2)` - Scale vertically
- `shape.rotation(45)` - Rotate 45 degrees
- `shape.offset({x: 25, y: 25})` - Set rotation offset

**Styling:**
- `shape.fill('red')` - Set fill color
- `shape.stroke('black')` - Set stroke color
- `shape.strokeWidth(5)` - Set stroke width
- `shape.opacity(0.5)` - Set opacity (0-1)
- `shape.visible(false)` - Hide shape
- `shape.shadowColor('black')` - Set shadow color
- `shape.shadowBlur(10)` - Set shadow blur

**Animation:**
- `shape.to({x: 200})` - Animate to new state
- `shape.to({duration: 1})` - Set animation duration
- `shape.to({easing: Konva.Easings.EaseIn})` - Set easing function
- `shape.to({yoyo: true})` - Yoyo animation
- `shape.to({repeat: 2})` - Repeat animation
- `shape.stop()` - Stop current animation
- `shape.cache()` - Cache for performance

**Layer Methods:**
- `layer.add(shape)` - Add shape to layer
- `layer.remove(shape)` - Remove shape from layer
- `layer.draw()` - Redraw layer
- `layer.batchDraw()` - Batch draw for performance
- `layer.clear()` - Clear layer content
- `layer.listening(false)` - Disable hit detection
- `layer.getChildren()` - Get all children

**Stage Methods:**
- `stage.add(layer)` - Add layer to stage
- `stage.getPointerPosition()` - Get mouse position
- `stage.toDataURL()` - Export as image
- `stage.toJSON()` - Serialize to JSON
- `Konva.Node.create(json)` - Create from JSON
- `stage.width(800)` - Set stage width
- `stage.height(600)` - Set stage height

**Utility Methods:**
- `shape.getAttr('fill')` - Get attribute value
- `shape.setAttr('fill', 'red')` - Set attribute value
- `shape.getAttrs()` - Get all attributes
- `shape.setAttrs({...})` - Set multiple attributes
- `shape.clone()` - Clone shape
- `shape.destroy()` - Remove and destroy
- `shape.zIndex(5)` - Set z-index

### Event Handling

```javascript
// Add event listener
shape.on('click', function(e) {
  console.log('Clicked!');
});

// Remove event listener
shape.off('click');

// Fire custom event
shape.fire('customEvent', { data: 'value' });
```

### Performance Tips

**Optimization Techniques:**
- Cache complex shapes: `complexShape.cache()`
- Batch draw operations: `layer.batchDraw()`
- Disable hit detection: `layer.listening(false)`
- Use layers effectively
- Group static content together

**Things to Avoid:**
- Don't redraw everything - only redraw changed layers
- Avoid too many layers
- Don't cache everything - only cache complex shapes
- Minimize shape count - use groups for complex objects

---

## Resources

- [Official Konva.js Documentation](https://konvajs.org/docs/)
- [API Reference](https://konvajs.org/api/)
- [Examples and Demos](https://konvajs.org/docs/demos/)
- [GitHub Repository](https://github.com/konvajs/konva)

---

*This guide covers all major aspects of Konva.js. For the most up-to-date information, always refer to the official documentation.*