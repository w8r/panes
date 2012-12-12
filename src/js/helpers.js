define(['exports', 'jquery', 'jquery.transition'], function(exports, $ /*, polyfill */ ) {

    console.log(exports)

    // Function.prototype.bind polyfill
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

    /**
     * Has class checker
     * @param  {HTMLElement}  el
     * @param  {String}  cls
     * @return {Boolean}
     */

    function hasClass(el, cls) {
        var separator = ' ';
        return(separator + el.className + separator).indexOf(separator + cls + separator) > -1;
    }

    /**
     * Adds class name
     * @param {HTMLElement} el
     * @param {String} cls
     */

    function addClass(el, cls) {
        if(!hasClass(el, cls)) {
            el.className = (el.className + ' ' + cls).replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
        };
        return el;
    }

    /**
     * Removes class name from element
     * @param  {HTMLElement} el
     * @param  {String} cls
     * @return {HTMLElement} self
     */

    function removeClass(el, cls) {
        el.className = el.className.replace(new RegExp('(^|\\s)' + cls + '(?:\\s|$)'), '$1');
        return el;
    }

    return {

        /**
         * Namespaced animation wrapper
         * @param  {HTMLElement} el
         * @param  {Object} properties CSS properties to animate
         * @param  {Number} [duration] in ms
         * @param  {String} [easing]
         * @param  {Function} [complete] callback
         */
        animate: function(el, properties, duration, easing, complete) {
            return $(el).animate(properties, duration, easing, complete);
        },

        /**
         * Get computed style
         * @param  {HTMLElement} el
         * @param  {String} styleProp
         * @return {String}
         */
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

        /**
         * isArray polyfill
         * @param  {Object}  object
         * @return {Boolean}
         */
        isArray: typeof Array.isArray === 'function' ? Array.isArray : function(
        object) {
            return Object.prototype.toString.call(object) == '[object Array]';
        },

        /**
         * Throttles function, returning its version that cannot be invoked
         * more than once per 'wait' ms. Userful for handling reflows on events
         * that are occurring very fast and often.
         *
         * @param  {Function} func
         * @param  {Number} wait
         * @return {Function}
         */
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

        addClass: addClass,
        removeClass: removeClass,
        hasClass: hasClass,

        /**
         * Capitalizes string, for css properties
         * @param  {String} str
         * @return {String}
         */
        capitalizeString: function(str) {
            return str[0].toUpperCase() + str.substring(1);
        }
    };

});
