$(function(){

  Iframework.util = {
    // From YUI3 via http://stackoverflow.com/a/7390555/592125
    types: {
      'undefined'        : 'undefined',
      'number'           : 'number',
      'boolean'          : 'boolean',
      'string'           : 'string',
      '[object Function]': 'function',
      '[object RegExp]'  : 'regexp',
      '[object Array]'   : 'array',
      '[object Date]'    : 'date',
      '[object Error]'   : 'error',
      '[object HTMLCanvasElement]': 'HTMLCanvasElement',
      '[object ImageData]': 'ImageData'
    },
    type: function(o) {
      return this.types[typeof o] || this.types[Object.prototype.toString.call(o)] || (o ? 'object' : 'null');
    },
    imageTypes: ["png", "gif", "jpg", "jpeg", "webp"],
    isImageURL: function(url) {
      var fileTypeSplit = url.split(".");
      if (fileTypeSplit.length > 1) {
        var fileType = fileTypeSplit[fileTypeSplit.length-1];
        return (this.imageTypes.indexOf(fileType) > -1);
      }
      return false;
    },
    imageDrop: function(event, ui){
      // Used in image.js and variable-animation.js
      // TODO only drop to top

      // Don't also drop on graph
      event.stopPropagation();

      var self = event.data.self;

      var type = ui.helper.data("meemoo-drag-type");
      if ( !type || type !== "canvas" ) { return false; }

      var inputName = event.data.inputName;
      if ( !inputName ) { return false; }

      var canvas;

      var url = ui.helper.data("meemoo-image-url");
      if (url) {
        // Load big image instead of thumbnail
        var img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function(){
          canvas = document.createElement("canvas");
          var context = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);
          // Hit own input with image
          self.receive(inputName, canvas);
        };
        img.src = url;
      } else {
        canvas = ui.helper.data("meemoo-drag-canvas");
        if ( !canvas) { return false; }
        // Hit own input with image
        self.receive(inputName, canvas);
      }

    }

  };

  // requestAnimationFrame shim from http://paulirish.com/2011/requestanimationframe-for-smart-animating/
  window.requestAnimationFrame = (function(){
    return  window.requestAnimationFrame       || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame     || 
            function( callback ){
              window.setTimeout(callback, 1000 / 60);
            };
  }());

});
