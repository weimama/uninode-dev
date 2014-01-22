var target = require('target');
target.a = 'true';
require('raptor-util').extend(target, { hello: 'world' });