/**
 * TODO: Check for console availability
 */

(function($) {
	'use strict';

	var ValidationEngine = (function () {
		var self = this, base,
        	field, validation, fields = [],
        	firstTime = true;

        self.processFields = function (options) {
        	//console.log(options);

        	$.each(options, function(k, v) {
        		field = {};

        		if (typeof(v) === 'object') {
    				field.selector = k;
    				field.enabled = v.enabled !== undefined ? v.enabled : true

    				delete v.enabled; // could be done better :(

        			self.processValidations(v);
        			self.bindValidations(field);
        			fields.push(field);
        			//console.log (field);
        		}
        		else {
        			console.error ('ValidationEngine: '+ k + ' must be of type object. Not ' + typeof(v) + '.');
        		}
        	});

        	//console.log(fields);
        };

        self.processValidations = function (validations) {
        	field.validations = {};

    		$.each(validations, function(k, v) {
    			field.validations[k] = {};

        		if (typeof(v) === 'object') {
        			$.each(v, function(key, value) {
        				field.validations[k][key] = value;
        			});
        		} else {
        			field.validations[k].validator = v;
        		}
        	});
        };

        self.bindValidations = function (f) {
    		f.$elem = $('*[data-member="' + f.selector + '"]', base.$elem);

    		if (f.$elem.length !== 1) {
    			console.error ('ValidationEngine: None or multiple results for selector: "' + f.selector + '".');
    		}
        };

        self.getValue = function (f) {
        	var tag = self.getTagName(f);

			return tag === 'select' || tag === 'textarea' ? f.$elem.val() :
				tag === 'input' ? f.$elem.attr('type') === 'text' || f.$elem.attr('type') === 'password' ? f.$elem.val() :
					f.$elem.attr('type') === 'radio' ? $('input[name='+ f.$elem.attr('name') + ']:checked').val() :
						f.$elem.attr('type') === 'checkbox' ? f.$elem.is(':checked') : null : null;
        };

        self.getTagName = function (f) {

        	return f.$elem.prop("tagName").toLowerCase();
        };

        self.searchField = function (selector) {
        	var field;

        	$.each(fields, function (i, f) {
        		if (f.selector === selector) {
    				field = f;

    				return false;
				}
        	});

        	return field;
        };

        self.validateField = function (f) {
        	var result = true;

			$.each(f.validations, function (fn, opts) {
				if (fn === 'match') {
					var matchField = self.searchField(opts.matchField);

		        	if (matchField) {
		        		if (typeof(opts.beforeValidation) === 'function')
        					opts.beforeValidation(f.$elem);

						if (!$.fn.validationEngine.validations[fn](self.getValue(f), self.getValue(matchField))) {
							result = opts.validator;

							return;
						}
					} else {
						console.error ('ValidationEngine: MatchField was not found for match key : "' + opts.matchField + '".');
					}

				} else {
					if (typeof(opts.beforeValidation) === 'function')
        				opts.beforeValidation(f.$elem);

					if (!$.fn.validationEngine.validations[fn](self.getValue(f))) {
						result = opts.validator;
					}
				}

	        	if (result !== true) {
					$.each(f.validations, function (f, o) {
						$('.' + o.validator, base.$elem).removeClass('error');
					});

					$('.' + result, base.$elem).addClass('error');

					if (typeof(opts.afterValidation) === 'function')
						opts.afterValidation(f.$elem, result);

					return false;
				}
			});

			if (result === true) {
				$.each(f.validations, function (fn, opts) {
					$('.' + opts.validator, base.$elem).removeClass('error');

					if (typeof(opts.afterValidation) === 'function')
						opts.afterValidation(f.$elem, result);
				});
			}

			return result;
        };

		self.validateAll = function () {
			var result = true;

			$.each(fields, function (i, f) {
    			if (f.enabled === false)
    				return true;

    			if (self.validateField(f) !== true)
    				result = false;
        	});

        	return result;
        };

		return {
			init: function (options, elem) {
				base = this;

	            base.$elem = $(elem);
	            base.options = options;

	            self.processFields(base.options);
	        },

	        destroy: function () {
	        	base.$elem.removeData();

	        	/*
				 * TODO: FIX THIS !!!!
				 */

	        	base = undefined;
	        	self = undefined;
	        },

	        addField: function (options) {

	        	self.processFields(options);
	        },

	        addFields: function (options) {

	        	self.processFields(options);
	        },

	        removeField: function (f) {
	        	$.each(fields, function (i, item) {
	        		if (item.selector === f) {
        				fields.splice(i, 1);

        				return false;
    				}
	        	});
	        },

	        removeFields: function (array) {
	        	$.each(array, function(i, f) {
        			base.removeField(f);
	        	});
	        },

	        enable: function (array) {
	        	$.each(array, function(i, key) {
	        		var f = self.searchField(key);

	        		if (f)
        				f.enabled = true;
        			else
    					console.error ('ValidationEngine: None fields found for key: "' + key + '".');
	        	});
	        },

	        disable: function (array) {
	        	$.each(array, function(i, key) {
	        		var f = self.searchField(key);

	        		if (f)
        				f.enabled = false;
        			else
    					console.error ('ValidationEngine: None fields found for key: "' + key + '".');
	        	});
	        },

	        validate: function (f) {
	        	if (f) {
	        		if (firstTime)
	        			return;

	        		var field = self.searchField(f);

	        		if (field.enabled)
    					self.validateField(field);
	        	}
	        	else {
	        		if (firstTime)
        				firstTime = false;

        			return self.validateAll();
    			}
	        }
		};
	});

	$.fn.validationEngine = function (options) {
		return this.each(function () {
			var va;

            if ($(this).data("va-init") === true) {
                return false;
            }

            $(this).data("va-init", true);

            va = new ValidationEngine();
            va.init(options, this);

            $.data(this, "validationEngine", va);
        });
	};

	$.fn.validationEngine.validations = {
		required: function (value) {
			if ($.trim(value).length > 0)
				return true;

			return false;
		},

		checkboxRequired: function (value) {

			return value;
		},

		isEmail: function (value) {
			var reg = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

	    	return reg.test(value);
		},

		isUrl: function (value) {
			var reg = /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;

	    	return reg.test(value);
		},

		isNumber: function (value) {
			var reg = /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/;

	    	return reg.test(value);
		},

		digitsOnly: function (value) {
			var reg = /^\d+$/;

	    	return reg.test(value);
		},

		lettersOnly: function (value) {
			var reg = /^[a-z]+$/i;

	    	return reg.test(value);
		},

		minlength: function (value, length) {

			return value.length >= length;
		},

		maxlength: function (value, length) {

			return value.length <= length;
		},

		rangelength: function(value, minLength, maxLength) {

			return value.length <= maxLength && value.length >= minLength;
		},

		min: function (value, min) {

			return value.length >= length;
		},

		max: function (value, max) {

			return value.length <= length;
		},

		range: function (value, min, max) {

			return value <= maxLength && value >= minLength;
		},

		isAlphaNumeric: function (value) {

			return true;
		},

		match: function (value1, value2) {

	    	return value1 === value2;
		}
	}
})($);