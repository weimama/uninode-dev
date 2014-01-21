var ok = require('assert').ok;

function replace(node, parent, newNodes) {
    ok(parent, 'parent expected');
    ok(parent.body, 'parent.body expected');
    var nodeIndex = parent.body.indexOf(node);
    ok(nodeIndex !== -1);

    if (!Array.isArray(newNodes)) {
        newNodes = [];
    }

    parent.body.splice.apply(parent.body, 
        [nodeIndex, 1]
            .concat(newNodes));
}

function insertBefore(node, parent, newNodes) {
    ok(parent, 'parent expected');
    ok(parent.body, 'parent.body expected');

    if (!Array.isArray(newNodes)) {
        newNodes = [newNodes];
    }
    var nodeIndex = parent.body.indexOf(node);
    ok(nodeIndex !== -1);

    parent.body.splice.apply(parent.body, 
        [nodeIndex, 0]
            .concat(newNodes));
}

exports.replace = replace;
exports.insertBefore = insertBefore;