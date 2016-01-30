/*  fsvg.js: Adventures in SVG manipulation for fun and profit
    ... okay, maybe just fun.                                  */

var fsvg = (function() {
  'use strict';

  var SVGNS = "http://www.w3.org/2000/svg";

  var Felement = (function() {
    // A Felement contains an SVG Element. Very basic thing.
    // Creating a Felement also creates an SVG Element.
    function Felement(tag) {
      this.createNode(tag);
      this.children = [];
    }
    var p = Felement.prototype;
    p.constructor = Felement;
    // Is setting the constructor even necessary? I don't know.

    p.createNode = function(tag) {
      // creates a new SVG Element, which can be accessed using this.node
      this.node = document.createElementNS(SVGNS, tag);
    }

    p.append = function(child) {
      // appends another Felement.
      // It might be a good idea to do some sort of
      // child instanceof Felement check here.
      this.node.appendChild(child.node);


      this.children.push(child);
    }

    p.appendTo = function(parent) {
      parent.node.appendChild(this.node);
    }

    p.appendToNode = function(parentnode) {
      parentnode.appendChild(this.node);
    }

    p.setAttribute = function(name, value) {
      // a convenience
      this.node.setAttribute(name, value);
      return this;
    }

    return Felement;
  }());

  var FDescriptor = (function() {

    // This part is totally unnecessary, but then again, so is this whole project.

    // I've gone too deep.

    var lengthFactory = function(property) {
      return {
        get: function() {
          return this.node[property].baseVal.value
        },
        set: function(x) {
          return this.node[property].baseVal.value = x
        }
      }
    }

    var styleFactory = function(property) {
      return {
        get: function() {
          return this.node.style[property]
        },
        set: function(x) {
          return this.node.style[property] = x
        }
      }
    }

    var attrFactory = function(property) {
      return {
        get: function() {
          return this.node.getAttribute(property)
        },
        set: function(x) {
          return this.node.setAttribute(property, x)
        }
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


  var Fshape = (function() {
    function Fshape(tag) {
      Felement.call(this, tag);
    };
    // extends Felement
    var p = Fshape.prototype = Object.create(Felement.prototype);

    return Fshape;
  }());

  var Fline = (function() {
    function Fline() {
      // tag = 'line'
      Fshape.call(this, "line");
    };
    // extends Fshape
    var p = Fline.prototype = Object.create(Fshape.prototype, {
      x1: FDescriptor.length('x1'),
      x2: FDescriptor.length('x2'),
      y1: FDescriptor.length('y1'),
      y2: FDescriptor.length('y2'),
      colour: FDescriptor.style('stroke'),
      width: FDescriptor.style('strokeWidth', {
        get: Number,
        set: Number
      })
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


    return Fline;
  }());

  var Frect = (function() {
    function Frect() {
      // tag = 'rect'
      Fshape.call(this, 'rect');
    };
    // Extends Fshape
    var p = Frect.prototype = Object.create(Fshape.prototype, {
      x: FDescriptor.length('x'),
      y: FDescriptor.length('y'),
      width: FDescriptor.length('width'),
      height: FDescriptor.length('height'),
      colour: FDescriptor.style('fill')
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


  var Frline = (function() {
    function Frline() {
      Fshape.call(this, "rect");

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
    var p = Frline.prototype = Object.create(Fshape.prototype);

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


// Doing things "properly" has never really been my strong point.

         /*
    Rough outline of how this structure works (or doesn't work).
    PRIMITIVE SHAPES. Basically, lines and rectangles. Wrap SVG shapes.
    GRAPHIC ELEMENTS. Represent crosses, saltires etc. Wrap SVG groups.
    FLAG STRUCTURE. Represents the whole flag. Also wraps SVG groups.
    - contains GElements, which countain PShapes.
      GElements can also contain GElements...

    You know what, this doesn't actually make any sense.

    Part III in the thrilling series: Getting Way Ahead Of Myself:
    Using the SVG DOM API itself.

    As I am only manipulating rectangles and polygons,
    it shouldn't be too hard.
    (Famous last words right there.)

    Lengths are represented in the API by SVGLength,
    Points by SVGPoint, which live in SVGPointList.
    There's also SVGTransform and SVGMatrix, and SVGAngle, and
    the ways to style with fill and stroke, which use the style interface
    instead of the SVG one.

    Simply, to set a length, we use <element>.length.baseVal.value
    or .valueInSpecifiedUnits. To change the units there's two methods which
    are used to either change the units, keeping the same actual value
    (5cm = 50mm etc) or just change both in one fell swoop.

    I don't know which one I should use, either setting
    value or valueInSpecifiedUnits. I suppose value corresponds to
    'user coordinate pixels' or something like that.

    Since this is going to be a simple programmatical thing, I think using
    'value' (with implied user units) is the best. I dunno.


    Now, on to colour, or to be precise, paint.
    In SVG, the paint can be defined as attributes like fill='blue',
    inline styles like style="fill:'blue';", and proper CSS stylesheets which can
    reside inside the SVG element, on the HTML page, inline or linked.
    I believe attributes > inline styles > stylesheets when it comes to priority.
    Thus, there are different ways to programatically set the colour.
    Setting the attributes is done via document.setAttribute('fill', col) etc.
    Setting via the inline style is done by accessing (node).style.fill = col,
    or (node).style.setProperty('fill', col).
    Changing a stylesheet is a bit more complicated but can be done by accessing
    the stylesheet element and then getting the actual rule that is applied,
    which lives in (stylesheet node).sheet.cssRules. Once you have that then you
    can use (cssRule).style and so on.

    For the sake of simplicity, let's use the inline style version, so we don't
    have to mess around too much with setting attributes.

   */

}());
