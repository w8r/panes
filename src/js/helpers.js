define(['jquery', 'jquery.transition'], function($ /*, polyfill */ ) {

    return {
        animate: this.animate = function(el, properties, duration, easing, complete) {
            return $(el).animate(properties, duration, easing, complete);
        }
    };

});
