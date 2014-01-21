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



function idNodeToArray(node) {
    var idParts = [];
    var valid = true;

    function addMemberExpressionParts(node) {
        if (node.type === 'Identifier') {
            idParts.push(node.name);
        }
        else if (node.type === 'MemberExpression' && node.computed === false) {
            addMemberExpressionParts(node.object);
            addMemberExpressionParts(node.property);
        }
        else {
            valid = false;
            return;
        }
    }

    addMemberExpressionParts(node);

    return valid ? idParts : null;
}

function idArrayToNode(parts) {
    if (parts.length === 1) {
        return {
            "type": "Identifier",
            "name": parts[0]
        };
    }
    else {
        return {
            "type": "MemberExpression",
            "computed": false,
            "object": idArrayToNode(parts.slice(0, -1)),
            "property": {
                "type": "Identifier",
                "name": parts[parts.length-1]
            }
        };
    }
}

exports.idNodeToArray = idNodeToArray;
exports.idArrayToNode = idArrayToNode;
exports.replace = replace;
exports.insertBefore = insertBefore;