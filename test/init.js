(function($, mvc) {

    // add test
    console.group('Panes test');
    console.group('init');

    var TestModelView = mvc.View.extend();

    var models = [new Backbone.Model({}), new Backbone.Model(), new Backbone.Model(), new Backbone.Model()],
        collection = new mvc.Collection(models),
        panes = this.panes = new Panes({
            el: $('#viewport'),
            model: collection
        });

    // add pane
    $('#add-pane').click(function() {
        console.log('add pane');
        collection.add(new Backbone.Model(), {
            at: collection.length - 1
        });
    });

    // remove pane
    $('#remove-pane').click(function() {
        console.log('remove pane');
    });

    console.groupEnd('init');
    console.groupEnd('Panes test');
})($, Backbone);
