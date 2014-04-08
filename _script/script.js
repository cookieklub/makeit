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
  density: 16,
  
  drawDistance: 28,
  baseRadius: 3.2,
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
    this.canvas.width = 400;
    this.canvas.height = 700;
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
    var base64img = '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';
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