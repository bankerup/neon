// Dependencies
var express = require('express');
var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);
var Busboy = require('busboy');
var validator = require('./validator.js');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var crypto = require('crypto');
var fs = require('fs');
var buffer = require('buffer');

// Neon application
var neon = express();

// Configurations
var config = JSON.parse(fs.readFileSync(__dirname + '/config.json', {encoding : 'utf8'}));

// Session
var store = new MongoDBStore({
    uri: config.sessionStore,
    collection: 'sessions'
});

neon.use(session({
    secret: config.sessionSecret,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        domain: config.domain
    },
    name: 'neonsid',
    store: store,
    resave: true,
    saveUninitialized: true
}));

// Client side
neon.use(express.static(__dirname + '/client'));

// Server API

// Add new user
neon.post('/API/addNewUser', (req, res) => {
    var name, email, password;
    // Parse the parameters
    var busboy = new Busboy({headers: req.headers});
    busboy.on('field', function(fieldName, val, fieldNameTruncated, valTruncated, encoding, mimetype){
        switch(fieldName) {
            case 'name': name = val; break;
            case 'email': email = val; break;
            case 'password': password = val;
        }
    });
    busboy.on('finish', function(){
        // Validate the name
        if(!validator.validName(name)){
            res.send(JSON.stringify({
                success: false,
                error: 'Invalid user name'
            }));
            return;
        }
        // Validate the email
        if(!validator.validEmail(email)){
            res.send(JSON.stringify({
                success: false,
                error: 'Invalid email address'
            }));
            return;
        }
        // Validate the password
        if(!validator.validPassword(password)){
            res.send(JSON.stringify({
                success: false,
                error: 'Invalid password'
            }));
            return;
        }
        MongoClient.connect(config.databaseURL, function(err, db){
            if((err != null) || (db == null)) {
                res.send(JSON.stringify({
                    success: false,
                    error: 'DB connection error'
                }));
                console.log(err);
            }
            else {
                // Check if the email address has been used before
                db.collection('users').findOne({email : email}, function(err, result){
                    if(err != null) {
                        res.send(JSON.stringify({
                            success: false,
                            error: 'Email address checking error'
                        }));
                    }
                    else {
                        // The email address has been used before
                        if(result != null) {
                            res.send(JSON.stringify({
                                success: false,
                                error: 'Please select another email address'
                            }));
                            db.close();
                        }
                        // The email address is new
                        else {
                            db.collection('users').insertOne({
                                name: name,
                                email: email,
                                password: crypto.createHash('sha256').update(password).digest('hex'),
                                registrationDate: Date.now(),
                                lastLoginDate: Date.now(),
                                status: 'pending'
                            }, function(err, result){
                                if(err != null) {
                                    res.send(JSON.stringify({
                                        success: false,
                                        error: 'Data storing error'
                                    }));
                                }
                                else {
                                    res.send(JSON.stringify({success: true}));
                                }
                                db.close();
                            });
                        }
                    }
                });
            }
        });
    });
    // Send the request to busboy for parsing it
    req.pipe(busboy);
});

