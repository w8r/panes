define(['exports', 'jquery', 'jquery.transition'], function(exports, $ /*, polyfill */ ) {

    console.log(exports)

    // https://gist.github.com/1312328
    Function.prototype.bind = Function.prototype.bind ||
    function(b) {
        if(typeof this !== "function") {
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }
        var a = Array.prototype.slice,
            f = a.call(arguments, 1),
            e = this,
            c = function() {},
            d = function() {
            return e.apply(this instanceof c ? this : b || window, f.concat(a.call(arguments)));
        };
        c.prototype = this.prototype;
        d.prototype = new c();
        return d;
    };

    return {
        animate: this.animate = function(el, properties, duration, easing, complete) {
            return $(el).animate(properties, duration, easing, complete);
        },
        // get computed style
        getStyle: function(el, styleProp) {
            var value = el.style[styleProp];
            if(value === '') {
                if(el.currentStyle) {
                    value = el.currentStyle[styleProp];
                } else {
                    if(window.getComputedStyle) {
                        value = document.defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
                    }
                }
            }
            return value;
        },
        // isArray polyfill
        isArray: typeof Array.isArray === 'function' ? Array.isArray : function(
        object) {
            return Object.prototype.toString.call(object) == '[object Array]';
        },
        // courtesy of underscore.js
        throttle: function(func, wait) {
            var context, args, timeout, result;
            var previous = 0;
            var later = function() {
                previous = new Date;
                timeout = null;
                result = func.apply(context, args);
            };
            return function() {
                var now = new Date;
                var remaining = wait - (now - previous);
                context = this;
                args = arguments;
                if(remaining <= 0) {
                    clearTimeout(timeout);
                    timeout = null;
                    previous = now;
                    result = func.apply(context, args);
                } else if(!timeout) {
                    timeout = setTimeout(later, remaining);
                }
                return result;
            };
        },
        hasClass: function(el, cls) {
            var separator = ' ';
            return(separator + el.className + separator).indexOf(separator + cls + separator) > -1;
        }
    };

});
