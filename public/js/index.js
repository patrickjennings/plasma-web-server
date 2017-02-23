var current_song = null;
var lastfm_api = '8629283b656243d0088df83cd69b78fb';
var lastfm_endpoint = 'https://ws.audioscrobbler.com/2.0/';

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
        search : document.getElementById( 'music_search' ).value
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

        var album_anchor = document.createElement( 'a' );
            album_anchor.href = 'javascript:get_album_info( ' + song.song + ' );';
            album_anchor.style.color = 'black';
            album_anchor.appendChild( document.createTextNode( song.album ) );

        album_cell.appendChild( album_anchor );

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

    var map = {
        method      : 'album.getinfo',
        api_key     : lastfm_api,
        autocorrect : 1,
        format      : 'json',
        artist      : artist,
        album       : album
    };

    $.get( lastfm_endpoint, map, receive_album_art_info );
}

function receive_album_art_info( json ) {
    if( json && json.album ) {
        var album = json.album;

        var album_image_url = album.image[ album.image.length - 1 ]['#text'];

        $( '#album_art' ).attr( 'src', album_image_url );
        $( '#album_art_link' ).attr( 'href', album_image_url );
        $( '#icon' ).attr( 'href', album_image_url );
    }
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

    $.get( lastfm_endpoint, map, receive_artist_info );
}

function receive_artist_info( json ) {
    if( json && json.artist ) {
        var artist = json.artist;

        var artist_image_url = artist.image[ artist.image.length - 1 ]['#text'];

        var artist_div = document.createElement( 'div' );

        var artist_image = document.createElement( 'img' );
            artist_image.src = artist_image_url;
            artist_image.style.width = '100px';
            artist_image.style.cssFloat = 'left';
            artist_image.style.marginRight = '10px';
            artist_image.style.marginBottom = '10px';

        var artist_info_div = document.createElement( 'div' );
            artist_info_div.innerHTML = artist.bio.summary;

        $( artist_info_div ).find( 'a' ).each( function() {
            this.target = '_blank';
        } );

        artist_div.appendChild( artist_image );
        artist_div.appendChild( artist_info_div );

        open_modal( artist_div );
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

function get_album_info( song ) {
    var song_row = $( '#song_row_' + song );
    var artist   = song_row.children().eq(1).text();
    var album    = song_row.children().eq(3).text();

    var map = {
        method      : 'album.getinfo',
        api_key     : lastfm_api,
        autocorrect : 1,
        format      : 'json',
        artist      : artist,
        album       : album
    };

    $.get( lastfm_endpoint, map, receive_album_info );
}

function receive_album_info( json ) {
    if( json && json.album ) {
        var album = json.album;

        var album_image_url = album.image[ album.image.length - 1 ]['#text'];

        var album_div = document.createElement( 'div' );

        var album_image = document.createElement( 'img' );
            album_image.src = album_image_url;
            album_image.style.width = '100px';
            album_image.style.cssFloat = 'left';
            album_image.style.marginRight = '10px';
            album_image.style.marginBottom = '10px';

        var album_info_div = document.createElement( 'div' );

        if( album.wiki && album.wiki.summary ) {
            album_info_div.innerHTML = album.wiki.summary;

            $( album_info_div ).find( 'a' ).each( function() {
                this.target = '_blank';
            } );
        }

        album_div.appendChild( album_image );
        album_div.appendChild( album_info_div );

        open_modal( album_div );
    }
}
