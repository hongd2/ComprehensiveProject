var path = require("path");
var should = require("should");
var common = require(path.resolve(__dirname + "/../common"));
var request = require('superagent');
var user1 = request.agent();
var math = require('mathjs');

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

// read current reponse
it('should let waiter read current watch response', function(done){
    user1
        .get('http://localhost:' + common.port + '/api/waiter/watchResponse')
        .end(function(err, res){
            // console.log(res.text);
            res.statusCode.should.be.equal(200);
            res.should.be.json;
            var return_struct = JSON.parse(res.text);
            should(return_struct).be.a.Object();
            return_struct.should.have.property("responses");
            should(return_struct.responses).be.a.Array();
            return_struct.responses.length.should.be.above(2);
            for (var i = 0; i < return_struct.responses.length; i++){
                should(return_struct.responses[i]).be.a.Object();
                return_struct.responses[i].should.have.property("message_type");
                should(return_struct.responses[i].message_type).be.a.Number();
                return_struct.responses[i].should.have.property("message");
                should(return_struct.responses[i].message).be.a.String();
                return_struct.responses[i].should.have.property("char_key");
                should(return_struct.responses[i].message).be.a.String();
            }
            done();
        });
});

// update current reponse
it('should let waiter update current watch response', function(done){
    user1
        .put('http://localhost:' + common.port + '/api/waiter/watchResponse/1')
        .send({
            message: "Random message " +  math.randomInt(10, 10000),
            char_key: common.generateRandomUppercaseCharacter()
        })
        .end(function(err, res){
            res.statusCode.should.be.equal(200);
            done();
        });
});
