'use strict';
require('raptor-polyfill');
var walk = require('../lib/walk');
var fs = require('fs');
var cheerio = require('cheerio');
var beautify = require('js-beautify').html;
module.exports = {
    usage: 'Usage: $0 $commandName [dir]',

    options: {
    },

    validate: function(args, rapido) {
        var files = args._;
        if (!files || !files.length) {
            throw 'one or more files is required';
        }
        
        return {
            files: files
        };
    },

    run: function(args, config, rapido) {


        var files = args.files;

        

        
        function transformIf($, isXml) {
            var ifSelector = isXml ? 'c\\:if' : 'c-if';
            var ifAttr = isXml ? 'c:if' : 'c-if';

            $(ifSelector).each(function(j, el) {

                // See if we can apply the c:if as a directive based on the following conditions:
                // - Only one child (excluding whitespace)
                // - Child is an element
                
                var $el = $(el);
                var children = $el.children();
                if (children.length !== 1) {
                    return;
                }

                var firstChild = children.get(0);
                if (firstChild.name.startsWith('c-') || firstChild.name.startsWith('c:')) {
                    return;
                }

                for (var i=0; i<el.children.length; i++) {
                    var childNode = el.children[i];
                    if (childNode.type === 'text' && childNode.data.trim().length !== 0) {
                        return;
                    }
                }

                children.first().attr(ifAttr, $el.attr('test'));
                $el.replaceWith($el.html());
            });
        }

        function transformFor($, isXml) {
            var forSelector = isXml ? 'c\\:if' : 'c-if';
            var forAttr = isXml ? 'c:if' : 'c-if';

            $(forSelector).each(function(j, el) {

                // See if we can apply the c:if as a directive based on the following conditions:
                // - Only one child (excluding whitespace)
                // - Child is an element
                
                var $el = $(el);
                var children = $el.children();
                if (children.length !== 1) {
                    return;
                }

                var firstChild = children.get(0);
                if (firstChild.name.startsWith('c-') || firstChild.name.startsWith('c:')) {
                    return;
                }

                for (var i=0; i<el.children.length; i++) {
                    var childNode = el.children[i];
                    if (childNode.type === 'text' && childNode.data.trim().length !== 0) {
                        return;
                    }
                }

                children.first().attr(forAttr, $el.attr('test'));
                $el.replaceWith($el.html());
            });
        }


        function transformFile(file) {
            console.log('Transforming ' + file + '...');
            var src = fs.readFileSync(file, 'utf8');
            var $ = cheerio.load(src);

            var isXml = $('c\\:template').length || $('template').length;
            transformIf($, isXml);
            transformFor($, isXml);

            var finalHtml = $.html();

            finalHtml = finalHtml.replace(/[\r\n](\s*[\r\n])+/gm, '\n\n');

            finalHtml = beautify(finalHtml, {
                wrap_line_length: 0,
                preserve_newlines: true
            });

            finalHtml = finalHtml.replace(/&apos;/g, "'");


            fs.writeFileSync(file, finalHtml, 'utf8');
        }

        walk(
            files,
            {
                file: function(file) {

                    if (file.endsWith('.rhtml')) {
                        transformFile(file);
                    }
                }
            },
            function(err) {
                if (err) {
                    console.error('Error while pretty printing templates: ' + (err.stack || err));
                    return;
                }
                
                console.log('All Raptor Templates have been pretty printed');
            });
    }
};
