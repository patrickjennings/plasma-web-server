var port = process.env.PORT || 3000;

var pg_port = process.env.PGPORT || 5432;
var pg_user = process.env.PGUSER || 'web-user';
var pg_pass = process.env.PGPASS || null;
var pg_host = process.env.PGHOST || 'localhost';
var pg_db   = process.env.PGDB   || 'audio';

require( 'string.prototype.endswith' );

var express = require( 'express'    );
var id3     = require( 'id3-parser' );
var fs      = require( 'fs'         );
var pg      = require( 'pg'         );
var jade    = require( 'jade'       );

var pg_connection = {
    port     : pg_port,
    user     : pg_user,
    password : pg_pass,
    host     : pg_host,
    database : pg_db
};

var client = new pg.Client( pg_connection );

client.on( 'drain', client.end.bind( client ) ); //disconnect client when all queries are finished
client.connect();

function save_audio_file( file, data ) {
    client.query( 'SELECT fn_create_or_update_song( $1, $2 )', [ file, data ], function( err ) {
        if( err ) {
            return console.error( 'query failed', err );
        }
    } );
}

function parse_mp3_file( file ) {
    var buffer = fs.readFileSync( file );

    var tags = id3.parseFromBuffer( buffer );

    if( Object.keys( tags ).length > 0 ) {
        var data = {
            title  : tags.title,
            album  : tags.album,
            year   : parseInt( tags.year, 10 ),
            track  : parseInt( tags.track, 10 ),
            artist : tags.artist
        };

        save_audio_file( file, data );
    }
}

function scan_audio_files( directory ) {
    var files = fs.readdirSync( directory );

    for( var i in files ) {
        var file = directory + '/' + files[i];

        try {
            if( fs.statSync( file ).isDirectory() ) {
                console.log( 'Scanning', file );

                scan_audio_files( file );
            }
            else if( file.endsWith( 'mp3' ) ) {
                parse_mp3_file( file );
            }
        }
        catch( e ) {}
    }
}

for( var i = 2; i < process.argv.length; i++ ) {
    var directory = process.argv[i].replace(/\/$/,'');

    try {
        if( !fs.statSync( directory ).isDirectory() ) {
            console.error( directory, 'is not a directory' );
            continue;
        }
    }
    catch( e ) {
        console.error( 'could not parse', directory );
        continue;
    }

    client.query( "DELETE FROM song WHERE path LIKE $1 || '%'", [ directory ], function( err ) {
        if( err ) {
            return console.error( 'failed to truncate', directory, err );
        }
    } );

    console.log( 'Scanning', directory );

    scan_audio_files( directory );
}

if( client.queryQueue.length == 0 ) {
    client.end();
}

var app = express();

app.use( express.static( 'public' ) );

app.get( '/', function( req, res ) {
    var fn = jade.compileFile( 'views/music_table.jade' );

    var html = fn();

    res.end( html );
});

app.get( '/songs', function( req, res ) {
    var filter = '';
    if( req.query.filter )
        filter = req.query.filter;

    var client = new pg.Client( pg_connection );

    client.connect();

    var query = client.query(
        'SELECT song, artist, album, title, year, track '
       +  'FROM song '
       + "WHERE title ilike '%' || $1 || '%' "
       +    "OR artist ilike '%' || $1 || '%' "
       +    "OR album ilike '%' || $1 || '%' "
       +  'ORDER BY artist, year, album, track',
       [ filter ]
    );

    var songs = [];

    query.on( 'row', function( row ) {
        songs.push( row );
    });

    query.on( 'end', function( result ) {
        res.json( songs );
        client.end();
    });
});

app.get( '/song/:song', function( req, res ) {
    if( isNaN( req.params.song ) ) {
        return res.status( 404 ).send( 'Song must be a number' );
    }

    var client = new pg.Client( pg_connection );

    client.connect();

    var query = client.query( 'SELECT path FROM song WHERE song = $1', [ req.params.song ] );

    query.on( 'row', function( song ) {
        res.sendFile( song.path );
    });

    query.on( 'end', function( result ) {
        client.end();
    });
});

app.get( '/random', function( req, res ) {
    var client = new pg.Client( pg_connection );

    client.connect();

    var query = client.query(
        'SELECT song, artist, album, title, year, track '
      +  ' FROM song '
      + ' ORDER BY RANDOM() '
      + ' LIMIT 50 '
    );

    var songs = [];

    query.on( 'row', function( row ) {
        songs.push( row );
    });

    query.on( 'end', function( result ) {
        res.json( songs );
        client.end();
    });
});

var server = app.listen( port, function () {
    var port = server.address().port;

    console.log( 'Started webserver on port %s', port );
} );
