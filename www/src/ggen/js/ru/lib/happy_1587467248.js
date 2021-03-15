var happy = {

    // matches mm/dd/yyyy (requires leading 0's (which may be a bit silly, what do you think?)
    date: function (val) {
        return /^(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12][0-9]|3[01])\/(?:\d{4})/.test(val);
    },

    email: function (val) {
        return /(\w[-._\w]*\w@\w[-._\w]*.\w{2,3})/.test(val);
    },

    // length - Array[min, max]
    rangeLength: function(val, length) {
        return val.length >= length[0] && val.length <= length[1];
    },

    minLength: function (val, length) {
        return val.length >= length;
    },

    maxLength: function (val, length) {
        return val.length <= length;
    },

    equal: function (val1, val2) {
        return (val1 == val2);
    }
};

/*global $*/
(function ($) {
    function trim(el) {
        var val = el.val()||'';
        return (''.trim) ? val.trim() : $.trim(val);
    }
    $.fn.isHappy = function (config) {
        var fields = [], item;

        function isFunction(obj) {
            return !!(obj && obj.constructor && obj.call && obj.apply);
        }
        function defaultError(error) { //Default error template
            return $('<span id="' + error.id + '" class="unhappyMessage" role="alert">' + error.message + '</span>');
        }
        function getError(error) { //Generate error html from either config or default
            if (isFunction(config.errorTemplate)) {
                return config.errorTemplate(error);
            }
            return defaultError(error);
        }
        function handleSubmit() {
            
            console.log('handleSubmit', config)
            var errors = false, i, l;
            for (i = 0, l = fields.length; i < l; i += 1) {
                if (!fields[i].testValid(true)) {
                    errors = true;
                }
            }
            if (errors) {
                if (isFunction(config.unHappy)) config.unHappy();
                return false;
            } else if (config.testMode) {
                if (isFunction(config.happy)) config.happy();
                if (window.console) console.warn('would have submitted');
                return false;
            }
            if (isFunction(config.happy)) config.happy();
        }
        function processField(opts, selector) {
            console.log('processField', opts, selector)
            var field = $(selector),
            error = {
                message: opts.message || '',
                id: selector.slice(1) + '_unhappy'
            },
            errorEl = $(error.id).length > 0 ? $(error.id) : getError(error);
			
			field.data('event', opts.when || config.when || 'blur');
			
            fields.push(field);
            field.testValid = function (submit) {
                if(!$(this).length) return true;
                
                var val,
                el = $(this),
                gotFunc,
                error = false,
                temp,
                required = !!el.get(0).attributes.getNamedItem('required') || opts.required,
                password = (field.attr('type') === 'password'),
                arg = isFunction(opts.arg) ? opts.arg() : opts.arg,
				result;

                // clean it or trim it
                if (isFunction(opts.clean)) {
                    val = opts.clean(el.val());
                } else if (!opts.trim && !password) {
                    val = trim(el);
                } else {
                    val = el.val();
                }

                // write it back to the field
                el.val(val);

                // get the value
                gotFunc = ((val.length > 0 || required === 'sometimes') && isFunction(opts.test));

                // check if we've got an error on our hands
                if (submit === true && required === true && val.length === 0) {
                    error = true;
                } else if (gotFunc) {
                    error = !opts.test(val, arg);
                }
				
                if (error) {
                    el.addClass('unhappy');
					
					if( config.errWrp )
						config.errWrp.prepend(errorEl);
					else
						el.before(errorEl);
					
                    errorEl.html(opts.message);
					
                    result = false;
                } else {
                    temp = errorEl.get(0);
                    // this is for zepto
                    if (temp.parentNode) {
                        temp.parentNode.removeChild(temp);
                    }
                    el.removeClass('unhappy');
					
                    result = true;
                }
				
				el.trigger('happy-'+el.data('event'), [result]);
				
				return result;
            };
			
            field.bind(field.data('event'), field.testValid);
        }

        for (item in config.fields) {
            processField(config.fields[item], item);
        }

        if (config.submitButton) {
            $(config.submitButton).click(handleSubmit);
        } else {
            this.bind('submit', handleSubmit);
        }
        return this;
    };
})(this.jQuery || this.Zepto);
