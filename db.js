var config = require('./config');

var knex = require('knex')({
    client: 'postgres',
    // Uncomment to enable SQL query logging in console.
    // debug   : true,
    connection: {
        host    : config.postgres.host,
        user    : config.postgres.user,
        password: config.postgres.password,
        database: 'davidwaiterlink',
        charset : 'utf8',
    }
});

var DB = require('bookshelf')(knex);

module.exports.DB = DB;
