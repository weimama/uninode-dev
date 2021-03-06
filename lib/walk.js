var fs = require('fs');
var nodePath = require('path');
var cwd = process.cwd();
require('raptor-polyfill');

function walk(files, options, done) {
    if (!files) {
        return done();
    }
    
    var pending = 0;

    if (Array.isArray(files)) {
        if (!files.length) {
            return done();
        }
    } else {
        files = [files];
    }

    var fileCallback = options.file;
    var isDone = false;
    var context = {
        
        beginAsync: function() {
            pending++;
        },
        endAsync: function(err) {
            if (isDone) {
                return;
            }

            pending--;

            if (pending === 0 || err) {
                isDone = true;
                if (err) {
                    done(err);
                } else {
                    done(null);
                }
            }
        }
    };

    function doWalk(dir, force) {
        var basename = nodePath.basename(dir);
        if (!force && (basename === 'node_modules' || basename.startsWith('.'))) {
            return;
        }

        context.beginAsync();
        fs.readdir(dir, function(err, list) {
            if (err) {
                return context.endAsync(err);
            }

            if (list.length) {
                list.forEach(function(basename) {
                    var file = nodePath.join(dir, basename);

                    context.beginAsync();
                    fs.stat(file, function(err, stat) {
                        if (err) {
                            return context.endAsync(err);
                        }

                        if (stat && stat.isDirectory()) {
                            doWalk(file);
                        } else {
                            try {
                                fileCallback(file);    
                            } catch(e) {
                                context.endAsync(e);
                                return;
                            }
                        }

                        context.endAsync();
                    });
                });
            }

            context.endAsync();
        });
    }


    files.forEach(function(file) {
        file = nodePath.resolve(cwd, file);

        context.beginAsync();

        fs.stat(file, function(err, stat) {
            if (err) {
                return context.endAsync(err);
            }

            if (stat.isDirectory()) {
                doWalk(file, true /*force walk of provided dirs */);
            } else {
                try {
                    fileCallback(file);    
                } catch(e) {
                    context.endAsync(e);
                    return;
                }
            }
            context.endAsync();
        });
    });
}

module.exports = walk;