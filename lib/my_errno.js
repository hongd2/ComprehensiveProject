var errno = require('errno');
var create = errno.custom.createError;
var UserError = create('UserError');
var AppError = create('AppError');

function errmsg(err) {
    var str = 'Error: '
    // if it's a libuv error then get the description from errno 
    if (errno.errno[err.errno])
        str += errno.errno[err.errno].description
    else
        str += err.message

    // if it's a `fs` error then it'll have a 'path' property 
    if (err.path)
        str += ' [' + err.path + ']'

    return str;
}

module.exports = {
    errmsg : errmsg,
    AppError : AppError,
    UserError : UserError
}
