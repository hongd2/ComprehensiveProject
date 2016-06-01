var crypto = require('crypto');
var math = require('mathjs');

// port only use for debugging/test
var port = 3333;

// pre-defined accounts for different roles
var waiterUsername = "waiter1@gmail.com";
var waiterPassword = "waiter1";
var ownerUsername = "owner1@gmail.com";
var ownerPassword = "owner1";
var dinerUsername = "diner1@gmail.com";
var dinerPassword = "diner1";

// --------------------------------------------------
// Other supporting functions
// --------------------------------------------------
function generateRandomRestaurantProfile(){
    var randomHash = crypto.randomBytes(20).toString('hex');
    return {
        name: "newRestaurant" + randomHash,
        address: "address of restaurant at " + randomHash,
        num_table: math.randomInt(10, 50)
    };
}

function generateRandomUppercaseCharacter(){
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return possible.charAt(math.randomInt(0, possible.length - 1));
}


module.exports = {
    generateRandomRestaurantProfile : generateRandomRestaurantProfile,
    generateRandomUppercaseCharacter : generateRandomUppercaseCharacter,
    waiterUsername : waiterUsername,
    waiterPassword : waiterPassword,
    ownerUsername : ownerUsername,
    ownerPassword : ownerPassword,
	dinerUsername : dinerUsername,
	dinerPassword : dinerPassword,
    port          : port
};
