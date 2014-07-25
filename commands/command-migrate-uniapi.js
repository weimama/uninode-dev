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
        projectdir: {
            description: 'Project directory',
            type: 'string'
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

        var projectRootDir = args['projectdir'];
        if(!projectRootDir) {
            var root = files[0];
            // console.log('root:', root);
            if( fs.existsSync(require('path').resolve(root,'./config')) ) {
                projectRootDir = root;
            } else if(fs.existsSync( require('path').resolve(root,'../config') ) ) {
                projectRootDir = require('path').resolve(root, '../');
            } else {
                if(root.indexOf('src') > 0) {
                    projectRootDir = require('path').resolve(root, '../');
                    // console.log('p r d:', projectRootDir);
                } else {
                    projectRootDir = root;
                    // console.log('p r d 2:', projectRootDir);
                }
            }
        }
        // console.log('---project root dir:', projectRootDir);


        return {
            searchPath: searchPath,
            files: files,
            skipTransformRequire: args['skip-transform-require'],
            projectDir: projectRootDir
        };
    },

    run: function(args, config, rapido) {
        var files = args.files;
        var fileCount = 0;
        var moduleOptions = {};
        moduleOptions.moduleNames = {};

        moduleOptions.projectDir = args.projectDir;

        function hasModuleConfig(src, file) {
            var r = src && src.indexOf("require('module-config')") > -1;
            if (r) {
                moduleOptions.moduleNames['module-config'] = true;
            }
            return r;
        }

        function hasRaptorPromises(src, file) {
            var r = src && src.indexOf("require('raptor/promises')") > -1;
            if (r) {
                moduleOptions.moduleNames['raptor-promises'] = true;
            }
            return r;
        }

        function hasUserEbay(src, file) {
            var r = src && src.indexOf(".getLevel1UserId()") > -1;
            r = r || src && src.indexOf(".getAccountId()") > -1;
            r = r || src && src.indexOf(".getPersistentAccountId()") > -1;
            r = r || src && src.indexOf(".getJSPersistentUserId()") > -1;

            if (r) {
                moduleOptions.moduleNames['user-ebay'] = true;
            }
            return r;
        }

        function hasEbayRequestContext(src, file) {
            var r = src && src.indexOf("require('ebay-request-context')") > -1;
            r = r || src && src.indexOf(".isHostInNetwork(") > -1;
            if (r) {
                moduleOptions.moduleNames['ebay-request-context'] = true;
            }
            return r;
        }

        function hasEbayTracking(src, file) {
            var r = src && src.indexOf("require('ebay-tracking')") > -1;
            r = r || src && src.indexOf(".trackVectorTag(") > -1;
            r = r || src && src.indexOf(".trackTag(") > -1;

            if (r) {
                moduleOptions.moduleNames['ebay-tracking'] = true;
            }
            return r;
        }

        function hasCommonsEbay(src, file) {
            var r = src && src.indexOf(".getSiteId()") > -1;
            r = r || src && src.indexOf(".getMarketplaceId(") > -1;
            r = r || src && src.indexOf(".getTerritoryId(") > -1;
            r = r || src && src.indexOf(".attributes.request") > -1;
            r = r || src && src.indexOf(".ebay.getLocale(") > -1;
            r = r || src && src.indexOf(".ebay.locale.language") > -1;
            r = r || src && src.indexOf(".outboundContext") > -1;
            r = r || src && src.indexOf("ebay.locale.toString(") > -1;

            if (r) {
                moduleOptions.moduleNames['commons-ebay'] = true;
            }
            return r;
        }

        function hasEbayI18n(src, file) {
            var r = src && src.indexOf("require('ebay-i18n')") > -1;
            r = r || src && src.indexOf(".getContentManager(") > -1;
            r = r || src && src.indexOf(".getBundle(") > -1;
            if (r) {
                moduleOptions.moduleNames['ebay-i18n'] = true;
            }
            return r;
        }

        function hasEbayEp(src, file) {
            var r = src && src.indexOf("require('ebay-ep')") > -1;
            r = r || src && src.indexOf("middleware.getQualifiedTreatments(") > -1;
            r = r || src && src.indexOf("app.use(") > -1;
            if (r) {
                moduleOptions.moduleNames['ebay-ep'] = true;
            }
            return r;
        }

        function hasEbayRestClient(src, file) {
            var r = src && src.indexOf("require('ebay-rest-client')") > -1;
            if (r) {
                moduleOptions.moduleNames['ebay-rest-client'] = true;
            }
            return r;
        }

        function hasEbayCookie(src, file) {
            var r = src && src.indexOf(".getCookieManager(") > -1;
            if (r) {
                moduleOptions.moduleNames['cookies-ebay'] = true;
            }
            return r;
        }

        function hasEbayCsrf(src, file) {
            var r = src && src.indexOf("require('ebay-csrf')") > -1;
            if (r) {
                moduleOptions.moduleNames['ebay-csrf'] = true;
            }
            return r;
        }

        function hasRaptor(src, file) {
            var r = src && src.indexOf("require('raptor')") > -1;
            if (r) {
                moduleOptions.moduleNames['raptor'] = true;
            }
            return r;
        }

        function hasEbayApiFolder(src, file) {
            if(!file) {
                return false;
            }
            if( file.indexOf('/src/ebay-api/') === -1 && file.indexOf('/src/services/') === -1 ) {
                return false;
            }
            var r = src && src.indexOf("JSON.parse") > -1;
            if (r) {
                moduleOptions.moduleNames['ebay-api-folder'] = true;
            }

            return r;
        }

        function hasEbayApiService(src, file) {
            if(!file) {
                return false;
            }

            var r = src && src.indexOf("require('ebay-api") > -1;
            if (r) {
                moduleOptions.moduleNames['ebay-api'] = true;
            }

            return r;
        }

        function hasEbayGuid(src, file) {
            if(!file || !src) {
                return false;
            }
            var r = src.indexOf("require('ebay-guid').getGuid") > -1;
            r =  r || src.indexOf("require('ebay-guid')") > -1;
            if (r) {
                moduleOptions.moduleNames['ebay-guid'] = true;
            }

            return r;
        }

        function hasEbayDeviceDetection(src, file) {
            if(!file || !src) {
                return false;
            }
            var r = src.indexOf("require('ebay-device-detection')") > -1;
            if (r) {
                moduleOptions.moduleNames['ebay-device-detection'] = true;
            }
            return r;
        }

        function hasEbayLogger(src, file) {
            if(!file || !src) {
                return false;
            }
            var r = src.indexOf("ebay.logger(") > -1;
            r = r || src.indexOf("ebayRequestContext.logger(") > -1;
            r = r || src.indexOf(".debugEvent(") > -1;
            r = r || src.indexOf(".errorEvent(") > -1;
            r = r || src.indexOf(".begin(") > -1;
            r = r || src.indexOf("logger.end(") > -1;

            if(r) {
                moduleOptions.moduleNames['ebay-logger'] = true;
            }
            return r;
        }

        function hasEbayAuth(src, file) {
            if(!file || !src) {
                return false;
            }
            var r = src.indexOf("require('ebay-auth')") > -1;
            if (r) {
                moduleOptions.moduleNames['ebay-auth'] = true;
            }

            return r;
        }


        function isMigrateFolder(src, file) {
            if(file && file.indexOf('/migrate/') > -1) {
                return true;
            }
            return false;
        }

        function hasCubejsAPI(src, file) {

            if(isMigrateFolder(src, file) ) {
                return false;
            }

            var checkFuncs = [hasModuleConfig, hasRaptorPromises, hasUserEbay, hasEbayRequestContext, hasEbayTracking ];
            checkFuncs.push(hasCommonsEbay);
            checkFuncs.push(hasEbayI18n);
            checkFuncs.push(hasEbayEp);
            checkFuncs.push(hasEbayRestClient);
            checkFuncs.push(hasEbayCookie);
            checkFuncs.push(hasEbayCsrf);
            checkFuncs.push(hasRaptor);
            checkFuncs.push(hasEbayApiService);
            checkFuncs.push(hasEbayApiFolder);
            checkFuncs.push(hasEbayGuid);
            checkFuncs.push(hasEbayDeviceDetection);
            checkFuncs.push(hasEbayLogger);
            checkFuncs.push(hasEbayAuth);




            var checkResults = _.map(checkFuncs, function(check) {
                var r = check(src, file);
                // console.log(check, r);
                return r;
            });

            var r = _.reduce(checkResults, function(memo, value) {
                return memo || value;
            }, false);

            return r;
        }

        function transformFile(file) {
            if(file.indexOf('/migrate/') !== -1) {
                return;
            }
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
            var pos = -1;
            if(file && file.indexOf('/tests/') !== -1) {
                pos = file.lastIndexOf('/tests/');
            } else {
                pos = file.lastIndexOf('/src/');
            }
            // pos = file.lastIndexOf('/src/');
            // if(pos === -1) {
            //     pos = file.lastIndexOf('/tests/')
            // }

            if(pos !== -1) {
                var projectSrcDir = file.substring(0, pos+1);
                moduleOptions.projectSrcDir = projectSrcDir;
                moduleOptions.srcRelative = '';
                var pathArrFile = file.split('/');
                var pathArrSrcDir = projectSrcDir.split('/');
                var len1 = pathArrFile.length;
                var len2 = pathArrSrcDir.length;
                if(len1 === len2) {
                    moduleOptions.srcRelative = '';
                } else if (len1 > len2) {
                    for(var i=0;i<len1-len2;i++) {
                        moduleOptions.srcRelative = moduleOptions.srcRelative + '../';
                    }
                }

            }


            var src = fs.readFileSync(file, {
                encoding: 'utf8'
            });
            if (hasCubejsAPI(src, file)) {

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
