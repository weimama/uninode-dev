var ok = require('assert').ok;

function getBody(node) {
    var body;

    if (node.type === 'IfStatement') {
        if (!Array.isArray(node.consequent)) {
            node.consequent = {
                "type": "BlockStatement",
                "body": [node.consequent]
            };
        }
        body = node.consequent;
    }
    if (node.type === 'SwitchCase') {
        body = node.consequent;
    }
    else if (node.body) {
        body = node.body;
    }

    if (body && body.type === 'BlockStatement') {
        body = body.body;
    }

    return body;
}

function remove(node, parent) {
    ok(parent, 'parent expected');
    var body = getBody(parent);
    ok(body, 'body expected');
    var nodeIndex = body.indexOf(node);
    ok(nodeIndex !== -1);

    body.splice(nodeIndex, 1);
}

function replace(node, parent, newNodes) {
    ok(parent, 'parent expected');
    var body = getBody(parent);
    ok(body, 'body expected: ' + JSON.stringify(parent, null, '    '));

    ok(Array.isArray(body), 'body should be an array. Actual: ' + require('util').inspect(parent));
    var nodeIndex = body.indexOf(node);
    ok(nodeIndex !== -1);

    if (!Array.isArray(newNodes)) {
        newNodes = [newNodes];
    }

    body.splice.apply(body, 
        [nodeIndex, 1]
            .concat(newNodes));
}

function insertBefore(node, parent, newNodes) {
    ok(parent, 'parent expected');
    var body = getBody(parent);
    ok(body, 'body expected: ' + JSON.stringify(parent, null, '    '));

    if (!Array.isArray(newNodes)) {
        newNodes = [newNodes];
    }
    var nodeIndex = body.indexOf(node);
    ok(nodeIndex !== -1);

    body.splice.apply(body, 
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
exports.remove =remove;
exports.replace = replace;
exports.insertBefore = insertBefore;