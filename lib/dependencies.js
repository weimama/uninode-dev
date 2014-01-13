'use strict';

var path = require('path');
var fs = require('fs');

function readJsonFile(path) {
    var json = fs.readFileSync(path, {encoding: 'utf8'});
    return JSON.parse(json);
}

var moduleNodeByName = {};


module.exports = {

    /**
     * Loop through each of the given directories (which should be NPM modules)
     * and read the package.json file
     */
    dependencyGraph: function(dirs) {

        var moduleNodes = [];
        var i;
        var moduleNode;

        // find the top-level modules
        for (i = 0; i < dirs.length; i++) {
            var dir = dirs[i];
            var packageJsonFile = path.join(dir, 'package.json');

            if (fs.existsSync(packageJsonFile)) {
                var packageJson = readJsonFile(packageJsonFile);

                // create graph node
                moduleNode = {
                    // the name of this module
                    name: packageJson.name,

                    // the package manifest for this module
                    packageJson: packageJson,

                    // the dependencies that this module has
                    dependencies: [],

                    // the dev dependencies
                    devDependencies: [],

                    // the directory of the dependency
                    dir: dir
                };

                moduleNodeByName[moduleNode.name] = moduleNode;

                moduleNodes.push(moduleNode);
            }
        }

        // For each top-level module, add references each other their dependencies
        for (i = 0; i < moduleNodes.length; i++) {
            moduleNode = moduleNodes[i];
            var dependencies;
            var dependency;
            var dependencyModuleNode;

            // find "dependencies"
            dependencies = moduleNode.packageJson.dependencies;
            for (dependency in dependencies) {
                dependencyModuleNode = moduleNodeByName[dependency];
                if (dependencyModuleNode) {
                    moduleNode.dependencies.push(dependencyModuleNode);
                }
            }

            // find "devDependencies"
            dependencies = moduleNode.packageJson.devDependencies;
            for (dependency in dependencies) {
                dependencyModuleNode = moduleNodeByName[dependency];
                if (dependencyModuleNode) {
                    moduleNode.devDependencies.push(dependencyModuleNode);
                }
            }
        }

        // return all of the top-level module nodes
        return moduleNodes;
    }
};