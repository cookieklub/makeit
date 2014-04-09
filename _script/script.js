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