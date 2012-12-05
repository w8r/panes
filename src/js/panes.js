(function($, mvc) {

    var getStyle = function(el, styleProp) {
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

        isArray = typeof Array.isArray === 'function' ? Array.isArray : function(object) {
        return Object.prototype.toString.call(object) == '[object Array]';
    };

    var Panes = this.Panes = mvc.View.extend({
        tagName: 'div',
        className: 'panes',
        defaultView: Pane,

        initialize: function(options) {
            console.log('Panes:constructor', options);
            _.bindAll(this, 'addPane', 'removePane', 'insertPane', 'fixPane', 'unfixPane');

            this.model.on('add', this.addPane);
            this.model.on('remove', this.removePane);

            mvc.View.prototype.initialize.apply(this, arguments);

            this.createPanesContainer();
            this.paneWidth = this.measurePane();

            this.render();
        },

        /**
         * Creates movable container for panes
         * @return {HTMLElement}
         */
        createPanesContainer: function() {
            var container = document.createElement('div');
            container.className = 'panes-container';
            this.el.appendChild(container);
            this.container = container;
            return container;
        },

        /**
         * Measures particular pane or dummy pane if none passed
         * @param  {HTMLElement} pane
         * @return {Number} pane width including margins
         */
        measurePane: function(pane) {
            // console.time('measurePane');
            pane = pane || this.createPane();
            var width, margins;

            pane.style.left = '9999px';
            this.container.appendChild(pane);

            margins = getStyle(pane, 'margin').split(' ');
            width = parseInt(pane.clientWidth) + parseInt(margins[1]) + parseInt(margins[3]);

            this.container.removeChild(pane);
            // console.timeEnd('measurePane');
            return width;
        },

        /**
         * Adds a pane at random position, at the top of the stack by default
         * @param {Model} model
         * @param {Collection} collection
         * @param {Object} [options]
         * @param {Number} [options.at] position
         * @param {Number} [options.index] model index
         */
        addPane: function(model, collection, options) {
            console.log('Panes:addPane', arguments);
            options = options || {};
            var pos = options.at || 0;
            var previous = this.container.children[pos - 1];
            var pane = this.createPane(model);
            // prepare place
            this.preparePlace(model)
            // put it in there
            this.co
            // animate
            // register with model
            this.createPanes(model);
        },

        preparePlace: function(model) {},

        removePane: function() {
            console.log('Panes:removePane', arguments);
        },

        insertPane: function() {
            console.log('Panes:insertPane', arguments);
        },

        fixPane: function() {
            console.log('Panes:fixPane', arguments);
        },

        unfixPane: function() {
            console.log('Panes:unfixPane', arguments);
        },

        /**
         * Creates panes for collection
         * @param  {Array/Model} models
         * @return {documentFragment} containing all the created panes, positioned
         */
        createPanes: function(models) {
            console.log('Panes#createPanes', arguments);
            if(!isArray(models)) {
                models = [models];
            }
            var fragment = document.createDocumentFragment(),
                pane, width = 0,
                model;

            for(var i = 0, len = models.length; i < len; i++) {
                model = models[i];

                pane = this.createPane(model);
                pane.style.left = this.getPositionForPane(i) + 'px';

                this.addView(model, pane);

                fragment.appendChild(pane);
            }
            return fragment;
        },

        getPanePosition: function(model) {
            var pane = model._view.el;
            return parseInt(getStyle(pane, 'left'));
        },

        getPositionForPane: function(index) {
            var left = 0;
            if(index > 0) {
                // get previous pane position, otherwise it won't work
                left = this.getPanePosition(this.model.models[index - 1]) + this.paneWidth;
            }
            return left;
        },

        addView: function(model, pane) {
            var viewOptions = {
                model: model,
                el: pane
            },
                viewConstructor = model.view || this.defaultView;
            model._view = new viewConstructor(viewOptions);
            return model;
        },

        createPane: function() {
            var pane = document.createElement('div');
            pane.className = 'pane';
            return pane;
        },

        render: function() {
            console.log('Panes:render', arguments);
            // create all the panes at once
            this.container.appendChild(this.createPanes(this.model.models));
        }

    });

})(jQuery, Backbone);
