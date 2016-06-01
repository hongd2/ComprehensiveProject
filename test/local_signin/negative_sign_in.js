var path = require("path");
var should = require("should");
var common = require(path.resolve(__dirname + "/../common"));
var request = require('superagent');
var user1 = request.agent();

// Use wrong password to log in and see if we can get a proper error message back 
it('shouldn\'t sign in user with wrong username or password x 1', function(done){
    user1
        .post('http://localhost:' + common.port + '/api/signin')
        .send({ username: common.dinerUsername, password: common.dinerPassword + "123"})
        .end(function(err, res) {
            res.statusCode.should.be.equal(400);
            //console.log(res.text);
            res.should.be.json;
            var struct = JSON.parse(res.text);
            struct.should.have.property('message');
            struct.should.have.property('code');
            struct.code.should.be.a.Number();
            struct.message.should.be.a.String();
            done();
        });
});
