(function($, Model, View, Collection) {

    // add test
    console.group('Panes test');
    console.group('init');

    var modelOptions = {
        view : Pane
    };

    var models = //[],
         [new Model(modelOptions), new Model(modelOptions),
         new Model(modelOptions), new Model(modelOptions)],
        collection = new Collection(models),
        panes = this.panes = new Panes({
                    el : $('#viewport'),
                    model : collection
                });

    // add pane
    $('#add-pane').click(function() {
                console.log('add pane triggered');
                collection.add(new Model(modelOptions), {
                            at : collection.length
                        });
            });

    // remove pane
    $('#remove-pane').click(function() {
                console.log('remove pane triggered');
                var model = collection.pop();
            });

    console.groupEnd('init');
    console.groupEnd('Panes test');
})($, Backbone.Model, Backbone.View, Backbone.Collection);
