/*  fsvg.js: Adventures in SVG manipulation for fun and profit
    ... okay, maybe just fun.                                  */


var fsvg = (function(fsvg) {
  'use strict';

  var SVGNS = fsvg.SVGNS = "http://www.w3.org/2000/svg",
      XLINKNS = fsvg.XLINKNS = "http://www.w3.org/1999/xlink";


  // Mixin Utilities
  var extend = fsvg.extend = function (target, source, methodNames) {
    methodNames = methodNames || Object.keys(source);
    methodNames.forEach(function (methodName) {
      target[methodName] = source[methodName];
    });
    return target;
  }

  var partialone = fsvg.partialone = function (fn, firstarg) {
    return function (value) {
      return fn.call(this, firstarg, value);
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

  // I'm not sure if this is necessary but whatever
  var freeze = Object.freeze || Object;

  // utility for dealing with IRIs for #ids.
  var idiri = fsvg.idiri = (function() {
    // A restricted version of the allowed characters in HTML IDs
    // because I don't want to deal with escaping them
    // mainly HTML4's letter>alphanumerics+underscore+hyphen, but not including
    // the : or the .
    var nameregex = /^[a-z][a-z0-9_\-]*$/i;
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
    return freeze({
      test: test,
      valid: valid,
      IRI: IRI,
      funcIRI: funcIRI
    })
  }());

  // simple maths utility
  var extentToLS = function (x1, y1, x2, y2) {
    var xmin = Math.min(x1, x2),
        ymin = Math.min(y1, y2),
        xdif = Math.abs(x1 - x2),
        ydif = Math.abs(y1 - y2);
    return [xmin, ymin, xdif, ydif];
  }

  var newElement = fsvg.newElement = function (tag, id) {
    var elem = document.createElementNS(SVGNS, tag);
    if (typeof id !== 'undefined') {
      elem.id = idiri.valid(id);
    }
    return elem
  }

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

    return freeze(retrieve);
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
    return freeze(generic);
  }());

  var basics = fsvg.basicshape = {
    setLocation: function (x, y) {
      retrieve.setLength.call(this, 'x', x);
      retrieve.setLength.call(this, 'y', y);
    },
    setSize: function (width, height) {
      retrieve.setLength.call(this, 'width', width);
      retrieve.setLength.call(this, 'height', height);
    }
  }

  var svge = fsvg.svge = (function() {
    var svge = {};
    var setViewBox = svge.setViewBox = function (x, y, width, height) {
      this.setAttribute('viewBox', [x, y, width, height]);
    }
    var setViewExtent = svge.setViewExtent = function (x1, y1, x2, y2) {
      this.setAttribute('viewBox', extentToLS(x1, y1, x2, y2));
    }
    var viewBoxBase = svge.viewBox = function () {
      return this.viewBox.baseVal;
    }
    var defs = svge.defs = function () {
      return this.querySelector('defs');
    }
    return svge;
  }());


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

    return freeze(line);
  }());

  var rect = fsvg.rect = (function() {

    var rect = {};
    //extend(rect, basicSetters);
    extend(rect, basics, ['setLocation', 'setSize']);

    var setLength = retrieve.setLength,
        setStyle = retrieve.setStyle,
        setLocation = basics.setLocation,
        setSize = basics.setSize;

    rect.setWidth = partialone(setLength, 'width');
    rect.setHeight = partialone(setLength, 'height');
    rect.setX = partialone(setLength, 'x');
    rect.setY = partialone(setLength, 'y');

    var setExtent = rect.setExtent = function (x1, y1, x2, y2) {
      var params = extentToLS(x1, y1, x2, y2);
      setLocation.call(this, params[0], params[1]);
      setSize.call(this, params[2], params[3]);
    }

    return freeze(rect);
  }());

  var poly = fsvg.poly = (function() {
    // for polygons and polylines
    var poly = {};
    var setLength = retrieve.setLength;

    var setByString = poly.setByString = function (str) {
          this.setAttribute('points', str);
        },
        getPoints = poly.getPoints = function () {
          return this.points;
        }
    return freeze(poly);
  }());

  var group = fsvg.group = (function() {
    var group = {};
    //extend(group, basicSetters);
    return freeze(group);
  }());


  var use = fsvg.use = (function() {
    var use = {};
    //extend(use, basicSetters);
    extend(use, basics, ['setLocation']);

    var setHref = use.setHref = function (href) {
      this.setAttributeNS(XLINKNS, 'href', href);
    }
    return freeze(use);
  }());


return fsvg;
}(fsvg || {}));
