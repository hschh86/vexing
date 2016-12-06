// flagshapes.js. A collection of various shapes.

var FlagShapes = (function(FlagShapes, fsvg) {
  var retrieve = fsvg.retrieve,
      newElement = fsvg.newElement;
      extend = fsvg.extend;
      partialone = fsvg.partialone;
      idiri = fsvg.idiri;


  var makeMethodsWorkOnProperty = function(reciever, source, propertyName, methodNames) {
    /* Extends the 'reciever' object with the methods from source, but
       with the new methods applied to a property of reciever instead.
       Used for things like e.setWidth(x) -> source.setWidth.call(e.node, x) */
    methodNames = methodNames || Object.keys(source);
    methodNames.forEach(function (methodName) {
      var sourceMethod = source[methodName];
      if (sourceMethod) {
        reciever[methodName] = function () {
          // this[propertyName] is usually this.node
          return sourceMethod.apply(this[propertyName], arguments);
        }
      }
    });
    return reciever;
  }

  var GenericShapeProto = makeMethodsWorkOnProperty({}, fsvg.generic, 'node');
  makeMethodsWorkOnProperty(GenericShapeProto, fsvg.genericshape, 'node');
  /* Implements things like setId, getOwnerSVG, appendToNode etc */

  var addInstances = (function() {
    /* extends sourcePrototype object with a makeInstance method that creates
       a <use> element that references the context element. */

    var InstantiateInstance = function (proto, sourceid, instid) {
      /* Inner function that creates instance objects */
      var iri = idiri.IRI(sourceid);
      var newInstance = Object.create(proto);
      newInstance.node = newElement('use', instid);
      fsvg.use.setHref.call(newInstance.node, iri);

      return newInstance;
    }

    return function (sourcePrototype, methodNames) {
      var instancePrototype = Object.create(GenericShapeProto);
      // methods from sourcePrototype can be added to the instance prototype
      extend(instancePrototype, sourcePrototype, methodNames);
      makeMethodsWorkOnProperty(instancePrototype, fsvg.use, 'node');

      sourcePrototype.makeInstance = function (instid) {
        var id = this.getId();
        return InstantiateInstance(instancePrototype, id, instid);
      }
      return sourcePrototype;
    }
  }());

  var StyleMethods = (function() {
    /* Helper methods for extending shapes.
       Also sets up makeInstance to use the methods. */
    var shapelike = {
      setColour: function (colour) {
        retrieve.setStyle.call(this.node, 'fill', colour);
      },
      setClip: function (clipObject) {
        var iri = (typeof clipObject !== 'undefined') ?
          idiri.funcIRI(clipObject.getId()) : "";
        retrieve.setStyle.call(this.node, 'clipPath', iri);
      }
    }
    addInstances(shapelike);

    var linelike = {
      setThickness: function(thickness) {
        retrieve.setStyle.call(this.node, 'strokeWidth', thickness);
      },
      setColour: function(colour) {
        retrieve.setStyle.call(this.node, 'stroke', colour);
      },
      setClip: shapelike.setClip
    }
    addInstances(linelike);

    return {
      shapelike: shapelike,
      linelike: linelike
    }
  }());


  var QRectangle = FlagShapes.QRectangle = (function() {
    /* Quarter rectangle, with one corner at (0,0) and the other at (w, h). */
    function QRectangle (width, height, id) {
      this.node = newElement('rect', id);
      fsvg.rect.setLocation.call(this.node, 0, 0);
      fsvg.rect.setSize.call(this.node, width, height);
    }
    var p = QRectangle.prototype = Object.create(GenericShapeProto);
    p.setWidth = function (width) {
      retrieve.setLength.call(this.node, 'width', width);
    }
    p.setHeight = function (height) {
      retrieve.setLength.call(this.node, 'height', height);
    }

    extend(p, StyleMethods.shapelike);

    return QRectangle;
  }());

  var WRectangle = FlagShapes.WRectangle = (function() {
    /* Whole rectangle, centred on (0,0). Takes halfWidth and halfHeight. */
    function WRectangle (halfWidth, halfHeight, id) {
      this.node = newElement('rect', id);
      fsvg.rect.setExtent.call(this.node,
        -halfWidth, -halfHeight, halfWidth, halfHeight);
    }
    var p = WRectangle.prototype = Object.create(GenericShapeProto);
    p.setHalfWidth = function (halfWidth) {
      retrieve.setLength.call(this.node, 'x', -halfWidth);
      retrieve.setLength.call(this.node, 'width', halfWidth*2);
    }
    p.setHalfHeight = function (halfHeight) {
      retrieve.setLength.call(this.node, 'y', -halfHeight);
      retrieve.setLength.call(this.node, 'height', halfHeight*2);
    }

    extend(p, StyleMethods.shapelike);

    return WRectangle;
  }());
/*
  var LineGroup = FlagShapes.LineGroup = (function() {
    function LineGroup (id) {
      this.node = newElement('g', id);
    }
    var p = LineGroup.prototype = Object.create(GenericShapeProto);
    makeMethodsWorkOnProperty(p, fsvg.svge, ['appendObjects']);
    extend(p, StyleMethods.linelike)
  }());
*/
  var Cross = FlagShapes.Cross = (function() {
    /* Cross, centred on (0,0). Takes halfWidth and halfHeight. */
    function Cross(halfWidth, halfHeight, id) {
      this.node = newElement('g', id);

      // create the two lines
      this.hline = this.node.appendChild(newElement('line'));
      fsvg.line.setExtent.call(this.hline, -halfWidth, 0, halfWidth, 0);


      this.vline = this.node.appendChild(newElement('line'));
      fsvg.line.setExtent.call(this.vline, 0, -halfHeight, 0, halfHeight);
    }
    var p = Cross.prototype = Object.create(GenericShapeProto);

    p.setHalfWidth = function(halfWidth) {
      retrieve.setLength.call(this.hline, 'x1', -halfWidth);
      retrieve.setLength.call(this.hline, 'x2', halfWidth);
    }

    p.setHalfHeight = function(halfHeight) {
      retrieve.setLength.call(this.vline, 'y1', -halfHeight);
      retrieve.setLength.call(this.vline, 'y2', halfHeight);
    }

    extend(p, StyleMethods.linelike);

    return Cross;
  }());

  /* I could alter the QMasks to use two offset points, one for the middle and
      one for the corners, so it goes
      (0,0) -> [edge boundary] -> (w,h) -> [cornerOffset] -> [middleOffset],
      but I don't think that's really necessary here. */
  var QMaskBase = (function() {
    // superclass for QMasks. Not strictly necessary in JS, but I find it
    // neater this way.
    function QMaskBase (width, height, ex, ey, id) {
      this.node = newElement('polygon', id+"_shape");
      fsvg.poly.setByString.call(this.node, [0, 0, ex, ey, width, height, 0, 0]);
      this.edgePoint = this.node.points[1];
      this.extentPoint = this.node.points[2];
      this.offsetPoint = this.node.points[3];
    }
    var p = QMaskBase.prototype = Object.create(GenericShapeProto);
    p.setOffsetPoint = function (ox, oy) {
      if (typeof oy === 'undefined') {
        oy = -ox;
      }
      this.offsetPoint.x = ox;
      this.offsetPoint.y = oy;
    }
    extend(p, StyleMethods.shapelike);
    return QMaskBase;
  }());


  var QMaskX = FlagShapes.QMaskX = (function() {
    /* Quarter pinwheel mask thing. Basically for countercharging.
       To use properly, it needs to be clipped/masked with a QRectangle.
       This version includes the side closer to the x-axis.
       Takes an 'offset', which alters the shape so the diagonal can be
       slightly off-centre if that's what's more aesthetically pleasing */
    function QMaskX (width, height, id) {
      QMaskBase.call(this, width, height, width, 0, id);
    }
    var p = QMaskX.prototype = Object.create(QMaskBase.prototype);

    p.setWidth = function (width) {
      this.edgePoint.x = width;
      this.extentPoint.x = width;
    }
    p.setHeight = function (height) {
      this.extentPoint.y = height;
    }
    return QMaskX;
  }());

  var QMaskY = FlagShapes.QMaskY = (function() {
    /* Like QMaskX, but includes the side closer to the y-axis instead. */
    function QMaskY (width, height, id) {
      QMaskBase.call(this, width, height, 0, height, id);
    }
    var p = QMaskY.prototype = Object.create(QMaskBase.prototype);

    p.setWidth = function (width) {
      this.extentPoint.x = width;
    }
    p.setHeight = function (height) {
      this.edgePoint.y = height;
      this.extentPoint.y = height;
    }
    return QMaskY
  }());

  var SaltireSegment = FlagShapes.SaltireSegment = (function() {
    /* A quarter of a saltire. Basically, a line running from (0,0) to (w,h).
       For use with a QRectangle and/or QMask mask or clip.
       Can also take an offset, which is used instead of (0,0). */
    function SaltireSegment (width, height, id) {
      this.node = newElement('line', id);
      fsvg.line.setExtent.call(this.node, 0, 0, width, height);
      // TODO: replace this with some sort of cssclass thing
      retrieve.setStyle.call(this.node, 'strokeLinecap', 'square');
    }
    var p = SaltireSegment.prototype = Object.create(GenericShapeProto);

    p.setWidth = function (width) {
      retrieve.setLength.call(this.node, 'x2', width);
    }
    p.setHeight = function (height) {
      retrieve.setLength.call(this.node, 'y2', height);
    }
    p.setOffsetPoint = function (ox, oy) {
      if (typeof oy === 'undefined') {
        oy = -ox;
      }
      fsvg.line.setStart.call(this.node, ox, oy);
    }

    extend(p, StyleMethods.linelike);
    return SaltireSegment;
  }());


  var Clipper = FlagShapes.Clipper = (function() {
    /* wraps ClipPath. */
    function Clipper (id) {
      // the rest of the arguments: objects to be contained
      this.node = newElement('clipPath', id);
      for (var i=1; i<arguments.length; i++) {
        arguments[i].appendToNode(this.node);
      }
    }
    var p = Clipper.prototype = Object.create(GenericShapeProto);
    extend(p, StyleMethods.shapelike, ['setClip']);
    // <clipPath>s can be clipped, but not cloned.

    // should I use clipper.clip(clipee) or clipee.setClip(clipper)?
    p.clipNode = function (node) {
      var iri = idiri.funcIRI(this.node.id);
      retrieve.setStyle.call(node, 'clipPath', iri)
    }
    return Clipper;
  }());

  var InstanceSaltire = FlagShapes.InstanceSaltire = (function() {
      function InstanceSaltire (segment, clippers, id) {
        this.node = newElement('g', id);
        this.segments = [];
        for (var i=0; i<4; i++) {
          var segint = segment.makeInstance(id+"_segment"+i);
          if (clippers) {
            var clipper = clippers[i % clippers.length];
            segint.setClip(clipper);
          }
          this.segments.push(segint);
          segint.appendToNode(this.node);
        }
        fsvg.transforms.flipX.call(this.segments[1].node);
        fsvg.transforms.flipXY.call(this.segments[2].node);
        fsvg.transforms.flipY.call(this.segments[3].node);
      }
      var p = InstanceSaltire.prototype = Object.create(GenericShapeProto);
      extend(p, StyleMethods.linelike);
      return InstanceSaltire;
  }());


  var SubFlag = FlagShapes.SubFlag = (function() {
    /* SubFlag. Superclass for flags and rectangular flag bits. */
    function SubFlag (id) {
      this.node = newElement('svg', id);
      this.defs = this.node.appendChild(newElement('defs'));
    }
    var p = SubFlag.prototype = Object.create(GenericShapeProto);
    makeMethodsWorkOnProperty(p, fsvg.svge, 'node');
    p.defsAppend = function () {
      fsvg.svge.appendObjects.apply(this.defs, arguments);
    }
    return SubFlag;
  }());

  var UnionJack = FlagShapes.UnionJack = (function() {
    /* The Union Jack. extends SubFlag. */
    function UnionJack (width, height, id) {
      // calculate half-lengths
      var halfWidth = width / 2,
          halfHeight = height / 2;

      // Set up the svg element.
      SubFlag.call(this, id);
      // Set up the ViewBox.
      this.setViewBox(-halfWidth, -halfHeight, width, height);
      // create the base shapes.
      this.baseCross = new Cross(halfWidth, halfHeight, id+"_baseCross");
      this.baseQRect = new QRectangle(halfWidth, halfHeight, id+"_baseQRect");
      this.baseWRect = new WRectangle(halfWidth, halfHeight, id+"_baseWRect");
      this.baseQSalt = new SaltireSegment(halfWidth, halfHeight, id+"_baseQSalt");
      this.QMaskX = new QMaskX(halfWidth, halfHeight, id+"_QMaskX");
      this.QMaskY = new QMaskY(halfWidth, halfHeight, id+"_QMaskY");

      this.clipQRect = new Clipper(id+"_clipQRect", this.baseQRect);
      this.clipQMaskX = new Clipper(id+"_clipQMaskX", this.QMaskX);
      this.clipQMaskY = new Clipper(id+"_clipQMaskY", this.QMaskY);
      this.clipQMaskX.setClip(this.clipQRect);
      this.clipQMaskY.setClip(this.clipQRect);
      this.inverted = false;


      this.defsAppend(this.baseCross, this.baseWRect, this.baseQSalt,
        this.clipQRect, this.clipQMaskX, this.clipQMaskY);

      // Create the visible elements.
      this.field = this.baseWRect.makeInstance(id+"_field");
      this.georgeFim = this.baseCross.makeInstance(id+"_georgeFim");
      this.george = this.baseCross.makeInstance(id+"_george")
      this.andrew = new InstanceSaltire(this.baseQSalt,
        [this.clipQRect], id+"_andrew");
      this.patrick = new InstanceSaltire(this.baseQSalt,
        [this.clipQMaskX, this.clipQMaskY], id+"_patrick");

      this.appendObjects(this.field,
        this.andrew, this.patrick,
        this.georgeFim, this.george);
    }
    var p = UnionJack.prototype = Object.create(SubFlag.prototype);
    // TODO: set up a custom stylesheet
    p.setBlue = function (colour) {
      this.blue = colour;
      this.field.setColour(colour);
    }
    p.setWhite = function (colour) {
      this.white = colour;
      this.georgeFim.setColour(colour);
      this.andrew.setColour(colour);
    }
    p.setRed = function (colour) {
      this.red = colour;
      this.george.setColour(colour);
      this.patrick.setColour(colour);
    }
    p.setWidth = function (width) {
      this.width = width;
      var halfWidth = width / 2;
      this.baseCross.setHalfWidth(halfWidth);
      this.baseQRect.setWidth(halfWidth);
      this.baseWRect.setHalfWidth(halfWidth);
      this.baseQSalt.setWidth(halfWidth);
      this.QMaskX.setWidth(halfWidth);
      this.QMaskY.setWidth(halfWidth);
      this.setViewHalfWidth(halfWidth);
    }
    p.setHeight = function (height) {
      this.height = height;
      var halfHeight = height / 2;
      this.baseCross.setHalfHeight(halfHeight);
      this.baseQRect.setHeight(halfHeight);
      this.baseWRect.setHalfHeight(halfHeight);
      this.baseQSalt.setHeight(halfHeight);
      this.QMaskX.setHeight(halfHeight);
      this.QMaskY.setHeight(halfHeight);
      this.setViewHalfHeight(halfHeight);
    }
    p.setOffsetPoint = function (ox, oy) {
      this.QMaskX.setOffsetPoint(ox, oy);
      this.QMaskY.setOffsetPoint(ox, oy);
      this.baseQSalt.setOffsetPoint(ox, oy);
    }
    var _setCrossThickness = function (w) {
      this.george.setThickness(w);
    }
    var _setCrossFim = function (w, f) {
      var tw = f*2 + w
      this.georgeFim.setThickness(tw)
    }
    p.setCrossThickness = function (w) {
      this.crossThickness = w;
      _setCrossThickness.call(this, w);
      _setCrossFim.call(this, w, this.crossFim);
    }
    p.setCrossFim = function (f) {
      this.crossFim = f;
      _setCrossFim.call(this, this.crossThickness, f);
    }
    var _setSaltireThickness = function (w) {
      this.patrick.setThickness(w);
    }
    var _setSaltireFim = function (w, f) {
      var tw = Math.max(f, 0)*2 + w;
      this.andrew.setThickness(tw);
    }
    p.setSaltireThickness = function (w) {
      this.saltireThickness = w;
      var isnegative = (w < 0);
      if (isnegative !== this.inverted) {
        this.setInverted(isnegative);
      }
      var aw = Math.abs(w);
      _setSaltireThickness.call(this, aw);
      _setSaltireFim.call(this, aw, this.saltireFim);
    }
    p.setSaltireFim = function (f) {
      this.saltireFim = f;
      _setSaltireFim.call(this, Math.abs(this.saltireThickness), f);
    }
    p.setInverted = function (b) {
      b = !!b;
      this.inverted = b;
      if (b) {
        fsvg.transforms.flipY.call(this.patrick.node);
      } else {
        fsvg.transforms.clear.call(this.patrick.node);
      }
    }
    p.setPatrickVisibility = function (b) {
      this.patrickVisiblity = !!b;
      this.patrick.setVisibility(b);
    }
    p.setOffset = function (n) {
      var ox = n/2 * this.height;
      var oy = -n/2 * this.width;
      this.setOffsetPoint(ox, oy);
    }


    return UnionJack;
  }());


  return FlagShapes;
}(FlagShapes || {}, fsvg));
