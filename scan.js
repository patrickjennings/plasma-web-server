"use strict";

// Requires.
var fs      = require( 'fs'         );
var id3     = require( 'id3-parser' );
var glob    = require( 'glob'       );
var async   = require( 'async'      );

// Local requires.
var db     = require( './db'     );
var config = require( './config' );

var null_char_regex = new RegExp(/\0/, 'g');

function clean_tag( tag ) {
    if( typeof( tag ) == 'string' ) {
        tag = tag.replace(null_char_regex, '');
    }

    return tag;
}


// Get the ID3 tags from the mp3 file.
function parse_mp3_file( file, callback ) {
    try {
        var buffer = fs.readFile( file, (err, data) => {
            id3.parse( data ).then( tags => {
                if( Object.keys( tags ).length > 0 ) {
                    var data = {
                        title  : clean_tag( tags.title ),
                        album  : clean_tag( tags.album ),
                        artist : clean_tag( tags.artist ),
                        year   : parseInt( clean_tag( tags.year ), 10 ),
                        track  : parseInt( clean_tag( tags.track ), 10 )
                    };

                    db.save_song_data( file, data ).then(() => {
                        callback();
                    } );
                }
            } );
        } );
    }
    catch( e ) {
        callback( e );
    }
}


// Get all mp3 files from directory at once using a glob pattern.
// Then parse mp3 files and upsert them into the db.
function scan_directory( directory ) {
    var options = {
        cwd: directory,
        nosort: true,
        strict: true,
        nocase: true,
        matchBase: true,
        nodir: true,
        absolute: true
    };

    glob( '*.mp3', options, (err, files) => {
        async.eachLimit( files, config.file_limit, parse_mp3_file, (err) => {
            if( err )
                return console.error( 'Failed to scan directory.', directory, err );
            console.log( 'Successfully scanned %s.', directory );
        } );
    });
}


// Scan a passed in directory and update the song database.
function scan_audio_files( directory ) {
    try {
        if( !fs.statSync( directory ).isDirectory() ) {
            console.error( directory, 'is not a directory.' );
            return;
        }
    }
    catch( e ) {
        console.error( 'Could not parse', directory );
        return;
    }

    var parse_unix_time = Math.round((new Date()).getTime() / 1000);

    scan_directory( directory );
    db.delete_songs_from_directory( directory, parse_unix_time );
}


module.exports = {
    scan_audio_files: scan_audio_files
};
