var path = require("path");
var should = require("should");
var http = require("http");
var common = require(path.resolve(__dirname + "/../common"));
var request = require('superagent');
var user1 = request.agent();
var crypto = require('crypto');

var newOccupyId;

// set new restaurant random information
before (function (done) {
    user1
        .post('http://localhost:' + common.port + '/signin')
        .send({ username: common.dinerUsername, password: common.dinerPassword })
        .end(function(err, res) {
            done();
            // user1 will manage its own cookies
            // res.redirects contains an Array of redirects
        });
});

after(function (done) {

    user1
        .get('http://localhost:' + common.port + '/signout')
        .end(function(err, res) {
            done();
            // user1 will manage its own cookies
            // res.redirects contains an Array of redirects
        });
});
