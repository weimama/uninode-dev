require('raptor-polyfill/string/startsWith');
var nodePath = require('path');
var requirePathRegExp = /^require(?:[:]?\s*|\s+)([^: ]+)$/;
var cwd = process.cwd();
function optimizerFixRelativePaths(manifest, file, fromDir, toDir, callback) {
    file = nodePath.resolve(cwd, file);
    fromDir = nodePath.resolve(cwd, fromDir);
    toDir = nodePath.resolve(cwd, toDir);
    var dir = nodePath.dirname(file);

    // console.log('dir: ', dir);

    var baseDir = dir;
    if (file.startsWith(toDir)) { // Was the source manifest file also moved?
        // If so, calculate relative paths relative to the manifests old location
        baseDir = nodePath.dirname(nodePath.join(fromDir, file.substring(toDir.length)));
        // console.log('*baseDir: ', baseDir);
    }

    function fixPath(path) {

        var isRequire = false;

        var requireMatches = requirePathRegExp.exec(path);
        if (requireMatches) {
            isRequire = true;
            path = requireMatches[1];

            if (path.charAt(0) !== '.') {
                return 'require: ' + path;
            }
        }

        var absolutePath = nodePath.join(baseDir, path);

        // console.log('manifest file: ', file);
        // console.log('manifest dir: ', dir);
        // console.log('path: ', path);
        // console.log('absolutePath: ', absolutePath);
        // console.log('fromDir: ', fromDir);

        if (absolutePath.startsWith(fromDir)) {
            // The path was in a directory that was moved...
            var relToFromDir = absolutePath.substring(fromDir.length);
            // console.log('relToFromDir: ', relToFromDir);
            var newAbsolutePath = nodePath.join(toDir, relToFromDir);
            

            // console.log('newAbsolutePath: ', newAbsolutePath);
            // Calculate a path relative to the directory of the manifest
            path = nodePath.relative(dir, newAbsolutePath);
            // console.log('fixedPath (1): ', path);
        } else if (file.startsWith(toDir)) {
            // The manifest was in a directory that was moved so we need to recalculate the relative path
            // based on the new location
            path = nodePath.relative(dir, absolutePath);
            // console.log('fixedPath (2): ', path);
        }

        if (isRequire) {
            if (path.charAt(0) !== '.') {
                path = './' + path;
            }
            path = 'require: ' + path;
        }

        // console.log();

        return path;
    }

    if (!manifest.dependencies) {
        return;
    }

    manifest.dependencies = manifest.dependencies.map(function(d) {
        if (typeof d === 'string') {
            return fixPath(d);
        }

        if (d.path) {
            d.path = fixPath(d.path);
        }

        return d;
    });

    return manifest;
}

module.exports = optimizerFixRelativePaths;