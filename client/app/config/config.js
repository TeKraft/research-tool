(function(){
    'use strict';

    var c = {};
    c.canvas = {};

    c.canvas.height = "512px";
    c.canvas.width = "1024px";
    c.canvas.heightNumber = 512;
    c.canvas.widthNumber = 1024;


    angular
        .module('conf', [])
        .constant('c', c);

})();
