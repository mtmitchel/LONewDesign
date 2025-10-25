# Konva.js API Reference

## Core Classes

### Konva.Stage

The stage is the root container for all layers and shapes.

#### Constructor

```javascript
const stage = new Konva.Stage({
  container: 'container-id',  // Required
  width: 800,                 // Required
  height: 600,                // Required
  x: 0,                       // Optional
  y: 0,                       // Optional
  scaleX: 1,                  // Optional
  scaleY: 1,                  // Optional
  rotation: 0,                // Optional
  visible: true,              // Optional
  listening: true             // Optional
});
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `container` | String | DOM element ID |
| `width` | Number | Stage width |
| `height` | Number | Stage height |
| `x` | Number | X position |
| `y` | Number | Y position |
| `scaleX` | Number | Horizontal scale |
| `scaleY` | Number | Vertical scale |
| `rotation` | Number | Rotation in degrees |
| `visible` | Boolean | Visibility |
| `listening` | Boolean | Hit detection |

#### Methods

```javascript
// Add layer
stage.add(layer);

// Remove layer
stage.remove(layer);

// Get mouse position
const pos = stage.getPointerPosition();

// Export as image
stage.toDataURL({
  mimeType: 'image/png',
  quality: 0.9,
  callback: function(dataUrl) {
    // Handle data URL
  }
});

// Serialize to JSON
const json = stage.toJSON();

// Create from JSON
const newStage = Konva.Node.create(json, 'container');

// Get stage size
const width = stage.width();
const height = stage.height();

// Set stage size
stage.width(800);
stage.height(600);

// Clear all layers
stage.clear();

// Destroy stage
stage.destroy();
```

### Konva.Layer

Layers are used to group shapes and can be thought of as transparent sheets.

#### Constructor

```javascript
const layer = new Konva.Layer({
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  visible: true,
  listening: true,
  clearBeforeDraw: true
});
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `x` | Number | X position |
| `y` | Number | Y position |
| `scaleX` | Number | Horizontal scale |
| `scaleY` | Number | Vertical scale |
| `rotation` | Number | Rotation in degrees |
| `visible` | Boolean | Visibility |
| `listening` | Boolean | Hit detection |
| `clearBeforeDraw` | Boolean | Clear before drawing |

#### Methods

```javascript
// Add shape
layer.add(shape);

// Remove shape
layer.remove(shape);

// Draw layer
layer.draw();

// Batch draw for performance
layer.batchDraw();

// Clear layer
layer.clear();

// Get all children
const children = layer.getChildren();

// Disable hit detection
layer.listening(false);

// Get specific shape by ID
const shape = layer.findOne('#shapeId');

// Get shapes by name
const shapes = layer.find('.shapeName');

// Get shapes by type
const circles = layer.find('Circle');
```

### Konva.Group

Groups are containers that can hold other shapes or groups.

#### Constructor

```javascript
const group = new Konva.Group({
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  visible: true,
  listening: true,
  draggable: false,
  clip: null,
  clipFunc: null
});
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `x` | Number | X position |
| `y` | Number | Y position |
| `scaleX` | Number | Horizontal scale |
| `scaleY` | Number | Vertical scale |
| `rotation` | Number | Rotation in degrees |
| `visible` | Boolean | Visibility |
| `listening` | Boolean | Hit detection |
| `draggable` | Boolean | Enable dragging |
| `clip` | Object | Clip rectangle |
| `clipFunc` | Function | Custom clip function |

#### Methods

```javascript
// Add shape to group
group.add(shape);

// Remove shape from group
group.remove(shape);

// Get all children
const children = group.getChildren();

// Set clip
group.clip({
  x: 50,
  y: 50,
  width: 200,
  height: 200
});

// Set custom clip function
group.clipFunc(function(ctx) {
  ctx.arc(0, 0, 100, 0, Math.PI * 2, false);
});
```

## Shapes

### Konva.Shape (Base Class)

All shapes inherit from the Shape class.

#### Common Properties

| Property | Type | Description |
|----------|------|-------------|
| `x` | Number | X position |
| `y` | Number | Y position |
| `scaleX` | Number | Horizontal scale |
| `scaleY` | Number | Vertical scale |
| `rotation` | Number | Rotation in degrees |
| `offsetX` | Number | X offset |
| `offsetY` | Number | Y offset |
| `visible` | Boolean | Visibility |
| `listening` | Boolean | Hit detection |
| `draggable` | Boolean | Enable dragging |
| `fill` | String | Fill color |
| `stroke` | String | Stroke color |
| `strokeWidth` | Number | Stroke width |
| `opacity` | Number | Opacity (0-1) |
| `shadowColor` | String | Shadow color |
| `shadowBlur` | Number | Shadow blur |
| `shadowOffset` | Object | Shadow offset |
| `shadowOpacity` | Number | Shadow opacity |

#### Common Methods

```javascript
// Position
shape.x(100);
shape.y(100);
shape.position({x: 100, y: 100});

