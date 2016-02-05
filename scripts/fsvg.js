/*  fsvg.js: Adventures in SVG manipulation for fun and profit
    ... okay, maybe just fun.                                  */


/*

Revised Version! Now, the plan is to lump all basic primitives together
under fsvg or maybe flagshapes. things such as crosses, stars, that pinwheel
shaped mask thing, etc, etc.

*/

var fsvg = (function(fsvg) {
  'use strict';

  var SVGNS = "http://www.w3.org/2000/svg",
      XLINKNS = "http://www.w3.org/1999/xlink";

  var describe = fsvg.describe = (function() {
    // Provides a way to generate descriptors for properties

    // SVGAnimatedLength
    var lengthFactory = function(pname, aname) {
      return {
        get: function () {return this[pname][aname].baseVal.value},
        set: function(x) {this[pname][aname].baseVal.value = x}
      }
    }

    // CSS2Properties
    var styleFactory = function(pname, aname) {
      return {
        get: function () {return this[pname].style[aname]},
        set: function(x) {this[pname].style[aname] = x}
      }
    }

    // attribute (no namespace)
    var attrFactory = function(pname, aname) {
      return {
        get: function () {return this[pname].getAttribute(aname)},
        set: function(x) {this[pname].setAttribute(aname, x)}
      }
    }

    // normal property / method
    var propFactory = function(pname, aname) {
      return {
        get: function () {return this[pname][aname]},
        set: function(x) {this[pname][aname] = x}
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
  var defineManualGetSet = function (obj, descs) {
    Object.keys(descs).forEach(function (key, index, array) {
      if (descs[key].get) {obj['get_'+key] = descs[key].get;}
      if (descs[key].set) {obj['set_'+key] = descs[key].set;}
    })
  }

  var MixinMethods = function (target, source, names) {
    names = (typeof names === 'undefined') ? Object.keys(source) : names;
    names.forEach(function (key, index, array) {
      target[key] = source[key];
    })
  }

  var mContainer = {
    // mixin for FSVG containing things in this.node
    appendWrappers: function () {
      for (var i=0; i<arguments.length; i++) {
        var obj = arguments[i];
        this.node.appendChild(obj.node);
      }
    },
  }

  // utility, for use with the coercers parameter when using makeDescriptor
  var utility = (function() {
    var halve = function (x) {return x/2}
    var double = function (x) {return x*2}
    return {
      halve: halve,
      double: double,
      halfToFull: {
        get: double,
        set: halve
      }
    }
  }());




  var Felement = fsvg.Felement = (function() {
    // Simple helping stuff for SVGElements.
    function Felement() {
      // pretty much nothing goes here at the moment
      // although keep in mind that this.node is where nodes go
    }
    var p = Felement.prototype;
    Object.defineProperties(p, {
      id: describe.property('id')
    })

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
    function FSVGE (element) {
      // can be passed an existing SVG Element to wrap.
      Felement.call(this);

      if (element && element.nodeName === "svg") {
        this.node = element;
      } else {
        this.node = document.createElementNS(SVGNS, "svg");
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
      this.node = document.createElementNS(SVGNS, tag);

    }
    var p = Fshape.prototype = Object.create(Felement.prototype);

    return Fshape;
  }());

  var Fline = fsvg.Fline = (function() {
    function Fline (x1, y1, x2, y2) {
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
      thickness:  describe.style('strokeWidth', {get: Number, set: Number})
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

  var Frect = fsvg.Frect = (function() {
    function Frect (x1, y1, x2, y2) {
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
      width:  describe.length('width'),
      height: describe.length('height'),
      colour: describe.style('fill')
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


  var Fpolygon = fsvg.Fpolygon = (function () {
    function Fpolygon (pstr) {
      Fshape.call(this, "polygon")

      if (typeof pstr !== 'undefined') {
        this.setByString(pstr);
      }
    }
    var p = Fpolygon.prototype = Object.create(Fshape.prototype, {
      colour: describe.style('fill')
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

  // More complex shapes!

  var Fcross = fsvg.Fcross = (function() {
    function Fcross (halfWidth, halfHeight) {
      Fshape.call(this, "g");

      this._hline = new Fline(-halfWidth, 0, halfWidth, 0);
      this._vline = new Fline(0, -halfHeight, 0, halfHeight);
      this._hw = hw;
      this._hh = hh;
      this.appendWrappers(this._hline, this._vline);

    }
    var p = Fcross.prototype = Object.create(Fshape.prototype, {
      thickness: describe.style('strokeWidth', {get: Number, set: Number}),
      colour: describe.style('stroke'),
    });
    MixinMethods(p, mContainer);

    p.setHalfWidth = function (hw) {
      this._hline.x1 = -hw;
      this._hline.x2 = hw;
      this._hw = hw
      return this;
    }

    p.setHalfHeight = function (hh) {
      this._vline.y1 = -hh;
      this._vline.y2 = hh;
      this._hh = hh;
      return this;
    }

    var hwaccessors = {
      get: function () {return this._hw},
      set: p.setHalfWidth
    }
    var hhaccessors = {
      get: function () {return this._hh},
      set: p.setHalfHeight
    }

    Object.defineProperties(p, {
      halfWidth: describe.makeDescriptor(hwaccessors),
      halfHeight: describe.makeDescriptor(hhaccessors),
      fullWidth: describe.makeDescriptor(hwaccessors, utility.halfToFull),
      fullHeight: describe.makeDescriptor(hhaccessors, utility.halfToFull)
    });

    return Fcross;
  }());



return fsvg;
}(fsvg || {}));
