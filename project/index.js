'use strict';

require('continuation-local-storage');

var express = require('express');
var kraken = require('kraken-js');

require('app-module-path').addPath(__dirname);

var options = {
    onconfig: function (config, cb) {

        require('raptor-optimizer').configure(config.get('raptor-optimizer'));
        require('view-engine').configure(config.get('view-engine'));

        // require('./src/dust-helpers').registerHelpers();
        // require('./src/dust-helpers-server').registerHelpers();



        cb(null, config);
    }
};




var app = express();
app.use(kraken(options));

app.once('start', function() {
    console.log('Server ready');
    if (process.send) {
        process.send('online');
    }
});

// TODO Move this into brogan-ebay when it exists.
// Needs to be there to prevent user from pre-empting
// the /admin routes used by Validate Internals
//require('validateinternals-ebay').middleware(app);


app.listen(8080, function () {
    console.log('Application Listening on port ' + 8080);
});