// Transform
shape.scaleX(2);
shape.scaleY(2);
shape.rotation(45);
shape.offset({x: 25, y: 25});

// Styling
shape.fill('red');
shape.stroke('black');
shape.strokeWidth(5);
shape.opacity(0.5);

// Animation
shape.to({
  x: 200,
  duration: 1,
  easing: Konva.Easings.EaseInOut
});

shape.stop();
shape.cache();

// Events
shape.on('click', function(e) {
  // Handle click
});

shape.off('click');
shape.fire('customEvent', {data: 'value'});

// Attributes
shape.getAttr('fill');
shape.setAttr('fill', 'red');
shape.getAttrs();
shape.setAttrs({fill: 'red', stroke: 'black'});

// Utility
shape.clone();
shape.destroy();
shape.zIndex(5);
```

### Konva.Circle

#### Constructor

```javascript
const circle = new Konva.Circle({
  x: 0,
  y: 0,
  radius: 0,
  ... // Other shape properties
});
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `radius` | Number | Circle radius |

### Konva.Rect

#### Constructor

```javascript
const rect = new Konva.Rect({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  cornerRadius: 0,
  ... // Other shape properties
});
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `width` | Number | Rectangle width |
| `height` | Number | Rectangle height |
| `cornerRadius` | Number | Corner radius |

### Konva.Arc

#### Constructor

```javascript
const arc = new Konva.Arc({
  x: 0,
  y: 0,
  innerRadius: 0,
  outerRadius: 0,
  angle: 0,
  ... // Other shape properties
});
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `innerRadius` | Number | Inner radius |
| `outerRadius` | Number | Outer radius |
| `angle` | Number | Angle in degrees |

### Konva.Arrow

#### Constructor

```javascript
const arrow = new Konva.Arrow({
  points: [],
  pointerLength: 0,
  pointerWidth: 0,
  ... // Other shape properties
});
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `points` | Array | Array of x,y coordinates |
| `pointerLength` | Number | Pointer length |
| `pointerWidth` | Number | Pointer width |

### Konva.Line

#### Constructor

```javascript
const line = new Konva.Line({
  points: [],
  closed: false,
  tension: 0,
  ... // Other shape properties
});
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `points` | Array | Array of x,y coordinates |
| `closed` | Boolean | Close the path |
| `tension` | Number | Tension for curves |
| `lineCap` | String | Line cap style |
| `lineJoin` | String | Line join style |

### Konva.Text

#### Constructor

```javascript
const text = new Konva.Text({
  text: '',
  fontSize: 12,
  fontFamily: 'Arial',
  fontStyle: 'normal',
  fontVariant: 'normal',
  align: 'left',
  verticalAlign: 'top',
  padding: 0,
  lineHeight: 1,
  wrap: 'word',
  ellipsis: false,
  ... // Other shape properties
});
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `text` | String | Text content |
| `fontSize` | Number | Font size |
| `fontFamily` | String | Font family |
| `fontStyle` | String | Font style |
| `fontVariant` | String | Font variant |
| `align` | String | Text alignment |
| `verticalAlign` | String | Vertical alignment |
| `padding` | Number | Padding |
| `lineHeight` | Number | Line height |
| `wrap` | String | Wrapping mode |
| `ellipsis` | Boolean | Show ellipsis |

### Konva.Image

#### Constructor

```javascript
const image = new Konva.Image({
  image: null,
  crop: null,
  ... // Other shape properties
});
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `image` | Image | Image object |
| `crop` | Object | Crop rectangle |

#### Static Methods

```javascript
// Load image from URL
Konva.Image.fromURL('image.png', function(image) {
  // Image loaded
});
```

### Konva.Ellipse

#### Constructor

```javascript
const ellipse = new Konva.Ellipse({
  x: 0,
  y: 0,
  radiusX: 0,
  radiusY: 0,
  ... // Other shape properties
});
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `radiusX` | Number | Horizontal radius |
| `radiusY` | Number | Vertical radius |

## Animation

### Konva.Tween

#### Constructor

```javascript
const tween = new Konva.Tween({
  node: shape,
  duration: 1,
  easing: Konva.Easings.Linear,
  yoyo: false,
  repeat: 0,
  onFinish: function() {
    // Animation finished
  }
});
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `node` | Node | Target node |
| `duration` | Number | Duration in seconds |
| `easing` | Function | Easing function |
| `yoyo` | Boolean | Yoyo animation |
| `repeat` | Number | Repeat count |
| `onFinish` | Function | Finish callback |

