var path = require('path');
var Q = require('q');
var fs = require('fs');
var AWS = require('aws-sdk');
AWS.config.update({ accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_S3_ACCESS_KEY });

function uploadImageToS3(imagePath, callback){
    var deferred = Q.defer();
    fs.readFile(imagePath, function (err, data) {
        if (err) { throw err; }

        var base64data = new Buffer(data, 'binary');
        var s3 = new AWS.S3();
            s3.putObject({
            Bucket: 'waiterlink',
            Key: path.basename(imagePath),
            Body: base64data,
            ACL: 'public-read'
        }, function (err, resp) {
            if (err) deferred.reject(err);
            deferred.resolve("https://s3-us-west-2.amazonaws.com/waiterlink/" + path.basename(imagePath));
        });
    });
    return deferred.promise.nodeify(callback);

}

// set up folder to accept image / file uploads from user
var multer = require('multer');
var upload = multer({
    dest: path.resolve(__dirname, "..", "public", "uploads"),
    limits: {fileSize: 1000000, files:1}
});
// app.use(upload.single('restaurantPicture'));
// app.use(upload.single('waiter_pic'));

module.exports = {
  uploadImageToS3: uploadImageToS3,
  uploadSetting: upload
}
