'use strict';

require('raptor-polyfill');
var nodePath = require('path');
var jsTransformer = require('../lib/uniapi/uniapi-transformer');
var fs = require('fs');
var walk = require('../lib/walk');
var _ = require('underscore');

module.exports = {
    usage: 'Usage: $0 $commandName [dir]',

    options: {
        'skip-transform-require': {
            description: 'Skip transforming non-raptor module paths in calls to require() to relative paths',
            type: 'boolean',
            default: false
        },

        file: {
            description: 'Only transform a single file',
            type: 'string'
        }
    },

    validate: function(args, rapido) {
        var files = args._;
        if (!files || !files.length) {
            files = [process.cwd()];
        }

        var searchPath = files.filter(function(path) {
            var stat = fs.statSync(path);
            return stat.isDirectory();
        });


        return {
            searchPath: searchPath,
            files: files,
            skipTransformRequire: args['skip-transform-require']
        };
    },

    run: function(args, config, rapido) {
        var files = args.files;
        var fileCount = 0;
        var moduleOptions = {};
        moduleOptions.moduleNames = {};

        function hasModuleConfig(src) {
            var r = src && src.indexOf("require('module-config')") > -1;
            if (r) {
                moduleOptions.moduleNames['module-config'] = true;
            }
            return r;
        }

        function hasRaptorPromises(src) {
            var r = src && src.indexOf("require('raptor/promises')") > -1;
            if (r) {
                moduleOptions.moduleNames['raptor-promises'] = true;
            }
            return r;
        }

        function hasUserEbay(src) {
            var r = src && src.indexOf(".getLevel1UserId()") > -1;
            r = r || src && src.indexOf(".getAccountId()") > -1;
            r = r || src && src.indexOf(".getPersistentAccountId()") > -1;
            r = r || src && src.indexOf(".getJSPersistentUserId()") > -1;

            if (r) {
                moduleOptions.moduleNames['user-ebay'] = true;
            }
            return r;
        }

        function hasEbayRequestContext(src) {
            var r = src && src.indexOf("require('ebay-request-context')") > -1;
            r = r || src && src.indexOf(".isHostInNetwork(") > -1;
            if (r) {
                moduleOptions.moduleNames['ebay-request-context'] = true;
            }
            return r;
        }

        function hasEbayTracking(src) {
            var r = src && src.indexOf("require('ebay-tracking')") > -1;
            r = r || src && src.indexOf(".trackVectorTag(") > -1;
            r = r || src && src.indexOf(".trackTag(") > -1;

            if (r) {
                moduleOptions.moduleNames['ebay-tracking'] = true;
            }
            return r;
        }

        function hasCommonsEbay(src) {
            var r = src && src.indexOf(".getSiteId()") > -1;
            r = r || src && src.indexOf(".getMarketplaceId(") > -1;
            r = r || src && src.indexOf(".getTerritoryId(") > -1;
            if (r) {
                moduleOptions.moduleNames['commons-ebay'] = true;
            }
            return r;
        }

        function hasEbayI18n(src) {
            var r = src && src.indexOf("require('ebay-i18n')") > -1;
            r = r || src && src.indexOf(".getContentManager(") > -1;
            if (r) {
                moduleOptions.moduleNames['ebay-i18n'] = true;
            }
            return r;
        }

        function hasEbayEp(src) {
            var r = src && src.indexOf("require('ebay-ep')") > -1;
            if (r) {
                moduleOptions.moduleNames['ebay-ep'] = true;
            }
            return r;
        }

        function hasEbayRestClient(src) {
            var r = src && src.indexOf("require('ebay-rest-client')") > -1;
            if (r) {
                moduleOptions.moduleNames['ebay-rest-client'] = true;
            }
            return r;
        }

        function hasEbayCookie(src) {
            var r = src && src.indexOf(".getCookieManager(") > -1;
            if (r) {
                moduleOptions.moduleNames['cookies-ebay'] = true;
            }
            return r;
        }

        function hasEbayCsrf(src) {
            var r = src && src.indexOf("require('ebay-csrf')") > -1;
            if (r) {
                moduleOptions.moduleNames['ebay-csrf'] = true;
            }
            return r;
        }

        function hasRaptor(src) {
            var r = src && src.indexOf("require('raptor')") > -1;
            if (r) {
                moduleOptions.moduleNames['raptor'] = true;
            }
            return r;
        }

        function hasCubejsAPI(src) {
            var checkFuncs = [hasModuleConfig, hasRaptorPromises, hasUserEbay, hasEbayRequestContext, hasEbayTracking ];
            checkFuncs.push(hasCommonsEbay);
            checkFuncs.push(hasEbayI18n);
            checkFuncs.push(hasEbayEp);
            checkFuncs.push(hasEbayRestClient);
            checkFuncs.push(hasEbayCookie);
            checkFuncs.push(hasEbayCsrf);
            checkFuncs.push(hasRaptor);

            var checkResults = _.map(checkFuncs, function(check) {
                var r = check(src);
                // console.log(check, r);
                return r;
            });

            var r = _.reduce(checkResults, function(memo, value) {
                return memo || value;
            }, false);

            return r;
        }

        function transformFile(file) {
            moduleOptions.file = file;
            var fileArr = file.split('/');
            // console.log(fileArr);
            var migratePath = 'migrate';
            var findSrc = false;
            for (var i = fileArr.length - 1; i >= 0; i--) {
                if (fileArr[i - 1] === 'src') {
                    findSrc = true;
                    break;
                }
                migratePath = '../' + migratePath;
            }
            if (findSrc === true) {
                moduleOptions.migratePath = migratePath;
            }
            var pos = file.lastIndexOf('/src');
            if(pos !== -1) {
                var projectSrcDir = file.substring(0, pos);
                moduleOptions.projectSrcDir = projectSrcDir;
            }


            var src = fs.readFileSync(file, {
                encoding: 'utf8'
            });
            if (hasCubejsAPI(src)) {
                console.log('Transforming ' + file + '...');
                fileCount++;
                // return;
                args.from = nodePath.dirname(file);
                var transformed = jsTransformer.transform(src, args, moduleOptions);
                fs.writeFileSync(file, transformed, {
                    encoding: 'utf8'
                });
            }

        }

        walk(
            files, {
                file: function(file) {

                    if (file.endsWith('.js')) {
                        transformFile(file);
                    }
                }
            },
            function(err) {
                if (err) {
                    console.error('Error while migrating JavaScript: ' + (err.stack ||
                        err));
                    return;
                }

                console.log('All ' + fileCount +
                    ' JavaScript files migrated to Unified Node.js API');
            });
    }
};
