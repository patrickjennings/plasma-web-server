# plasma-web-server
A MP3 web interface for managing large music collections.

Offers full-text search using PostgreSQL tsvector for very fast and intelligent
search queries. Uses last.fm to pull image art as well as descriptions of artist
and albums.

![alt text](https://raw.githubusercontent.com/patrickjennings/plasma-web-server/master/plasma-web-server.png "Plasma Web Server")

## Install Dependencies
Run npm install:

```bash
    $ npm install
```

## Database Installation
Create plasma database with the following SQL:

```sql
    CREATE DATABASE plasma;
```
Create the schema.sql:

```bash
    $ psql -f schema.sql -d plasma
```
## Configuration
config.js contains the default configuration for the server. You may either change
the defaults or set environment variables to override the web server port, db
connection, and open file limit variables.

```javascript
    // The webserver port.
    port: process.env.PORT || 3000,

    // Parameters for database access.
    pg_port: process.env.PGPORT || 5432,
    pg_user: process.env.PGUSER || 'web-user',
    pg_pass: process.env.PGPASS || null,
    pg_host: process.env.PGHOST || 'localhost',
    pg_db:   process.env.PGDB   || 'plasma',

    // Number of files to parse at once.
    file_limit: process.env.FILELIMIT || 512
```

Example:

```bash
    $ PGPORT=5432 PGUSER=web-user PGHOST=localhost PGDB=plasma node plasma.js
```

## Consuming MP3s
Pass the webserver directories to consume the MP3 files within.

```bash
    $ node plasma.js ~/Media/ ~/Music/ ...
```

The directories only need be consumed once. Run the program without arguments to
start the server without consuming. You may pass the same directory to update your
song library.

## Browse Songs
Open your HTML5 compliant browser to [http://localhost:3000](http://localhost:3000).
