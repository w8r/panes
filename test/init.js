(function($, Model, View, Collection) {

    // add test
    console.group('Panes test');
    console.group('init');

    var modelOptions = {
        view: Pane
    };

    var models = // [],
    [new Model(modelOptions), new Model(modelOptions),
             new Model(modelOptions), new Model(modelOptions)],
        collection = new Collection(models),
        panes = this.panes = new Panes({
            el: $('#viewport'),
            model: collection
        });

    // add pane
    $('#add-pane').click(function() {
        console.log('add pane triggered');
        collection.add(new Model(modelOptions), {
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
            collection.add(new Model(modelOptions), {
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

    console.groupEnd('init');
    console.groupEnd('Panes test');
})($, Backbone.Model, Backbone.View, Backbone.Collection);
