var path = require("path");
var should = require("should");
var http = require("http");
var common = require(path.resolve(__dirname + "/../common"));
var request = require('superagent');
var user1 = request.agent();
var crypto = require('crypto');

var newRestaurantProfile;

// set new restaurant random information
before (function (done) {
    user1
        .post('http://localhost:' + common.port + '/signin')
        .send({ username: common.ownerUsername, password: common.ownerPassword })
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

/*
 * If we signin successfully, it should redirect
 */
it('should add new restaurants to this manager list', function (done) {
    // this may take long because server needs to upload to imgur
    this.timeout(5000);

    newRestaurantProfile = common.generateRandomRestaurantProfile();
    user1
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

/*
 * Get a list of restaurant this manager manages
 * It should contain the last restaurant we added
 */
it('should get a list of restaurant this manager manages', function (done) {
    this.timeout(5000);
    user1
        .get('http://localhost:' + common.port + '/api/restaurantStatus')
        .end(function(err, res) {
            res.should.be.json;
            var return_struct = JSON.parse(res.text);
            return_struct.should.have.property('restaurants');
            should(return_struct.restaurants).be.a.Array();
            return_struct.restaurants.should.containDeep([{
                name: newRestaurantProfile.name,
                address: newRestaurantProfile.address,
                num_table: newRestaurantProfile.num_table
            }]);
            done();
        });
});
