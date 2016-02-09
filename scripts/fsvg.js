/*  fsvg.js: Adventures in SVG manipulation for fun and profit
    ... okay, maybe just fun.                                  */


var fsvg = (function(fsvg) {
  'use strict';

  var SVGNS = fsvg.SVGNS = "http://www.w3.org/2000/svg",
      XLINKNS = fsvg.XLINKNS = "http://www.w3.org/1999/xlink";

  var newElement = fsvg.newElement = function (tag) {
    return document.createElementNS(SVGNS, tag)
  }

  // Mixin Utilities
  var extend = fsvg.extend = function (target, source, methodNames) {
    methodNames = methodNames || Object.keys(source);
    methodNames.forEach(function (methodName) {
      target[methodName] = source[methodName];
    });
    return target;
  }

  var partialone = fsvg.partialone = function (fn, firstarg) {
    return function (x) {
      return fn(firstarg, x);
    }
  }

  var partial = fsvg.partial = function (fn) {
    var slice = Array.prototype.slice;
    var partialargs = slice.call(arguments, 1);
    return function () {
      var fullargs = partialargs.concat(slice(arguments));
      return fn.apply(this, fullargs);
    }
  }

  // utility for dealing with IRIs for #ids.
  var idiri = fsvg.idiri = (function() {
    // A restricted version of the allowed characters in HTML IDs
    // because I don't want to deal with escaping them
    // mainly HTML4's letter>alphanumerics+underscore+hyphen, but not including
    // the : or the .
    var nameregex = /^[a-z]+[a-z0-9_\-]*$/i;
    var test = function (id) {return nameregex.test(id);}
    var valid = function (id) {
      if (test(id)) {
        return id;
      } else {
        throw new Error("Invalid id: " + id);
      }
    }
    var IRI = function (id) {return "#" + valid(id);}
    var funcIRI = function (id) {return "url(" + IRI(id) + ")";}
    return {
      test: test,
      valid: valid,
      IRI: IRI,
      funcIRI: funcIRI
    }
  }());

  var retrieve = fsvg.retrieve = (function() {
    // Helper functions for grabbing SVG properties.
    // For use with 'this' and call
    var retrieve = {};

        // SVGAnimatedLength
    var getLength = retrieve.getLength = function(prop) {
          return this[prop].baseVal.value;
        },
        setLength = retrieve.setLength = function(prop, x) {
          this[prop].baseVal.value = x;
        },
        // CSS2Properties
        getStyle = retrieve.getStyle = function(prop) {
          return this.style[prop];
        },
        setStyle = retrieve.setStyle = function(prop, x) {
          this.style[prop] = x;
        },
        // attribute
        getAttribute = retrieve.getAttribute = function(prop) {
          return this.getAttribute(prop);
        },
        setAttribute = retrieve.setAttribute = function(prop, x) {
          this.setAttribute(prop, x)
        },
        // property
        getProperty = retrieve.getProperty = function(prop) {
          return this[prop];
        },
        setProperty = retrieve.setProperty = function(prop, x) {
          this[prop] = x;
        }

    return retrieve;
  }());

  var basicSetters = extend({}, retrieve,
     ['setLength', 'setStyle', 'setProperty', 'setAttribute']);

  var generic = fsvg.generic = (function() {
    var generic = {};
    var getId = generic.getId = function() {
          return this.id;
        },
        setId = generic.setId = function(id) {
          id = idiri.valid(id);
          return this.id = id;
        },
        appendToNode = generic.appendToNode = function (parentnode) {
          parentnode.appendChild(this);
        },
        getOwnerSVG = generic.getOwnerSVG = function () {
          return this.ownerSVGElement;
        }
    return generic;
  }());

  var basics = fsvg.basicshape = {
    setLocation: function (x, y) {
      setLength.call(this, 'x', x);
      setLength.call(this, 'y', y);
    }
  }


  var line = fsvg.line = (function() {

    var line = {};
    //extend(line, basicSetters);

    var setLength = retrieve.setLength,
        setStyle = retrieve.setStyle;

    var setStart = line.setStart = function(x, y) {
      setLength.call(this, 'x1', x);
      setLength.call(this, 'y1', y);
    }
    var setEnd = line.setEnd = function(x, y) {
      setLength.call(this, 'x2', x);
      setLength.call(this, 'y2', y);
    }
    var setExtent = line.setExtent = function(x1, y1, x2, y2) {
      setStart.call(this, x1, y1);
      setEnd.call(this, x2, y2);
    }

    return line;
  }());

  var rect = fsvg.rect = (function() {

    var rect = {};
    //extend(rect, basicSetters);
    extend(rect, basics, ['setLocation']);

    var setLength = retrieve.setLength,
        setStyle = retrieve.setStyle,
        setLocation = basics.setLocation;

    var setSize = rect.setSize = function (width, height) {
      setLength.call(this, 'width', width);
      setLength.call(this, 'height', height);
    }

    var setExtent = rect.setExtent = function (x1, y1, x2, y2) {
      var xmin = Math.min(x1, x2),
          ymin = Math.min(y1, y2),
          xdif = Math.abs(x1 - x2),
          ydif = Math.abs(y1 - y2);
      setLocation.call(this, xmin, ymin);
      setSize.call(this, xdif, ydif);
    }

    return rect;
  }());

  var group = fsvg.group = (function() {
    var group = {};
    //extend(group, basicSetters);
    return group;
  }());


  var use = fsvg.use = (function() {
    var use = {};
    //extend(use, basicSetters);
    extend(use, basics, ['setLocation']);

    var setHref = use.setHref = function (href) {
      this.setAttributeNS(XLINKNS, 'href', href);
    }
    return use;
  }());


return fsvg;
}(fsvg || {}));
