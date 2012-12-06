(function($) {

    var animate = this.animate = function(el, properties, duration, easing, complete) {
        return $(el).animate(properties, duration, easing, complete);
    };

})(jQuery);
