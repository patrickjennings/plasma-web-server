var current_song = null;
var lastfm_api = '8629283b656243d0088df83cd69b78fb';

$( initialize );

function initialize() {
    $( '#music_tbody' ).click( function( e ) {
        if( e.target.type == 'submit' )
            play_song( e.target.value );
    } );

    $( '#music_player' ).bind( 'ended', function() {
        $( '.current' ).next().find( 'button' ).click();
    });
}

function get_songs() {
    var map = {
        filter : document.getElementById( 'music_search' ).value
    };

    $.get( '/songs/', map, receive_songs );
}

function receive_songs( json, text_status ) {
    var fragment = document.createDocumentFragment();

    for( var i = 0; i < json.length; i++ ) {
        var song = json[ i ];

        var song_row = document.createElement( 'tr' );
            song_row.id = 'song_row_' + song.song;

        if( current_song == song.song ) {
            song_row.className = 'current';
        }

        var play_cell = document.createElement( 'td' );

        var play_button = document.createElement( 'button' );
            play_button.value = song.song;
            play_button.appendChild( document.createTextNode( '\u25B6' ) );

        play_cell.appendChild( play_button );

        var artist_cell = document.createElement( 'td' );

        var artist_anchor = document.createElement( 'a' );
            artist_anchor.href = 'javascript:get_artist_info( ' + song.song + ' );';
            artist_anchor.style.color = 'black';
            artist_anchor.appendChild( document.createTextNode( song.artist ) );

        artist_cell.appendChild( artist_anchor );

        var title_cell = document.createElement( 'td' );
            title_cell.appendChild( document.createTextNode( song.title ) );

        var album_cell = document.createElement( 'td' );
            album_cell.appendChild( document.createTextNode( song.album ) );

        var year_cell = document.createElement( 'td' );
            year_cell.appendChild( document.createTextNode( song.year ? song.year : '' ) );

        var track_cell = document.createElement( 'td' );
            track_cell.appendChild( document.createTextNode( song.track ? song.track : '' ) );

        song_row.appendChild( play_cell );
        song_row.appendChild( artist_cell );
        song_row.appendChild( title_cell );
        song_row.appendChild( album_cell );
        song_row.appendChild( year_cell );
        song_row.appendChild( track_cell );

        fragment.appendChild( song_row );
    }

    $( '#music_tbody' ).empty().append( fragment );
    $( '#music_footer' ).hide();
}

function play_song( song ) {
    var song_row = $( '#song_row_' + song );

    $( '.current' ).removeClass( 'current' );
    song_row.addClass( 'current' );

    current_song = song;

    document.getElementById( 'music_source' ).src = '/song/' + song;
    document.getElementById( 'music_player' ).load();
    document.getElementById( 'music_player' ).play();

    var artist = song_row.children().eq(1).text();
    var title  = song_row.children().eq(2).text();
    var album  = song_row.children().eq(3).text();

    document.title = title + ' - ' + artist;

    $( '#artist' ).text( artist );
    $( '#album' ).text( album );
    $( '#title' ).text( title );

    get_album_art( song );
}

function get_album_art( song ) {
    var song_row = $( '#song_row_' + song );

    var album  = song_row.children().eq(3).text();
    var artist = song_row.children().eq(1).text();

    var imageSearch = new google.search.ImageSearch();

    imageSearch.setSearchCompleteCallback( this, function() {
        if( imageSearch.results && imageSearch.results.length > 0 ) {
            var url = imageSearch.results[0].tbUrl;
            var direct_url = imageSearch.results[0].url;

            $( '#album_art' ).attr( 'src', url );
            $( '#album_art_link' ).attr( 'href', direct_url );
            $( '#icon' ).attr( 'href', url );
        }
    }, null );

    imageSearch.execute( album + ' ' + artist );
}

function get_random_playlist() {
    var map = {};

    $.get( '/random', map, receive_songs );
}

function get_artist_info( song ) {
    var artist = $( '#song_row_' + song ).children().eq(1).text();

    var map = {
        method      : 'artist.getinfo',
        api_key     : lastfm_api,
        autocorrect : 1,
        format      : 'json',
        artist      : artist
    };

    $.get( 'http://ws.audioscrobbler.com/2.0/', map, receive_artist_info );
}

function receive_artist_info( json ) {
    if( json && json.artist ) {
        var artist_info_div = document.createElement( 'div' );
            artist_info_div.innerHTML = json.artist.bio.summary;

        open_modal( artist_info_div );
    }
}

function open_modal( html_node ) {
    var overlay = document.createElement( 'div' );
        overlay.className = 'overlay';
        overlay.onclick = function() {
            $( '.overlay' ).remove();
        };

    var modal = document.createElement( 'div' );
        modal.className = 'modal';
        modal.onclick = function( e ) { e.stopPropagation(); };

    modal.appendChild( html_node );

    overlay.appendChild( modal );

    document.body.appendChild( overlay );
}
