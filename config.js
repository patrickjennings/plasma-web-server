"use strict";

module.exports = {
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
};
