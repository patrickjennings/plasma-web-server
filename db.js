"use strict";

// Requires.
var pg = require( 'pg' );

// Local requires.
var config = require( './config' );


var client = function() {
    var pg_connection = {
        port     : config.pg_port,
        user     : config.pg_user,
        password : config.pg_pass,
        host     : config.pg_host,
        database : config.pg_db
    };

    var client = new pg.Client( pg_connection );

    client.connect();

    return client;
}();


// Remove characters reserved for tsquery
function prep_tsquery_string( search_string ) {
    if( !search_string || typeof( search_string ) != 'string' )
        return null;

    search_string = search_string.replace( /[&|!*:]/g, '' );
    if( !search_string )
        return null;

    return search_string.split( / +/ ).join( ':* & ' ) + ':*';
}


// data can have attributes: title, album, year, track, artist
function save_song_data( file, data ) {
    var sql = 'SELECT fn_create_or_update_song( $1, $2 )';

    return client.query( sql, [ file, data ], ( err ) => {
        if( err ) {
            console.error( 'Query failed', file, data, err );
        }
    } );
}


// Delete songs from a directory prefix where the parse time is greater than the
// songs last parsed time. Should be run after a scan of the directory which
// updates all parsed timestamps.
function delete_songs_from_directory( directory, parse_unix_time ) {
    var sql = 'DELETE FROM song '
            + " WHERE path LIKE $1 || '%'"
            +   ' AND parsed < to_timestamp($2)';

    return client.query( sql, [ directory, parse_unix_time ], ( err ) => {
        if( err ) {
            console.error( 'Failed to remove songs', directory, err );
        }
    } );
}


function get_songs( search ) {
    var query_values = [];

    var sql = 'SELECT song, artist, album, title, year, track '
             + ' FROM song WHERE TRUE';

    var search = prep_tsquery_string( search );
    if( search ) {
        var i = query_values.length + 1;
        var tsquery = "to_tsquery( 'english', $" + i + " ) || to_tsquery( 'simple', $" + i + ' )';

        sql += ' AND song IN ( SELECT fn_get_songs_by_query( ' + tsquery + ' ) )';

        query_values.push( search );
    }

    sql += ' ORDER BY artist, year, album, track';

    return client.query( sql, query_values );
}


function get_song( song ) {
    var sql = 'SELECT path FROM song WHERE song = $1';
    return client.query( sql, [ song ] );
}


function get_random_songs( limit ) {
    var sql = 'SELECT song, artist, album, title, year, track'
            +  ' FROM song'
            + ' ORDER BY RANDOM()'
            + ' LIMIT $1 ';

    return client.query( sql, [ limit ] );
}


function get_songs_by_search( search ) {
    var search = prep_tsquery_string( search );

    var tsquery = "to_tsquery( 'english', $1 ) || to_tsquery( 'simple', $1 )";
    var sql = 'SELECT * FROM fn_fuzzy_search_song( ' + tsquery + ' )';

    return client.query( sql, [ search ] );
}


module.exports = {
    save_song_data:              save_song_data,
    delete_songs_from_directory: delete_songs_from_directory,
    get_songs:                   get_songs,
    get_song:                    get_song,
    get_random_songs:            get_random_songs,
    get_songs_by_search:         get_songs_by_search
};
