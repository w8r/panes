(function($, View) {

    /**
     * Dummy pane view - to inherit from
     *
     * @type {View}
     */
    var Pane = this.Pane = View.extend({
        initialize: function() {
            View.prototype.initialize.apply(this, arguments);
            this.render();
        },
        render: function() {
            var id = this.model.collection.indexOf(this.model);
            this.el.innerHTML = '<h3>p' + id + '<sup>' + this.model.cid + '</sup></h3>';
            console.log('Pane::render', id, this.model.cid);
        }
    });

})(jQuery, Backbone.View);
