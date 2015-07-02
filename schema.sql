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
