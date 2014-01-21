define.Class(
    'raptor/templating/compiler/AttributeSplitter',
    ['raptor'],
    function(raptor, require) {
        "use strict";
        
        var strings = require('raptor/strings'),
            Expression = require('raptor/templating/compiler/Expression');
        
        /**
         * AttributeSplitter
         */
        var AttributeSplitter = function() {
            
        };
        
        /**
         * Parses the provided string to find the sub-attributes that it contains.
         * The parsed output can be either returned as an array or a map. By default,
         * the parsed output is returned as a map where each property corresponds
         * to a sub-attribute. However, if the order of the sub-attributes is important
         * then the "ordered" option can be set to "true" and
         * an array will instead be returned where each element in the array is an object
         * with a name and value property that corresponds to the matching sub-attribute.
         * 
         * <p>
         * Supported options:
         * <ul>
         *  <li>ordered (boolean, defaults to "false") - If true then an array is returned (see above). Otherwise, an object is returned.
         * </ul>
         * 
         * @memberOf raptor/templating/compiler$AttributeSplitter
         * @param attr {String} The attribute to split
         * @param types {Object} Type definitions for the possible sub-attributes.
         * @param options
         * @returns
         */
        AttributeSplitter.parse = function(attr, types, options) {
            
            return attr;
        };

        return AttributeSplitter;
    });