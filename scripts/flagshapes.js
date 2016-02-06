// flagshapes.js. A collection of various shapes.

var FlagShapes = (function(FlagShapes, fsvg) {
  var retrieve = fsvg.retrieve,
      lineTools = fsvg.lineTools,
      rectTools = fsvg.rectTools;
      newElement = fsvg.newElement;

  var Cross = FlagShapes.Cross = (function() {
    function Cross(halfWidth, halfHeight) {
      this.node = newElement('g');

      // create the two lines
      this.hline = this.node.appendChild(newElement('line'));
      lineTools.setExtent.call(this.hline, -halfWidth, 0, halfWidth, 0);


      this.vline = this.node.appendChild(newElement('line'));
      lineTools.setExtent.call(this.vline, 0, -halfHeight, 0, halfHeight);

    }
    var p = Cross.prototype;

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

    return Cross;
  }());


  return FlagShapes;
}(FlagShapes || {}, fsvg));
