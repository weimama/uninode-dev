var nodePath = require('path');

function fixRelativePath(path, file, fromDir, toDir) {
    var dir = nodePath.dirname(file);

    var baseDir = dir;
    if (file.startsWith(toDir)) { // Was the source manifest file also moved?
        // If so, calculate relative paths relative to the manifests old location
        baseDir = nodePath.dirname(nodePath.join(fromDir, file.substring(toDir.length)));
        // console.log('*baseDir: ', baseDir);
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

    return path;
}

module.exports = fixRelativePath;