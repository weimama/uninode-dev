'use strict';

if( !process.env.NODE_ENV ) {
    process.env.NODE_ENV = 'development';
}

var path = require('path');
var fs = require('fs');
var rapido = require('rapido').create();

rapido.title = 'Commands for RaptorJS 3 development';
rapido.configFilename = 'raptor-migrate.json';
rapido.addStackDir(path.join(__dirname, '..'));
rapido.enableStack('raptor-dev');

Object.defineProperty(rapido, 'version', {
    get: function() {
        var pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
        return pkg.version;
    }
});

rapido.run(process.argv);
