// flagshapes.js. A collection of various shapes.

var FlagShapes = (function(FlagShapes, fsvg) {
  var retrieve = fsvg.retrieve,
      newElement = fsvg.newElement;
      use = fsvg.use;
      extend = fsvg.extend;
      partialone = fsvg.partialone;
      idiri = fsvg.idiri;


  // META


  var makeMethodsWorkOnProperty = function(reciever, source, propertyName, methodNames) {
    // not a very good general-use function, but i'll take it!
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

  var addInstances = (function() {

    var InstantiateInstance = function (proto, sourceid, instid) {
      var iri = idiri.IRI(sourceid);

      // do what 'new' does
      var newInstance = Object.create(proto);
      newInstance.node = newElement('use', instid);
      use.setHref.call(newInstance.node, iri);

      return newInstance;
    }

    return function (sourcePrototype, methodNames) {
      var instancePrototype = Object.create(GenericShapeProto);
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
    var shapelike = {
      setColour: function (colour) {
        retrieve.setStyle.call(this.node, 'fill', colour);
      }
    }
    addInstances(shapelike, ['setColour']);

    var linelike = {
      setThickness: function(thickness) {
        retrieve.setStyle.call(this.node, 'strokeWidth', thickness);
      },
      setColour: function(colour) {
        retrieve.setStyle.call(this.node, 'stroke', colour);
      }
    }
    addInstances(linelike, ['setThickness', 'setColour']);

    return {
      shapelike: shapelike,
      linelike: linelike
    }
  }());


  var QRectangle = FlagShapes.QRectangle = (function() {
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
    function WRectangle (halfWidth, halfHeight, id) {
      this.node = newElement('rect', id);
      fsvg.rect.setExtent.call(this.node,
        -halfWidth, -halfHeight, halfWidth, halfHeight);
    }
    var p = WRectangle.prototype = Object.create(GenericShapeProto);
    p.setHalfWidth = function (halfWidth) {
      retrieve.length.call(this.node, 'x', -halfWidth);
      retrieve.length.call(this.node, 'width', halfWidth*2);
    }
    p.setHalfHeight = function (halfHeight) {
      retrieve.length.call(this.node, 'y', -halfHeight);
      retrieve.length.call(this.node, 'height', halfHeight*2);
    }

    extend(p, StyleMethods.shapelike);

    return WRectangle;
  }());

  var Cross = FlagShapes.Cross = (function() {
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
      retrieve.setLength.call(this.hline, 'y1', -halfHeight);
      retrieve.setLength.call(this.hline, 'y2', halfHeight);
    }

    extend(p, StyleMethods.linelike);

    return Cross;
  }());


  var QMaskX = FlagShapes.QMaskX = (function() {
    function QMaskX (width, height, id) {
      this.node = newElement('polygon', id);
      // points: (0,0) -> (w, 0) -> (w, h) -> (offset, -offset)
      fsvg.poly.setByString.call(this.node, [0, 0, width, 0, width, height, 0, 0]);
      this.widthPoint = this.node.points[1];
      this.extentPoint = this.node.points[2];
      this.offsetPoint = this.node.points[3];
    }
    var p = QMaskX.prototype = Object.create(GenericShapeProto);

    p.setColour = function(colour) {
      retrieve.setStyle.call(this.node, 'fill', colour);
    }

    p.setWidth = function (width) {
      this.widthPoint.x = width;
      this.extentPoint.x = width;
    }

    p.setHeight = function (height) {
      this.extentPoint.y = height;s
    }

    p.setOffset = function (ox, oy) {
      if (typeof oy === 'undefined') {
        oy = -ox;
      }
      this.offsetPoint.x = ox;
      this.offsetPoint.y = oy;
    }

    extend(p, StyleMethods.shapelike);

    return QMaskX;
  }());

  var QMaskY = FlagShapes.QMaskY = (function() {
    function QMaskY (width, height, id) {
      this.node = newElement('polygon', id);
      // points: (0,0) -> (0, h) -> (w, h) -> (offset, -offset)
      fsvg.poly.setByString.call(this.node, [0, 0, 0, height, width, height, 0, 0]);
      this.heightPoint = this.node.points[1];
      this.extentPoint = this.node.points[2];
      this.offsetPoint = this.node.points[3];
    }
    var p = QMaskY.prototype = Object.create(GenericShapeProto);
    extend(p, QMaskX.prototype, ['setColour', 'setOffset', 'makeInstance']);

    p.setWidth = function (width) {
      this.extentPoint.x = width;
    }

    p.setHeight = function (height) {
      this.heightPoint.y = height;
      this.extentPoint.y = height;
    }

    return QMaskY
  }());

  var SaltireSegment = FlagShapes.SaltireSegment = (function() {
    function SaltireSegment (width, height, id) {
      this.node = newElement('line', id);
      fsvg.line.setExtent.call(this.node, 0, 0, width, height);
    }
    var p = SaltireSegment.prototype = Object.create(GenericShapeProto);

    p.setWidth = function (width) {
      retrieve.length.call(this.node, 'x2', width);
    }
    p.setHeight = function (height) {
      retrieve.length.call(this.node, 'y2', height);
    }
    p.setOffset = function (ox, oy) {
      if (typeof oy === 'undefined') {
        oy = -ox;
      }
      fsvg.line.setStart.call(this.node, ox, oy);
    }

    extend(p, StyleMethods.linelike);

    return SaltireSegment;
  }());


  return FlagShapes;
}(FlagShapes || {}, fsvg));
