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

  fsvg.describe = (function() {
    // This part is totally unnecessary, but then again, so is this whole project.
    // I've gone too deep.

    var lengthFactory = function(property) {
      return {
        get: function () {return this.node[property].baseVal.value},
        set: function(x) {this.node[property].baseVal.value = x}
      }
    }

    var styleFactory = function(property) {
      return {
        get: function () {return this.node.style[property]},
        set: function(x) {this.node.style[property] = x}
      }
    }

    var attrFactory = function(property) {
      return {
        get: function () {return this.node.getAttribute(property)},
        set: function(x) {this.node.setAttribute(property, x)}
      }
    }

    var propFactory = function(property) {
      return {
        get: function () {return this.node[property]},
        set: function(x) {this.node[property] = x}
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
        desc.get = function () {return coercers.get(accessors.get.call(this))}
      } else if (coercers.get !== null) {
        desc.get = accessors.get;
      }
      if (typeof coercers.set === 'function') {
        desc.set = function (x) {accessors.set.call(this, coercers.set(x))}
      } else if (coercers.set !== null) {
        desc.set = accessors.set;
      }
      return desc;
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
      property: descriptorMaker(propFactory)
    }
  }());

  fsvg.Felement = (function() {
    // Simple helping stuff for SVGElements.
    function Felement() {
      // pretty much nothing goes here at the moment
      // although keep in mind that this.node is where nodes go
    }
    var p = Felement.prototype;
    Object.defineProperties(p, {
      id: fsvg.describe.property('id')
    })

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

return fsvg;
}(fsvg || {}));
