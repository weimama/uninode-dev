// Some documentation
define('test.some-module', ['raptor'], function(raptor, require, module, exports) {
    var foo = require('foo');
    var extend = raptor.extend;

    return {
        foo: foo
    };
});