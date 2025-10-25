# Konva.js Quick Reference

## Basic Setup

```javascript
const stage = new Konva.Stage({
  container: 'container-id',
  width: window.innerWidth,
  height: window.innerHeight
});

const layer = new Konva.Layer();
stage.add(layer);

const shape = new Konva.Circle({
  x: 100, y: 100, radius: 50, fill: 'red'
});

layer.add(shape);
layer.draw();
```

## Shapes

### Circle
```javascript
new Konva.Circle({
  x: 100, y: 100, radius: 50,
  fill: 'red', stroke: 'black', strokeWidth: 2
});
```

### Rectangle
```javascript
new Konva.Rect({
  x: 50, y: 50, width: 100, height: 60,
  fill: 'green', cornerRadius: 10
});
```

### Arc
```javascript
new Konva.Arc({
  x: 100, y: 100, innerRadius: 40,
  outerRadius: 70, angle: 60, fill: 'yellow'
});
```

### Line
```javascript
new Konva.Line({
  points: [50, 50, 150, 50, 150, 150],
  stroke: 'red', strokeWidth: 4,
  closed: true, tension: 0.5
});
```

### Text
```javascript
new Konva.Text({
  x: 50, y: 50, text: 'Hello',
  fontSize: 24, fontFamily: 'Arial', fill: 'blue'
});
```

## Methods

### Position & Transform
```javascript
shape.x(100);
shape.y(100);
shape.position({x: 100, y: 100});
shape.scaleX(2);
shape.scaleY(2);
shape.rotation(45);
```

### Styling
```javascript
shape.fill('red');
shape.stroke('black');
shape.strokeWidth(5);
shape.opacity(0.5);
shape.visible(false);
```

### Animation
```javascript
shape.to({
  x: 200,
  duration: 1,
  easing: Konva.Easings.EaseInOut,
  yoyo: true,
  repeat: Infinity
});
```

## Events

```javascript
shape.on('click', function(e) {
  console.log('Clicked!');
});

shape.on('mouseover', function() {
  document.body.style.cursor = 'pointer';
});

shape.on('dragstart', function() {
  console.log('Drag started');
});
```

## Filters

```javascript
image.filters([Konva.Filters.Blur]);
image.blurRadius(10);

image.filters([Konva.Filters.Grayscale]);
image.grayscaleEnabled(true);
```

## Performance

```javascript
// Cache complex shapes
complexShape.cache();

// Batch draw operations
layer.batchDraw();

// Disable hit detection
layer.listening(false);
```

## Common Patterns

### Draggable Shape
```javascript
const shape = new Konva.Circle({
  x: 100, y: 100, radius: 50,
  fill: 'red', draggable: true
});
```

### Transform Controls
```javascript
const tr = new Konva.Transformer({
  nodes: [shape]
});
layer.add(tr);
```

### Animation Loop
```javascript
const anim = new Konva.Animation(function(frame) {
  shape.rotation(frame.time * 0.1);
}, layer);
anim.start();
```

## Easing Functions

- `Konva.Easings.Linear`
- `Konva.Easings.EaseIn`
- `Konva.Easings.EaseOut`
- `Konva.Easings.EaseInOut`
- `Konva.Easings.Bounce`
- `Konva.Easings.Elastic`

## Layer Methods

```javascript
layer.add(shape);
layer.remove(shape);
layer.draw();
layer.batchDraw();
layer.clear();
```

## Stage Methods

```javascript
stage.add(layer);
stage.getPointerPosition();
stage.toDataURL();
stage.toJSON();
```

*For complete documentation, see konva-complete-guide.md*