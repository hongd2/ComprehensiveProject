// set env variable DEBUG_FLAG
process.env.DEV_FLAG = 1;

function importTest(name, path) {
    describe(name, function () {
        require(path);
    });
}

var should = require("should");
var path = require("path");
var common = require(path.resolve(__dirname + "/common"));
var app = require(__dirname + "/../app.js");

describe("top:", function () {
    var runningApp;

    before (function (done) {
        runningApp = app.listen(common.port, function (err, result) {
            if (err) {
                done(err);
            } else {
                done();
            }
        });
    });

    after(function (done) {
        runningApp.close();
        done();
    });

    // check existence of app variable
    it('app should exist', function (done) {
        should.exist(app);
        done();
    });

    importTest("basic_functions:", path.resolve(__dirname, "basic_functions/app_working"));
    describe("local account:", function(){
        importTest("sign up, in and out with correct credentials:", path.resolve(__dirname, "local_signin/sign_in_up_out"));
        importTest("sign in and out with wrong credentials:", path.resolve(__dirname, "local_signin/negative_sign_in"));
     });
	// import tests for diner role
    describe("diner:", function(){
        importTest("diner get all restaurants:", path.resolve(__dirname, "diner/diner_test"));
    });

    // import tests for manager role
    describe("manager:", function(){
        importTest("manage restaurants:", path.resolve(__dirname, "manager/manage_restaurants"));
    });

    // import tests for waiter role
    describe("waiter:", function(){
        importTest("request ratings:", path.resolve(__dirname, "waiter/waiter_rating"));
        importTest("CRUD watchResponse:", path.resolve(__dirname, "waiter/watch_response"));
    });

    // import tests for diner role
    describe("diner:", function(){
        importTest("basic functions of diner:", path.resolve(__dirname, "diner/basic"));
    });

    // import tests for all flows 
    // flows test are for sequences that involves more than one entities
    describe("flows:", function(){
        importTest("waiter request work at restaurants:", path.resolve(__dirname, "flow/waiter_add_restaurant"));
        importTest("waiter start shift at restaurants:", path.resolve(__dirname, "waiter/start_shift"));
        importTest("diner request to occupy a table restaurants:", path.resolve(__dirname, "flow/diner_occupy_table"));
    });

});


