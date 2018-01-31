(function(){
    'use strict';

/* zuletzt 17.11.2017

https://github.com/williammalone/Simple-HTML5-Drawing-App
+ w3 school canvas
http://www.williammalone.com/articles/create-html5-canvas-javascript-drawing-app/#demo-complete

draw/ copy image into div
https://developer.mozilla.org/de/docs/Web/API/CanvasRenderingContext2D/drawImage

https://docs.google.com/document/d/1bdUVHCHWHOLIZyc8MD23WwZZo9Bmdndy5qDeHIEHkCU/edit

// touch handler
// source: JQuery +  https://www.mediaevent.de/javascript/touch-events.html
// https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
*/

/* TODO - issues:

*/

    angular
        .module('rtool', ['conf', 'ngMaterial', 'ngAnimate'])
        .controller('EditorController', EditorController);

    EditorController.$inject = ['$scope', '$log', 'c', '$mdDialog'];

    function EditorController($scope, $log, c, $mdDialog) {
        // in the beginning to load!
        var config = c;
        var vm = this;


        var uncertaintyCounter = 0;
        var lessuncertaintyCounter = 0;
        var certaintyCounter = 0;

        $scope.uncertaintyStep = '1step';
        $scope.setUncertaintyStep = function (item) {
            $scope.uncertaintyStep = item;
        }

        // create canvas for editor
        $scope.canvasDraw;
        var canvasDrawWidth = $('#editor').width();
        var canvasDrawHeight = $('#editor').height();
        var contextDraw;
        var canvasDrawDiv = document.getElementById('canvasDivDraw');
        $scope.canvasDraw = document.createElement('canvas');
        $scope.canvasDraw.setAttribute('width', canvasDrawWidth);
        $scope.canvasDraw.setAttribute('height', canvasDrawHeight);
        $scope.canvasDraw.setAttribute('id', 'canvasDrawing');
        canvasDrawDiv.appendChild($scope.canvasDraw);
        if(typeof G_vmlCanvasManager != 'undefined') {
        	 $scope.canvasDraw = G_vmlCanvasManager.initElement($scope.canvasDraw);
        }
        contextDraw = $scope.canvasDraw.getContext("2d");

        // fill editor-canvas with white color (for download purposes)
        fillWhiteRectangle();

        // create canvas for clipboard
        $scope.canvasImage;
        var canvasImageWidth = $('#editor').width();
        var canvasImageHeight = $('#editor').height();
        var contextImage;
        var canvasImageDiv = document.getElementById('canvasDivImage');
        $scope.canvasImage = document.createElement('canvas');
        $scope.canvasImage.setAttribute('width', canvasImageWidth);
        $scope.canvasImage.setAttribute('height', canvasImageHeight);
        $scope.canvasImage.setAttribute('id', 'canvasImage');
        canvasImageDiv.appendChild($scope.canvasImage);
        if(typeof G_vmlCanvasManager != 'undefined') {
        	 $scope.canvasImage = G_vmlCanvasManager.initElement($scope.canvasImage);
        }
        contextImage = $scope.canvasImage.getContext("2d");

        var curSize = "small";
        var sizeSelected;

        // add default color
        var curColor = {};
        curColor.r = 0;
        curColor.g = 0;
        curColor.b = 0;

        // add click event
        var clickX = new Array();
        var clickY = new Array();
        var clickDrag = new Array();
        var clickColor = new Array();
        // var clickSize = new Array();
        var paint;
        var mousemoving = false;

        // for touch devices
        var starttouch = document.querySelector('#canvasDivDraw');  // use canvasDivDraw, because it is same with the canvas

        // ############################################################

        // for mouse devices
        // mouse down
        $('#canvasDrawing').mousedown(function(e) {
            var mouseX = e.pageX - this.offsetLeft;
            var mouseY = e.pageY - this.offsetTop;

            paint = true;
            mousemoving = false;
            addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
            redraw();
        });

        // mouse move
        $('#canvasDrawing').mousemove(function(e) {
            waitForMouseStop(function() {
                mousemoving = false;
            });

            if(paint){
              mousemoving = true;
              addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
              redraw();
            }
        });

        // mouse up
        $('#canvasDrawing').mouseup(function(e) {
            paint = false;
            mousemoving = false;
        });

        // mouse leave
        $('#canvasDrawing').mouseleave(function(e) {
            paint = false;
            mousemoving = false;
        });

        // for touch devices
        // touch start
        starttouch.addEventListener("touchstart", function(eve){
            var touchobj = eve.changedTouches[0]; // first finger that touched the surface

            paint = true;
            mousemoving = false;
            addClick(parseInt(touchobj.clientX) - this.offsetLeft, touchobj.clientY - this.offsetTop);
            redraw();
            eve.preventDefault();
        });

        // touch move
        starttouch.addEventListener("touchmove", function(eve){
            var touchobj = eve.changedTouches[0]; // first finger that touched the surface

            if(paint){
              mousemoving = true;
              addClick(touchobj.clientX - this.offsetLeft, touchobj.clientY - this.offsetTop, true);
              redraw();
            }
            eve.preventDefault();
        });

        // touch end
        starttouch.addEventListener("touchend", function(eve){
            var touchobj = eve.changedTouches[0]; // reference first finger that touched the surface
            paint = false;
            mousemoving = false;
            eve.preventDefault();
        });

// ############################################################

        // $scope.selectSize = function(size) {
        //   curSize = size;
        //   sizeSelected = true;
        // };

        var savedDrawing;

        $scope.copyToBottomDiv = function () {
          var canvasToBottom= contextDraw.getImageData(0, 0, $scope.canvasDraw.width, $scope.canvasDraw.height);
          contextImage.putImageData(canvasToBottom, 0, 0);

          // var mirror = document.getElementById('mirror');
          // var dataURL = $scope.canvasDraw.toDataURL('image/png');
          // mirror.src = dataURL;
        };

        $scope.downloadDiv = function (canvasData) {
          var confirm = $mdDialog.prompt()
            .title('Do you want do download as a PNG?')
            .textContent('Please enter a name. (Default: "download")')
            .placeholder('image name')
            .ariaLabel('image name')
            .initialValue('download')
            .required(true)
            .ok('download')
            .cancel('cancel');

          $mdDialog.show(confirm).then(function(result) {
              $scope.status = 'Download PNG named as ' + result + '.';

              var downloadData = document.getElementById('downloadButton');
              var canvasDrawDownload = canvasData.toDataURL("image/png").replace("image/png", "image/octet-stream");
              downloadData.setAttribute('download', result+'.png');
              downloadData.setAttribute('href', canvasDrawDownload);
              downloadData.click();
          }, function() {
              $scope.status = 'You didn\'t choose to donwload as png.';
          });
        };

        $scope.copyToTopDiv = function () {
          var m = confirm("Do you want to clear the top and copy this into the editor?");
          if (m) {
              clearView();
              var canvasToTop= contextImage.getImageData(0, 0, $scope.canvasImage.width, $scope.canvasImage.height);
              contextDraw.putImageData(canvasToTop, 0, 0);
          }
        };

        $scope.clear = function () {
          var m = confirm("Want to clear?");
          if (m) {
              clearView();
          }
        };

        $scope.selectColor = function(color) {
            switch(color) {
              case "white":
                  curColor = setColorRGB(255,255,255); // --> white
                  break;
              case "orange":
                  curColor = setColorRGB(255,191,0); // --> orange
                  break;
              case "red":
                  curColor = setColorRGB(255,0,0); // --> red
                  break;
              case "black":
                  curColor = setColorRGB(0,0,0); // --> black
                  break;
              default:
                  break;
          }
        };

// ############################################################

        // on key press change color
        document.addEventListener('keydown', function(event) {
            if (typeof(event.which) == "number") {
                // keypress = "a"
                if (event.which == "65" ) {
                    changeColor(curColor, "red");
                }
                // keypress = "s"
                if (event.which == "83" ) {
                    changeColor(curColor, "black");
                }
                // keypress = "d"
                if (event.which == "68" ) {
                    changeColor(curColor, "yellow");
                }
                // keypress = "f"
                if (event.which == "70" ) {
                    changeColor(curColor, "green");
                }
                // keypress = "r"
                if (event.which == "82" ) {
                    changeColor(curColor, "reset"); // rest to black
                }
                if (event.which !="65" && event.which !="83" && event.which !="68" && event.which !="70") {changeColor(curColor, "black");}
            }
        });

        // window.addEventListener('resize', function(event) {
        //   if (canvasDrawWidth != $('#editor').width()) {
        //     var m = confirm("You changed the browser width. Do you want to resize the canvas? If Yes is choosen, data can be lost.");
        //     if (m) {
        //       resizeCanvas();
        //     }
        //   }
        // });

        // function resizeCanvas () {
        //     $scope.canvasDraw.width = $('#editor').width();
        //     $scope.canvasImage.width = $('#editor').width();
        // };

// ############################################################

        function fillWhiteRectangle() {
            contextDraw.beginPath();
            contextDraw.rect(0, 0, $scope.canvasDraw.width, $scope.canvasDraw.height);
            contextDraw.fillStyle = "white";
            contextDraw.fill();
        };

        function clearView() {
            contextDraw.clearRect(0, 0, $scope.canvasDraw.width, $scope.canvasDraw.height);
            clickX = new Array();
            clickY = new Array();
            clickDrag = new Array();
            clickColor = new Array();
            // clickSize = new Array();
            changeColor(curColor, "reset");
            fillWhiteRectangle();
        };

        function waitForMouseStop(callback) {
            var timer;
            function stoppedMoving(evt) {
                document.onmousemove = null;
                callback();
            }
            function moveHandler(evt) {
                evt = evt || window.event;
                if (timer) {
                    window.clearTimeout(timer);
                }
                timer = window.setTimeout(function() {
                    stoppedMoving(evt);
                }, 1000);
            }
            document.onmousemove = moveHandler;
        };

        var twoDimObj = {};

        function addClick(x, y, dragging) {
            if (twoDimObj[x] != undefined && twoDimObj[x][y] != undefined) {
                decreaseCounter(twoDimObj[x][y]);
            }
            if (twoDimObj[x] == undefined) {
              twoDimObj[x] = {};
            }

            clickX.push(x);
            clickY.push(y);
            clickDrag.push(dragging);
            clickColor.push("rgb("+curColor.r+","+curColor.g+","+curColor.b+")");
            // clickSize.push(curSize);


            twoDimObj[x][y] = "("+curColor.r+ "," +curColor.g+ "," +curColor.b+ ")";
            increaseCounter(twoDimObj[x][y]);

            console.log("number of pixel drawn");
            console.log(uncertaintyCounter);
            console.log(lessuncertaintyCounter);
            console.log(certaintyCounter);
        };

        function increaseCounter(colorString) {
            switch(colorString) {
                case '(255,0,0)':
                    uncertaintyCounter ++;
                    break;
                case '(255,191,0)':
                    lessuncertaintyCounter ++;
                    break;
                case '(0,0,0)':
                    certaintyCounter ++;
                    break;
                default:
                    break;
            }
        }
        function decreaseCounter(colorString) {
            switch(colorString) {
                case '(255,0,0)':
                    uncertaintyCounter --;
                    break;
                case '(255,191,0)':
                    lessuncertaintyCounter --;
                    break;
                case '(0,0,0)':
                    certaintyCounter --;
                    break;
                default:
                    break;
            }
        }

        function changeColor(oldColor, newColor) {
            if (mousemoving == true) {
                switch (newColor) {
                    case "red":
                        curColor = setColorRGB(Math.min(255, (oldColor.r+5.0)),0,0); // --> red (slow)
                        break;
                    case "yellow":
                        curColor = setColorRGB(255,255,0); // --> yellow
                        break;
                    case "green":
                        curColor = setColorRGB(0,255,0); // --> green
                        break;
                    case "black":
                        curColor = setColorRGB(Math.max(0, (oldColor.r-5)),0,0); // --> black (slow)
                        break;
                    case "reset":
                        curColor = setColorRGB(0,0,0); // --> black
                        break;
                    default:
                        break;
                }
            };

        };

        function setColorRGB(r, g, b) {
            let newColor = {};
            newColor.r = r;
            newColor.g = g;
            newColor.b = b;
            return newColor;
        };

        // redraw function = clear field
        function redraw() {
          var radius = 2;

            // if (sizeSelected == false) {
            //     radius = 5;
            // }
            contextDraw.lineJoin = "round"; // style
            contextDraw.lineWidth = radius;  // line width

            for(var i=0; i < clickX.length; i++) {
                // Set the drawing radius
                // switch (clickSize[i]) {
                // case "small":
                //     radius = 2;
                //     break;
                // case "normal":
                //     radius = 5;
                //     break;
                // case "large":
                //     radius = 10;
                //     break;
                // case "huge":
                //     radius = 20;
                //     break;
                // default:
                //     break;
                // }

                contextDraw.beginPath();
                if(clickDrag[i] && i){
                  contextDraw.moveTo(clickX[i-1], clickY[i-1]);
                 }else{
                   contextDraw.moveTo(clickX[i]-1, clickY[i]);
                 }
                   contextDraw.lineTo(clickX[i], clickY[i]);
                   contextDraw.strokeStyle = clickColor[i]; // set color, which has been choosen
                   contextDraw.lineCap = "round";
                   contextDraw.lineJoin = "round";
                   contextDraw.lineWidth = radius;
                   contextDraw.closePath();
                   contextDraw.stroke();
            }
        }

        // var oldImage = new Image(); // for saving
        // var curImage = new Image(); // for reloading
        // var newImage = new Image(); // for creating new image

        // var imageToSave = {};
        // var clickX_save = new Array();
        // var clickY_save = new Array();
        // var clickDrag_save = new Array();
        // var clickColor_save = new Array();
        // var clickSize_save = new Array();
        // imageToSave.clickX = clickX;
        // imageToSave.clickY = clickY;
        // imageToSave.clickSize = clickSize;
        // imageToSave.clickDrag = clickDrag;
        // imageToSave.clickColor = clickColor;
        // clickX = imageToSave.clickX;
        // clickY = imageToSave.clickY;
        // clickSize = imageToSave.clickSize;
        // clickDrag = imageToSave.clickDrag;
        // clickColor = imageToSave.clickColor;

    };
})();
