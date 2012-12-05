(function($, mvc) {

    // add test
    console.group('Panes test');
    console.group('init');

    var modelOptions = {
        view: Pane
    };

    var models = [/*new mvc.Model(modelOptions),
                    new mvc.Model(modelOptions),
            new mvc.Model(modelOptions),
            new mvc.Model(modelOptions)*/

        ],
        collection = new mvc.Collection(models),
        panes = this.panes = new Panes({
            el: $('#viewport'),
            model: collection
        });

    // add pane
    $('#add-pane').click(function() {
        console.log('add pane triggered');
        collection.add(new mvc.Model(modelOptions), {
            at: collection.length
        });
    });

    // remove pane
    $('#remove-pane').click(function() {
        console.log('remove pane triggered');
        var model = collection.pop();
    });

    console.groupEnd('init');
    console.groupEnd('Panes test');
})($, Backbone);
