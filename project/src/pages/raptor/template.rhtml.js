module.exports = function create(__helpers) {
  var empty = __helpers.e,
      notEmpty = __helpers.ne,
      ______layouts_default_layout_rhtml = __helpers.l(require.resolve("../../layouts/default-layout.rhtml")),
      raptor_optimizer_taglib_page_tag = require("raptor-optimizer/taglib/page-tag"),
      _tag = __helpers.t,
      raptor_taglib_layout_use_tag = require("raptor-taglib-layout/use-tag"),
      raptor_taglib_layout_put_tag = require("raptor-taglib-layout/put-tag"),
      escapeXml = __helpers.x,
      raptor_templates_node_modules_raptor_taglib_async_async_fragment_tag = require("raptor-templates/node_modules/raptor-taglib-async/async-fragment-tag"),
      attr = __helpers.a;

  return function render(data, context) {
    var name=data.name;

    var pagename=data.pagename;
    _tag(context,
      raptor_optimizer_taglib_page_tag,
      {
        "name": "raptor",
        "packagePath": "./optimizer.json",
        "dirname": __dirname
      });
    _tag(context,
      raptor_taglib_layout_use_tag,
      {
        "template": ______layouts_default_layout_rhtml
      },
      function(_layout) {
        _tag(context,
          raptor_taglib_layout_put_tag,
          {
            "into": "title",
            "value": "Home",
            "layout": _layout
          });
        _tag(context,
          raptor_taglib_layout_put_tag,
          {
            "into": "body",
            "layout": _layout
          },
          function() {
            context.w('<h2>Welcome to the unified stack</h2><h1>Hello, ' +
              escapeXml(name) +
              '</h1><h1>pageName, ' +
              escapeXml(pagename) +
              '</h1><p><h1>ASYNC HELLO</h1>');
            _tag(context,
              raptor_templates_node_modules_raptor_taglib_async_async_fragment_tag,
              {
                "dataProvider": data.asyncname
              },
              function(context,asyncname) {
                context.w('<app-hello' +
                  attr("name", asyncname) +
                  '></app-hello>');
              });

            context.w('</p>');
          });
      });
  };
}