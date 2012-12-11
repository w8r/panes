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
            var id = this.model.collection ? this.model.collection.indexOf(this.model) : 0,
                html = '<span class="close-pane">&times</span>';

            if(this.model.dummy || this.model.attributes.dummy) {
                html = [html, '<h3>p', id, '<sup>', this.model.cid,
                        '</sup></h3>', '<img src="../src/img/',
                        ['capibara', 'arctic-foxes', 'cog'][Math.round(Math.random() * 2)],
                        '.gif" />'].join('');
            }

            this.el.innerHTML = html;

            console.log('Pane::render', id, this.model.cid, this.model);
            this.el.addEventListener('click', function(evt) {
                if(helpers.hasClass(evt.target, 'close-pane')) {
                    this.model.destroy();
                }
            }.bind(this), false);
        },

        destroy: function() {
            if(this.el) {
               this.el.parentNode.removeChild(this.el);
            }
        }
    };

    return Pane;
});
