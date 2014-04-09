(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

var Nodes = {

  // Settings
  density: 15,
  
  drawDistance: 30,
  baseRadius: 2.8,
  maxLineThickness: 1,
  reactionSensitivity: 0.8,
  lineThickness: 1,

  points: [],
  mouse: { x: -1000, y: -1000, down: false },

  animation: null,

  canvas: null,
  context: null,

  imageInput: null,
  bgImage: null,
  bgCanvas: null,
  bgContext: null,
  bgContextPixelData: null,

  init: function() {
    // Set up the visual canvas 
    this.canvas = document.getElementById( 'canvas' );
    this.context = canvas.getContext( '2d' );
    this.context.globalCompositeOperation = "lighter";
    this.canvas.width = 350;
    this.canvas.height = 570;
    this.canvas.style.display = 'block'
    this.canvas.style.margin = 'auto'

    this.imageInput = document.createElement( 'input' );
    this.imageInput.setAttribute( 'type', 'file' );
    this.imageInput.style.visibility = 'hidden';
    this.imageInput.addEventListener('change', this.upload, false);
    document.body.appendChild( this.imageInput );

    this.canvas.addEventListener('mousemove', this.mouseMove, false);
    this.canvas.addEventListener('mousedown', this.mouseDown, false);
    this.canvas.addEventListener('mouseup',   this.mouseUp,   false);
    this.canvas.addEventListener('mouseout',  this.mouseOut,  false);

    /*window.onresize = function(event) {
      Nodes.canvas.width = window.innerWidth;
      Nodes.canvas.height = window.innerHeight;
      Nodes.onWindowResize();    
    }*/

    // Load initial input image (the chrome logo!)
    var base64img = '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QKwBEGsAsQZArAHEGgCxBkCsAcQaALEGQKwBxBoAsQYQawDEGgCxBhBrAMQaALEGEGsAxBoAsQYQawDEGkCsARBrAMQaQKwBEGsAxBpArAEQawCxBkCsARBrALEGQKwBEGsAsQZArAEQawCxBkCsAcQaALEGQKwBxBoAsQZArAHEGgCxBhBrAMQaALEGEGsAxBoAsQYQawDEGgCxBhBrAMQaQKwBEGsAxBpArAEQawDEGkCsARBrALEGQKwBEGsAsQZArAEQawCxBkCsARBrALEGQKwBxBoAsQZArAHEGgCxBkCsAcQaALEGEGsAxBoAsQYQawDEGgCxBhBrAMQaALEGEGsAxBpArAEQawDEGkCsARBrAMQaQKwBEGsAsQZArAEQawCxBkCsARBrALEGQKwBEGsAsQZArAHEGgCxBkCsAcQaALEGQKwBxBoAsQYQawDEGgCxBhBrAMQaALEGEGsAxBoAsQYQawDEGkCsARBrAMQaQKwBEGsAxBpArAEQawCxBkCsARBrALEGQKwBEGsAsQZArAEQawCxBkCsAcQaALEGQKwBxBoAsQZArAHEGgCxBhBrhwBArAEQawCxBkCsARBrALEGQKwBEGsAsQZArAHEGgCxBkCsAcQaALEGQKwBxBoAsQZArAHEGgCxBhBrAMQaALEGEGsAxBoAsQYQawDEGkCsARBrAMQaQKwBEGsAxBpArAEQawDEGkCsARBrALEGQKwBEGsAsQZArAEQawCxBkCsAcQaALEGQKwBxBoAsQZArAHEGgCxBkCsAcQaALEGEGsAxBoAsQYQawDEGgCxBhBrAMQaQKwBEGsAxBpArAEQawDEGkCsARBrAMQaQKwBEGsAsQZArAEQawCxBkCsARBrALEGQKwBxBoAsQZArAHEGgCxBkCsAcQaALEGQKwBxBoAsQYQawDEGgCxBhBrAMQaALEGEGsAxBpArAEQawDEGkCsARBrAMQaQKwBEGsAxBpArAEQawCxBkCsARBrALEGQKwBEGsAsQZArAHEGgCxBkCsAcQaALEGQKwBxBoAsQZArAHEGgCxBhBrAMQaALEGEGsAxBoAsQYQawDEGkCsARBrADby/wIMAMtM3bJF5cDBAAAAAElFTkSuQmCC';
    this.loadData('data:image/png;base64,' + base64img);
  },

  preparePoints: function() {

    // Clear the current points
    this.points = [];
    
    var width, height, i, j;

    var colors = this.bgContextPixelData.data;

    for( i = 0; i < this.canvas.height; i += this.density ) {

      for ( j = 0; j < this.canvas.width; j += this.density ) {

        var pixelPosition = ( j + i * this.bgContextPixelData.width ) * 4;

        // Dont use whiteish pixels
        if ( colors[pixelPosition] > 200 && (colors[pixelPosition + 1]) > 200 && (colors[pixelPosition + 2]) > 200 || colors[pixelPosition + 3] === 0 ) {
          continue;
        }
        
        var color = 'rgba(' + colors[pixelPosition] + ',' + colors[pixelPosition + 1] + ',' + colors[pixelPosition + 2] + ',' + '1)';
        this.points.push( { x: j, y: i, originalX: j, originalY: i, color: color } );

      }
    }
  },

  updatePoints: function() {

    var i, currentPoint, theta, distance;
    
    for (i = 0; i < this.points.length; i++ ){

      currentPoint = this.points[i];

      theta = Math.atan2( currentPoint.y - this.mouse.y, currentPoint.x - this.mouse.x);

      if ( this.mouse.down ) {
        distance = this.reactionSensitivity * 200 / Math.sqrt((this.mouse.x - currentPoint.x) * (this.mouse.x - currentPoint.x) +
         (this.mouse.y - currentPoint.y) * (this.mouse.y - currentPoint.y));
      } else {
        distance = this.reactionSensitivity * 100 / Math.sqrt((this.mouse.x - currentPoint.x) * (this.mouse.x - currentPoint.x) +
         (this.mouse.y - currentPoint.y) * (this.mouse.y - currentPoint.y));  
      }
      

      currentPoint.x += Math.cos(theta) * distance + (currentPoint.originalX - currentPoint.x) * 0.05;
      currentPoint.y += Math.sin(theta) * distance + (currentPoint.originalY - currentPoint.y) * 0.05;

    }
  },

  drawLines: function() {
    
    var i, j, currentPoint, otherPoint, distance, lineThickness;

    for ( i = 0; i < this.points.length; i++ ) {

      currentPoint = this.points[i];

      // Draw the dot.
      this.context.fillStyle = currentPoint.color;
      this.context.strokeStyle = currentPoint.color;

      for ( j = 0; j < this.points.length; j++ ){

        // Distaqnce between two points.
        otherPoint = this.points[j];

        if ( otherPoint == currentPoint ) {
          continue;
        }

        distance = Math.sqrt((otherPoint.x - currentPoint.x) * (otherPoint.x - currentPoint.x) +
         (otherPoint.y - currentPoint.y) * (otherPoint.y - currentPoint.y));

        if (distance <= this.drawDistance) {

          this.context.lineWidth = (1 - (distance / this.drawDistance)) * this.maxLineThickness * this.lineThickness;
          this.context.beginPath();
          this.context.moveTo(currentPoint.x, currentPoint.y);
          this.context.lineTo(otherPoint.x, otherPoint.y);
          this.context.stroke();
        }
      }
    }
  },

  drawPoints: function() {

    var i, currentPoint;

    for ( i = 0; i < this.points.length; i++ ) {

      currentPoint = this.points[i];

      // Draw the dot.
      this.context.fillStyle = currentPoint.color;
      this.context.strokeStyle = currentPoint.color;

      this.context.beginPath();
      this.context.arc(currentPoint.x, currentPoint.y, this.baseRadius ,0 , Math.PI*2, true);
      this.context.closePath();
      this.context.fill();

    }
  },

  draw: function() {
    this.animation = requestAnimationFrame( function(){ Nodes.draw() } );

    this.clear();
    this.updatePoints();
    this.drawLines();
    this.drawPoints();

  },

  clear: function() {
    this.canvas.width = this.canvas.width;
  },

  // The filereader has loaded the image... add it to image object to be drawn
  loadData: function( data ) {
    
    this.bgImage = new Image;
    this.bgImage.src = data;

    this.bgImage.onload = function() {

      //this
      Nodes.drawImageToBackground();
    }
  },

  // Image is loaded... draw to bg canvas
  drawImageToBackground: function () {

    this.bgCanvas = document.createElement( 'canvas' );
    this.bgCanvas.width = this.canvas.width;
    this.bgCanvas.height = this.canvas.height;

    var newWidth, newHeight;

    // If the image is too big for the screen... scale it down.
    if ( this.bgImage.width > this.bgCanvas.width - 100 || this.bgImage.height > this.bgCanvas.height - 100) {

      var maxRatio = Math.max( this.bgImage.width / (this.bgCanvas.width - 100) , this.bgImage.height / (this.bgCanvas.height - 100) );
      newWidth = this.bgImage.width / maxRatio;
      newHeight = this.bgImage.height / maxRatio;

    } else {
      newWidth = this.bgImage.width;
      newHeight = this.bgImage.height;
    }

    // Draw to background canvas
    this.bgContext = this.bgCanvas.getContext( '2d' );
    this.bgContext.drawImage( this.bgImage, (this.canvas.width - newWidth) / 2, (this.canvas.height - newHeight) / 2, newWidth, newHeight);
    this.bgContextPixelData = this.bgContext.getImageData( 0, 0, this.bgCanvas.width, this.bgCanvas.height );

    this.preparePoints();
    this.draw();
  },

  mouseDown: function( event ){
    Nodes.mouse.down = true;
  },

  mouseUp: function( event ){
    Nodes.mouse.down = false;
  },
  
  mouseMove: function(event){
    Nodes.mouse.x = event.offsetX || (event.layerX - Nodes.canvas.offsetLeft);
    Nodes.mouse.y = event.offsetY || (event.layerY - Nodes.canvas.offsetTop);
  },
  
  mouseOut: function(event){
    Nodes.mouse.x = -1000;
    Nodes.mouse.y = -1000;
    Nodes.mouse.down = false;
  },

  // Resize and redraw the canvas.
  onWindowResize: function() {
    cancelAnimationFrame( this.animation );
    this.drawImageToBackground();
  }
}
  
Nodes.init();