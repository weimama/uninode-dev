require('raptor-polyfill/string/startsWith');
require('raptor-polyfill/string/endsWith');

var fs = require('fs');
var nodePath = require('path');
var cwd = process.cwd();
var fixRelativePath = require('./fixRelativePath');

var requireRegExp = /require\((["]([^"]+)["]|[']([^']+)['])\)/g;

function commonjsFixRelativePaths(file, fromDir, toDir) {
    file = nodePath.resolve(cwd, file);
    fromDir = nodePath.resolve(cwd, fromDir);
    toDir = nodePath.resolve(cwd, toDir);

    // console.log('dir: ', dir);

    function fixPath(path) {

        if (path.endsWith('.json')) {
            return path;
        }

        if (!path.endsWith('.js')) {
            path += '.js';
        }
        path = fixRelativePath(path, file, fromDir, toDir);

        path = path.slice(0, -3); // Remove the .js extension
    }

    var src = fs.readFileSync(file, 'utf8');
    src = src.replace(requireRegExp, function(match, path1, path2) {
        var path = path1 || path2;

        if (!path.startsWith('.')) {
            return match;
        }

        else {
            return "require('" + fixPath(path) + "'')";
        }
    });

    fs.writeFileSync(file, src, 'utf8');
}

module.exports = commonjsFixRelativePaths;