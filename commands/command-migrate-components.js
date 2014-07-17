var walk = require('../lib/walk');
var optimizerFixRelativePaths = require('../lib/optimizerFixRelativePaths');

var nodePath = require('path');
var fs = require('fs');
require('raptor-polyfill');

var mkdirp = require('mkdirp');
var raptorAsync = require('raptor-async');

function removeDir(dir) {
    try {
        var children = fs.readdirSync(dir);
        for (var i = 0; i < children.length; i++) {
            var file = nodePath.join(dir, children[i]);
            var stat = fs.statSync(file);
            
            if (stat.isDirectory()) {
                console.log('Removing directory: ' + dir);
                removeDir(file);
            } else {
                fs.unlinkSync(file);
            }
        }

        fs.rmdirSync(dir);
    } catch(e) {}
}

module.exports = {
    usage: 'Usage: $0 $commandName <dir>',

    options: {
    },

    validate: function(args, rapido) {
        var dirs = args._;
        if (!dirs || !dirs.length) {
            dirs = [process.cwd()];
        }
        
        return {
            dirs: dirs
        };
    },

    run: function(args, config, rapido) {

        

        function migrateComponent(sourceDir, targetDir) {
            console.log('Migrating "' + sourceDir + '" to "' + targetDir + '"...');

            mkdirp.sync(targetDir);

            var sourceFiles = fs.readdirSync(sourceDir);
            var oldShortName = nodePath.basename(sourceDir);

            function transformOptimizer(optimizer) {
                var dependencies = optimizer.dependencies;

                if (dependencies) {
                    optimizer.dependencies = optimizer.dependencies.map(function(d) {
                        if (typeof d !== 'string') {
                            return d;
                        }

                        if (d === oldShortName + 'Widget.js') {
                            return 'require: ./widget';
                        } else if (d === oldShortName + '.rhtml') {
                            return 'template.rhtml';
                        } else if (d === oldShortName + '.css') {
                            return 'style.css';
                        } else if (d === oldShortName + 'Renderer.js') {
                            return 'renderer.js';
                        } else if (d === 'raptor/renderer/optimizer.json') {
                            
                        } else if (d.endsWith(oldShortName + '/optimizer.json')) {
                            return './optimizer.json';
                        } else {
                            return d;
                        }
                    });
                }

                return JSON.stringify(optimizer, null, 4);
            }

            function copyDir(dir, targetDir) {
                try {
                    fs.mkdirSync(targetDir);    
                } catch(e) {}
                
                var filenames = fs.readdirSync(dir);
                filenames.forEach(function(filename) {
                    var file = nodePath.join(dir, filename);

                    var stat = fs.statSync(file);
                    if (stat.isDirectory()) {
                        copyDir(file, nodePath.join(targetDir, filename));
                        return;
                    } else {
                        var targetFile = nodePath.join(targetDir, filename);
                        var src = fs.readFileSync(file);
                        fs.writeFileSync(targetFile, src);
                    }
                });
            }


            sourceFiles.forEach(function(filename) {
                var file = nodePath.join(sourceDir, filename);

                if (file.startsWith(targetDir)) {
                    return;
                }

                var targetFile;
                var code;

                var stat = fs.statSync(file);
                if (stat.isDirectory()) {
                    copyDir(file, nodePath.join(targetDir, filename));
                    return;
                }

                if (filename === 'raptor-tag.json') {
                    var raptorTag = require(file);
                    raptorTag.renderer = './renderer';
                    code = JSON.stringify(raptorTag, null, 4);
                } else if (filename === oldShortName + '.css') {
                    targetFile = nodePath.join(targetDir, 'style.css');
                } else if (filename === oldShortName + 'Widget.js' || filename === 'widget.js') {
                    targetFile = nodePath.join(targetDir, 'widget.js');
                    code = fs.readFileSync(file, 'utf8');
                    var oldClassNameRegExp = new RegExp(nodePath.basename(sourceDir) + 'Widget', 'g');
                    code = code.replace(oldClassNameRegExp, 'Widget');
                } else if (filename === oldShortName + '.rhtml') {
                    targetFile = nodePath.join(targetDir, 'template.rhtml');
                    code = fs.readFileSync(file, 'utf8');
                    code = code.replace(/w[:-]widget="([^"]+)"/g, 'w-bind="./widget"');
                    code = code.replace(/<w[:-]init-widgets\/>/g, '');
                } else if (filename === oldShortName + 'Renderer.js' || filename === 'renderer.js' || filename === oldShortName + '-renderer.js') {
                    targetFile = nodePath.join(targetDir, 'renderer.js');
                    code = fs.readFileSync(file, 'utf8');

                    // console.log('CHECKING: ', file);

                    var foundRaptorTemplatesRender = false;
                    code = code.replace(/require\(\s*['"]raptor-templates['"]\s*\)\s*.render\(['"][^'"]+['"],\s*/g, function() {
                        foundRaptorTemplatesRender = true;
                        return 'template.render(';
                    });

                    code = code.replace(/templating.render\(['"][^'"]+['"],\s*/g, function() {
                        foundRaptorTemplatesRender = true;
                        return 'template.render(';
                    });

                    code = code.replace(/var\s+templating\s*=\s*require\(['"]raptor-templates['"]\);\s*/g, '');

                    if (foundRaptorTemplatesRender) {
                        code = "var template = require('raptor-templates').load(require.resolve('./template.rhtml'));\n" + code;
                    }

                    // code = code.replace(/ templating/g, ' raptorTemplates');
                    // code = code.replace(/require\('raptor-templates'\);/g, function(match) {
                    //     return match + '\n' + 'var templatePath = require.resolve(\'./template.rhtml\');\n';
                    // });
                    // code = code.replace(/raptorTemplates.render\([^,]+/g, 'raptorTemplates.render(templatePath');
                } else if (filename.endsWith('optimizer.json')) {
                    code = transformOptimizer(JSON.parse(fs.readFileSync(file, 'utf8')));
                }

                if (!targetFile) {
                    targetFile = nodePath.join(targetDir, filename);
                }

                if (code == null) {
                    fs.writeFileSync(targetFile, fs.readFileSync(file));
                    return;
                    
                }

                fs.writeFileSync(targetFile, code, 'utf8');

            });
        }

        var dirs = args.dirs;

        
        var componentPathToTagName = {};
        var componentTagNameToPath = {};
        var targetToSourceDir = {};
        var sourceToTargetDir = {};

        var rootTaglibs = [];
        
        function findComponents(callback) {
            walk(
                dirs,
                {
                    file: function(file) {

                        var basename = nodePath.basename(file);
                        

                        if (basename === 'raptor-taglib.json') {
                            var taglib = require(file);
                            if (taglib.tags) {
                                rootTaglibs.push({
                                    file: file,
                                    taglib: taglib
                                });
                                
                            }
                        }
                    }
                },
                callback); 
        }

        function fixRelativePaths(fromDir, toDir, callback) {
            walk(
                dirs,
                {
                    file: function(file) {

                        var basename = nodePath.basename(file);
                        if (basename.endsWith('optimizer.json')) {
                            var optimizerManifest = JSON.parse(fs.readFileSync(file, 'utf8'));
                            // console.log(module.id, 'fixRelativePaths: ', file, fromDir,);
                            optimizerManifest = optimizerFixRelativePaths(optimizerManifest, file, fromDir, toDir); 
                            fs.writeFileSync(file, JSON.stringify(optimizerManifest, null, 4), 'utf8');
                        }
                    }
                },
                callback);
        }

        function migrateComponents(callback) {

            var migrateTasks = [];

            rootTaglibs.forEach(function(taglibInfo) {
                var file = taglibInfo.file;
                var taglib = taglibInfo.taglib;

                var tagNames = Object.keys(taglib.tags);
                tagNames.forEach(function(tagName) {
                    var tagFile = taglib.tags[tagName];
                    if (typeof tagFile !== 'string') {
                        return;
                    }


                    var taglibDir = nodePath.dirname(file);
                    tagFile = nodePath.join(taglibDir, tagFile);

                    var targetDir = nodePath.join(taglibDir, 'components', tagName);

                    if (tagFile.startsWith(targetDir)) {
                        return;
                    }


                    migrateTasks.push(function(callback) {

                        

                        var sourceDir = nodePath.dirname(tagFile);
                        var relPath = nodePath.relative(taglibDir, sourceDir);
                        componentPathToTagName[relPath] = tagName;
                        componentTagNameToPath[tagName] = relPath;
                        
                        
                        targetToSourceDir[targetDir] = sourceDir;
                        sourceToTargetDir[sourceDir] = targetDir;



                        migrateComponent(sourceDir, targetDir);

                        removeDir(sourceDir);

                        fixRelativePaths(sourceDir, targetDir, callback);
                    });
                    
                });
            });

            raptorAsync.series(migrateTasks, callback);
        }        

        function fixTaglibs(callback) {
            rootTaglibs.forEach(function(taglibInfo) {
                var taglibFile = taglibInfo.file;
                var taglibDir = nodePath.dirname(taglibFile);
                var taglib = JSON.parse(fs.readFileSync(taglibFile, 'utf8'));

                taglib.tags = taglib.tags || {};
                
                var tags = taglib.tags;
                Object.keys(tags).forEach(function(tagName) {
                    var targetFile = nodePath.join(taglibDir, 'components', tagName, 'raptor-tag.json');
                    taglib.tags[tagName] = nodePath.relative(taglibDir, targetFile);
                });

                fs.writeFileSync(taglibFile, JSON.stringify(taglib, null, 4), 'utf8');
            });

            callback();
        }

        raptorAsync.series([
                findComponents,
                migrateComponents,
                fixTaglibs
            ],
            function(err) {
                if (err) {
                    console.error('Error while migrating components: ' + (err.stack || err));
                    return;
                }

                console.log('All components migrated');
            });
    }
};
