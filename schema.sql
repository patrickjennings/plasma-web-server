CREATE TABLE song ( song SERIAL PRIMARY KEY, path TEXT UNIQUE, title TEXT, artist TEXT, album TEXT, track SMALLINT, year SMALLINT );

CREATE OR REPLACE FUNCTION fn_create_or_update_song( in_path TEXT, in_data JSON )
    RETURNS void
    AS $$
BEGIN
    PERFORM song FROM song WHERE path = in_path;

    IF NOT FOUND THEN
        INSERT INTO song ( path, title, artist, album, track, year ) VALUES
                         ( in_path,
                           in_data->>'title',
                           in_data->>'artist',
                           in_data->>'album',
                           (in_data->>'track')::SMALLINT,
                           (in_data->>'year')::SMALLINT );
    ELSE
        UPDATE song SET
               title = in_data->>'title',
               artist = in_data->>'artist',
               album = in_data->>'album',
               track = (in_data->>'track')::SMALLINT,
               year = (in_data->>'year')::SMALLINT
         WHERE path = in_path;
    END IF;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_get_tsquery_from_text( in_query text )
    RETURNS SETOF tsquery
    AS $$
BEGIN
    RETURN QUERY
        SELECT song
          FROM song
         WHERE to_tsvector( 'english', coalesce( artist, '' ) ) || to_tsvector( 'simple', coalesce( artist, '' ) )
            || to_tsvector( 'english', coalesce( title,  '' ) ) || to_tsvector( 'simple', coalesce( title,  '' ) )
            || to_tsvector( 'english', coalesce( album,  '' ) ) || to_tsvector( 'simple', coalesce( album,  '' ) )
            @@ in_query;

    RETURN;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_get_songs_by_query( in_query tsquery )
    RETURNS SETOF integer
    AS $$
BEGIN
    RETURN QUERY
        SELECT song
          FROM song
         WHERE to_tsvector( 'english', coalesce( artist, '' ) || ' ' || coalesce( title, '' ) || ' ' || coalesce( album, '' ) )
            || to_tsvector( 'simple',  coalesce( artist, '' ) || ' ' || coalesce( title, '' ) || ' ' || coalesce( album, '' ) )
            @@ in_query;

    RETURN;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_fuzzy_search_song( in_query tsquery )
    RETURNS TABLE( match text, match_type text )
    AS $$
BEGIN
    RETURN QUERY
    WITH matches AS (
        SELECT artist AS match,
               'artist' AS match_type,
               ts_rank(
                   to_tsvector( 'english', coalesce( artist, '' ) ),
                   in_query
               ) AS match_rank
          FROM song
         WHERE to_tsvector( 'english', coalesce( artist, '' ) ) @@ in_query
         GROUP BY artist
        UNION ALL
        SELECT album AS match,
               'album' AS match_type,
               ts_rank(
                   to_tsvector( 'english', coalesce( album, '' ) ),
                   in_query
               ) AS match_rank
          FROM song
         WHERE to_tsvector( 'english', coalesce( album, '' ) ) @@ in_query
         GROUP BY album
        UNION ALL
        SELECT title AS match,
               'title' AS match_type,
               ts_rank(
                   to_tsvector( 'english', coalesce( title, '' ) ),
                   in_query
               ) AS match_rank
          FROM song
         WHERE to_tsvector( 'english', coalesce( title, '' ) ) @@ in_query
         GROUP BY title
    )
    SELECT m.match::text, m.match_type
      FROM matches m
     ORDER BY m.match_rank DESC;

    RETURN;
END
$$ LANGUAGE plpgsql;

CREATE INDEX song_tsvector_index
    ON song
 USING gin(
    (
        to_tsvector('english'::regconfig, ((((COALESCE(artist, ''::text) || ' '::text) || COALESCE(title, ''::text)) || ' '::text) || COALESCE(album, ''::text)))
     || to_tsvector('simple'::regconfig,  ((((COALESCE(artist, ''::text) || ' '::text) || COALESCE(title, ''::text)) || ' '::text) || COALESCE(album, ''::text)))
    )
);
