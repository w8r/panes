define(function() {

    /**
     * Dummy pane view - to inherit from
     *
     * @type {View}
     */
    var Pane = function(options) {
        // set options
        options = options || {};
        for(var option in options) {
            if(options.hasOwnProperty(option)) {
                this[option] = options[option];
            }
        }

        this.render();
    };

    Pane.prototype = {

        /**
         * Dummy render
         */
        render: function() {
            var id = this.model.collection.indexOf(this.model);
            this.el.innerHTML = '<h3>p' + id + '<sup>' + this.model.cid + '</sup></h3>';
            console.log('Pane::render', id, this.model.cid);
        }
    };

    return Pane;
});