#### Methods

```javascript
tween.play();
tween.pause();
tween.reverse();
tween.reset();
tween.finish();
tween.destroy();
```

### Konva.Animation

#### Constructor

```javascript
const anim = new Konva.Animation(function(frame) {
  // Animation function
}, layer);
```

#### Methods

```javascript
anim.start();
anim.stop();
anim.isRunning();
```

### Frame Object

The frame object passed to animation functions contains:

| Property | Type | Description |
|----------|------|-------------|
| `time` | Number | Current time in ms |
| `timeDiff` | Number | Time difference from last frame |
| `frameRate` | Number | Current frame rate |

## Events

### Event Types

**Mouse Events:**
- `click`
- `dblclick`
- `mousedown`
- `mouseup`
- `mouseover`
- `mouseout`
- `mousemove`
- `contextmenu`

**Touch Events:**
- `touchstart`
- `touchmove`
- `touchend`
- `tap`
- `dbltap`
- `dragstart`
- `dragmove`
- `dragend`
- `dragenter`
- `dragleave`
- `drop`

**Keyboard Events:**
- `keydown`
- `keyup`

### Event Object

| Property | Type | Description |
|----------|------|-------------|
| `type` | String | Event type |
| `target` | Node | Target node |
| `currentTarget` | Node | Current target |
| `evt` | Event | Original DOM event |

## Filters

### Built-in Filters

- `Konva.Filters.Blur`
- `Konva.Filters.Brighten`
- `Konva.Filters.Contrast`
- `Konva.Filters.Emboss`
- `Konva.Filters.Enhance`
- `Konva.Filters.Grayscale`
- `Konva.Filters.HSL`
- `Konva.Filters.HSV`
- `Konva.Filters.Invert`
- `Konva.Filters.Kaleidoscope`
- `Konva.Filters.Mask`
- `Konva.Filters.Noise`
- `Konva.Filters.Pixelate`
- `Konva.Filters.Posterize`
- `Konva.Filters.RGB`
- `Konva.Filters.RGBA`
- `Konva.Filters.Sepia`
- `Konva.Filters.Solarize`
- `Konva.Filters.Threshold`

### Filter Properties

**Blur:**
- `blurRadius` - Blur radius
- `blurEnabled` - Enable blur

**Grayscale:**
- `grayscaleEnabled` - Enable grayscale

**Invert:**
- `invertEnabled` - Enable invert

**Sepia:**
- `sepiaEnabled` - Enable sepia

**Brightness:**
- `brightness` - Brightness value

**Contrast:**
- `contrast` - Contrast value

## Transform

### Konva.Transformer

#### Constructor

```javascript
const transformer = new Konva.Transformer({
  nodes: [shape],
  enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
  rotateEnabled: true,
  resizeEnabled: true,
  borderEnabled: true,
  anchorSize: 10,
  anchorStroke: 'rgb(0, 161, 255)',
  anchorStrokeWidth: 1,
  anchorFill: 'white',
  borderStroke: 'rgb(0, 161, 255)',
  borderStrokeWidth: 1,
  borderDash: [],
  boundBoxFunc: function(oldBoundBox, newBoundBox) {
    return newBoundBox;
  }
});
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `nodes` | Array | Array of nodes to transform |
| `enabledAnchors` | Array | Which anchors to show |
| `rotateEnabled` | Boolean | Enable rotation |
| `resizeEnabled` | Boolean | Enable resizing |
| `borderEnabled` | Boolean | Show border |
| `anchorSize` | Number | Anchor size |

#### Methods

```javascript
transformer.nodes([shape1, shape2]);
transformer.attachTo(shape);
transformer.detach();
transformer.getActiveAnchor();
transformer.stopTransform();
```

## Utility

### Konva.Util

```javascript
// Get random color
const color = Konva.Util.getRandomColor();

// RGB to hex
const hex = Konva.Util.rgbToHex(255, 0, 0);

// Hex to RGB
const rgb = Konva.Util.hexToRgb('#ff0000');

// Get angle
const angle = Konva.Util.getAngle({x: 1, y: 0});

// Degrees to radians
const rad = Konva.Util.degToRad(90);

// Radians to degrees
const deg = Konva.Util.radToDeg(Math.PI / 2);
```

### Konva.Filters

Filter functions for image processing.

---

*This API reference covers the main classes and methods of Konva.js. For complete documentation, refer to the official Konva.js documentation.*