var path = require("path");
var should = require("should");
var http = require("http");
var common = require(path.resolve(__dirname + "/../common"));
var request = require('superagent');
var user1 = request.agent();

it('should be listening at localhost:3333', function (done) {

    user1
        .get('http://localhost:' + common.port)
        .end(function(err, res) {
            res.statusCode.should.be.equal(200);
            done();
        });
});