// User login
neon.post('/API/userLogin', (req, res) => {
    var email, password;
    var busboy = new Busboy({headers : req.headers});
    busboy.on('field', function(fieldName, val, fieldNameTruncated, valTruncated, encoding, mimetype) {
        switch(fieldName) {
            case 'email': email = val; break;
            case 'password': password = val;
        }
    });
    busboy.on('finish', function(){
        if((typeof req.session.userID) != 'undefined') {
            res.send(JSON.stringify({
                success: false,
                error: 'Already logged in'
            }));
            return;
        }
        if(!validator.validEmail(email)) {
            res.send(JSON.stringify({
                success: false,
                error: 'Invalid email address'
            }));
            return;
        }
        if(!validator.validPassword(password)) {
            res.send(JSON.stringify({
                success: false,
                error: 'Invalid password'
            }));
            return;
        }
        MongoClient.connect(config.databaseURL, function(err, db){
            if((err != null) || (db == null)) {
                res.send(JSON.stringify({
                    success: false,
                    error: 'DB connection error'
                }));
            }
            else {
                db.collection('users').findOne({ $and: [{
                        email: {$eq: email},
                        password: {$eq: crypto.createHash('sha256').update(password).digest('hex')}
                    }]
                }, function(err, result){
                    if(err != null) {
                        res.send(JSON.stringify({
                            success: false,
                            error: 'Data retrieval error'
                        }));
                    }
                    else {
                        // Invalid email address and/or password
                        if(result === null) {
                            res.send(JSON.stringify({
                                success: false,
                                error: 'Invalid credentials'
                            }));
                        }
                        else {
                            req.session.userID = result._id;
                            req.session.status = result.status;
                            res.send(JSON.stringify({
                                success: true,
                                name: result.name
                            }));
                        }
                    }
                    db.close();
                });
            }
        });
    });
    req.pipe(busboy);
});

// User logout
neon.get('/API/userLogout', (req, res) => {
    store.destroy(req.sessionID, function(err){
        req.session.regenerate(function(err){
            res.send(JSON.stringify({
                success: true
            }));
        });
    });
});

// Infromation about the user
neon.get('/API/getUserInfo', (req, res) => {
    if((typeof req.session.userID) == 'undefined') {
        res.send(JSON.stringify({
            success: false,
            error: 'Not logged in'
        }));
    }
    else {
        MongoClient.connect(config.databaseURL, function(err, db){
            if((err != null) || (db == null)) {
                res.send(JSON.stringify({
                    success: false,
                    error: 'DB connection error'
                }))
            }
            else {
                db.collection('users').findOne({_id : {$eq : req.session.userID}}, function(err, result){
                    if((err != null) || (res == null)) {
                        res.send(JSON.stringify({
                            success: false,
                            error: 'Data retrieval error'
                        }));
                    }
                    else {
                        res.send(JSON.stringify({
                            success: true,
                            id: result._id.str,
                            name: result.name,
                            registrationDate: result.registrationDate,
                            lastLoginDate: result.lastLoginDate
                        }));
                    }
                    db.close();
                });
            }
        });
    }
});

// The user avatar
neon.get('/API/getUserAvatar', (req, res) => {
    var path = __dirname + '/avatar/default.png';
    fs.readFile(path, function(err, data){
        if(err != null) {
            var response = JSON.stringify({
                success: false,
                error: 'Data retrieval error'
            });
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Length', response.length);
            res.send(response);
        }
        else {
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Length', data.length);
            res.send(data);
        }
    });
})

