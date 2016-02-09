// flagshapes.js. A collection of various shapes.

var FlagShapes = (function(FlagShapes, fsvg) {
  var retrieve = fsvg.retrieve,
      line = fsvg.line,
      rect = fsvg.rect;
      newElement = fsvg.newElement;
      use = fsvg.use;
      extend = fsvg.extend;
      partialone = fsvg.partialone;


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

  var Cross = FlagShapes.Cross = (function() {
    function Cross(halfWidth, halfHeight, id) {
      this.node = newElement('g');

      // create the two lines
      this.hline = this.node.appendChild(newElement('line'));
      line.setExtent.call(this.hline, -halfWidth, 0, halfWidth, 0);


      this.vline = this.node.appendChild(newElement('line'));
      line.setExtent.call(this.vline, 0, -halfHeight, 0, halfHeight);

      if (typeof id !== 'undefined') {
        this.setId(id);
      }

    }
    var p = Cross.prototype = Object.create(GenericShapeProto);

    p.setHalfWidth = function(halfWidth) {
      retrieve.setLength.call(this.hline, 'x1', -halfWidth);
      retrieve.setLength.call(this.hline, 'x2', halfWidth);
      return this;
    }

    p.setHalfHeight = function(halfHeight) {
      retrieve.setLength.call(this.hline, 'y1', -halfHeight);
      retrieve.setLength.call(this.hline, 'y2', halfHeight);
      return this;
    }

    p.setThickness = function(thickness) {
      retrieve.setStyle.call(this.node, 'strokeWidth', thickness);
    }

    p.setColour = function(colour) {
      retrieve.setStyle.call(this.node, 'stroke', colour);
    }

    var instancePrototype = Object.create(GenericShapeProto);
    fsvg.extend(instancePrototype, p, ['setThickness', 'setColour']);
    makeMethodsWorkOnProperty(instancePrototype, fsvg.use, 'node');

    p.makeInstance = function () {
      var id = this.getId();
      if (id !== "") {
        // do what 'new' does
        var newInstance = Object.create(instancePrototype);
        newInstance.node = newElement('use');
        newInstance.setHref("#"+id);
        return newInstance;
      }
    }

    return Cross;
  }());


  return FlagShapes;
}(FlagShapes || {}, fsvg));
