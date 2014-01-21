// Some documentation
define('test.some-module', ['raptor'], function(raptor, require, module, exports) {
    var foo = require('foo');

    return {
        foo: foo
    };
});