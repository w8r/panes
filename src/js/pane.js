(function($, mvc) {

    /**
     * Dummy pane view - to inherit from
     * @type {View}
     */
    var Pane = this.Pane = mvc.View.extend({
        initialize: function() {
            mvc.View.prototype.initialize.apply(this, arguments);
            this.render();
        },
        render: function() {
            this.el.innerHTML = '<h3>p' + this.model.collection.indexOf(this.model) + '</h3>';
        }
    });

})(jQuery, Backbone);
