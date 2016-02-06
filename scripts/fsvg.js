/*  fsvg.js: Adventures in SVG manipulation for fun and profit
    ... okay, maybe just fun.                                  */


var fsvg = (function(fsvg) {
  'use strict';

  var SVGNS = fsvg.SVGNS = "http://www.w3.org/2000/svg",
      XLINKNS = fsvg.XLINKNS = "http://www.w3.org/1999/xlink";

  var retrieve = fsvg.retrieve = (function() {
    // Helper functions for grabbing SVG properties.
    // For use with 'this' and call

        // SVGAnimatedLength
    var getLength = function(prop) {
          return this[prop].baseVal.value;
        },
        setLength = function(prop, x) {
          this[prop].baseVal.value = x;
          return this;
        },
        // CSS2Properties
        getStyle = function(prop) {
          return this.style[prop];
        },
        setStyle = function(prop, x) {
          this.style[prop] = x;
          return this;
        }

    return {
      getLength: getLength,
      setLength: setLength,
      getStyle: getStyle,
      setStyle: setStyle,
    }
  }());
/*
  var pfix = function(fn, prop) {
    return function (x) {
      return fn(prop, x);
    }
  }
*/

  var newElement = fsvg.newElement = function (tag) {
    return document.createElementNS(SVGNS, tag)
  }


  var line = fsvg.line = (function() {

    var setLength = retrieve.setLength,
        setStyle = retrieve.setStyle;

    var setStart = function(x, y) {
      setLength.call(this, 'x1', x);
      setLength.call(this, 'y1', y);
      return this;
    }
    var setEnd = function(x, y) {
      setLength.call(this, 'x2', x);
      setLength.call(this, 'y2', y);
      return this;
    }
    var setExtent = function(x1, y1, x2, y2) {
      setStart.call(this, x1, y1);
      setEnd.call(this, x2, y2);
      return this;
    }

    return {
      setStart: setStart,
      setEnd: setEnd,
      setExtent: setExtent
    }
  }());

  var rect = fsvg.rect = (function() {
    var setLength = retrieve.setLength,
        setStyle = retrieve.setStyle;

    var setLocation = function (x, y) {
      setLength.call(this, 'x', x);
      setLength.call(this, 'y', y);
      return this;
    }

    var setSize = function (width, height) {
      setLength.call(this, 'width', width);
      setLength.call(this, 'height', height);
      return this;
    }

    var setExtent = function (x1, y1, x2, y2) {
      var xmin = Math.min(x1, x2),
          ymin = Math.min(y1, y2),
          xdif = Math.abs(x1 - x2),
          ydif = Math.abs(y1 - y2);
      setLocation.call(this, xmin, ymin);
      setSize.call(this, xdif, ydif);
      return this;
    }

    return {
      setLocation: setLocation,
      setSize: setSize,
      setExtent: setExtent
    }
  }());


return fsvg;
}(fsvg || {}));
