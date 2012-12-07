(function($, Model, View, Collection, throttle) {

    // get computed style
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
        // isArray polyfill
        isArray = typeof Array.isArray === 'function' ? Array.isArray : function(
    object) {
        return Object.prototype.toString.call(object) == '[object Array]';
    };

    // https://gist.github.com/1312328
    Function.prototype.bind = Function.prototype.bind ||
    function(b) {
        if(typeof this !== "function") {
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }
        var a = Array.prototype.slice,
            f = a.call(arguments, 1),
            e = this,
            c = function() {},
            d = function() {
            return e.apply(this instanceof c ? this : b || window, f.concat(a.call(arguments)));
        };
        c.prototype = this.prototype;
        d.prototype = new c();
        return d;
    };

    /**
     * @class Panes
     */
    var Panes = this.Panes = View.extend({
        tagName: 'div',
        className: 'panes',

        /**
         * Default view constructor for a model
         *
         * @type {View}
         */
        defaultView: Pane,

        /**
         * Buffered and displayed out of bounds panes
         *
         * @type {Number}
         */
        bufferPanes: 3,

        /**
         * Shift correction value, used to fill the viewport with panes
         * seamlessly: if there's more panes than the viewport can contain, the
         * first one should be partly displayed
         *
         * @type {Number}
         */
        correction: 0,

        /**
         * Actually created panes count
         *
         * @type {Number}
         */
        panesCount: 0,

        /**
         * Viewport size. To be updated on resize
         *
         * @type {Object}
         */
        viewportSize: null,

        /**
         * Pane responsible for shifting
         *
         * @type {HTMLElement}
         */
        shifter: null,

        /**
         * Shim pane to cover partly shown panes and to be clicked to move back
         *
         * @type {HTMLElement}
         */
        shim: null,

        animation: false,

        animate: null,

        shiftDuration: 300,

        /**
         * @constructor
         * @param {Object}
         *            options
         */
        initialize: function(options) {
            console.log('Panes:constructor', options);

            this.addPane = this.addPane.bind(this);
            this.removePane = this.removePane.bind(this);

            this.model.on('add', this.addPane);
            this.model.on('remove', this.removePane);

            View.prototype.initialize.apply(this, arguments);

            if(options.animation) {
                this.animation = options.animation;
                this.animate = options.animate;
            }

            this.updateViewportSize();
            this.createCanvas();
            this.paneWidth = this.measurePane();
            this.panesPerViewport = Math.floor(this.viewportSize.w / this.paneWidth);
            this.adjustCanvasToViewport();
            this.createShim();
            this.bindEvents();

            this.render();
        },

        /**
         * Stores viewport size
         *
         * @returns {Object} size
         */
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
         *
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
         * Creates pane shim
         */
        createShim: function() {
            var shim = this.shim = this.createPane();
            shim.className += ' shim hide';
            shim.style.left = 0;
            this.adjustShim();
            this.el.appendChild(shim);
        },

        /**
         * Adjusts shim size
         */
        adjustShim: function() {
            this.shim.style.marginLeft = (this.viewportSize.w - (this.panesPerViewport + 1) * this.paneWidth) + 'px';
        },

        /**
         * Adjust canvas to contain buffer space to the left
         */
        adjustCanvasToViewport: function() {
            // one extra pane at each side to cover occasional nevative margins
            var bufferMargin = this.bufferMargin = (this.bufferPanes + 1) * this.paneWidth,
                width = this.viewportSize.w + bufferMargin * 2,
                containerStyle = this.container.style;

            containerStyle.width = width + 'px';
            containerStyle.height = this.viewportSize.h + 'px';
            containerStyle.left = -bufferMargin + 'px';
        },

        /**
         * Binds event listeners
         */
        bindEvents: function() {
            // resize
            this.resizeListener = window.addEventListener('resize', throttle(function() {
                this.updateViewportSize();
                this.adjustCanvasToViewport();
                if(this.model.length) {
                    this.adjust(this.current, this.model);
                }
                this.adjustShim();
            }.bind(this), 100), false);

            // shim click
            this.shimClickListener = this.shim.addEventListener('click', function() {
                this.adjust(--this.current, this.model);
            }.bind(this), false);
        },

        /**
         * Measures particular pane or dummy pane if none passed
         *
         * @param {HTMLElement}
         *            pane
         * @return {Number} pane width including margins
         */
        measurePane: function(pane) {
            // console.time('measurePane');
            pane = pane || this.createPane();
            var width, margins, metrics;

            pane.style.left = '-9999px';
            this.container.appendChild(pane);

            margins = getStyle(pane, 'margin').split(' ');
            width = parseInt(pane.clientWidth);
            metrics = this.paneMetrics = {
                width: width,
                margin: {
                    right: parseInt(margins[1]),
                    left: parseInt(margins[3])
                }
            };

            this.container.removeChild(pane);
            return width + metrics.margin.left + metrics.margin.right;
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
        addPane: function(model, collection, options) {
            console.group('addPane');

            options = options || {};
            var pos = options.index || collection.indexOf(model),
                pane = this.createPane(model),
                container = options.container || this.container,
                newPanesCount = this.panesCount + 1;
            console.log('Panes:addPane', arguments, pos, options.at, options.index, this.panesCount);

            if(this.animation) {
                pane.style.marginLeft = pane.style.width = '0px';
            }

            // insert at pos
            if(pos < this.panesCount) {
                var nextPane = this.model.models[pos + 1]._view.el;
                this.container.insertBefore(pane, nextPane);
            } else { // append
                this.container.appendChild(pane);
            }

            this.addView(model, pane);
            this.current = pos;

            if(!options.silent && !this.animation) {
                this.adjust(this.current, collection);
            }

            if(this.animation) {
                // Works perfectly if we're appending a pane
                //  - then it shifts stack to the left.
                if(this.shifter && pos === this.panesCount - 1 && this.panesCount > this.panesPerViewport) {
                    var shift = parseInt(this.shifter.el.style.marginLeft) - this.paneWidth;
                    if(this.panesCount === this.panesPerViewport + 1) {
                        shift += this.correction;
                    }
                    this.animate(this.shifter.el, {
                        marginLeft: shift
                    }, this.shiftDuration);
                }

                // animate pane
                this.animate(pane, {
                    marginLeft: this.paneMetrics.margin.left,
                    width: this.paneMetrics.width
                }, this.shiftDuration, function() {
                    this.adjust(this.current, collection);
                }.bind(this));
            }
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
        removePane: function(model, collection, options) {
            console.group('removePane');
            options = options || {};
            var pos = ('index' in options) ? options.index : collection.indexOf(model),
                pane = model._view.el,
                newPanesCount = this.panesCount - 1;
            console.log('Panes:removePane', arguments, pos, '/', collection.length, options.at, options.index);

            this.current = pos - 1;
            this.removeView(model, pane);

            // remove element instantly
            if(!this.animation) {
                pane.parentNode.removeChild(pane);
            }

            if(!options.silent) {
                if(this.animation) {
                    if(this.shifter && pos === collection.length && this.panesCount >= this.panesPerViewport) {
                        var shift = parseInt(this.shifter.el.style.marginLeft) + this.paneWidth;
                        if(this.panesCount === this.panesPerViewport) {
                            shift -= this.correction;
                        }
                        this.animate(this.shifter.el, {
                            marginLeft: shift
                        }, this.shiftDuration);
                    }
                    this.animate(pane, {
                        width: 0
                    }, this.shiftDuration, function() {
                        pane.parentNode.removeChild(pane);
                        this.adjust(this.current, this.model);
                    }.bind(this));
                } else {
                    this.adjust(this.current, this.model);
                }
            }
            console.groupEnd('removePane');
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
        addView: function(model, pane) {
            var viewOptions = {
                model: model,
                el: pane
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
        removeView: function(model, pane) {
            if(!this.animation) {

            }
            this.panesCount--;
            delete model._view;
            return pane;
        },

        /***********************************************************************
         *
         * [||||| buf | buf || vis | vis | current || buf | buf ||||||]
         *                                    ^
         **********************************************************************/
        adjust: function(current, collection) {
            // current pane position is the rightmost, so
            var firstVisiblePane = Math.max(0, current - this.panesPerViewport - this.bufferPanes),
                lastVisiblePane = Math.min(this.panesCount, current + this.bufferPanes),
                i, len, pane,
                // calculate position
                leftBufferSize = Math.max(0, Math.min(this.bufferPanes, current + 1 - this.panesPerViewport - firstVisiblePane)),
                pos = this.bufferMargin - (leftBufferSize * this.paneWidth),
                correction;

            // "Teaser pane": shift so that the viewport would be filled
            // seamlessly it means adjusting margin so that there should
            // be no empty space after the rightmost pane.
            if(leftBufferSize) {
                correction = this.viewportSize.w - this.paneWidth * this.panesPerViewport;
                pos += correction;
                this.showShim();
            } else {
                this.hideShim();
            }

            console.group('Viewport state');
            console.log('\tmax panes per viewport:', this.panesPerViewport, ', buffer: ', this.bufferPanes);
            console.log('\tcorrection needed: ', !! correction, ', correction size:', correction);
            console.log('\tcurrent:', current, ', size:', this.panesCount);
            console.log('\tfirst visible:', firstVisiblePane, ', left buffer size:', leftBufferSize);
            console.log('\tlast visible:', firstVisiblePane);
            console.log('pos', pos);
            console.groupEnd('Viewport state');

            // one loop
            for(var i = 0, len = this.panesCount; i < len; i++) {
                pane = this.model.models[i]._view;
                // hide stacked, they're out of view anyway
                if((i < firstVisiblePane) || (i > lastVisiblePane)) {
                    this.hidePane(pane);
                } else {
                    this.showPane(pane);
                    // it's the shifter
                    if(i === firstVisiblePane) {
                        this.shift(pane, pos, correction);
                    }
                }
            }
        },

        /**
         * Shifts canvas
         *
         * @param {Pane}
         *            pane
         * @param {Number}
         *            pos
         */
        shift: function(pane, pos, correction) {
            // release last shifter from its duties
            if(this.shifter && pane !== this.shifter) {
                console.log('change shifter');
                var previousShifter = this.shifter.el,
                    display = previousShifter.style.display;
                previousShifter.setAttribute('style', '');

                previousShifter.style.display = display;
                previousShifter.style.marginLeft = '';
                previousShifter.className = previousShifter.className.replace(/\s?shifter/g, '');
            }

            // cache shifter
            this.shifter = pane;
            if(pane.el.className.indexOf('shifter') === -1) {
                pane.el.className += ' shifter';
            }

            if(false && this.animation && (correction || correction !== this.correction)) {
                pane.el.style.marginLeft = pos - correction + 'px';
                this.animate(pane.el, {
                    marginLeft: pos
                }, this.shiftDuration);
            } else {
                pane.el.style.marginLeft = pos + 'px';
            }
            this.correction = correction;
        },

        /**
         * Hides pane
         * @param  {Pane} pane
         */
        hidePane: function(pane) {
            if(!pane._isHidden) {
                pane.el.style.display = 'none';
                pane._isHidden = true;
            }
        },

        /**
         * Reveals pane
         * @param  {Pane} pane
         */
        showPane: function(pane) {
            if(pane._isHidden) {
                pane.el.style.display = 'block';
                pane._isHidden = false;
            }
        },

        /**
         * Hides shim pane
         */
        hideShim: function() {
            var shim = this.shim;
            if(shim.isDisplayed) {
                if(this.animation) {
                    console.log('animate shim', shim);
                    this.animate(shim, {
                        left: -(this.paneWidth + parseInt(shim.style.marginLeft))
                    }, this.shiftDuration);
                } else {
                    shim.className += ' hide';
                }
                shim.isDisplayed = false;
            }
        },

        /**
         * Reveals shim(slide out if animated)
         */
        showShim: function() {
            var shim = this.shim;
            shim.className = shim.className.replace('hide', '');
            if(!shim.isDisplayed) {
                if(this.animation) {
                    console.log('animate shim', shim);
                    this.animate(shim, {
                        left: 0
                    }, this.shiftDuration);
                } else {
                    shim.className = this.shim.className.replace('hide', '');
                }
                shim.isDisplayed = true;
            }
        },

        /**
         * Creates pane element
         *
         * @returns {HTMLElement}
         */
        createPane: function() {
            var pane = document.createElement('div');
            pane.className = 'pane';
            return pane;
        },

        /**
         * First render
         */
        render: function() {
            console.log('Panes:render', arguments);
            // create all the panes at once, use DocumentFragment to boost
            if(this.model.length) {
                var paneOptions = {
                    container: document.createDocumentFragment(),
                    silent: true
                };
                for(var i = 0, len = this.model.length; i < len; i++) {
                    paneOptions.at = i;
                    this.addPane(this.model.models[i], this.model, paneOptions);
                }
                this.container.appendChild(paneOptions.container);
                this.adjust(this.current, this.model);
            }
        },

        /**
         * Destructor
         *
         * @return {[type]} [description]
         */
        destroy: function() {
            window.removeEventListener('resize', this.resizeListener);
            this.shim.removeEventListener('click', this.shimClickListener);
        }

    });

})(jQuery, Backbone.Model, Backbone.View, Backbone.Collection, _.throttle);
