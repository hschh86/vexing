//  fcontrols.js: 'Let's Keep Going And See What Happens'

var fcontrols = (function(fcontrols) {
  'use strict';

  var newElement = function (tag, props) {
    var elem = document.createElement(tag);
    if (typeof props !== 'undefined') {
      Object.keys(props).forEach(function (prop) {
        var val = props[prop];
        if (typeof val !== 'undefined') {
          elem[prop] = val;
        }
      });
    };
    return elem;
  }

  var Control = fcontrols.Control = (function() {
    // Some sort of thing goes here
    function Control (id, options) {
      options = options || {};
      // constructor.
      this.id = id;
      // Create div
      this.div = newElement('div', {
        id: id+"_div"
      });
      // Create label
      this.label = newElement('label', {
        id: id+"_label",
        textContent: options.label
      });
      this.div.appendChild(this.label);
    }

    var p = Control.prototype = {};

    p.appendMe = function (selector) {
      document.querySelector(selector).appendChild(this.div);
    }

    return Control
  }());
  /*
  var Spinner = fcontrols.Spinner = (function() {
  function Spinner (id, options) {
  // inherits Control
  Control.call(this, id, options);
  this.spinner = newElement('input', {
  id: id+"_spinner",
  type: 'number',
  value: options.value,
  min: options.min,
  max: options.max,
    step: options.step
  });
  this.label.htmlFor = this.spinner.id;
  this.div.appendChild(this.spinner);
  }
  var p = Spinner.prototype = Object.create(Control.prototype);
  return Spinner;
  }());*/

  var Rangeful = fcontrols.Rangeful = (function() {
    function Rangeful (id, options){
      Control.call(this, id, options);
      var spinner = this.spinner = newElement('input', {
        id: id+"_spinner",
        type: 'number',
        value: options.value,
      });
      var slider = this.slider = newElement('input', {
        id: id+"_slider",
        type: 'range',
        value: options.value,
      });
      this.setMin(options.min);
      this.setMax(options.max);
      this.setStep(options.step);

      spinner.addEventListener('change', function() {
        slider.value = spinner.value;
        this.callback(spinner.value);
      }.bind(this));
      slider.addEventListener('input', function() {
        spinner.value = slider.value;
        this.callback(slider.value);
      }.bind(this));
      this.label.htmlFor = spinner.id;
      this.div.appendChild(spinner);
      this.div.appendChild(slider);

      this.callback = options.callback;
      this.callback(options.value);
    }
    var p = Rangeful.prototype = Object.create(Control.prototype);
    p.setMin = function (min) {
      this.spinner.min = min;
      this.slider.min = min;
    }
    p.setMax = function (max) {
      this.spinner.max = max;
      this.slider.max = max;
    }
    p.setStep = function (step) {
      this.spinner.step = step;
      this.slider.step = step;
    }
    // p.setValue = function ()
    // p.changeValue = function (value) {
    //   this.value = value
    //   this.callback(value);
    // }
    // console.log(p)
    return Rangeful;
  }());



  var Colours = fcontrols.Colours = (function() {
    function Colours (id, options){
      Control.call(this, id, options);
      var picker = this.picker = newElement('input', {
        id: id+"_picker",
        type: 'color',
        value: options.value,
      });
      picker.addEventListener('change', function() {
        this.callback(picker.value);
      }.bind(this));
      this.label.htmlFor = picker.id;
      this.div.appendChild(picker);

      this.callback = options.callback;
      this.callback(options.value);
    }
    var p = Colours.prototype = Object.create(Control.prototype);

    return Colours;
  }());



return fcontrols;
}(fcontrols || {}));
