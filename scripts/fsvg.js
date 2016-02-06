/*  fsvg.js: Adventures in SVG manipulation for fun and profit
    ... okay, maybe just fun.                                  */


/*

Revised Version! Now, the plan is to lump all basic primitives together
under fsvg or maybe flagshapes. things such as crosses, stars, that pinwheel
shaped mask thing, etc, etc.

*/

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


  var newElement = function (tag) {return document.createElementNS(SVGNS, tag)}


  var lineTools = fsvg.lineTools = (function() {

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

  var rectTools = fsvg.rectTools = (function() {
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



  // More complex shapes!

  var Fcross = fsvg.Fcross = (function() {
    function Fcross (halfWidth, halfHeight) {
      this.node = newElement('g');

      // create the two lines
      this.hline = this.node.appendChild(newSVGElem('line'));
      lineTools.setExtent.call(this.hline, -halfWidth, 0, halfWidth, 0);


      this.vline = this.node.appendChild(newSVGElem('line'));
      lineTools.setExtent.call(this.vline, 0, -halfHeight, 0, halfHeight);

    }
    var p = Fcross.prototype;

    p.setHalfWidth = function (halfWidth) {
      retrieve.setLength.call(this.hline, 'x1', -halfWidth);
      retrieve.setLength.call(this.hline, 'x2', halfWidth);
      return this;
    }

    p.setHalfHeight = function (halfHeight) {
      retrieve.setLength.call(this.hline, 'y1', -halfHeight);
      retrieve.setLength.call(this.hline, 'y2', halfHeight);
      return this;
    }

    p.setThickness = function (thickness) {
      retrieve.setStyle.call(this.node, 'strokeWidth', thickness);
    }

    p.setColour = function (colour) {
      retrieve.setStyle.call(this.node, 'stroke', colour);
    }

    return Fcross;
  }());



return fsvg;
}(fsvg || {}));
