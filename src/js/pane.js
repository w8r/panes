(function($, View) {

    /**
     * Dummy pane view - to inherit from
     * 
     * @type {View}
     */
    var Pane = this.Pane = View.extend({
                initialize : function() {
                    View.prototype.initialize.apply(this, arguments);
                    this.render();
                },
                render : function() {
                    this.el.innerHTML =
                            '<h3>p' + this.model.collection.indexOf(this.model)
                                    + '</h3>';
                }
            });

})(jQuery, Backbone.View);
