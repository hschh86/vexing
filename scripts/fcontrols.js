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

  var helpers = {
    optionomatic: function (self, object, methodlist) {
      methodlist.forEach(function (item) {
        var optionName = item[0];
        var methodName = item[1];
        var val = object[optionName];
        if (typeof val !== 'undefined') {
          self[methodName].call(self, val);
        }
      });
    },
    makeLabelAndWidget: function (self, elem, widgetName, type) {
      var id = elem.id;
      var wid = id+"_"+widgetName;
      self.label = elem.appendChild(newElement('label', {
        id: id+"label",
        htmlFor: wid
      }));
      self[widgetName] = elem.appendChild(newElement('input', {
        id: wid,
        type: type
      }))
    }
  }

  // dirty Mixins
  var mixins = {
    setLabelText: function (label) {
      this.labelText = this.label.textContent = label;
    },
    basicSetOptions: function (options) {
      helpers.optionomatic(this, options, [
        ['onValue', 'setValueCallback'],
        ['label', 'setLabelText'],
        ['value', 'setValue']
      ])
    }
  }

  var Control = fcontrols.Control = (function() {
    // Basic container for a Control.
    // I really should flesh this out more
    function Control (elem, bunch) {
      this.elem = elem;
      this.bunch = bunch;
      this.controls = bunch.controls;
    }
    var p = Control.prototype;
    // what goes here really
    return Control
  }());

  var Button = fcontrols.Button = (function() {
    // Not actually a Control like the others.
    // I should have really thought this through first...
    function Button (elem, bunch) {
      Control.call(this, elem, bunch);
      var id = elem.id;
      this.button = elem.appendChild(newElement('button', {
        id: id+'_button',
        type: 'button',
      }));
      this.button.addEventListener('click', function () {
        this.onAction(this);
      }.bind(this));
    }
    var p = Button.prototype = Object.create(Control.prototype);
    p.onAction = function () {
      // default noop
    }
    p.setOptions = function (options) {
      helpers.optionomatic(this, options, [
        ['onAction', 'setActionCallback'],
        ['label', 'setLabelText']
      ]);
    }
    p.setLabelText = function (labelText) {
      this.labelText = this.button.textContent = labelText;
    }
    p.setActionCallback = function (callback) {
      this.onAction = callback;
    }
    return Button;
  }());

  var ValueControl = fcontrols.ValueControl = (function() {
    // probs not necessary. might cut down later
    function ValueControl () {
      Control.apply(this, arguments);
    }
    var p = ValueControl.prototype = Object.create(Control.prototype);
    p.onValue = function () {
      // Default noop
    }
    p.setValueCallback = function (callback) {
      this.onValue = callback;
    }
    return ValueControl
  }());

  var Colours = fcontrols.Colours = (function() {
    function Colours (elem, bunch) {
      // wraps the colour picker widget.
      // options.callback executed on 'change' event, with argument colour
      ValueControl.call(this, elem, bunch);
      helpers.makeLabelAndWidget(this, elem, 'widget', 'color');
      this.widget.addEventListener('change', function () {
        this.setValue(this.widget.value);
      }.bind(this));
    }
    var p = Colours.prototype = Object.create(ValueControl.prototype);
    p.setOptions = mixins.basicSetOptions;
    p.setLabelText = mixins.setLabelText;
    p.setValue = function (value) {
      this.value = this.widget.value = value;
      this.onValue(this);
    }
    return Colours;
  }());

  var Checkbox = fcontrols.Checkbox = (function() {
    function Checkbox (elem, bunch) {
      // Wraps a check box. Label on the right.
      // options.callback executed on 'change' event, argument bool as string
      ValueControl.call(this, elem, bunch);
      helpers.makeLabelAndWidget(this, elem, 'widget', 'checkbox');
      this.widget.addEventListener('change', function () {
        this.setValue(this.widget.checked);
      }.bind(this));

    }
    var p = Checkbox.prototype = Object.create(ValueControl.prototype);
    p.setOptions = mixins.basicSetOptions;
    p.setLabelText = mixins.setLabelText;
    p.setValue = function (value) {
      this.value = this.widget.checked = !!value;
      this.onValue(this);
    }
    return Checkbox;
  }());

  var Rangeful = fcontrols.Rangeful = (function() {
    function Rangeful (elem, bunch){
      // Combines a spinner and slider into one inconvenient package.
      // Also provides some methods of changing the range and step.
      // Incomplete for now, but it sorta works.

      // Create Objects
      ValueControl.call(this, elem, bunch);
      helpers.makeLabelAndWidget(this, elem, 'spinner', 'number');
      this.slider = this.elem.appendChild(newElement('input', {
        id: elem.id+"_slider",
        type: 'range',
      }));

      this.spinner.addEventListener('change', function() {
        this.setValue(this.spinner.value);
      }.bind(this));
      this.slider.addEventListener('input', function() {
        this.setValue(this.slider.value);
      }.bind(this));

    }
    var p = Rangeful.prototype = Object.create(ValueControl.prototype);
    p.setOptions = function (options) {
      helpers.optionomatic(this, options, [
        ['onValue', 'setValueCallback'],
        ['label', 'setLabelText'],
        ['min', 'setMin'],
        ['max', 'setMax'],
        ['step', 'setStep'],
        ['value', 'setValue']
      ]);
    }
    p.setLabelText = mixins.setLabelText;

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

  var ControlBunch = fcontrols.ControlBunch = (function() {

    var rmap = {
      colours: Colours,
      checkbox: Checkbox,
      rangeful: Rangeful,
      button: Button
    }

    function ControlBunch (id, elem, options) {
      this.id = id;
      this.elem = elem;
      // Build Up The Big Listy Thing
      this.controls = {};
      var clist = this.elem.querySelectorAll('.control');
      for (var i=0; i<clist.length; i++) {
        var node = clist[i];
        var ctr = rmap[node.dataset.type];
        if (typeof ctr === 'function') {
          this.controls[node.id] = new ctr(node, this, {});
        }
      }
      this.setOptions(options);
    }
    var p = ControlBunch.prototype;
    p.setOptions = function (options) {
      Object.keys(options).forEach(function (id) {
        this.controls[id].setOptions(options[id])
      }.bind(this));
    }
    return ControlBunch;
  }());

  var registerControls = fcontrols.registerControls = function (elem_id, options) {
    var elem = document.getElementById(elem_id);
    return new ControlBunch(elem_id, elem, options);
  }
return fcontrols;
}(fcontrols || {}));
