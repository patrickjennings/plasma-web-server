# plasma-web-server
A MP3 web server using Node.js and Postgresql

![alt text](https://raw.githubusercontent.com/patrickjennings/plasma-web-server/master/plasma-web-server.png "Plasma Web Server")

## Install Dependencies
Run npm install:

```bash
    $ npm install
```

## Database Installation
Create audio database with the following SQL:

```sql
    CREATE DATABASE audio;
```
Run schema.sql:

```bash
    $ psql -f schema.sql -d audio
```
Update index.js to set your postgresql connection configuration

```javascript
    var connection_string = 'postgres://web-user@localhost:5432/audio';
```

## Consuming MP3s
Pass the webserver directories to consume the MP3 files within.

```bash
    $ node index.js ~/Media/ ~/Music/ ...
```

The directories only need be consumed once. Run the program without arguments to start the server without consuming.

## Browse Songs
Open your HTML5 compliant browser to [http://localhost:3000](http://localhost:3000).
