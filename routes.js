"use strict";

// Requires.
var pug = require( 'pug' );

// Local requires.
var db = require( './db' );


function get_index( req, res ) {
    var fn = pug.compileFile( 'views/music_table.pug' );
    var html = fn();
    res.end( html );
}


function get_songs( req, res ) {
    var songs = [];

    var query = db.get_songs( req.query.search );

    query.on( 'row', ( row ) => {
        songs.push( row );
    });

    query.on( 'end', ( result ) => {
        res.json( songs );
    });
}


function get_song( req, res ) {
    if( isNaN( req.params.song ) ) {
        return res.status( 404 ).send( 'Song must be a number' );
    }

    var query = db.get_song( req.params.song );

    query.on( 'row', ( song ) => {
        res.sendFile( song.path );
    });
}


function get_random_songs( req, res ) {
    var songs = [];

    var query = db.get_random_songs( 50 );

    query.on( 'row', ( row ) => {
        songs.push( row );
    });

    query.on( 'end', ( result ) => {
        res.json( songs );
    });
}


function get_songs_by_search( req, res ) {
    var search = prep_tsquery_string( req.query.search );
    if( !search ) {
        return res.status( 404 ).send( 'Requires search' );
    }

    var songs = [];

    var query = db.get_songs_by_search( search );

    query.on( 'row', ( row ) => {
        songs.push( row );
    });

    query.on( 'end', ( result ) => {
        res.json( songs );
    });
}


module.exports = ( app ) => {
    app.get( '/',           get_index          );
    app.get( '/songs',      get_songs          );
    app.get( '/song/:song', get_song           );
    app.get( '/random',     get_random_songs   );
    app.get( '/search',     get_songs_by_search);
};
