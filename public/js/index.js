$( initialize );

function initialize() {
    get_songs();

    $( '#music_table' ).click( function( e ) {
        if( e.target.type == 'submit' )
            play_song( e.target.value );
    } );

    $( '#music_player' ).bind( 'ended', function() {
        $( '.current' ).next().find( 'button' ).click();
    });
}

function get_songs() {
    var map = {};

    $.get( '/songs/', map, receive_songs );
}

function receive_songs( json, text_status ) {
    var fragment = document.createDocumentFragment();

    for( var i = 0; i < json.length; i++ ) {
        var song = json[ i ];

        var song_row = document.createElement( 'tr' );
            song_row.id = 'song_row_' + song.song;

        var play_cell = document.createElement( 'td' );

        var play_button = document.createElement( 'button' );
            play_button.value = song.song;
            play_button.appendChild( document.createTextNode( '\u25B6' ) );

        play_cell.appendChild( play_button );

        var artist_cell = document.createElement( 'td' );
            artist_cell.appendChild( document.createTextNode( song.artist ) );

        var title_cell = document.createElement( 'td' );
            title_cell.appendChild( document.createTextNode( song.title ) );

        var album_cell = document.createElement( 'td' );
            album_cell.appendChild( document.createTextNode( song.album ) );

        var year_cell = document.createElement( 'td' );
            year_cell.appendChild( document.createTextNode( song.year ? song.year : '' ) );

        var track_cell = document.createElement( 'td' );
            track_cell.appendChild( document.createTextNode( song.track ) );

        song_row.appendChild( play_cell );
        song_row.appendChild( artist_cell );
        song_row.appendChild( title_cell );
        song_row.appendChild( album_cell );
        song_row.appendChild( year_cell );
        song_row.appendChild( track_cell );

        fragment.appendChild( song_row );
    }

    $( '#music_table' ).empty().append( fragment );
    $( '#music_footer' ).hide();
}

function play_song( song ) {
    $( '.current' ).removeClass( 'current' );
    $( '#song_row_' + song ).addClass( 'current' );

    document.getElementById( 'music_source' ).src = '/song/' + song;
    document.getElementById( 'music_player' ).load();
    document.getElementById( 'music_player' ).play();
}
