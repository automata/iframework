// extends src/nodes/image.js which extends src/node-box-native-view.js

$(function(){

  var template = 
    '<canvas id="canvas-<%= id %>" class="preview" style="max-width:100%"></canvas>'+
    '<div class="info">frame <span class="index"></span>/<span class="length"></span></div>'+
    '<div class="control">'+
      '<button class="play">play</button>'+
      '<button class="pause">pause</button>'+
      '<button class="prev">prev</button>'+
      '<button class="next">next</button>'+
      '<button class="deleteframe">deleteframe</button><br/><br/>'+
      '<label><input type="checkbox" class="pingpong" <%= (get("state").pingpong ? "checked" : "") %> />pingpong (loop back and forth)</label><br/><br/>'+
      '<button class="make-gif">make gif</button>'+
      '<button class="make-spritesheet">make spritesheet</button>'+
      // '<button class="import">import</button>'+
      // '<form class="importform" style="display:none;">'+
      // '</form>'+
    '</div>'+
    '<div class="status"></div>'+
    '<div class="exports"></div>';

  Iframework.NativeNodes["variable-animation"] = Iframework.NativeNodes["variable"].extend({

    template: _.template(template),
    info: {
      title: "animation",
      description: "holds a stack of canvases to use as an animation"
    },
    events: {
      "click .play"  : "inputplay",
      "click .pause" : "inputpause",
      "click .prev"  : "inputprev",
      "click .next"  : "inputnext",
      "click .deleteframe"  : "deleteFrame",
      "change .pingpong": "clickPingpong",
      "click .make-spritesheet"  : "makeSpritesheet",
      "click .make-gif"  : "makeGif"
    },
    initializeModule: function(){
      this._animation = {
        width: 0, 
        height: 0, 
        fps: 10, 
        frames: [], 
        length: 0
      };
      this.canvas = this.$(".preview")[0];
      this.context = this.canvas.getContext('2d');
      this.$("button").button();


      // Setup droppable
      // Add drop indicator (shown in CSS)
      this.$el.append('<div class="drop-indicator"><p class="icon-login">add image</p></div>');
      
      // Make droppable        
      this.$el.droppable({
        accept: ".canvas, .meemoo-plugin-images-thumbnail",
        tolerance: "pointer",
        hoverClass: "drop-hover",
        activeClass: "drop-active",
        // Don't also drop on graph
        greedy: true
      });
      this.$el.on("drop", {"self": this, "inputName": "push"}, Iframework.util.imageDrop);
    },
    inputpush: function(image){
      var frame = document.createElement("canvas");
      frame.width = image.width;
      frame.height = image.height;
      frame.getContext('2d').drawImage(image, 0, 0);
      this._animation.frames.push(frame);
      if (this._length && this._animation.frames.length>this._length) {
        var shifted = this._animation.frames.shift();
        this.send("shift", shifted);
      }
      this._animation.length = this._animation.frames.length;
      this._animation.width = image.width;
      this._animation.height = image.height;

      // Info
      this.$(".length").text(this._animation.length);

      // Preview
      if (this.canvas.width !== image.width){
        this.canvas.width = image.width;
      }
      if (this.canvas.height !== image.height){
        this.canvas.height = image.height;
      }
      if (!this._play){
        this.showFrame(this._animation.length-1);
      }

      this.inputsend();
    },
    showFrame: function(i) {
      var frame = this._animation.frames[i];
      if (frame) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.drawImage(frame, 0, 0);
        this._previewFrame = i;
        this.$(".index").text(i+1);
        this.send("image", this.canvas);
      }
    },
    _ms: 1000/12,
    inputfps: function(fps){
      this._animation.fps = fps;
      this._ms = 1000/fps;

      this.inputsend();
    },
    inputlength: function(i){
      if (i >= 0) {
        this._length = i;
        if (this._length > 0 && this._animation.frames.length > this._length) {
          this._animation.frames.splice(this._length, this._animation.frames.length);
          this._animation.length = this._animation.frames.length;
          this.$(".length").text(this._animation.length);
          if (this._previewFrame >= this._animation.length) {
            // Show last
            this.showFrame(this._animation.length-1);
          }
        }
      }
    },
    deleteFrame: function(){
      this.inputpause();
      this._animation.frames.splice(this._previewFrame, 1);
      this._animation.length = this._animation.frames.length;
      this.$(".length").text(this._animation.length);
      // Show next preview
      if (this._animation.length <= 0) {
        // No frames, make blank
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.$(".index").text("0");
      } else if (this._previewFrame >= this._animation.length) {
        // Show last
        this.showFrame(this._animation.length-1);
      } else {
        // Show next
        this.showFrame(this._previewFrame);
      }
    },
    _pingpong: false,
    _reverse: false,
    clickPingpong: function(event){
      if (event.target.checked) {
        this._pingpong = true;
        this.set("pingpong", true);
      } else {
        this._pingpong = false;
        this._reverse = false;
        this.set("pingpong", false);
      }
    },
    inputpingpong: function(boo){
      this._pingpong = boo;
      if (!boo) {
        // Keeps it from looping backwards
        this._reverse = false;
      }
      this.$(".pingpong")[0].checked = boo;
    },
    _play: false,
    inputplay: function(){
      this._play = true;
    },
    inputpause: function(){
      this._play = false;
    },
    _previewFrame: 0,
    inputprev: function(){
      // Pause
      this.inputpause();
      // Show prev or loop back
      if (this._previewFrame > 0) {
        this.showFrame(this._previewFrame-1);
      } else {
        this.showFrame(this._animation.frames.length-1);
      }
    },
    inputnext: function(){
      this.inputpause();
      // Show next or loop
      if (this._previewFrame < this._animation.frames.length-1) {
        this.showFrame(this._previewFrame+1);
      } else {
        this.showFrame(0);
      }
    },
    makeSpritesheet: function(){
      if (this._animation.length < 1) { return; }

      var image = document.createElement("canvas");
      var imageContext = image.getContext("2d");
      image.width = this._animation.width * this._animation.length;
      image.height = this._animation.height;
      var x = 0;
      for (var i=0; i<this._animation.length; i++){
        imageContext.drawImage(this._animation.frames[i], x, 0);
        x += this._animation.width;
      }
      var img = '<img src="' + image.toDataURL() + '" style="max-width:100%" />';
      self.$(".exports").prepend( img );
    },
    makeGif: function(){
      // Spawn worker
      this.$(".status").text("Setting up GIF...");
      var gifWorker = new Worker("libs/omggif/omggif-worker.js");

      // Setup listeners
      var self = this;
      gifWorker.addEventListener('message', function (e) {
        if (e.data.type === "progress") {
          self.$(".status").text("GIF " + e.data.data + "% encoded...");
        } else if (e.data.type === "gif") {
          var gifurl = "data:image/gif;base64,"+window.btoa(e.data.data);
          var img = $('<img />')
            .attr({
              src: gifurl,
              title: e.data.frameCount + " frames encoded in " + e.data.encodeTime + " seconds",
              style: "max-width:100%"
            });
          self.$(".exports").prepend( img );
          self.$(".status").text("");
        }
      }, false);
      gifWorker.addEventListener('error', function (e) {
        self.$(".status").text("GIF encoding error :-(");
      }, false);

      // Send image data
      var frames = [];
      for (var i = 0; i<this._animation.length; i++) {
        var imageData = this._animation.frames[i].getContext('2d').getImageData(0, 0, this._animation.width, this._animation.height);
        frames[i] = imageData;
        if (this._pingpong && i>0 && i<this._animation.length-1) {
          frames[this._animation.length * 2 - 2 - i] = imageData;
        }
      }
      gifWorker.postMessage({
        frames: frames,
        delay: this._ms
      });

    },
    inputsend: function(){
      this.send("animation", this._animation);
    },
    redraw: function(timestamp){
    },
    renderAnimationFrame: function (timestamp) {
      if (this._play && timestamp-this._lastRedraw>=this._ms) {
        if (this._reverse) {
          this._previewFrame--;
          if (this._previewFrame < 0) {
            // Loop
            if (this._pingpong) {
              this._reverse = false;
              this._previewFrame = 1;
            } else {
              this._previewFrame = this._animation.frames.length - 1;
            }
          }
        } else {
          this._previewFrame++;
          if (this._previewFrame >= this._animation.frames.length) {
            // Loop
            if (this._pingpong) {
              this._reverse = true;
              this._previewFrame = Math.max(this._animation.frames.length - 2, 0);
            } else {
              this._previewFrame = 0;
            }
          }
        }
        this.showFrame(this._previewFrame);

        this._lastRedraw = timestamp;
      }
    },
    inputs: {
      push: {
        type: "image",
        description: "adds image to end of array"
      },
      length: {
        type: "int",
        description: "max length of array"
      },
      fps: {
        type: "float",
        description: "frames per second to animate",
        "default": 12
      },
      pingpong: {
        type: "boolean",
        description: "loop animation back and forth",
        "default": false
      },
      play: {
        type: "bang",
        description: "start the preview animation"
      },
      pause: {
        type: "bang",
        description: "stop the preview animation"
      },
      prev: {
        type: "bang",
        description: "when paused, show the prev frame"
      },
      next: {
        type: "bang",
        description: "when paused, show the next frame"
      },
      sendOne: {
        type: "int",
        description: "sends canvas with this index"
      },
      send: {
        type: "bang",
        description: "sends animation object"
      }
    },
    outputs: {
      image: {
        type: "image",
        description: "the preview canvas"
      },
      animation: {
        type: "animation",
        description: "animation object has width, height, fps, frames (array of canvases), and length (frames.length)"
      },
      shift: {
        type: "image",
        description: "overflow canvas that is shifted from array"        
      }
    }

  });


});
