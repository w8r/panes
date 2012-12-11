require.config({
    baseUrl: '../src/js/',
    paths: {
        'jquery': '../../vendor/jquery',
        'jquery.transition': '../../vendor/jquery.transition',
        'backbone': '../../vendor/backbone',
        'underscore': '../../vendor/underscore'
    },
    shim: {
        'underscore': {
            'exports': '_'
        },
        'backbone': {
            'deps': ["underscore", "jquery"],
            'exports': "Backbone"
        }
    }
});

// app logic
requirejs(['jquery', 'backbone', 'pane', 'panes', 'helpers'], function($, Backbone, Pane, Panes, helpers) {
    var Model = Backbone.Model,
        View = Backbone.View,
        Collection = Backbone.Collection;

    // add test
    console.group('Panes test');
    console.group('init');

    var ModelFactory = this.ModelFactory = {
        create: function(num) {
            num = num || 0;
            var modelOptions = {
                view: Pane
            }
            models = [];
            for(var i = 0; i < num; i++) {
                models.push(new Model(modelOptions));
            }
            return models;
        }
    };

    var models = ModelFactory.create(6),
        collection = new Collection(models),
        panes = this.panes = new Panes({
            el: document.getElementById('panes'),
            model: collection,
            animation: true,
            animate: helpers.animate
        }),
        updateMiddleIterator = function(model, collection) {
        $('#goto-pane-pos').val(Math.round(collection.length / 2));
    };
    updateMiddleIterator(null, collection);

    collection.on('add', panes.addPane);
    collection.on('remove', panes.removePane);

    // set iterator to the central pane
    collection.on('add', updateMiddleIterator);
    collection.on('remove', updateMiddleIterator);

    // add pane
    $('#add-pane').click(function() {
        console.log('add pane triggered');
        collection.add(ModelFactory.create(1), {
            at: collection.length
        });
    });

    // remove pane
    $('#remove-pane').click(function() {
        console.log('remove pane triggered');
        var model = collection.pop();
    });

    // add pane at pos
    $('#add-pane-at').click(function() {
        var pos = $('#add-pane-pos').val();
        if(pos <= collection.length) {
            console.log('add pane @', pos);
            collection.add(ModelFactory.create(1), {
                at: pos
            });
        }
    });

    // remove pane at pos
    $('#remove-pane-at').click(function() {
        var pos = $('#remove-pane-pos').val();
        if(pos < collection.length) {
            console.log('remove pane #', pos);
            collection.remove(collection.at(pos));
        }
    });

    // goto middle pane
    $('#goto-pane').click(function() {
        var pos = $('#goto-pane-pos').val();
        panes.navigate(pos);
        updateMiddleIterator(null, collection);
    });

    // fixed pane to the left
    $('#nav-fix-left').click(function() {
        console.log('nav pane left triggered');
        panes.fixPane(ModelFactory.create(1)[0], {
            side: 'left'
        });
    });

    // fixed pane to the left
    $('#nav-fix-right').click(function() {
        console.log('nav pane left triggered');
        panes.fixPane(ModelFactory.create(1)[0], {
            side: 'left'
        });
    });

    console.groupEnd('init');
    console.groupEnd('Panes test');
});
