var path = require("path");
var should = require("should");
var http = require("http");
var common = require(path.resolve(__dirname + "/../common"));
var request = require('superagent');
var user1 = request.agent();
var crypto = require('crypto');

// generate random hash as new user name
var randomHash = crypto.randomBytes(20).toString('hex');
var newUsername = "testUser" + randomHash;
var newPassword = randomHash;


// Ask server to signup new user
it('should sign up new user', function(done){
    user1
        .post('http://localhost:' + common.port + '/api/signup')
        .send({ username: newUsername, password: newPassword, passwordRepeat: newPassword })
        .end(function(err, res) {
            res.statusCode.should.be.equal(200);
            done();
        });
});

// If we signin successfully, it should return code 200 
it('should authenticate new user', function (done) {
    user1
        .post('http://localhost:' + common.port + '/api/signin')
        .send({ username: newUsername, password: newPassword })
        .end(function(err, res) {
            res.statusCode.should.be.equal(200);
            done();
        });
});

// If we signout successfully, it should redirect
it('should sign out a user', function(done) {
    user1
        .post('http://localhost:' + common.port + '/api/signout')
        .end(function(err, res) {
            res.statusCode.should.be.equal(200);
            done();
        });
});
