'use strict';

function trim(str) {
    return str;
}

function runNpmCommand(npmArgs, dir, rapido, callback) {
    var spawn = require('child_process').spawn;

    var npm = spawn('npm', npmArgs, {
        cwd: dir
    });

    npm.stdout.setEncoding('utf8');
    npm.stderr.setEncoding('utf8');

    // pipe stdout to our own console
    npm.stdout.on('data', function (data) {
        rapido.log.info('[npm] ' + trim(data));
    });

    // pipe stderr to our own console
    npm.stderr.on('data', function (data) {
        rapido.log.error('[npm] ' + trim(data));
    });

    // catch errors
    npm.on('error', function(err) {
        callback(err);
    });

    npm.on('close', function (code) {
        callback();
    });
}

function createNpmLinkModuleJob(moduleNode, dir, rapido) {
    return function(callback) {
        runNpmCommand(['link', moduleNode.name], dir, rapido, callback);
    };
}

/**
 * Run "npm link" in given directory
 */
function createNpmLinkJob(moduleNode, rapido) {
    return function(callback) {
        runNpmCommand(['link'], moduleNode.dir, rapido, callback);
    };
}

/**
 * Link the given Raptor modules
 */
function linkRaptorModules(moduleNodes, callback) {

    var work = [];
    var seen = {};
    var stack = [];
    var errors = [];

    var linkRaptorModulesHelper = function(moduleNodes) {
        for (var i = 0; i < moduleNodes.length; i++) {
            var moduleNode = moduleNodes[i];

            var moduleName = moduleNode.name;

            if (seen[moduleName]) {
                errors.push('Cycle detected: ' + stack.join(' --> '));
                return;
            }

            stack.push(moduleName);
            seen[moduleName] = moduleName;

            if (moduleNode.dependencies.length === 0) {
                if (!moduleNode.npmLinked) {
                    work.push(createNpmLinkJob(moduleNode));
                    moduleNode.npmLinked = true;
                }
            } else {

            }

            stack.pop();
            delete seen[moduleName];
        }
    }

    linkRaptorModulesHelper(moduleNodes);
}


/*
Each node has this state information:
- npmLinked:
    Has "npm link" been ran for this node?
- unresolvedCount (need this?)
    he number of direct dependencies)

CYCLE:
raptor-logging
    raptor-util
        raptor-xml
            raptor-logging
raptor-util

CYCLE DETECTION:
When walking graph keep track of nodes that were visited in stack.
Before visiting node make sure current node does not appear in stack. If not found in
stack then push current node to stack. Visit the node and when done pop node off stack.

// LEAF NODES
A leaf node is a node that does not have any dependencies. Leaf nodes should have
"npm link" command run earliest.

walk the graph
for each top-level node
    
    if node.unresolvedCount > 0
        for each dependency

    run npm link





For each dependency try to "npm link <dependency>" if resolvedCount === 0
*/

module.exports = {

    /**
     * This function use to "npm link" modules together for local development of
     * all of the raptor modules.
     */
    linkModules: function(dependencyGraph) {

    }
};