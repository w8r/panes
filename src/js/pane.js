define(['helpers'], function(helpers) {

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

        constructor: Pane,

        /**
         * Dummy render
         */
        render: function() {
            var id = this.model.collection.indexOf(this.model);
            this.el.innerHTML = ['<span class="close-pane">&times</span>',
                                '<h3>p', id, '<sup>', this.model.cid,
                                '</sup></h3>', '<img src="../src/img/',
                                ['capibara', 'arctic-foxes', 'cog'][Math.round(Math.random() * 2)],
                                '.gif" />'].join('');

            console.log('Pane::render', id, this.model.cid);
            this.el.addEventListener('click', function(evt) {
                if(helpers.hasClass(evt.target, 'close-pane')) {
                    this.model.destroy();
                }
            }.bind(this), false);
        }
    };

    return Pane;
});
