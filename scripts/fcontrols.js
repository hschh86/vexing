//  fcontrols.js: 'Let's Keep Going And See What Happens'

var fcontrols = (function(fcontrols) {
  'use strict';


  /* So, how is this going to work?
  Control Interface.
  Each as a 'onValue' callback.
  When the associated DOM event happens, this.onValue(this) is executed.
  first argument of the callback is the Control. by default,
  'this' is also the control but it can be bound. probably.
  Each control has a value, accessed by 'value' property.
  There may be other properties.
  The Control object is the Source Of Truth, not any DOM nodes.*/




  var newElement = function (tag, props) {
    // Lazy way to configure some properties when creating element
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
    // Basic container for a Control.
    // I really should flesh this out more
    function Control (id) {
      // constructor.
      this.id = id;
      // Create div
      this.elem = newElement('div', {
        id: id+"_div"
      });
      this.elem.classList.add('controlbox')
    }
    var p = Control.prototype;
    return Control
  }());

  var Colours = fcontrols.Colours = (function() {
    function Colours (id, options) {
      // wraps the colour picker widget.
      // options.callback executed on 'change' event, with argument colour
      Control.call(this, id);
      this.elem.classList.add('colours');
      this.onValue = options.onValue;
      this.widget = newElement('input', {
        id: id+'_widget',
        type: 'color',
      });
      this.widget.addEventListener('change', function () {
        this.setValue(this.widget.value);
      }.bind(this));

      this.label = newElement('label', {
        textContent: options.label,
        id: id+'_label',
        htmlFor: this.widget.id
      });
      this.elem.appendChild(this.label);
      this.elem.appendChild(this.widget);

      this.revaluate = function () {
        this.setValue(options.value);
      }
    }
    var p = Colours.prototype = Object.create(Control.prototype);
    p.setValue = function (value) {
      this.value = this.widget.value = value;
      this.onValue(this);
    }
    return Colours;
  }());

  var Checkbox = fcontrols.Checkbox = (function() {
    function Checkbox (id, options) {
      // Wraps a check box. Label on the right.
      // options.callback executed on 'change' event, argument bool as string
      Control.call(this, id);
      this.elem.classList.add('checkbox');
      this.onValue = options.onValue;
      this.widget = newElement('input', {
        id: id+'_widget',
        type: 'checkbox',
      });
      this.widget.addEventListener('change', function () {
        this.setValue(this.widget.checked);
      }.bind(this));
      var label = this.label = newElement('label', {
        textContent: options.label,
        id: id+'_label',
        htmlFor: this.widget.id
      });
      this.elem.appendChild(this.label);
      this.elem.appendChild(this.widget);

      this.revalueate = function () {
        this.setValue(options.value);
      }
    }
    var p = Checkbox.prototype = Object.create(Control.prototype);
    p.setValue = function (value) {
      this.value = this.widget.checked = !!value;
      this.onValue(this);
    }
    return Checkbox;
  }());

  var Rangeful = fcontrols.Rangeful = (function() {
    function Rangeful (id, options){
      // Combines a spinner and slider into one inconvenient package.
      // Also provides some methods of changing the range and step.
      // Incomplete for now, but it sorta works.
      Control.call(this, id);
      this.elem.classList.add('rangeful')
      this.onValue = options.onValue;
      this.spinner = newElement('input', {
        id: id+"_spinner",
        type: 'number',
      });
      this.slider = newElement('input', {
        id: id+"_slider",
        type: 'range',
      });


      this.spinner.addEventListener('change', function() {
        this.setValue(this.spinner.value);
      }.bind(this));
      this.slider.addEventListener('input', function() {
        this.setValue(this.slider.value);
      }.bind(this));
      this.label = newElement('label', {
        textContent: options.label,
        id: id+'_label',
        htmlFor: this.spinner.id
      });

      this.elem.appendChild(this.label);
      this.elem.appendChild(this.spinner);
      this.elem.appendChild(this.slider);

      this.revaluate = function () {
        this.setMin(options.min);
        this.setMax(options.max);
        this.setStep(options.step);
        this.setValue(options.value);
      }
    }
    var p = Rangeful.prototype = Object.create(Control.prototype);
    p._reassert_value = function () {
      this.slider.value = this.spinner.value = this.value;
    }
    p.setMin = function (min) {
      this.min = this.spinner.min = this.slider.min = +min;
      this._reassert_value();
    }
    p.setMax = function (max) {
      this.max = this.spinner.max = this.slider.max = +max;
      this._reassert_value();
    }
    p.setStep = function (step) {
      this.step = this.spinner.step = this.slider.step = +step;
      this._reassert_value();
    }
    p.setValue = function (value) {
      this.value = this.spinner.value = this.slider.value = +value;
      this.onValue(this);
    }
    return Rangeful;
  }());

  var newFieldset = function (id, label) {
    // Lazy way of making a fieldset,
    // because having Legend as a separate element sucks.
    var elem = newElement('fieldset', {id: id});
    var legend = newElement('legend', {textContent: label});
    elem.appendChild(legend);
    return elem;
  }

  var ControlCollection = (function() {
    // A bunch of controls, wrapped together.
    function ControlCollection (id, elem) {
      this.id = id;
      this.elem = elem;
      this.childList = [];
      this.children = {};
    }
    var p = ControlCollection.prototype;
    p.addChild = function (child) {
      this.children[child.id] = child;
      this[child.id] = child;
      this.childList.push(child);
      this.elem.appendChild(child.elem);
      return this;
    }
    p.addChildren = function (children) {
      // where children is an array.
      children.forEach(p.addChild.bind(this));
      return this;
    }
    p.revaluate = function () {
      // Probably not the best way to do this......
      this.childList.forEach(function (child) {
        if (typeof child.revaluate === 'function') {
          child.revaluate();
        }
      });
    }
    p.blegister = function (census) {
      // I KNOW this isn't the best way to do it!
      census = census || {};
      this.childList.forEach(function (child) {
        child.controls = census;
        census[child.id] = child;
        if (typeof child.blegister === 'function') {
          child.blegister(census);
        }
      });
      return census
    }
    return ControlCollection;
  }());

  var Controlset = fcontrols.Controlset = (function() {
    // Wraps fieldset.
    function Controlset (id, label, children) {
      ControlCollection.call(this, id, newFieldset(id+"_elem", label));
      this.elem.classList.add('controlset');
      this.addChildren(children);
    }
    var p = Controlset.prototype = Object.create(ControlCollection.prototype);
    return Controlset;
  }());

  var attachControls = fcontrols.attachControls = function (node, children) {
    // Attaches a bunch of controls to a node.
    var bunch = new ControlCollection(null, document.createDocumentFragment());
    bunch.addChildren(children);
    node.appendChild(bunch.elem)
    bunch.elem = null;
    bunch.controls = bunch.blegister();
    bunch.revaluate();

    return bunch
  }

return fcontrols;
}(fcontrols || {}));
