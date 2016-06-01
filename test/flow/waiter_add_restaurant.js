var path = require("path");
var should = require("should");
var http = require("http");
var common = require(path.resolve(__dirname + "/../common"));
var request = require('superagent');
var user1 = request.agent();
var user2 = request.agent();
var crypto = require('crypto');
var math = require('mathjs');
var newRestaurantToRequestWorkAt = null;
var requestIdToApprove = null;

before (function (done) {
    //log in as manager
    user2
        .post('http://localhost:3333/signin')
        .send({ username: common.ownerUsername, password: common.ownerPassword })
        .end(function(err, res) {
            // log in as waiter
            user1
                .post('http://localhost:3333/signin')
                .send({ username: common.waiterUsername, password: common.waiterPassword })
                .end(function(err, res) {
                    done();
                    // user1 will manage its own cookies
                    // res.redirects contains an Array of redirects
                });
        });
});

after(function (done) {
    // log out as manager
    user2
        .get('http://localhost:3333/signout')
        .end(function(err, res) {
            // log out as waiter
            user1
                .get('http://localhost:3333/signout')
                .end(function(err, res) {
                    done();
                    // user1 will manage its own cookies
                    // res.redirects contains an Array of redirects
                });
        });

});

it('owner add one new sample restaurant', function(done){
    this.timeout(5000);

    // owner add one new restaurant
    newRestaurantProfile = common.generateRandomRestaurantProfile();
    user2
        .post('http://localhost:' + common.port + '/console/manager/addNewRestaurant')
        .field('restaurantName', newRestaurantProfile.name)
        .field('restaurantAddress', newRestaurantProfile.address)
        .field('restaurantNumTable', newRestaurantProfile.num_table)
        .field('restaurantPicture', 'sample_picture.png')
        .attach('restaurantPicture', path.resolve(__dirname + "/../res/sample_restaurant_image.png"))
        .end(function(err, res) {
            res.statusCode.should.be.equal(200);
            done();
            // user1 will manage its own cookies
            // res.redirects contains an Array of redirects
        });

});

it('list restaurants available to work', function(done){

            
    // waiter get a list of restaurant available to work
    user1
        .get('http://localhost:3333/api/getAvailableRestaurants')
        .end(function(err, res) {
            res.should.be.json;
            var return_struct = JSON.parse(res.text);
            return_struct.should.have.property("restaurants");
            should(return_struct.restaurants).be.a.Array();
            return_struct.restaurants.length.should.be.above(0);
            newRestaurantToRequestWorkAt = return_struct.restaurants[math.randomInt(return_struct.restaurants.length - 1)].restaurant_id;
            done();
        });
});

// need to revisit this because sometimes the waiter works at all restaurant in database already
it('ask manager to work at this restaurant', function(done){
    if (newRestaurantToRequestWorkAt !== null)
        // waiter ask manager to work at this restaurant
        user1
            .post('http://localhost:' + common.port + '/api/askToWorkAtRestaurant')
            .send({'restaurant_id': newRestaurantToRequestWorkAt})
            .end(function(err, res) {
                res.statusCode.should.be.equal(200);
                done();
            });
    else
        done();
});

it('manager see new request to work', function(done){
    user2
        .get('http://localhost:' + common.port + '/api/getPendingWorkRequest')
        .end(function(err, res){
            res.should.be.json;
            var return_struct = JSON.parse(res.text);
            return_struct.should.have.property("requests");
            should(return_struct.requests).be.a.Array();
            return_struct.requests.length.should.be.above(0);
            return_struct.requests.should.containDeep([{
                restaurant_id: newRestaurantToRequestWorkAt,
                waiter_username: common.waiterUsername 
            }]);

            // find the request id 
            var request_id = return_struct.requests.filter(function(request){
                return request.restaurant_id == newRestaurantToRequestWorkAt;
            })[0].request_id;
            requestIdToApprove = request_id;

            done();
        });
});

it('manager approve request to work', function(done){
    this.timeout(5000);
    user2
        .post('http://localhost:' + common.port + '/api/decidePendingWorkRequest')
        .send({
            request_id: requestIdToApprove,
            state: 2
        }).end(function(err, res){
            res.should.be.json;
            res.statusCode.should.be.equal(200);
            done();
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
            // using es6 notation here, quite advance
            var working_restaurant_id = return_struct.restaurants.map(
                s => s.restaurant_id);
            working_restaurant_id.should.containEql(newRestaurantToRequestWorkAt);
            done();
        });
});


// TO DO: manager reject request to work
