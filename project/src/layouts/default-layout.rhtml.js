module.exports = function create(__helpers) {
  var empty = __helpers.e,
      notEmpty = __helpers.ne,
      global_header_ebay_taglib_gh_configure_tag = require("global-header-ebay/taglib/gh-configure-tag"),
      _tag = __helpers.t,
      raptor_taglib_layout_placeholder_tag = require("raptor-taglib-layout/placeholder-tag"),
      global_header_ebay_taglib_gh_head_css_tag = require("global-header-ebay/taglib/gh-head-css-tag"),
      raptor_optimizer_taglib_head_tag = require("raptor-optimizer/taglib/head-tag"),
      site_speed_ebay_taglib_ss_top_tag = require("site-speed-ebay/taglib/ss-top-tag"),
      tracking_ebay_tags_helper_helper_renderer = require("tracking-ebay/tags/helper/helper-renderer"),
      tracking = require("tracking-ebay/tags/helper/helper-object"),
      tracking_ebay_tags_cookie_tag = require("tracking-ebay/tags/cookie-tag"),
      tracking_ebay_tags_image_tag = require("tracking-ebay/tags/image-tag"),
      global_header_ebay_taglib_gh_header_tag = require("global-header-ebay/taglib/gh-header-tag"),
      global_header_ebay_taglib_gh_footer_tag = require("global-header-ebay/taglib/gh-footer-tag"),
      raptor_optimizer_taglib_body_tag = require("raptor-optimizer/taglib/body-tag"),
      global_header_ebay_taglib_gh_body_js_tag = require("global-header-ebay/taglib/gh-body-js-tag"),
      site_speed_ebay_taglib_ss_bottom_tag = require("site-speed-ebay/taglib/ss-bottom-tag");

  return function render(data, context) {
    _tag(context,
      global_header_ebay_taglib_gh_configure_tag,
      {
        "layout": "FULL"
      });

    context.w(' <!DOCTYPE html> <html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">');
    _tag(context,
      raptor_taglib_layout_placeholder_tag,
      {
        "name": "meta",
        "content": data.layoutContent
      });

    context.w('<title>');
    _tag(context,
      raptor_taglib_layout_placeholder_tag,
      {
        "name": "title",
        "content": data.layoutContent
      });

    context.w('</title>');
    _tag(context,
      global_header_ebay_taglib_gh_head_css_tag,
      {});
    _tag(context,
      raptor_optimizer_taglib_head_tag,
      {});
    _tag(context,
      site_speed_ebay_taglib_ss_top_tag,
      {});

    context.w('</head><body>');
    _tag(context,
      tracking_ebay_tags_helper_helper_renderer,
      {
        "var": "tracking"
      },
      function() {
      });
    _tag(context,
      tracking_ebay_tags_cookie_tag,
      {});
    _tag(context,
      tracking_ebay_tags_image_tag,
      {});
    _tag(context,
      global_header_ebay_taglib_gh_header_tag,
      {});
    _tag(context,
      raptor_taglib_layout_placeholder_tag,
      {
        "name": "body",
        "content": data.layoutContent
      });

    context.w('<div style="clear: both"></div>');
    _tag(context,
      global_header_ebay_taglib_gh_footer_tag,
      {});
    _tag(context,
      raptor_optimizer_taglib_body_tag,
      {});
    _tag(context,
      global_header_ebay_taglib_gh_body_js_tag,
      {});
    _tag(context,
      site_speed_ebay_taglib_ss_bottom_tag,
      {});

    context.w('</body></html>');
  };
}