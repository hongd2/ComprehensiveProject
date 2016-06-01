var path = require("path");
var should = require("should");
var common = require(path.resolve(__dirname + "/../common"));
var request = require('superagent');
var user1 = request.agent();

before (function (done) {
    // log in as waiter
    user1
        .post('http://localhost:' + common.port + '/signin')
        .send({ username: common.waiterUsername, password: common.waiterPassword })
        .end(function(err, res) {
            done();
        });
});

after(function (done) {
    // log out as waiter
    user1
        .get('http://localhost:3333/signout')
        .end(function(err, res) {
            done();
            // user1 will manage its own cookies
            // res.redirects contains an Array of redirects
        });
});

it('should show this waiter rating detail', function(done){
    user1
        .get('http://localhost:' + common.port + '/api/getRatingDetail')
        .end(function(err, res){
            // console.log(res.text);
            res.statusCode.should.be.equal(200);
            res.should.be.json;
            var return_struct = JSON.parse(res.text);
            return_struct.should.have.property("ratings");
            should(return_struct.ratings).be.a.Array();
            return_struct.ratings.length.should.be.above(0);
            done();
        });

});
