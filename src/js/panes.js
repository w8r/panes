(function($, Model, View, Collection) {

    var getStyle = function(el, styleProp) {
        var value = el.style[styleProp];
        if (value === '') {
            if (el.currentStyle) {
                value = el.currentStyle[styleProp];
            } else {
                if (window.getComputedStyle) {
                    value =
                            document.defaultView.getComputedStyle(el, null)
                                    .getPropertyValue(styleProp);
                }
            }
        }
        return value;
    },

        isArray =
                typeof Array.isArray === 'function' ? Array.isArray : function(
                        object) {
                    return Object.prototype.toString.call(object) == '[object Array]';
                };

    // https://gist.github.com/1312328
    Function.prototype.bind = Function.prototype.bind || function(b) {
        if (typeof this !== "function") {
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }
        var a = Array.prototype.slice,
            f = a.call(arguments, 1),
            e = this,
            c = function() {},
            d = function() {
                return e.apply(this instanceof c ? this : b || window, f
                                .concat(a.call(arguments)));
            };
        c.prototype = this.prototype;
        d.prototype = new c();
        return d;
    };

    /**
     * @class Panes
     */
    var Panes = this.Panes = View.extend({
        tagName : 'div',
        className : 'panes',
        defaultView : Pane,
        bufferPanes : 3,
        firstVisiblePane : 0,
        correction : 0,
        panesCount : 0,
        viewportSize : null,

        /**
         * @constructor
         * @param {Object}
         *            options
         */
        initialize : function(options) {
            console.log('Panes:constructor', options);
            _.bindAll(this, 'addPane', 'removePane', 'insertPane');

            this.model.on('add', this.addPane);
            this.model.on('remove', this.removePane);

            View.prototype.initialize.apply(this, arguments);

            this.updateViewportSize();
            this.createCanvas();
            this.paneWidth = this.measurePane();
            this.panesPerViewport =
                    Math.floor(this.viewportSize.w / this.paneWidth);
            this.adjustCanvasToViewport();

            this.render();
        },

        /**
         * Stores viewport size
         * 
         * @returns {Object} size
         */
        updateViewportSize : function() {
            var size = this.viewportSize = {
                w : this.el.offsetWidth,
                h : this.el.offsetHeight
            };
            return size;
        },

        /**
         * @return {Number}
         */
        getViewportWidth : function() {
            return this.el.clientWidth;
        },

        /**
         * Creates movable container for panes
         * 
         * @return {HTMLElement}
         */
        createCanvas : function() {
            var container = document.createElement('div');
            container.className = 'panes-container';
            this.el.appendChild(container);
            this.container = container;
            return container;
        },

        /**
         * Adjust canvas to contain buffer space to the left
         */
        adjustCanvasToViewport : function() {
            var bufferMargin =
                    this.bufferMargin = (this.bufferPanes + 1) * this.paneWidth,
                width = this.viewportSize.w + bufferMargin,
                containerStyle = this.containerStyle.style;
                
            containerStyle.width = width + 'px';
            containerStyle.height = this.viewportSize.h + 'px';
            containerStyle.left = -bufferMargin + 'px';
        },

        /**
         * Measures particular pane or dummy pane if none passed
         * 
         * @param {HTMLElement}
         *            pane
         * @return {Number} pane width including margins
         */
        measurePane : function(pane) {
            // console.time('measurePane');
            pane = pane || this.createPane();
            var width, margins;

            pane.style.left = '-9999px';
            this.container.appendChild(pane);

            margins = getStyle(pane, 'margin').split(' ');
            width =
                    parseInt(pane.clientWidth) + parseInt(margins[1])
                            + parseInt(margins[3]);

            this.container.removeChild(pane);
            // console.timeEnd('measurePane');
            return width;
        },

        /**
         * Adds a pane at random position, at the top of the stack by default
         * 
         * @param {Model}
         *            model
         * @param {Collection}
         *            collection
         * @param {Object}
         *            [options]
         * @param {Number}
         *            [options.at] position
         * @param {Number}
         *            [options.index] model index
         * @param {HTMLElement|DocumentFragment}
         *            options.container Container to insert pane into
         */
        addPane : function(model, collection, options) {
            console.group('addPane');

            options = options || {};
            var pos = options.index || collection.indexOf(model),
                pane = this.createPane(model),
                container = options.container || this.container;
            console.log('Panes:addPane', arguments, pos, this.bufferMargin,
                    this.correction);
            // first pane - position
            if (pos === 0) {
                pane.style.marginLeft = this.bufferMargin + 'px';
            } else {
                // haha, that's it
                if (collection.length > this.panesPerViewport) {
                    // "Teaser pane": shift so that the viewport would be filled
                    // seamlessly it means adjusting margin so that there should
                    // be no empty space after the rightmost pane.
                    if (collection.length === this.panesPerViewport + 1) {
                        this.correction =
                                this.viewportSize.w - this.paneWidth
                                        * this.panesPerViewport;
                    }

                    // if there is a margin buffer to use - use it
                    if (this.bufferMargin > this.paneWidth) {
                        this.bufferMargin -= this.paneWidth;
                        console.log('margin', this.bufferMargin
                                        + this.correction)
                        collection.models[0]._view.el.style.marginLeft =
                                this.bufferMargin + this.correction + 'px';
                    } else {
                        // else start removing(collapsing) panes
                        // that are out of bounds
                        var firstVisible = this.firstVisiblePane,
                            first = collection.models[firstVisible]._view.el,
                            next = collection.models[firstVisible + 1]._view.el;

                        // copy margin to the next one
                        console.log(first.style.marginLeft)
                        next.style.marginLeft = first.style.marginLeft;
                        first.style.marginLeft = '';
                        // constrict
                        first.style.display = 'none';

                        // set iterator to the first expanded
                        this.firstVisiblePane++;
                    }
                }
            }

            this.addView(model, pane);
            this.container.appendChild(pane);
            console.groupEnd('addPane');
        },

        /**
         * Removes random pane
         * 
         * @param {Model}
         *            model Pane model
         * @param {Collection}
         *            collection
         * @param {Object}
         *            options
         * @param {Number}
         *            options.index Insertion index
         */
        removePane : function(model, collection, options) {
            console.group('removePane');
            console.log('Panes:removePane', arguments, this.model.length,
                    this.panesPerViewport);
            options = options || {};
            var pos = collection.indexOf(model),
                pane = model._view.el;

            if (collection.length >= this.panesPerViewport) {
                // there are panes out of view, move them forward
                var firstVisible = this.firstVisiblePane, first, prev;

                // fix correction, we don't need teaser pane anymore
                if (collection.length === this.panesPerViewport) {
                    this.correction = 0;
                }

                if (firstVisible === 0) {
                    // no constricted panes - move first one to the right
                    first = collection.models[0]._view.el;
                    this.bufferMargin += this.paneWidth;
                    first.style.marginLeft =
                            this.bufferMargin + this.correction + 'px';
                } else {
                    first = collection.models[firstVisible]._view.el;
                    prev = collection.models[firstVisible - 1]._view.el;

                    // copy margin from the expanded one
                    prev.style.marginLeft = first.style.marginLeft;
                    first.style.marginLeft = '';
                    // then expand
                    prev.style.display = 'block';

                    // it is now first expanded pane
                    this.firstVisiblePane--;
                }
            }
            this.removeView(model, pane);
            console.groupEnd('removePane');
        },

        insertPane : function() {
            console.log('Panes:insertPane', arguments);
        },

        /**
         * Adds pane to the model view as the container(.el)
         * 
         * @param {Model}
         *            model
         * @param {HTMLElement}
         *            pane
         * @returns {HTMLElement} pane
         */
        addView : function(model, pane) {
            var viewOptions = {
                model : model,
                el : pane
            },
                viewConstructor = model.view || this.defaultView;
            model._view = new viewConstructor(viewOptions);
            this.panesCount++;
            return pane;
        },

        /**
         * Removes pane reference from model view, destroys element
         * 
         * @param {Model}
         *            model
         * @param {HTMLElement}
         *            pane
         * @returns {HTMLElement} detached pane
         */
        removeView : function(model, pane) {
            pane.parentNode.removeChild(pane);
            this.panesCount--;
            delete model._view;
            return pane;
        },

        /**
         * Creates pane element
         * 
         * @returns {HTMLElement}
         */
        createPane : function() {
            var pane = document.createElement('div');
            pane.className = 'pane';
            return pane;
        },

        /**
         * First render
         */
        render : function() {
            console.log('Panes:render', arguments);
            // create all the panes at once, use DocumentFragment to boost
            var paneOptions = {
                container : document.createDocumentFragment()
            };
            for (var i = 0, len = this.model.length; i < len; i++) {
                paneOptions.at = i;
                this.addPane(this.model.models[i], this.model, paneOptions);
            }
            this.container.appendChild(paneOptions.container);
        }

    });

})(jQuery, Backbone.Model, Backbone.View, Backbone.Collection);
