var nodePath = require('path');
require('raptor-ecma/es6');

function normalizePackagePath(path) {

    path = path.replace(/package\.json$/g, 'optimizer.json');

    if (!path.endsWith('.json') && !path.startsWith('.')) {
        path = path.replace(/[.]/g, '/');
    }

    return path;
}

function transformDependency(d) {
    var basename;

    if (typeof d === 'object') {
        var extension = d.extension;

        var keys = Object.keys(d);

        if (extension) {
            d['if-extension'] = extension;
            delete d.extension;
        }

        if (d.type === 'module') {
            d.type = 'package';
        }
        
        if (d.type === 'package') {
            if (d.name) {
                d.path = d.name;
                delete d.name;
            }

            if (d.path) {
                d.path = normalizePackagePath(d.path);

                if (keys.length === 2) {
                    d = { package: d.path };
                }
            }
        } else if (d.type === 'css' || d.type === 'js' && d.path) {
            

            if (keys.length === 2 && (d.path.endsWith('.js') || d.path.endsWith('.css'))) {
                d = d.path;
            }
        } else if (!d.type) {
            if (d.module || d.package) {
                d.package = normalizePackagePath(d.module || d.package);
                delete d.module;
            }
            else if (d.path) {
                basename = nodePath.basename(d.path);
                if (basename.indexOf('.') === -1) {
                    d.path = normalizePackagePath(d.path);
                }

                if (keys.length === 1) {
                    d = d.path;
                }
            }
        }
    }

    return d;
}
function transform(pkg) {
    var optimizerManifest = pkg.raptor || pkg['raptor-optimizer'] || pkg;
    var dependencies = optimizerManifest.dependencies ||
        optimizerManifest['browser-dependencies'] ||
        optimizerManifest.includes;
    var extensions = optimizerManifest.extensions;

    var outputDependencies = [];
    if (dependencies) {
        dependencies.forEach(function(d) {
            outputDependencies.push(transformDependency(d));
        });
    }

    if (extensions) {
        if (!Array.isArray(extensions)) {
            extensions = Object.keys(extensions).map(function(key) {
                var ext = extensions[key];

                return {
                    name: key,
                    dependencies: ext.dependencies || ext.includes
                };
            });
        }

        extensions.forEach(function(ext) {
            var condition = ext.condition;
            var name = ext.name;
            var dependencies = ext.dependencies || ext.includes;

            if (dependencies) {
                dependencies.forEach(function(d) {
                    d = transformDependency(d);
                    if (typeof d === 'string') {
                        d = { path: d};
                    }

                    if (condition) {
                        d['if'] = condition;
                    }
                    else if (name) {
                        d['if-extension'] = name;
                    }

                    outputDependencies.push(d);
                });
            }
        });
    }

    var transformed = {};
    transformed.dependencies = outputDependencies;
    return transformed;
    
}

exports.transform = transform;
exports.transformDependency = transformDependency;