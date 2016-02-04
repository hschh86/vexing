// fsvg-x.js: Even More Unnecessary Than The Regular One!
(function(fsvg) {
  'use strict';

  fsvg.Fquadrilateral = (function() {
    function Fquadrilateral(w, h) {
      fsvg.Fpolygon.call(this);
      // By default, a rectangle of dimensions (w,h) in +ve direction from 0,0
      w = (typeof w === 'undefined') ? 0 : w;
      h = (typeof h === 'undefined') ? w : h;
      this.setByString([0, 0, w, 0, w, h, 0, h].join(" "));
    }
    var p = Fquadrilateral.prototype = Object.create(fsvg.Fpolygon.prototype);

    return Fquadrilateral;
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

  return fsvg;
}(fsvg));
