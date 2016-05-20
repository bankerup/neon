// Validate the email address
exports.validEmail = function(email) {
    var emailReg = /^[a-zA-Z0-9_]+([\.|\-]*[a-zA-Z0-9_]+)*@[a-zA-Z0-9_]+([\.|\-]*[a-zA-Z0-9_]+)*\.[a-zA-Z]{2,3}$/;
    return emailReg.test(email);
}

// Validate the user name
exports.validName = function(name) {
    var nameReg = /^[a-zA-Z]+([\ ]?[a-zA-Z]+)*$/;
    return nameReg.test(name);
}

// Validate the password
exports.validPassword = function(password) {
    return (password.length < 8) ? false : true;
}

// Validate the file name
exports.validFileName = function(fileName) {
    var fileNameReg = /[\/\?\%\*\:\"\>\<\|\\]+/;
    return !fileNameReg.test(fileName);
}

// Validate the size
exports.validFileSize = function(fileSize) {
    var sizeReg = /^[0-9]{1,}$/;
    return sizeReg.test(fileSize);
}

// Validate the mime type
exports.validFileType = function(fileType) {
    var type = ['application/x-troff-msvideo',
                'application/mac-binary',
                'application/macbinary',
                'application/octet-stream',
                'application/x-binary',
                'application/x-macbinary',
                'application/x-bzip',
                'application/x-bzip2',
                'application/x-pointplus',
                'application/msword',
                'application/octet-stream',
                'application/x-gzip',
                'application/x-javascript',
                'application/octet-stream',
                'application/x-shockwave-flash',
                'application/x-compressed',
                'application/x-zip-compressed',
                'application/zip',
                'image/bmp',
                'image/x-windows-bmp',
                'image/gif',
                'image/jpeg',
                'image/pjpeg',
                'image/jpeg',
                'image/pjpeg',
                'image/png',
                'text/x-asm',
                'text/asp',
                'text/plain',
                'text/x-c',
                'text/plain',
                'text/x-c',
                'text/css',
                'text/html',
                'text/html',
                'text/html',
                'video/avi',
                'video/msvideo',
                'video/x-msvideo',
                'video/quicktime',
                'video/mpeg',
                'video/x-mpeg',
                'video/x-mpeq2a',
                'video/mpeg',
                'video/x-mpeg',
                'video/mpeg',
                'video/mpeg',
                'audio/mpeg',
                'audio/x-mpeg',
                'audio/mpeg3',
                'audio/x-mpeg-3',
                'audio/mpeg',
                'audio/wav',
                'audio/x-wav',
                'multipart/x-gzip',
                'multipart/x-zip'];
    return (type.indexOf(fileType) == -1) ? false : true;
}

// Validate the object id
exports.validObjectID = function(objectID) {
    objectIDReg = /^[a-fA-F0-9]{24}$/;
    return objectIDReg.test(objectID);
}
