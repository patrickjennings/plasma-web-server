"use strict";

// Requires.
var express = require( 'express' );
var morgan  = require( 'morgan'  );

// Local requires.
var scan   = require( './lib/scan'   );
var routes = require( './lib/routes' );
var config = require( './lib/config' );


// Parse MP3 directories passed in as arguments.
for( var i = 2; i < process.argv.length; i++ ) {
    var directory = process.argv[ i ].replace( /\/$/, '' );

    console.log( 'Scanning %s.', directory );

    scan.scan_audio_files( directory );
}


// Create webserver.
var app = express();

app.use( morgan( 'combined' ) );
app.use( express.static( 'public' ) );

routes( app );

var server = app.listen( config.port, () => {
    var port = server.address().port;

    console.log( 'Started plasma web server on port %s.', port );
} );
