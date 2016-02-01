/*  fsvg.js: Adventures in SVG manipulation for fun and profit
    ... okay, maybe just fun.                                  */


/*

Revised Version! Now, the plan is to lump all basic primitives together
under fsvg or maybe flagshapes. things such as crosses, stars, that pinwheel
shaped mask thing, etc, etc.

*/

var fsvg = (function(fsvg) {
  'use strict';

  var SVGNS = "http://www.w3.org/2000/svg";


  fsvg.Felement = (function() {
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

  fsvg.FSVGE = (function() {
    // Contains the whole flag.
    function FSVGE (element) {
      // can be passed an existing SVG Element to wrap.
      fsvg.Felement.call(this);

      if (element && element.nodeName === "svg") {
        this.node = element;
      } else {
        this.node = document.createElementNS(SVGNS, "svg");
      }
    }

    var p = FSVGE.prototype = Object.create(fsvg.Felement.prototype);

    return FSVGE;
  }());



  fsvg.Fshape = (function() {
    // generic shape class. All shape SVG elements are created through here
    function Fshape(tag) {
      fsvg.Felement.call(this);
      // creates a new SVG Element, which can be accessed using this.node
      this.node = document.createElementNS(SVGNS, tag);

    }
    var p = Fshape.prototype = Object.create(fsvg.Felement.prototype);

    return Fshape;
  }());

  fsvg.describe = (function() {

    // This part is totally unnecessary, but then again, so is this whole project.

    // I've gone too deep.

    var lengthFactory = function(property) {
      return {
        get: function () {return this.node[property].baseVal.value},
        set: function(x) {return this.node[property].baseVal.value = x}
      }
    }

    var styleFactory = function(property) {
      return {
        get: function () {return this.node.style[property]},
        set: function(x) {return this.node.style[property] = x}
      }
    }

    var attrFactory = function(property) {
      return {
        get: function () {return this.node.getAttribute(property)},
        set: function(x) {return this.node.setAttribute(property, x)}
      }
    }

    var descriptorProto = {
      configurable: true,
      enumerable: false
    }

    var makeDescriptor = function(accessor, coercers) {
      var descriptor = Object.create(descriptorProto);
      descriptor.get = accessor.get;
      descriptor.set = accessor.set;
      if (coercers) {
        if (coercers.get) {
          descriptor.get = function() {
            return coercers.get(accessor.get.call(this));
          }
        };
        if (coercers.set) {
          descriptor.set = function(x) {
            return accessor.set.call(this, coercers.set(x));
          }
        };
      };
      return descriptor;
    }

    var descriptorMaker = function(factory) {
      return (function(property, coercers) {
        return makeDescriptor(factory(property), coercers);
      });
    }

    return {
      length: descriptorMaker(lengthFactory),
      style: descriptorMaker(styleFactory),
      attribute: descriptorMaker(attrFactory),
    }
  }());

  fsvg.Fline = (function() {
    function Fline (x1, y1, x2, y2) {
      // tag = 'line'
      fsvg.Fshape.call(this, "line");

      if (typeof x1 !== 'undefined') {
        this.setExtent(x1, y1, x2, y2);
      }
    };
    // extends Fshape
    var p = Fline.prototype = Object.create(fsvg.Fshape.prototype, {
      x1: fsvg.describe.length('x1'),
      x2: fsvg.describe.length('x2'),
      y1: fsvg.describe.length('y1'),
      y2: fsvg.describe.length('y2'),
      colour: fsvg.describe.style('stroke'),
      width:  fsvg.describe.style('strokeWidth', {get: Number, set: Number})
    });

    p.setStart = function(x, y) {
      this.x1 = x;
      this.y1 = y;
      return this;
    }

    p.setEnd = function(x, y) {
      this.x2 = x;
      this.y2 = y;
      return this;
    }

    p.setExtent = function (x1, y1, x2, y2) {
      return this.setStart(x1, y1).setEnd(x2, y2);
    }

    return Fline;
  }());

  fsvg.Frect = (function() {
    function Frect (x1, y1, x2, y2) {
      // tag = 'rect'
      fsvg.Fshape.call(this, 'rect');

      if (typeof x1 !== 'undefined') {
        this.setExtent(x1, y1, x2, y2);
      }
    };
    // Extends Fshape
    var p = Frect.prototype = Object.create(fsvg.Fshape.prototype, {
      x: fsvg.describe.length('x'),
      y: fsvg.describe.length('y'),
      width:  fsvg.describe.length('width'),
      height: fsvg.describe.length('height'),
      colour: fsvg.describe.style('fill')
    });


    p.setLocation = function(x, y) {
      this.x = x;
      this.y = y;
      return this;
    }

    p.setSize = function(width, height) {
      this.width = width;
      this.height = height;
      return this;
    }

    p.setExtent = function(x1, y1, x2, y2) {
      var xmin = Math.min(x1, x2),
        ymin = Math.min(y1, y2),
        xdif = Math.abs(x1 - x2),
        ydif = Math.abs(y1 - y2);
      return this.setLocation(xmin, ymin).setSize(xdif, ydif);
    }

    return Frect;
  }());


  fsvg.Fpolygon = (function () {
    function Fpolygon (pstr) {
      fsvg.Fshape.call(this, "polygon")

      if (typeof pstr !== 'undefined') {
        this.setByString(pstr);
      }
    }
    var p = Fpolygon.prototype = Object.create(fsvg.Fshape.prototype, {
      colour: fsvg.describe.style('fill')
    });

    p.setByString = function (pstr) {
      this.node.setAttribute("points", pstr);
      return this;
    }

    p.getPoint = function (index) {
      return this.node.points[index];
    }

    p.setPoint = function (index, x, y) {
      var point = this.node.points[index];
      point.x = x;
      point.y = y;
      return this;
    }

    return Fpolygon;
  }());

/* TODO: replace this. Any new functionality can be folded into Fpolygon
(or a more specific derived class, such as one for a qw-mask).

  fsvg.Fquadrilateral = (function() {
    function Fquadrilateral (w, h) {
      fsvg.Fpolygon.call(this);
      // By default, a rectangle of dimensions (w,h) in +ve direction from 0,0
      w = (typeof w === 'undefined') ? 0 : w;
      h = (typeof h === 'undefined') ? w : h;
      this.setByString([0, 0, w, 0, w, h, 0, h].join(" "));
    }
    var p = Fquadrilateral.prototype = Object.create(fsvg.Fpolygon.prototype);

    return Fquadrilateral;
  }());


  A JUST FOR FUNSIES thing that is kinda useless, but fun to think about

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
      this.transform = tf.createSVGTransformFromMatrix(zeromatrix);
      tf.initialize(this.transform);
      this.matrix = this.transform.matrix;
    }
    var p = Frline.prototype = Object.create(fsvg.Fshape.prototype);

    // JUST FOR FUNSIES: Not the best way to do it, but whatever
    var zeromatrix = (function() {
      var m = document.querySelector('svg').createSVGMatrix();
      m.a = 0;
      m.d = 0;
      return m
    }());

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
*/

return fsvg;
}(fsvg || {}));
