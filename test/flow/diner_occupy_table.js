var path = require("path");
var should = require("should");
var http = require("http");
var common = require(path.resolve(__dirname + "/../common"));
var request = require('superagent');
var user1 = request.agent();
var user2 = request.agent();
var crypto = require('crypto');

var newOccupyId;

// set new restaurant random information
before (function (done) {
    //log in for diner
    user1
        .post('http://localhost:' + common.port + '/api/signin')
        .send({ username: common.dinerUsername, password: common.dinerPassword })
        .end(function(err, res) {
            // log in waiter
            user2
                .post('http://localhost:' + common.port + '/api/signin')
                .send({ username: common.dinerUsername, password: common.dinerPassword })
                .end(function(err, res) {
                    done();
                });
        });
});

after(function (done) {
    //log in for diner
    user1
        .post('http://localhost:' + common.port + '/api/signout')
        .end(function(err, res) {
            //log in for waiter
            user2
                .post('http://localhost:' + common.port + '/api/signout')
                .end(function(err, res) {
                    done();
                });
        });
});

// occupy a table, for now request for occupation is granted automatically
it('should allow diner to request to occupy a table', function(done){
    user1
        .post('http://localhost:' + common.port + '/api/dinerRequestOccupyTable')
        .send({
            'restaurant_id': 1,
            'table_number': 3})
        .end(function(err, res){
            // console.log(res.text);
            res.statusCode.should.be.equal(200);
            res.should.be.json;
            var return_struct = JSON.parse(res.text);
            should(return_struct).be.a.Object();
            return_struct.should.have.property('request_id');
            should(return_struct.request_id).be.a.Number();
            newOccupyRequestId = return_struct.request_id;
            done();
        });
});

// occupy a table, for now request for occupation is granted automatically
it('should allow waiter to approve request to occupy a table', function(done){
    user1
        .post('http://localhost:' + common.port + '/api/waiterDecideOccupyRequest')
        .send({
            'request_id': newOccupyRequestId,
            'decision': 2})           // 2 for approve and 3 for reject
        .end(function(err, res){
            res.statusCode.should.be.equal(200);
            res.should.be.json;
            var return_struct = JSON.parse(res.text);
            should(return_struct).be.a.Object();
            // return_struct.should.have.property('request_id');
            // should(return_struct.request_id).be.a.Number();
            // newOccupyRequestId = return_struct.request_id;
            done();
        });
});


/*
// finish last occupation
it('should allow diner to end last occupation of a table', function(done){
    user1
        .post('http://localhost:' + common.port + '/api/dinerEndOccupyTable')
        .field('occupy_id', newOccupyId)
        .end(function(err, res){
            // console.log(res.text);
            res.statusCode.should.be.equal(200);
            res.should.be.json;
            done();
        });
});

// rate/review last occupation
it('should allow user to rate/review last occupy', function(done){
    user1
        .post('http://localhost:' + common.port + '/api/dinerRateReviewService')
        .field('occupy_id', newOccupyId)
        .field('rating', 3)
        .field('review', 'Good service')
        .field('type', 1)
        .end(function(err, res){
            res.statusCode.should.be.equal(200);
            res.should.be.json;
            done();
        });

});
*/
