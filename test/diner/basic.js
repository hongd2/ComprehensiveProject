var path = require("path");
var should = require("should");
var http = require("http");
var common = require(path.resolve(__dirname + "/../common"));
var request = require('superagent');
var user1 = request.agent();
var crypto = require('crypto');

// set new restaurant random information
before (function (done) {
    user1
        .post('http://localhost:' + common.port + '/signin')
        .send({ username: common.dinerUsername, password: common.dinerPassword })
        .end(function(err, res) {
            done();
        });
});

after(function (done) {

    user1
        .get('http://localhost:' + common.port + '/signout')
        .end(function(err, res) {
            done();
        });
});

it('should retrieve restaurant information based on id', function (done) {
    user1
        .get('http://localhost:' + common.port + '/api/getRestaurantInfoById')
        .query({ restaurant_id: 1 })
        .end(function(err, res) {
            // this should match the sample data we insert from script psql_scripts/sample_data.sql
            res.statusCode.should.be.equal(200);
            res.should.be.json;
            var return_struct = JSON.parse(res.text);
            should(return_struct).be.a.Object();
            return_struct.should.have.property('name');
            return_struct.should.have.property('address');
            return_struct.should.have.property('picture');
            return_struct.should.have.property('num_table');
            return_struct.num_table.should.be.above(0);
            return_struct.name.should.match('BJs Restaurant and Brewhouse');
            done();
        });
});
