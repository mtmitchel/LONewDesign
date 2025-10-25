# Konva.js Examples Collection

## Table of Contents

1. [Basic Shapes](#basic-shapes)
2. [Animation Examples](#animation-examples)
3. [Event Handling](#event-handling)
4. [Advanced Examples](#advanced-examples)

---

## Basic Shapes

### Interactive Circle

```javascript
const circle = new Konva.Circle({
  x: stage.width() / 2,
  y: stage.height() / 2,
  radius: 50,
  fill: 'red',
  draggable: true
});

circle.on('mouseover', function() {
  this.fill('blue');
  layer.draw();
});

circle.on('mouseout', function() {
  this.fill('red');
  layer.draw();
});

layer.add(circle);
```

### Draggable Rectangle with Transform

```javascript
const rect = new Konva.Rect({
  x: 150,
  y: 120,
  width: 100,
  height: 60,
  fill: 'green',
  stroke: 'black',
  strokeWidth: 2,
  draggable: true,
  cornerRadius: 10
});

const tr = new Konva.Transformer({
  nodes: [rect]
});

layer.add(rect, tr);
```

### Animated Arc

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

const arcTween = new Konva.Tween({
  node: arc,
  duration: 3,
  angle: 360,
  easing: Konva.Easings.EaseInOut,
  yoyo: true,
  repeat: Infinity
});

arcTween.play();
layer.add(arc);
```

### Dynamic Line with Tension

```javascript
const line = new Konva.Line({
  points: [50, 50, 150, 50, 150, 150, 50, 150],
  stroke: 'red',
  strokeWidth: 4,
  closed: true,
  tension: 0.5
});

line.to({
  tension: 1,
  duration: 2,
  easing: Konva.Easings.EaseInOut,
  yoyo: true,
  repeat: Infinity
});

layer.add(line);
```

### Color Cycling Text

```javascript
const text = new Konva.Text({
  x: stage.width() / 2,
  y: stage.height() / 2,
  text: 'Hello Konva!',
  fontSize: 32,
  fontFamily: 'Arial',
  fill: 'red',
  align: 'center'
});

text.offsetX(text.width() / 2);
text.offsetY(text.height() / 2);

let hue = 0;
const textAnim = new Konva.Animation(function(frame) {
  hue = (hue + 1) % 360;
  text.fill('hsl(' + hue + ', 100%, 50%)');
}, layer);

textAnim.play();
layer.add(text);
```

---

## Animation Examples

### Bouncing Ball

```javascript
const ball = new Konva.Circle({
  x: 50,
  y: 150,
  radius: 20,
  fill: 'red'
});

let velocity = 200;
const bounceAnim = new Konva.Animation(function(frame) {
  ball.x(ball.x() + (velocity * frame.timeDiff) / 1000);
  
  if (ball.x() > stage.width() - ball.radius()) {
    ball.x(stage.width() - ball.radius());
    velocity = -velocity;
  } else if (ball.x() < ball.radius()) {
    ball.x(ball.radius());
    velocity = -velocity;
  }
}, layer);

bounceAnim.start();
layer.add(ball);
```

### Rotating Star

```javascript
const star = new Konva.Star({
  x: stage.width() / 2,
  y: stage.height() / 2,
  numPoints: 5,
  innerRadius: 30,
  outerRadius: 50,
  fill: 'yellow',
  stroke: 'black',
  strokeWidth: 2
});

const rotateAnim = new Konva.Animation(function(frame) {
  star.rotation(frame.time * 0.1);
}, layer);

rotateAnim.start();
layer.add(star);
```

### Pulsing Ellipse

```javascript
const ellipse = new Konva.Ellipse({
  x: stage.width() / 2,
  y: stage.height() / 2,
  radiusX: 80,
  radiusY: 40,
  fill: 'purple',
  stroke: 'white',
  strokeWidth: 3
});

ellipse.to({
  scaleX: 1.3,
  scaleY: 1.3,
  duration: 1.5,
  easing: Konva.Easings.EaseInOut,
  yoyo: true,
  repeat: Infinity
});

layer.add(ellipse);
```

### Group Rotation

```javascript
const group = new Konva.Group({
  x: 200,
  y: 150,
  draggable: true
});

const circle1 = new Konva.Circle({
  x: -40,
  y: 0,
  radius: 25,
  fill: 'red'
});

const circle2 = new Konva.Circle({
  x: 40,
  y: 0,
  radius: 25,
  fill: 'blue'
});

group.add(circle1, circle2);
group.to({
  rotation: 360,
  duration: 4,
  easing: Konva.Easings.EaseInOut,
  repeat: Infinity
});

layer.add(group);
```

---

## Event Handling

### Click Counter

```javascript
let clickCount = 0;
const clickRect = new Konva.Rect({
  x: 150,
  y: 125,
  width: 100,
  height: 50,
  fill: 'blue',
  stroke: 'black',
  strokeWidth: 2
});

clickRect.on('click', function() {
  clickCount++;
  console.log('Clicks: ' + clickCount);
  this.fill(Konva.Util.getRandomColor());
  layer.draw();
});

layer.add(clickRect);
```

### Mouse Trail

```javascript
stage.on('mousemove', function(e) {
  const pos = stage.getPointerPosition();
  const trailCircle = new Konva.Circle({
    x: pos.x,
    y: pos.y,
    radius: 5,
    fill: 'rgba(255, 0, 0, 0.5)'
  });
  
  layer.add(trailCircle);
  
  trailCircle.to({
    opacity: 0,
    duration: 1,
    onFinish: function() {
      trailCircle.destroy();
    }
  });
});
```

### Touch Events

```javascript
const touchRect = new Konva.Rect({
  x: 100,
  y: 100,
  width: 150,
  height: 100,
  fill: 'green',
  draggable: true
});

touchRect.on('tap', function() {
  console.log('Tapped!');
  this.fill('orange');
  layer.draw();
});

touchRect.on('dbltap', function() {
  console.log('Double tapped!');
  this.fill('red');
  layer.draw();
});

layer.add(touchRect);
```

---

## Advanced Examples

### Clipping Region

```javascript
const clipGroup = new Konva.Group({
  x: 100,
  y: 50,
  clip: {
    x: 0,
    y: 0,
    width: 200,
    height: 200
  }
});

const clipCircle = new Konva.Circle({
  x: 100,
  y: 100,
  radius: 80,
  fill: 'blue'
});

clipGroup.add(clipCircle);
layer.add(clipGroup);
```

### Custom Clip Function

```javascript
const clipGroup2 = new Konva.Group({
  x: 350,
  y: 50,
  clipFunc: function(ctx) {
    ctx.arc(0, 0, 100, 0, Math.PI * 2, false);
  }
});

const clipRect = new Konva.Rect({
  x: -100,
  y: -100,
  width: 200,
  height: 200,
  fill: 'green'
});

clipGroup2.add(clipRect);
layer.add(clipGroup2);
```

### Image Filters

```javascript
// Note: In a real implementation, you would load an actual image
const imageRect = new Konva.Rect({
  x: 100,
  y: 75,
  width: 200,
  height: 150,
  fill: 'lightblue',
  stroke: 'black',
  strokeWidth: 2
});

// Simulate filter application
let filterApplied = false;

function toggleFilter() {
  if (filterApplied) {
    imageRect.fill('lightblue');
    filterApplied = false;
  } else {
    imageRect.fill('rgba(100, 100, 100, 0.5)');
    filterApplied = true;
  }
  layer.draw();
}

layer.add(imageRect);
```

### Complex Animation

```javascript
const complexGroup = new Konva.Group({
  x: 300,
  y: 200
});

const centerCircle = new Konva.Circle({
  x: 0,
  y: 0,
  radius: 30,
  fill: 'red'
});

const orbitingCircle = new Konva.Circle({
  x: 80,
  y: 0,
  radius: 15,
  fill: 'blue'
});

complexGroup.add(centerCircle, orbitingCircle);

// Multiple animations
complexGroup.to({
  rotation: 360,
  duration: 4,
  repeat: Infinity
});

orbitingCircle.to({
  x: -80,
  duration: 2,
  yoyo: true,
  repeat: Infinity,
  easing: Konva.Easings.Sinusoidal
});

layer.add(complexGroup);
```

### Responsive Design

```javascript
function fitStageIntoParentContainer() {
  const container = document.querySelector('#stage-parent');
  
  // now we need to fit stage into parent
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;
  
  // but we also need to scale the stage to fit the container
  const scale = containerWidth / stage.width();
  
  stage.width(containerWidth);
  stage.height(containerHeight);
  stage.scale({ x: scale, y: scale });
  stage.draw();
}

window.addEventListener('resize', fitStageIntoParentContainer);
```

### Serialization Example

```javascript
// Save stage to JSON
function saveStage() {
  const json = stage.toJSON();
  localStorage.setItem('konva-stage', json);
  console.log('Stage saved');
}

// Load stage from JSON
function loadStage() {
  const json = localStorage.getItem('konva-stage');
  if (json) {
    const newStage = Konva.Node.create(json, 'container');
    console.log('Stage loaded');
    return newStage;
  }
}

// Export as image
function exportImage() {
  stage.toDataURL({
    mimeType: 'image/png',
    quality: 0.9,
    callback: function(dataUrl) {
      // dataUrl contains the base64 encoded image
      const link = document.createElement('a');
      link.download = 'stage.png';
      link.href = dataUrl;
      link.click();
    }
  });
}
```

---

## Tips and Best Practices

### Performance Optimization

1. **Cache complex shapes:**
   ```javascript
   complexShape.cache();
   ```

2. **Batch draw operations:**
   ```javascript
   layer.batchDraw();
   ```

3. **Disable hit detection when not needed:**
   ```javascript
   layer.listening(false);
   ```

4. **Use layers effectively:**
   ```javascript
   // Group static content together
   const staticLayer = new Konva.Layer();
   const dynamicLayer = new Konva.Layer();
   ```

### Common Patterns

1. **Draggable with bounds:**
   ```javascript
   shape.dragBoundFunc(function(pos) {
     return {
       x: Math.max(0, Math.min(stage.width() - this.width(), pos.x)),
       y: Math.max(0, Math.min(stage.height() - this.height(), pos.y))
     };
   });
   ```

2. **Animating multiple properties:**
   ```javascript
   shape.to({
     x: 200,
     y: 200,
     rotation: 180,
     scaleX: 2,
     scaleY: 2,
     duration: 1
   });
   ```

3. **Event delegation:**
   ```javascript
   layer.on('click', function(e) {
     if (e.target.name() === 'button') {
       console.log('Button clicked');
     }
   });
   ```

### Debugging Tips

1. **Check if shape is visible:**
   ```javascript
   console.log('Visible:', shape.visible());
   console.log('Opacity:', shape.opacity());
   console.log('Position:', shape.position());
   ```

2. **Debug drawing issues:**
   ```javascript
   console.log('Layer children:', layer.getChildren());
   console.log('Layer visible:', layer.visible());
   ```

3. **Performance monitoring:**
   ```javascript
   const anim = new Konva.Animation(function(frame) {
     console.log('Frame rate:', frame.frameRate);
     console.log('Time diff:', frame.timeDiff);
   }, layer);
   ```

---

*These examples demonstrate the key features and patterns of Konva.js. Experiment with them and combine different techniques to create amazing interactive canvas applications!*