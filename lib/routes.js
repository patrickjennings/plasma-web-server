"use strict";

// Requires.
var pug = require( 'pug' );

// Local requires.
var db = require( './db' );


var index_html = function() {
    return pug.compileFile( 'views/music_table.pug' )();
}();


function get_index( req, res ) {
    res.end( index_html );
}


function get_songs( req, res ) {
    var query = db.get_songs( req.query.search );

    query.then( results => {
        var songs = results.rows || [];
        res.json( songs );
    });
}


function get_song( req, res ) {
    if( isNaN( req.params.song ) ) {
        return res.status( 404 ).send( 'Song must be a number' );
    }

    var query = db.get_song( req.params.song );

    query.then( results => {
        var songs = results.rows || [];
        if( songs )
            res.sendFile( songs[ 0 ].path );
        else
            res.sendStatus( 404 );
    });
}


function get_random_songs( req, res ) {
    var query = db.get_random_songs( 50 );

    query.then( results => {
        var songs = results.rows || [];
        res.json( songs );
    });
}


function get_songs_by_search( req, res ) {
    var search = prep_tsquery_string( req.query.search );
    if( !search ) {
        return res.status( 404 ).send( 'Requires search' );
    }

    var query = db.get_songs_by_search( search );

    query.then( results => {
        var songs = results.rows || [];
        res.json( songs );
    });
}


module.exports = ( app ) => {
    app.get( '/',           get_index           );
    app.get( '/songs',      get_songs           );
    app.get( '/song/:song', get_song            );
    app.get( '/random',     get_random_songs    );
    app.get( '/search',     get_songs_by_search );
};
