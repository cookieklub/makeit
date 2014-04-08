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
    this.canvas.height = 370;
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