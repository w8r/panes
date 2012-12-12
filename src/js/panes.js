define(['helpers', 'pane'], function(helpers, Pane) {

    /**
     * @class Panes
     */
    var Panes = this.Panes = function(options) {
        console.log('Panes:constructor', options);

        // just copy the options
        for(var option in options) {
            this[option] = options[option];
        }
        console.log(options.model, this.model);

        // enable addPane, removePane, adjust and destroy as event listeners
        this.addPane = this.addPane.bind(this);
        this.removePane = this.removePane.bind(this);
        this.adjust = this.adjust.bind(this);
        this.destroy = this.destroy.bind(this);

        // build and calculate constants
        this.createViewport();
        this.updateViewportSize();
        this.createCanvas();
        this.paneWidth = this.measurePane();
        this.panesPerViewport = Math.floor(this.viewportSize.w / this.paneWidth);
        this.adjustCanvasToViewport();
        this.createShim();
        this.bindEvents();

        this.render();
    };

    Panes.prototype = {

        constructor: Panes,

        /**
         * Models collection
         * @type {Collection}
         */
        model: null,

        /**
         * Fixed panes array
         * @type {Object}
         */
        fixedPanes: {},

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

        /**
         * Use animation or not
         * @type {Boolean}
         */
        animation: false,

        /**
         * Animation wrapper. To be implemented elsewhere
         * @type {Function}
         */
        animate: null,

        /**
         * Panes movement animation duration
         * @type {Number}
         */
        shiftDuration: 200,

        /**
         * Creates viewport container
         */
        createViewport: function() {
            var viewport = this.viewport = document.createElement('div');
            viewport.className = "viewport";
            this.el.appendChild(viewport);
        },

        /**
         * Stores viewport size
         *
         * @returns {Object} size
         */
        updateViewportSize: function() {
            var size = this.viewportSize = {
                w: this.viewport.offsetWidth,
                h: this.viewport.offsetHeight
            };
            this.panesPerViewport = Math.floor(this.viewportSize.w / this.paneWidth);
            return size;
        },

        /**
         * @return {Number}
         */
        getViewportWidth: function() {
            return this.viewport.clientWidth;
        },

        /**
         * Creates movable container for panes
         *
         * @return {HTMLElement}
         */
        createCanvas: function() {
            var container = document.createElement('div');
            container.className = 'panes-container';
            this.viewport.appendChild(container);
            this.container = container;
            return container;
        },

        /**
         * Creates pane shim
         */
        createShim: function() {
            var shim = this.shim = this.createPane();
            helpers.addClass(shim, 'shim hide');
            shim.style.left = 0;
            this.adjustShim();
            this.viewport.appendChild(shim);
        },

        /**
         * Gets correction size for partly concealed panes
         * @return {Number}
         */
        getCorrection: function() {
            return this.viewportSize.w - this.paneWidth * this.panesPerViewport;
        },

        /**
         * Adjusts shim size
         */
        adjustShim: function() {
            console.log('adjust shim')
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
            this.resizeListener = helpers.throttle(function() {
                this.updateViewportSize();
                this.adjustCanvasToViewport();
                if(this.model.length) {
                    this.adjust(this.current);
                }
                this.adjustShim();
            }.bind(this), 100);
            window.addEventListener('resize', this.resizeListener, false);

            // shim click
            this.shimClickListener = function() {
                this.navigate(--this.current, this.model);
            }.bind(this);
            this.shim.addEventListener('click', this.shimClickListener, false);
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

            margins = helpers.getStyle(pane, 'margin').split(' ');
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
         * @public
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

            if(arguments.length === 2) {
                return this.fixPane(model, arguments[1]);
            }

            options = options || {};
            var pos = options.index || collection.indexOf(model),
                pane = this.createPane(model),
                container = options.container || this.container,
                newPanesCount = this.panesCount + 1,
                animation = ('animation' in options) ? options.animation : this.animation;
            console.log('Panes:addPane', arguments, pos, options.at, options.index, this.panesCount);

            if(animation) {
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
                this.adjust(this.current);
            }

            if(animation) {
                // Works perfectly if we're appending a pane
                //  - then it shifts stack to the left.
                if(this.shifter && pos === this.panesCount - 1 && this.panesCount > this.panesPerViewport) {
                    var shift = parseInt(this.shifter.el.style.marginLeft) - this.paneWidth;
                    if(this.panesCount === this.panesPerViewport + 1) {
                        shift += this.getCorrection();
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
                    this.adjust(this.current);
                }.bind(this));
            }
            console.groupEnd('addPane');
        },

        /**
         * Removes random pane
         *
         * @public
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

            if(arguments.length == 1) {
                return this.unfixPane(model);
            }

            options = options || {};
            var pos = ('index' in options) ? options.index : collection.indexOf(model),
                pane = model._view.el,
                newPanesCount = this.panesCount - 1,
                animation = ('animation' in options) ? options.animation : this.animation;
            console.log('Panes:removePane', arguments, pos, '/', collection.length, options.at, options.index);

            this.current = pos - 1;
            this.removeView(model, pane);

            // remove element instantly
            if(!animation) {
                pane.parentNode.removeChild(pane);
            }

            if(!options.silent) {
                if(animation) {
                    if(this.shifter && pos === collection.length && this.panesCount >= this.panesPerViewport) {
                        var shift = parseInt(this.shifter.el.style.marginLeft) + this.paneWidth;
                        if(this.panesCount === this.panesPerViewport) {
                            shift -= this.getCorrection();
                        }
                        this.animate(this.shifter.el, {
                            marginLeft: shift
                        }, this.shiftDuration);
                    }
                    this.animate(pane, {
                        width: 0
                    }, this.shiftDuration, function() {
                        pane.parentNode.removeChild(pane);
                        this.adjust(this.current);
                    }.bind(this));
                } else {
                    this.adjust(this.current);
                }
            }
            console.groupEnd('removePane');
        },


        /**
         * Fixes pane(new or exisiting) at position
         * @param  {Model} model
         * @param  {Object} options
         */
        fixPane: function(model, options) {
            // can work with existing pane, can create new ones
            var exists = (model._view && model._view.el),
                pane = exists ? model._view.el : this.createPane();
            console.log(pane);
            var paneStyle = pane.style,
                overlay = options.over,
                side = options.side || 'left',
                animation = ('animation' in options) ? options.animation : this.animation,
                viewportCorrection = overlay ? 0 : this.paneMetrics.width;
            helpers.addClass(pane, 'fixed');

            // position pane
            if(side === 'left') {
                pane.style.left = (animation ? -this.paneMetrics.width : 0) + 'px';
                console.log(pane.style.left);
                this.el.insertBefore(pane, this.viewport);
            } else {
                pane.style.right = (animation ? -this.paneMetrics.width : 0) + 'px';
                this.el.appendChild(pane);
            }
            this.addView(model, pane);
            this.fixedPanes[side] = model;

            console.log('positioned', animation)
            if(animation) {
                if(overlay) {} else {
                    var viewportStyles = {
                        width: this.viewportSize.w - viewportCorrection
                    },
                        paneStyles = {};
                    paneStyles[side] = 0;
                    viewportStyles['margin' + helpers.capitalizeString(side)] = viewportCorrection;
                    console.log(viewportStyles)

                    helpers.addClass(this.viewport, 'condensed');
                    this.animate(this.viewport, viewportStyles, this.shiftDuration, function() {
                        this.panesCount--;
                        this.resizeListener();
                        // pane.innerHTML = '<h3>Fixed</h3>';
                    }.bind(this));
                    this.animate(pane, paneStyles, this.shiftDuration);
                }
            } else {
                // show over the viewport, like shim
                if(overlay) {} else {
                    this.viewport.style['margin' + helpers.capitalizeString(side)] = viewportCorrection + 'px';
                    this.viewport.style.width = this.viewportSize.w - viewportCorrection + 'px';
                    helpers.addClass(this.viewport, 'condensed');
                    this.resizeListener();
                }

                pane.innerHTML = '<h3>Fixed</h3>';

                if(options.side === 'left') {
                    this.el.insertBefore(pane, this.viewport);
                } else {
                    this.el.appendChild(pane);
                }
            }

            model.options = options;
            console.groupEnd('addPane');
        },

        /**
         * Removes fixed pane(sidebar)
         * @param  {Model} model
         * @param  {Object} options
         * @return {Model}
         */
        unfixPane: function(model, options) {
            options = options || model.options;
            var overlay = !! options.over,
                side = options.side,
                pane = model._view.el,
                animation = ('animation' in options) ? options.animation : this.animation,
                viewportCorrection = overlay ? 0 : this.paneMetrics.width;
            console.log('remove sidebar', options.over, options.side);

            this.removeView(model, pane);
            this.panesCount++;

            if(animation) {
                var viewportStyles = {
                    width: parseInt(helpers.getStyle(this.viewport, 'width')) + viewportCorrection
                },
                    paneStyles = {};
                viewportStyles['margin' + helpers.capitalizeString(side)] = 0;
                paneStyles[side] = -this.paneMetrics.width;

                this.animate(this.viewport, viewportStyles, this.shiftDuration, function() {
                    this.resizeListener();
                }.bind(this));
                this.animate(pane, paneStyles, this.shiftDuration, function() {
                    pane.parentNode.removeChild(pane);
                });
            } else {
                // fix viewport
                this.viewport.style['margin' + helpers.capitalizeString(side)] = '';
                this.viewport.style.width = parseInt(helpers.getStyle(this.viewport, 'width')) + viewportCorrection + 'px';

                pane.parentNode.removeChild(pane);
                this.resizeListener();
            }

            delete this.fixedPanes[side];
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
            model._view = new(model.view || this.defaultView)({
                model: model,
                el: pane
            });
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
            this.panesCount--;
            delete model._view;
            return pane;
        },

        /***********************************************************************
         *
         * @public
         *
         * [||||| buf | buf || vis | vis | current || buf | buf ||||||]
         *                                    ^
         **********************************************************************/
        adjust: function(current, withAnimation) {
            // current pane position is the rightmost, so
            var firstVisiblePane = Math.max(0, current - this.panesPerViewport - this.bufferPanes),
                lastVisiblePane = Math.min(this.panesCount, current + this.bufferPanes),
                i, len, pane,
                // calculate position
                leftBufferSize = Math.max(0, Math.min(this.bufferPanes, current + 1 - this.panesPerViewport - firstVisiblePane)),
                pos = this.bufferMargin - (leftBufferSize * this.paneWidth),
                correction = 0;

            // "Teaser pane": shift so that the viewport would be filled
            // seamlessly it means adjusting margin so that there should
            // be no empty space after the rightmost pane.
            if(leftBufferSize) {
                correction = this.getCorrection();
                pos += this.getCorrection();
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
                        this.shift(pane, pos, correction, withAnimation);
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
        shift: function(pane, pos, correction, withAnimation) {
            // release last shifter from its duties
            if(this.shifter && pane !== this.shifter) {
                console.log('change shifter');
                var previousShifter = this.shifter.el,
                    display = previousShifter.style.display;
                previousShifter.setAttribute('style', '');

                previousShifter.style.display = display;
                previousShifter.style.marginLeft = '';
                helpers.removeClass(previousShifter, 'shifter');
            }

            // cache shifter
            this.shifter = pane;
            helpers.addClass(pane.el, 'shifter');

            // animate only if it wasn't animated before
            if(withAnimation && this.animation) {
                this.animate(pane.el, {
                    marginLeft: pos
                }, this.shiftDuration);
            } else {
                pane.el.style.marginLeft = pos + 'px';
            }
            this.shifterPos = pos;
        },

        /**
         * [navigate description]
         * @param  {[type]}   id       [description]
         * @param  {Function} callback [description]
         * @return {[type]}            [description]
         */
        navigate: function(id, callback) {
            // just shift to the right pane, calling the adjust method with
            // animation if needed
            this.adjust(id, this.animation);
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
                    }, this.shiftDuration / 2);
                } else {
                    helpers.addClass(shim, 'hide');
                }
                shim.isDisplayed = false;
            }
        },

        /**
         * Reveals shim(slide out if animated)
         */
        showShim: function() {
            var shim = this.shim;
            if(!shim.isDisplayed) {
                helpers.removeClass(shim, 'hide');
                if(this.animation) {
                    console.log('animate shim', shim);
                    this.animate(shim, {
                        left: 0
                    }, this.shiftDuration / 2);
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
         * @public         *
         */
        destroy: function() {
            window.removeEventListener('resize', this.resizeListener);
            this.shim.removeEventListener('click', this.shimClickListener);
        }

    };

    return Panes;
});
