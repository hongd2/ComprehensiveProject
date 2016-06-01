var path = require("path");
var should = require("should");
var http = require("http");
var common = require(path.resolve(__dirname + "/../common"));
var request = require('superagent');
var user1 = request.agent();
var crypto = require('crypto');
var math = require('mathjs');
var restaurantToStartShift = null;
var workingShiftId = null;

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

it('waiter get list of restaurant he/she works at', function(done){
    user1
        .get('http://localhost:' + common.port + '/api/waiterGetListWorkRestaurant')
        .end(function(err, res){
            res.statusCode.should.be.equal(200);
            res.should.be.json;
            var return_struct = JSON.parse(res.text);
            return_struct.should.have.property("restaurants");
            should(return_struct.restaurants).be.a.Array();
            return_struct.restaurants.length.should.be.above(0);
            restaurantToStartShift = return_struct.restaurants[math.randomInt(return_struct.restaurants.length - 1)].restaurant_id;
            done();
        });
});

it('waiter register to work at a range of table', function(done){
    var tableArray = [1,2,3,4,5,11,12,13];

    user1
        .post('http://localhost:' + common.port + '/api/waiterStartShift')
        .send({
            'restaurant_id': restaurantToStartShift,
            'table_number': tableArray.join(',')})
        .end(function(err, res){
            res.statusCode.should.be.equal(200);
            res.should.be.json;
            var return_struct = JSON.parse(res.text);
            return_struct.should.have.property("shift_id");
            should(return_struct.shift_id).be.a.Number();
            done();
        });
});

it('waiter get list of open shifts', function(done){
    user1
        .get('http://localhost:' + common.port + '/api/waiterGetOpenShift')
        .end(function(err, res){
            res.statusCode.should.be.equal(200);
            res.should.be.json;
            var return_struct = JSON.parse(res.text);
            return_struct.should.have.property("shifts");
            should(return_struct.shifts).be.a.Array();
            return_struct.shifts.length.should.be.above(0);
            workingShiftId = return_struct.shifts[return_struct.shifts.length-1].shift_id;
            done();
        });
});


it('waiter update serving tables midshift', function(done){
    var tableArray = [6,7,8];

    if (workingShiftId != null)
        user1
            .post('http://localhost:' + common.port + '/api/waiterChangeServingTable')
            .send({
                'shift_id': workingShiftId,
                'table_number': tableArray.join(',')})
            .end(function(err, res){
                res.statusCode.should.be.equal(200);
                done();
            });
    else
        setTimeout(100, done);
});

it('waiter close shift', function(done){
    if (workingShiftId != null)
        user1
            .post('http://localhost:' + common.port + '/api/waiterCloseShift')
            .send({'shift_id': workingShiftId})
            .end(function(err, res){
                res.statusCode.should.be.equal(200);
                done();
            });
    else
        setTimeout(100, done);
});
