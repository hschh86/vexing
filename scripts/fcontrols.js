//  fcontrols.js: 'Let's Keep Going And See What Happens'

var fcontrols = (function(fcontrols) {
  'use strict';

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

  var newCallbackWidget = function (id, type, value_prop, event_name, initial_value, callback) {
    // Lazy way to create a input element and then assign a callback on each change
    var widget = newElement('input', {
      id: id,
      type: type,
    });
    widget[value_prop] = initial_value;
    widget.addEventListener(event_name, function () {
      callback(widget[value_prop]);
    });
    callback(initial_value);
    return widget;
  }


  var Colours = fcontrols.Colours = (function() {
    function Colours (id, options) {
      // wraps the colour picker widget.
      // options.callback executed on 'change' event, with argument colour
      Control.call(this, id);
      this.elem.classList.add('colours');
      var callback = this.callback = options.callback;
      var widget = this.widget = newCallbackWidget(
        id+'_widget', 'color', 'value', 'change', options.value, callback
      );
      var label = this.label = newElement('label', {
        textContent: options.label,
        id: id+'_label',
        htmlFor: widget.id
      });
      this.elem.appendChild(label);
      this.elem.appendChild(widget);
    }
    Colours.prototype = Object.create(Control.prototype);
    return Colours;
  }());

  var Checkbox = fcontrols.Checkbox = (function() {
    function Checkbox (id, options) {
      // Wraps a check box. Label on the right.
      // options.callback executed on 'change' event, argument bool as string
      Control.call(this, id);
      this.elem.classList.add('checkbox');
      var callback = this.callback = options.callback;
      var widget = this.widget = newCallbackWidget(
        id+'_widget', 'checkbox', 'checked', 'change', options.value, callback
      );
      var label = this.label = newElement('label', {
        textContent: options.label,
        id: id+'_label',
        htmlFor: widget.id
      });
      this.elem.appendChild(label);
      this.elem.appendChild(widget);
    }
    Checkbox.prototype = Object.create(Control.prototype);
    return Checkbox;
  }());

  var Rangeful = fcontrols.Rangeful = (function() {
    function Rangeful (id, options){
      // Combines a spinner and slider into one inconvenient package.
      // Also provides some methods of changing the range and step.
      // Incomplete for now, but it sorta works.
      Control.call(this, id);
      this.elem.classList.add('rangeful')
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

      var callback = this.callback = options.callback;

      spinner.addEventListener('change', function() {
        slider.value = spinner.value;
        callback(Number(spinner.value));
      });
      slider.addEventListener('input', function() {
        spinner.value = slider.value;
        callback(Number(slider.value));
      });
      var label = this.label = newElement('label', {
        textContent: options.label,
        id: id+'_label',
        htmlFor: spinner.id
      });
      callback(Number(options.value));

      this.elem.appendChild(label);
      this.elem.appendChild(spinner);
      this.elem.appendChild(slider);
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
    p.setValue = function (value) {
      value = Number(value);
      this.spinner.value = value;
      this.slider.value = value;
      this.callback(value);
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
      this.childList.push(child);
      this.elem.appendChild(child.elem);
      return this;
    }
    p.addChildren = function (children) {
      // where children is an array.
      children.forEach(p.addChild.bind(this));
      return this;
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
    return bunch
  }

return fcontrols;
}(fcontrols || {}));
