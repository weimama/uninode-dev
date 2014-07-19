'use strict';

var path = require('path');

require('rapido').run(process.argv, {
    title: 'Commands for RaptorJS 3 development',
    configFilename: 'uninode-dev.json',
    stackDirs: [
        path.join(__dirname, '..')
    ],
    nodeModulesDirs: [
        path.join(__dirname, '../node_modules')
    ],
    enabledStacks: [
        'uninode-dev',
        'module'
    ],
    version: function() {
        return require('../package.json').version;
    }
});