// Add new file to the Database
neon.post('/API/addNewFile', (req, res) => {
    if((typeof req.session.userID) == 'undefined') {
        res.send(JSON.stringify({
            success: false,
            error: 'Not logged in'
        }));
    }
    else {
        var name, size, type;
        var busboy = new Busboy({headers : req.headers});
        busboy.on('field',function(fieldName, val, fieldNameTruncated, valTruncated, encoding, mimetype){
            switch (fieldName) {
                case 'name': name = val; break;
                case 'size': size = val; break;
                case 'type': type = val;
            }
        });
        busboy.on('finish', function(){
            if(!validator.validFileName(name)) {
                res.send(JSON.stringify({
                    success: false,
                    error: 'Invalid file name'
                }));
                return;
            }
            if(!validator.validFileSize(size)) {
                res.send(JSON.stringify({
                    success: false,
                    error: 'Invalid file size'
                }));
                return;
            }
            if(!validator.validFileType(type)) {
                res.send(JSON.stringify({
                    success: false,
                    error: 'Invalid file type'
                }));
                return;
            }
            MongoClient.connect(config.databaseURL, function(err, db) {
                if((err != null) || (db == null)) {
                    res.send(JSON.stringify({
                        success: false,
                        error: 'Database connection error'
                    }));
                }
                else {
                    db.collection('files').insertOne({
                        name: name,
                        size: size,
                        type: type,
                        owner: req.session.userID,
                        creationDate: Date.now(),
                        status: 'uploading'
                    }, function(err, result){
                        if((err != null) || (result == null)) {
                            res.send(JSON.stringify({
                                success: false,
                                error: 'Data insertion error'
                            }));
                        }
                        else {
                            var path = __dirname + '/filecenter/' + result.insertedId;
                            fs.open(path, 'w', function(err, fd) {
                                if((err != null) || ((typeof fd) == 'undefined')) {
                                    res.send(JSON.stringify({
                                        success: false,
                                        error: 'File creation error'
                                    }));
                                }
                                else {
                                    fs.ftruncate(fd, size, function(err) {
                                        if(err != null) {
                                            res.send(JSON.stringify({
                                                success: false,
                                                error: 'Unable to set the file size'
                                            }));
                                        }
                                        else {
                                            res.send(JSON.stringify({
                                                success: true,
                                                id: result.insertedId
                                            }));
                                        }
                                        fs.close(fd, function() {});
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
        req.pipe(busboy);
    }
});

// Append data to the file
neon.post('/API/appendData', (req, res) => {
    if((typeof req.session.userID) == 'undefined') {
        res.send(JSON.stringify({
            success: false,
            error: 'Not logged in'
        }));
    }
    else {
        var busboy = new Busboy({headers : req.headers});
        var tempPath = __dirname + '/temp/' + req.session.userID + '_' + Math.floor(Math.random()*100000);
        var tempFile = fs.createWriteStream(tempPath);
        var size, position, id;
        busboy.on('field', function(fieldName, val, fieldNameTruncated, valTruncated, encoding, mimetype) {
            switch (fieldName) {
                case 'size': size = val; break;
                case 'position': position = val; break;
                case 'id': id = val;
            }
        });
        busboy.on('file', function(fieldName, file, fileName, encoding, mimetype) {
            file.pipe(tempFile);
        });
        busboy.on('finish', function(){
            if(!validator.validInteger(size)) {
                res.send(JSON.stringify({
                    success: false,
                    error: 'Invalid size'
                }));
                return;
            }
            if(!validator.validInteger(position)) {
                res.send(JSON.stringify({
                    success: false,
                    error: 'Invalid position'
                }));
                return;
            }
            if(!validator.validObjectID(id)) {
                res.send(JSON.stringify({
                    success: false,
                    error: 'Invalid id'
                }));
                return;
            }
            MongoClient.connect(config.databaseURL, function(err, db){
                if((err != null) || (db == null)) {
                    res.send(JSON.stringify({
                        success: false,
                        error: 'DB connection error'
                    }));
                }
                else {
                    db.collection('files').findOne({_id : {$eq : new ObjectID(id)}}, function(err, result){
                        if((err != null) || (result == null)) {
                            res.send(JSON.stringify({
                                success: false,
                                error: 'Data retrieval error'
                            }));
                        }
                        else {
                            // All the file data were already sent
                            if(result.status != 'uploading') {
                                res.send(JSON.stringify({
                                    success: false,
                                    error: 'File is complete'
                                }));
                            }
                            // The user doesn't own this file
                            else if (result.owner != req.session.userID) {
                                res.send(JSON.stringify({
                                    success: false,
                                    error: 'Insufficient privileges'
                                }));
                            }
                            else {
                                fs.readFile(tempPath, function(err, data){
                                    if((err != null) || ((typeof data) == 'undefined')) {
                                        res.send(JSON.stringify({
                                            success: false,
                                            error: 'Error while reading from the temporary file'
                                        }));
                                    }
                                    else if(data.length != parseInt(size)) {
                                        res.send(JSON.stringify({
                                            success: false,
                                            error: 'Data length mismatch'
                                        }));
                                    }
                                    else {
                                        var path = __dirname + '/filecenter/' + id;
                                        fs.open(path, 'r+', function(err, fd){
                                            if((err != null) || ((typeof fd) == 'undefined')) {
                                                res.send(JSON.stringify({
                                                    success: false,
                                                    error: 'Error while trying to open the destination'
                                                }));
                                            }
                                            else {
                                                fs.write(fd, data, 0, data.length, position, function(err, written, buffer){
                                                    if(err != null) {
                                                        res.send(JSON.stringify({
                                                            success: false,
                                                            error: 'Error while writing the destination'
                                                        }));
                                                    }
                                                    else {
                                                        fs.close(fd, function(){
                                                            fs.unlink(tempPath);
                                                            res.send(JSON.stringify({
                                                                success: true
                                                            }));
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        }
                        db.close();
                    });
                }
            });
        });
        req.pipe(busboy);
    }
});

// Mark the file complete
neon.post('/API/closeFile', (req, res) => {
    if((typeof req.session.userID) == 'undefined') {
        res.send(JSON.stringify({
            success: false,
            error: 'Not logged in'
        }));
        return;
    }
    else {
        var busboy = new Busboy({headers : req.headers});
        var id;
        busboy.on('field', function(fieldName, val, fieldNameTruncated, valTruncated, encoding, mimetype){
            if(fieldName == 'id') {
                id = val;
            }
        });
        busboy.on('finish', function(){
            if(!validator.validObjectID(id)) {
                res.send(JSON.stringify({
                    success: false,
                    error: 'Invalid ID'
                }));
            }
            MongoClient.connect(config.databaseURL, function(err, db){
                db.collection('files').findOne({_id: {$eq : new ObjectID(id)}}, function(err, result) {
                    if((err != null) || (result == null)) {
                        res.send(JSON.stringify({
                            success: false,
                            error: 'Data retrieval error'
                        }));
                        db.close();
                    }
                    else {
                        if(result.owner != req.session.userID) {
                            res.send(JSON.stringify({
                                success: false,
                                error: 'You do not own this file'
                            }));
                            db.close();
                        }
                        else if(result.status != 'uploading'){
                            res.send(JSON.stringify({
                                success: false,
                                error: 'File was already marked complete'
                            }));
                            db.close();
                        }
                        else {
                            db.collection('files').updateOne({
                                _id: new ObjectID(id)
                            }, {
                                $set: {status: 'complete'}
                            }, function(err, result){
                                if((err != null) || (result == null)) {
                                    res.send(JSON.stringify({
                                        success: false,
                                        error: 'Error while updating the data'
                                    }));
                                }
                                else {
                                    res.send(JSON.stringify({
                                        success: true
                                    }));
                                }
                                db.close();
                            });
                        }
                    }
                });
            });
        });
        req.pipe(busboy);
    }
});

// Get files
neon.get('/API/getFiles', (req, res) => {
    var skip = 0;
    if((typeof req.query.skip) != 'undefined') {
        if(!validator.validInteger(skip)) {
            res.send(JSON.stringify({
                success: false,
                error: 'Skip must be an integer'
            }));
            return;
        }
        else {
            skip = req.query.skip;
        }
    }
    MongoClient.connect(config.databaseURL, function(err, db){
        if((err != null) || (db == null)) {
            res.send(JSON.stringify({
                success: false,
                error: 'DB connection error'
            }));
        }
        else {
            var callback = function(err, cursor){
                if((err != null) || (cursor == null)) {
                    res.send(JSON.stringify({
                        success: false,
                        error: 'Error while searching for files'
                    }));
                }
                else {
                    cursor.sort({creationDate : -1}).skip(skip * 10).limit(10).toArray(function(err, result){
                        if((err != null) || (result == null)) {
                            res.send(JSON.stringify({
                                success: false,
                                error: 'Error getting the files'
                            }));
                        }
                        else {
                            res.send(JSON.stringify({
                                success: true,
                                numberOfFiles: result.length,
                                files: result
                            }));
                        }
                        db.close();
                    });
                }
            }
            if((typeof req.query.fileName) != 'undefined') {
                if(!validator.validFileName(req.query.fileName)) {
                    res.send(JSON.stringify({
                        success: false,
                        error: 'Invalid file name'
                    }));
                    db.close();
                }
                else {
                    db.collection('files').find({name : {$regex : `.*${req.query.fileName}.*`, $options : 'i'}}, callback);
                }
            }
            else {
                db.collection('files').find(callback);
            }
        }
    });
});

// Get the thumb/icon for the file
neon.get('/API/getFileThumb', (req, res) => {
    if(((typeof req.query.fileID) =='undefined') || !validator.validObjectID(req.query.fileID)) {
        var path = __dirname + '/extension/0.png';
        fs.readFile(path, function(err, data){
            if(err != null) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({
                    success: false,
                    error: 'Error while reading the file'
                }));
            }
            else {
                res.setHeader('Content-Type', 'image/png');
                res.send(data);
            }
        });
    }
    else {
        MongoClient.connect(config.databaseURL, function(err, db){
            if((err != null) || (db == null)) {
                res.send(JSON.stringify({
                    success: false,
                    error: 'DB connection error'
                }));
            }
            else {
                db.collection('files').findOne({_id : {$eq : new ObjectID(req.query.fileID)}}, function(err, result){
                    if((err != null) || (result == null)) {
                        res.send(JSON.stringify({
                            success: false,
                            error: 'Data retrieval error'
                        }));
                        db.close();
                    }
                    else {
                        var type = ['application/x-compressed',
                                    'application/zip',
                                    'application/x-zip-compressed',
                                    'application/x-troff-msvideo',
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
                                    'application/javascript',
                                    'application/octet-stream',
                                    'application/x-shockwave-flash',
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
                        var icon = type.indexOf(result.type) + 1;
                        var path = __dirname + '/extension/' + icon + '.png';
                        fs.readFile(path, function(err, data){
                            if(err != null) {
                                res.setHeader('Content-Type', 'application/json');
                                res.send(JSON.stringify({
                                    success: false,
                                    error: 'Error while reading the file'
                                }));
                            }
                            else {
                                res.setHeader('Content-Type', 'image/png');
                                res.send(data);
                            }
                        });
                        db.close();
                    }
                });
            }
        });
    }
});

// Download the file
neon.get('/API/getTheFile', (req, res) => {
    if((typeof req.session.userID) == 'undefined') {
        res.send(JSON.stringify({
            success: false,
            error: 'You must be logged in'
        }));
    }
    else if(req.session.status != 'active') {
        res.send(JSON.stringify({
            success: false,
            error: 'Your account is not verified yet'
        }));
    }
    else if((typeof req.query.fileID) == 'undefined' || !validator.validObjectID(req.query.fileID)) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
            success: false,
            error: 'File ID is not provided or it is not valid'
        }));
    }
    else {
        MongoClient.connect(config.databaseURL, function(err, db){
            if(err != null) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({
                    success: false,
                    error: 'Database connection error'
                }));
            }
            db.collection('files').findOne({
                _id : {$eq : new ObjectID(req.query.fileID)}
            }, function(err, result){
                if(err != null) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({
                        success: false,
                        error: 'Result retrieval error'
                    }));
                }
                else if(result == null) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({
                        success: false,
                        error: 'File not found'
                    }));
                }
                else {
                    var path = __dirname + '/filecenter/' + req.query.fileID;
                    var file = fs.createReadStream(path, {buffer : 1024 * 1024});
                    res.setHeader('Content-Type', result.type);
                    res.setHeader('Content-Length', result.size);
                    res.setHeader('Content-Disposition', 'attachment; filename=' + result.name);
                    file.pipe(res);
                }
            });
        });
    }
});

// Start the server
neon.listen(8080, () => {
    console.log('Neon listening on port 8080');
});
