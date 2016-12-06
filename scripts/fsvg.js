/*  fsvg.js: Adventures in SVG manipulation for fun and profit
    ... okay, maybe just fun.                                  */


var fsvg = (function(fsvg) {
  'use strict';

  var SVGNS = fsvg.SVGNS = "http://www.w3.org/2000/svg",
      XLINKNS = fsvg.XLINKNS = "http://www.w3.org/1999/xlink";


  // Mixin Utilities
  var extend = fsvg.extend = function (target, source, methodNames) {
    /* Copies methods from source to target. */
    methodNames = methodNames || Object.keys(source);
    methodNames.forEach(function (methodName) {
      target[methodName] = source[methodName];
    });
    return target;
  }

  var partialone = fsvg.partialone = function (fn, firstarg) {
    /* Partially applies the first argument to functions that take two. */
    return function (value) {
      return fn.call(this, firstarg, value);
    }
  }

  var partial = fsvg.partial = function (fn) {
    /* Partially applies any number of arguments! */
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
      /* Simply throws an error if the id is invalid.
         I might change this to escape invalid characters instead somehow */
      if (test(id)) {
        return id;
      } else {
        throw new Error("Invalid id: " + id);
      }
    }
    /* IRI, for use in xlink:href attribute */
    var IRI = function (id) {return "#" + valid(id);}
    /* funcIRI, for use in style attributes */
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
    /* Takes two points (x1, y1) and (x2, y2) and returns values suitable
       for use with x, y, width, height parameters */
    var xmin = Math.min(x1, x2),
        ymin = Math.min(y1, y2),
        xdif = Math.abs(x1 - x2),
        ydif = Math.abs(y1 - y2);
    return {x:xmin, y:ymin, width:xdif, height:ydif};
  }

  var newElement = fsvg.newElement = function (tag, id) {
    var elem = document.createElementNS(SVGNS, tag);
    if (typeof id !== 'undefined') {
      elem.id = idiri.valid(id);
    }
    return elem
  }
  var retrieve = fsvg.retrieve = freeze({
    // Helper functions for grabbing SVG properties.
    // For use with 'this' and call

    // SVGAnimatedLength
    getLength: function(prop) {
      return this[prop].baseVal.value;
    },
    setLength: function(prop, x) {
      this[prop].baseVal.value = x;
    },
    // CSS2Properties
    getStyle: function(prop) {
      return this.style[prop];
    },
    setStyle: function(prop, x) {
      this.style[prop] = x;
    },
    // attribute
    getAttribute: function(prop) {
      return this.getAttribute(prop);
    },
    setAttribute: function(prop, x) {
      this.setAttribute(prop, x)
    },
    // property
    getProperty: function(prop) {
      return this[prop];
    },
    setProperty: function(prop, x) {
      this[prop] = x;
    }
  });

  var transforms = fsvg.transforms = freeze({
    flipX: function() {
      this.setAttribute('transform', 'scale(-1, 1)');
    },
    flipY: function() {
      this.setAttribute('transform', 'scale( 1,-1)');
    },
    flipXY: function() {
      this.setAttribute('transform', 'scale(-1,-1)')
    },
    clear: function() {
      this.setAttribute('transform', '');
    }
  })

  var basicSetters = extend({}, retrieve,
     ['setLength', 'setStyle', 'setProperty', 'setAttribute']);

  var generic = fsvg.generic = freeze({
    getId: function() {
      return this.id;
    },
    setId: function(id) {
      id = idiri.valid(id);
      return this.id = id;
    },
    appendToNode: function(parentnode) {
      parentnode.appendChild(this);
    },
    getOwnerSVG: function() {
      return this.ownerSVGElement;
    }
  });

  var genericshape = fsvg.genericshape = freeze({
    setVisibility: function(b) {
      retrieve.setStyle.call(this, 'visibility', b ? 'visible' : 'hidden');
    }
  })

  var basicshape = fsvg.basicshape = freeze({
    setLocation: function (x, y) {
      retrieve.setLength.call(this, 'x', x);
      retrieve.setLength.call(this, 'y', y);
    },
    setSize: function (width, height) {
      retrieve.setLength.call(this, 'width', width);
      retrieve.setLength.call(this, 'height', height);
    },
    setExtent: function (x1, y1, x2, y2) {
      var LS = extentToLS(x1, y1, x2, y2);
      retrieve.setLength.call(this, 'x', LS.x);
      retrieve.setLength.call(this, 'y', LS.y);
      retrieve.setLength.call(this, 'width', LS.width);
      retrieve.setLength.call(this, 'height', LS.height);
    }
  });

  var svge = fsvg.svge = (function() {
    var svge = {};
    var setViewBox = svge.setViewBox = function (x, y, width, height) {
      this.setAttribute('viewBox', [x, y, width, height]);
    }
    svge.setViewExtent = function (x1, y1, x2, y2) {
      var LS = extentToLS(x1, y1, x2, y2);
      setViewBox.call(this, LS.x, LS.y, LS.width, LS.height);
    }
    svge.setViewHalfWidth = function (halfWidth) {
      this.viewBox.baseVal.x = -halfWidth;
      this.viewBox.baseVal.width = halfWidth * 2;
    }
    svge.setViewHalfHeight = function (halfHeight) {
      this.viewBox.baseVal.y = -halfHeight;
      this.viewBox.baseVal.height = halfHeight * 2;
    }

    svge.appendObjects = function () {
      // Objects should have an appendToNode method
      for (var i=0; i<arguments.length; i++) {
        arguments[i].appendToNode(this);
      }
    }
    return freeze(svge);
  }());


  var line = fsvg.line = (function() {

    var line = {};
    //extend(line, basicSetters);

    var setLength = retrieve.setLength;

    var setStart = line.setStart = function(x, y) {
      setLength.call(this, 'x1', x);
      setLength.call(this, 'y1', y);
    }
    var setEnd = line.setEnd = function(x, y) {
      setLength.call(this, 'x2', x);
      setLength.call(this, 'y2', y);
    }
    line.setExtent = function(x1, y1, x2, y2) {
      setStart.call(this, x1, y1);
      setEnd.call(this, x2, y2);
    }

    return freeze(line);
  }());

  var rect = fsvg.rect = (function() {

    var rect = {};
    //extend(rect, basicSetters);
    extend(rect, basicshape);

    var setLength = retrieve.setLength;
    rect.setWidth = partialone(setLength, 'width');
    rect.setHeight = partialone(setLength, 'height');
    rect.setX = partialone(setLength, 'x');
    rect.setY = partialone(setLength, 'y');
    return freeze(rect);
  }());

  var poly = fsvg.poly = (function() {
    // for polygons and polylines
    var poly = {};
    poly.setByString = function (str) {
        this.setAttribute('points', str);
    }
    poly.getPoints = function () {
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
    extend(use, basicshape, ['setLocation']);

    var setHref = use.setHref = function (href) {
      this.setAttributeNS(XLINKNS, 'href', href);
    }
    return freeze(use);
  }());


return fsvg;
}(fsvg || {}));
