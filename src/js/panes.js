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
        bufferPanes: 3,
        firstVisiblePane: 0,
        viewportSize: null,

        initialize: function(options) {
            console.log('Panes:constructor', options);
            _.bindAll(this, 'addPane', 'removePane', 'insertPane');

            this.model.on('add', this.addPane);
            this.model.on('remove', this.removePane);

            mvc.View.prototype.initialize.apply(this, arguments);

            this.updateViewportSize();
            this.createCanvas();
            this.paneWidth = this.measurePane();
            this.panesPerViewport = Math.floor(this.viewportSize.w / this.paneWidth);
            this.adjustCanvasToViewport();

            this.render();
        },

        updateViewportSize: function() {
            var size = this.viewportSize = {
                w: this.el.offsetWidth,
                h: this.el.offsetHeight
            };
            return size;
        },

        /**
         * @return {Number}
         */
        getViewportWidth: function() {
            return this.el.clientWidth;
        },

        /**
         * Creates movable container for panes
         * @return {HTMLElement}
         */
        createCanvas: function() {
            var container = document.createElement('div');
            container.className = 'panes-container';
            this.el.appendChild(container);
            this.container = container;
            return container;
        },

        /**
         * Adjust canvas to contain buffer space to the left
         */
        adjustCanvasToViewport: function() {
            var bufferMargin = this.bufferMargin = (this.bufferPanes + 1) * this.paneWidth,
                width = this.viewportSize.w + bufferMargin;
            this.container.style.width = width + 'px';
            this.container.style.height = this.viewportSize.h + 'px';
            this.container.style.left = -bufferMargin + 'px';
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

            pane.style.left = '-9999px';
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
            console.group('addPane');
            console.log('Panes:addPane', arguments, options.index, options.at);
            options = options || {};
            var pos = options.index || 0,
                pane = this.createPane(model);

            // first pane - position
            if(pos === 0) {
                pane.style.marginLeft = this.bufferMargin + 'px';
            } else if(this.model.length > this.panesPerViewport) {
                // if there is a margin buffer to use - use it
                if(this.bufferMargin > this.paneWidth) {
                    this.bufferMargin -= this.paneWidth;
                    this.model.models[0]._view.el.style.marginLeft = this.bufferMargin + 'px';
                } else {
                    // else start removing(collapsing) panes
                    // that are out of bounds
                    var first = this.model.models[this.firstVisiblePane]._view.el,
                        next = this.model.models[this.firstVisiblePane + 1]._view.el;

                    next.style.marginLeft = first.style.marginLeft;
                    first.style.marginLeft = '';
                    first.style.display = 'none';

                    this.firstVisiblePane++;
                }
            }

            this.addView(model, pane);
            this.container.appendChild(pane);
            console.groupEnd('addPane');
        },

        preparePlace: function(model) {},

        removePane: function(model, collection, options) {
            console.group('removePane');
            console.log('Panes:removePane', arguments, this.model.length, this.panesPerViewport);
            options = options || {};
            var pos = collection.indexOf(model),
                pane = model._view.el;

            if(this.model.length >= this.panesPerViewport) {
                // there are panes out of view, move them forward
                var first, prev, margin;
                if(this.firstVisiblePane === 0) {
                    first = this.model.models[0]._view.el;
                    this.bufferMargin += this.paneWidth;
                    first.style.marginLeft = this.bufferMargin + 'px';
                } else {
                    first = this.model.models[this.firstVisiblePane]._view.el;
                    prev = this.model.models[this.firstVisiblePane - 1]._view.el;

                    prev.style.marginLeft = first.style.marginLeft;
                    first.style.marginLeft = '';
                    prev.style.display = 'block';

                    this.firstVisiblePane--;
                }
            }
            this.removeView(model, pane);
            console.groupEnd('removePane');
        },

        insertPane: function() {
            console.log('Panes:insertPane', arguments);
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

        removeView: function(model, pane) {
            pane.parentNode.removeChild(pane);
            delete model._view;
        },

        createPane: function() {
            var pane = document.createElement('div');
            pane.className = 'pane';
            return pane;
        },

        render: function() {
            console.log('Panes:render', arguments);
            // create all the panes at once
            // this.container.appendChild(this.createPanes(this.model.models));
        }

    });

})(jQuery, Backbone);
