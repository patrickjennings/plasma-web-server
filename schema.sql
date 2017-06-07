CREATE TABLE song (
    song SERIAL PRIMARY KEY,
    path TEXT UNIQUE,
    title TEXT,
    artist TEXT,
    album TEXT,
    track SMALLINT,
    year SMALLINT,
    parsed TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);


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
               year = (in_data->>'year')::SMALLINT,
               parsed = DEFAULT
         WHERE path = in_path;
    END IF;
END
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION fn_get_tsquery_from_TEXT( in_query TEXT )
    RETURNS SETOF TSQUERY
    AS $$
BEGIN
    RETURN QUERY
        SELECT song
          FROM song
         WHERE TO_TSVECTOR( 'english', COALESCE( artist, '' ) ) || TO_TSVECTOR( 'simple', COALESCE( artist, '' ) )
            || TO_TSVECTOR( 'english', COALESCE( title,  '' ) ) || TO_TSVECTOR( 'simple', COALESCE( title,  '' ) )
            || TO_TSVECTOR( 'english', COALESCE( album,  '' ) ) || TO_TSVECTOR( 'simple', COALESCE( album,  '' ) )
            @@ in_query;

    RETURN;
END
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION fn_get_songs_by_query( in_query TSQUERY )
    RETURNS SETOF integer
    AS $$
BEGIN
    RETURN QUERY
        SELECT song
          FROM song
         WHERE TO_TSVECTOR( 'english', COALESCE( artist, '' ) || ' ' || COALESCE( title, '' ) || ' ' || COALESCE( album, '' ) )
            || TO_TSVECTOR( 'simple',  COALESCE( artist, '' ) || ' ' || COALESCE( title, '' ) || ' ' || COALESCE( album, '' ) )
            @@ in_query;

    RETURN;
END
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION fn_fuzzy_search_song( in_query TSQUERY )
    RETURNS TABLE( match TEXT, match_type TEXT )
    AS $$
BEGIN
    RETURN QUERY
    WITH matches AS (
        SELECT artist AS match,
               'artist' AS match_type,
               ts_rank(
                   TO_TSVECTOR( 'english', COALESCE( artist, '' ) ),
                   in_query
               ) AS match_rank
          FROM song
         WHERE TO_TSVECTOR( 'english', COALESCE( artist, '' ) ) @@ in_query
         GROUP BY artist
        UNION ALL
        SELECT album AS match,
               'album' AS match_type,
               ts_rank(
                   TO_TSVECTOR( 'english', COALESCE( album, '' ) ),
                   in_query
               ) AS match_rank
          FROM song
         WHERE TO_TSVECTOR( 'english', COALESCE( album, '' ) ) @@ in_query
         GROUP BY album
        UNION ALL
        SELECT title AS match,
               'title' AS match_type,
               ts_rank(
                   TO_TSVECTOR( 'english', COALESCE( title, '' ) ),
                   in_query
               ) AS match_rank
          FROM song
         WHERE TO_TSVECTOR( 'english', COALESCE( title, '' ) ) @@ in_query
         GROUP BY title
    )
    SELECT m.match::TEXT, m.match_type
      FROM matches m
     ORDER BY m.match_rank DESC;

    RETURN;
END
$$ LANGUAGE plpgsql;


CREATE INDEX song_tsvector_index
    ON song
 USING gin(
    (
        TO_TSVECTOR('english'::REGCONFIG, ((((COALESCE(artist, ''::TEXT) || ' '::TEXT) || COALESCE(title, ''::TEXT)) || ' '::TEXT) || COALESCE(album, ''::TEXT)))
     || TO_TSVECTOR('simple'::REGCONFIG,  ((((COALESCE(artist, ''::TEXT) || ' '::TEXT) || COALESCE(title, ''::TEXT)) || ' '::TEXT) || COALESCE(album, ''::TEXT)))
    )
);
