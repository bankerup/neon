// Copyright (c) 2016 bankerup.me
// The MIT License (MIT)
// A simple validation module

// Validate the email address
exports.validEmail = function(email) {
    var emailReg = /^[a-zA-Z0-9_]+([\.|\-]?[a-zA-Z0-9_]+)*@[a-zA-Z0-9_]+([\.|\-]?[a-zA-Z0-9_]+)*\.[a-zA-Z]{2,3}$/;
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
    return !fileNameReg.test(fileName) && (fileName.length > 0);
}

// Validate the size
exports.validFileSize = function(fileSize) {
    var sizeReg = /^[0-9]{1,}$/;
    return sizeReg.test(fileSize);
}

// Validate the mime type
exports.validFileType = function(fileType) {
    var typeReg = /^[\w]+([\.|\-]?[\w]+)*\/[\w]+([\.|\-|\+]?[\w]+)*$/;
    return typeReg.test(fileType);
}

// Validate the object id
exports.validObjectID = function(objectID) {
    objectIDReg = /^[a-fA-F0-9]{24}$/;
    return objectIDReg.test(objectID);
}

exports.validInteger = function(number) {
    numberReg = /^[0-9]+$/;
    return numberReg.test(number);
}
