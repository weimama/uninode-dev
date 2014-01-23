require('raptor-ecma/es6');
var estraverse = require('estraverse');
var nodePath = require('path');
var fs = require('fs');

function tryPath(path, ext) {
    path = path + ext;
    if (fs.existsSync(path)) {

        return path.slice(0, 0-ext.length);
    }
}

function resolve(target, searchPath, from) {
    for (var i=0; i<searchPath.length; i++) {
        var path = nodePath.join(searchPath[i], target);
        var filePath = tryPath(path, '.js') || tryPath(path, '.coffee');
        if (filePath) {
            var relPath = nodePath.relative(from, filePath);
            if (!relPath.startsWith('.')) {
                relPath = './' + relPath;
            }

            return relPath;
        }
    }
}

function transformAST(ast, options) {

    ast = estraverse.replace(ast, {
        enter: function(node, parent) {
        },

        leave: function(node, parent) {
            if (node.type === 'CallExpression' &&
                node.callee.type === 'Identifier' &&
                node.callee.name === 'require' &&
                node.arguments.length === 1 &&
                node.arguments[0].type === 'Literal' &&
                typeof node.arguments[0].value === 'string') {
                
                var target = node.arguments[0].value;
                var resolved = null;

                if (target.charAt(0) !== '.') {
                    if (options && options.searchPath && options.from) {
                        resolved = resolve(target, options.searchPath, options.from);
                    }

                    if (!resolved) {
                        var targetParts = target.split('/');
                        if (targetParts.length >= 2 && targetParts[0] === 'raptor') {
                            targetParts.shift();
                            if (targetParts[0] === 'templating') {
                                targetParts[0] = 'templates';
                            }
                            
                            targetParts[0] = 'raptor' + '-' + targetParts[0];

                            resolved = targetParts.join('/');
                        }    
                    }    
                }

                if (resolved) {
                    node.arguments[0].value = resolved;    
                }
            }

        }
    });

    return ast;
}

exports.transformAST = transformAST;