'use strict';

var path = require('path');

require('rapido').run(process.argv, {
    title: 'Commands for RaptorJS 3 development',
    configFilename: 'raptor-dev.json',
    stackDirs: [
        path.join(__dirname, '..')
    ],
    enabledStacks: [
        'raptor-dev',
        'module'
    ],
    version: function() {
        return require('../package.json').version;
    }
});
