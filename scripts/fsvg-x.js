// fsvg-x.js: Even More Unnecessary Than The Regular One!
var fsvg = (function(fsvg) {
  'use strict';

  var
    retrieve = fsvg.retrieve,
   SVGNS = "http://www.w3.org/2000/svg",
    XLINKNS = "http://www.w3.org/1999/xlink";

  var describe = fsvg.describe = (function() {
    // Provides a way to generate descriptors for properties
    // SVGAnimatedLength
    var lengthFactory = function(pname, aname) {
      return {
        get: function() {
          return retrieve.getLength.call(this[pname], aname)
        },
        set: function(x) {
          retrieve.setLength.call(this[pname], aname, x)
        }
      }
    }

    // CSS2Properties
    var styleFactory = function(pname, aname) {
      return {
        get: function() {
          return retrieve.getStyle.call(this[pname], aname)
        },
        set: function(x) {
          retrieve.setStyle.call(this[pname], aname, x)
        }
      }
    }

    // attribute (no namespace)
    var attrFactory = function(pname, aname) {
      return {
        get: function() {
          return this[pname].getAttribute(aname)
        },
        set: function(x) {
          this[pname].setAttribute(aname, x)
        }
      }
    }

    // normal property / method
    var propFactory = function(pname, aname) {
      return {
        get: function() {
          return this[pname][aname]
        },
        set: function(x) {
          this[pname][aname] = x
        }
      }
    }

    var descriptorProto = {
      configurable: true,
      enumerable: false,
      // Explicitly define get and set as undefined,
      // so we can overwrite existing properties
      get: undefined,
      set: undefined
    }

    var makeDescriptor = function(accessors, coercers) {
      coercers = coercers || {};
      var desc = Object.create(descriptorProto);

      if (typeof coercers.get === 'function') {
        desc.get = function() {
          return coercers.get(accessors.get.call(this))
        }
      } else if (coercers.get !== null) {
        desc.get = accessors.get;
      }
      if (typeof coercers.set === 'function') {
        desc.set = function(x) {
          accessors.set.call(this, coercers.set(x))
        }
      } else if (coercers.set !== null) {
        desc.set = accessors.set;
      }
      return desc;
    }

    var descriptorMaker = function(factory) {
      return (function(property, coercers, location) {
        location = location || 'node';
        return makeDescriptor(factory(location, property), coercers);
      });
    }


    return {
      length: descriptorMaker(lengthFactory),
      style: descriptorMaker(styleFactory),
      attribute: descriptorMaker(attrFactory),
      property: descriptorMaker(propFactory),
      makeDescriptor: makeDescriptor
    }
  }());

  // Uses a descriptor or equivalent but instead just creates prefixed methods


  var MixinMethods = function(target, source, names) {
    names = (typeof names === 'undefined') ? Object.keys(source) : names;
    names.forEach(function(key, index, array) {
      target[key] = source[key];
    })
  }

  var mContainer = {
    // mixin for FSVG containing things in this.node
    appendWrappers: function() {
      for (var i = 0; i < arguments.length; i++) {
        var obj = arguments[i];
        this.node.appendChild(obj.node);
      }
    },
  }


  var newSVGElem = function(tag) {
    return document.createElementNS(SVGNS, tag)
  }


  var lineTools = (function(retrieve) {

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
  }(retrieve));

  var rectTools = (function(retrieve) {
    var setLength = retrieve.setLength,
      setStyle = retrieve.setStyle;

    var setLocation = function(x, y) {
      setLength.call(this, 'x', x);
      setLength.call(this, 'y', y);
      return this;
    }

    var setSize = function(width, height) {
      setLength.call(this, 'width', width);
      setLength.call(this, 'height', height);
      return this;
    }

    var setExtent = function(x1, y1, x2, y2) {
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
  }(retrieve));


  var Felement = fsvg.Felement = (function() {
    // Simple helping stuff for SVGElements.
    function Felement() {
      // pretty much nothing goes here at the moment
      // although keep in mind that this.node is where nodes go
    }
    var p = Felement.prototype;

    p.appendToNode = function(parentnode) {
      parentnode.appendChild(this.node);
    }

    p.getOwnerSVG = function() {
      return this.node.ownerSVGElement;
    }

    return Felement;
  }());

  var FSVGE = fsvg.FSVGE = (function() {
    // Contains the whole flag.
    function FSVGE(element) {
      // can be passed an existing SVG Element to wrap.
      Felement.call(this);

      if (element && element.nodeName === "svg") {
        this.node = element;
      } else {
        this.node = newSVGElem("svg");
      }
    }

    var p = FSVGE.prototype = Object.create(Felement.prototype);
    MixinMethods(p, mContainer);

    return FSVGE;
  }());


  var Fshape = fsvg.Fshape = (function() {
    // generic shape class. All shape SVG elements are created through here
    function Fshape(tag) {
      Felement.call(this);
      // creates a new SVG Element, which can be accessed using this.node
      this.node = newSVGElem(tag);

    }
    var p = Fshape.prototype = Object.create(Felement.prototype);

    return Fshape;
  }());

  var Fline = fsvg.Fline = (function() {
    function Fline(x1, y1, x2, y2) {
      // tag = 'line'
      Fshape.call(this, "line");

      if (typeof x1 !== 'undefined') {
        this.setExtent(x1, y1, x2, y2);
      }
    };
    // extends Fshape
    var p = Fline.prototype = Object.create(Fshape.prototype, {
      x1: describe.length('x1'),
      x2: describe.length('x2'),
      y1: describe.length('y1'),
      y2: describe.length('y2'),
      colour: describe.style('stroke'),
      thickness: describe.style('strokeWidth', {
        get: Number,
        set: Number
      })
    });

    p.setStart = function(x, y) {
      lineTools.setStart.call(this.node, x, y);
      return this;
    }

    p.setEnd = function(x, y) {
      lineTools.setEnd.call(this.node, x, y);
      return this;
    }

    p.setExtent = function(x1, y1, x2, y2) {
      lineTools.setExtent.call(this.node, x1, y1, x2, y2);
      return this;
    }

    return Fline;
  }());

  var Frect = fsvg.Frect = (function() {
    function Frect(x1, y1, x2, y2) {
      // tag = 'rect'
      Fshape.call(this, 'rect');

      if (typeof x1 !== 'undefined') {
        this.setExtent(x1, y1, x2, y2);
      }
    };
    // Extends Fshape
    var p = Frect.prototype = Object.create(Fshape.prototype, {
      x: describe.length('x'),
      y: describe.length('y'),
      width: describe.length('width'),
      height: describe.length('height'),
      colour: describe.style('fill')
    });


    p.setLocation = function(x, y) {
      rectTools.setLocation.call(this.node, x, y);
      return this;
    }

    p.setSize = function(width, height) {
      rectTools.setSize.call(this.node, width, height);
      return this;
    }

    p.setExtent = function(x1, y1, x2, y2) {
      rectTools.setExtent.call(this.node, x1, y1, x2, y2);
      return this;
    }

    return Frect;
  }());


  var Fpolygon = fsvg.Fpolygon = (function() {
    function Fpolygon(pstr) {
      Fshape.call(this, "polygon")

      if (typeof pstr !== 'undefined') {
        this.setByString(pstr);
      }
    }
    var p = Fpolygon.prototype = Object.create(Fshape.prototype, {
      colour: describe.style('fill')
    });

    p.setByString = function(pstr) {
      this.node.setAttribute("points", pstr);
      return this;
    }

    p.getPoint = function(index) {
      return this.node.points[index];
    }

    p.setPoint = function(index, x, y) {
      var point = this.node.points[index];
      point.x = x;
      point.y = y;
      return this;
    }

    return Fpolygon;
  }());

  fsvg.Frline = (function() {
    function Frline() {
      fsvg.Fshape.call(this, "rect");

      // Set up rectangle
      this.node.x.baseVal.value = 0;
      this.node.y.baseVal.value = -0.5;
      this.node.width.baseVal.value = 1;
      this.node.height.baseVal.value = 1;

      // Set up transform
      var tf = this.node.transform.baseVal;
      this.transform = tf.createSVGTransformFromMatrix(zeromatrix());
      tf.initialize(this.transform);
      this.matrix = this.transform.matrix;
    }
    var p = Frline.prototype = Object.create(fsvg.Fshape.prototype);

    // JUST FOR FUNSIES: Not the best way to do it, but whatever
    var zeromatrix = function() {
      var m = document.querySelector('svg').createSVGMatrix();
      m.a = 0;
      m.d = 0;
      return m
    };

    var pythag = function(a, b) {
      return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2))
    }


    p.replot = function() {
      var dx = this.x2 - this.x1;
      var dy = this.y2 - this.y1;
      var r = this.width / pythag(dx, dy);
      this.matrix.a = dx;
      this.matrix.b = dy;
      this.matrix.c = -r * dy;
      this.matrix.d = r * dx;
      this.matrix.e = this.x1;
      this.matrix.f = this.y1;
      return this
    }

    p.redo = function(x1, y1, x2, y2, w) {
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
      this.width = w;
      return this.replot();
    }
    return Frline;
  }());


  return fsvg;
}(fsvg || {}));
