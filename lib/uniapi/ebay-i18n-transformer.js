'use strict';

require('raptor-polyfill');
var estraverse = require('estraverse');
var nodePath = require('path');
var fs = require('fs');
var u = require('./util');
var _ = require('underscore');
var beautify = require('js-beautify').js;


function checkGetBundle(n) {
    if(!n) {
        return false;
    }
    if(n.type !== 'CallExpression') {
        return false;
    }
    var name = u.get(n, 'callee.property.name');
    if(name !== 'getBundle') {
        return false;
    }
    var type = u.get(n, 'callee.property.type');
    if(type !== 'Identifier') {
        return false;
    }
    var args = n.arguments;
    if(!args) {
        return false;
    }
    var arg = args[0];
    if(!arg) {
        return false;
    }
    type = arg.type;
    if(type !== 'Literal') {
        return false;
    }
    return true;
}

function transformGetBundle(n, projectDir) {
    if(! checkGetBundle(n) ) {
        return;
    }
    var args = n.arguments;
    var arg = args && args[0];
    var val = arg && arg.value;
    if(!val || !projectDir) {
        return;
    }
    var shush = require('shush');
    var configFileDir = require('path').resolve(projectDir, './config');
    u.exec('mkdir -p ' + configFileDir);

    var configFileNameI18n = require('path').resolve(projectDir, './config/configi18n.json');
    if(!fs.existsSync(configFileNameI18n) ) {
        u.exec('touch ' + configFileNameI18n);
        fs.writeFileSync(configFileNameI18n,  '{ }', {encoding: 'utf8'});
    }

    var configFileName = require('path').resolve(projectDir, './config/config.json');

    if(!fs.existsSync(configFileName)) {
        console.log(' --- NO FILE: ', configFileName);
        return;
    }
    if(!fs.existsSync() ) {
        u.exec('touch ' + configFileName);
    }

    var config = shush(configFileName);
    if(! config['i18n-ebay']) {
        config['i18n-ebay'] = {};
    }
    if( !config['i18n-ebay'].preload) {
        config['i18n-ebay'].preload = [];
    }
    var preloadArr = config['i18n-ebay'].preload;
    if(! _.contains(preloadArr, val) ) {
        preloadArr.push(val);

        // console.log(config['i18n-ebay']);
        // console.log(configFileName);
        var cnt = JSON.stringify(config,null, 4);
        // console.log(cnt);

        fs.writeFileSync(configFileName,  cnt, {encoding: 'utf8'});
        fs.writeFileSync(configFileNameI18n,  cnt, {encoding: 'utf8'});

    }


}

function transformAST(ast, options, moduleOptions) {

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {
        },

        leave: function(node, parent) {
            if (node && node.type === 'CallExpression' && node.callee &&
                node.callee.type === 'Identifier' &&
                node.callee.name === 'require' &&
                node.arguments &&
                node.arguments[0] &&
                node.arguments[0].type === 'Literal' &&
                node.arguments[0].value === 'ebay-i18n' ) {

                delete node.arguments[0].raw;
                node.arguments[0].value = 'i18n-ebay';

            }

            transformGetBundle(node, moduleOptions.projectDir);

            // if(node && node.type === 'CallExpression' && node.callee &&
            // node.callee.type === 'MemberExpression' &&
            // node.callee.property &&
            // node.callee.property.name === 'getContentManager' &&
            // node.callee.property.type === 'Identifier'
            // ) {
            //     node.callee = {
            //                 "type": "Identifier",
            //                 "name": "require"
            //             };
            //     node.arguments = [
            //                 {
            //                     "type": "Literal",
            //                     "value": "i18n-ebay",
            //                     "raw": "'i18n-ebay'"
            //                 }
            //             ];
            //
            // }



        }
    });

    return ast;
}

exports.transformAST = transformAST;
