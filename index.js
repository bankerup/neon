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

// Database URL
var url = 'mongodb://localhost:27017/neon';

// Domain
var domain = 'localhost';

// Session
var store = new MongoDBStore({
    uri: 'mongodb://localhost:27017/neon',
    collection: 'sessions'
});

neon.use(session({
    secret: 'neonze7lji$k&)j=!&bqwd%5gk&8t_xql^gqwdk(_7d20n9k$9@c)ufy8_4m4',
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7
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
        MongoClient.connect(url, function(err, db){
            // Check if the email address has been used before
            db.collection('users').findOne({email : email}, function(err, result){
                if(result != null) {
                    res.send(JSON.stringify({
                        success: false,
                        error: 'Please select another email address'
                    }));
                    return;
                }
                db.collection('users').insertOne({
                    name: name,
                    email: email,
                    password: crypto.createHash('sha256').update(password).digest('hex'),
                    registrationDate: Date.now(),
                    lastLoginDate: Date.now(),
                    status: 'pending'
                }, function(err, result){
                    res.send(JSON.stringify({success: true}));
                });
            });
        });
    });
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
        MongoClient.connect(url, function(err, db){
            db.collection('users').findOne({ $and: [{
                    email: {$eq: email},
                    password: {$eq: crypto.createHash('sha256').update(password).digest('hex')}
                }]
            }, function(err, result){
                req.session.userID = result._id;
                res.send(JSON.stringify({
                    success: true,
                    name: result.name
                }));
            });
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
        return;
    }
    MongoClient.connect(url, function(err, db){
        db.collection('users').findOne({_id : {$eq : req.session.userID}}, function(err, result){
            res.send(JSON.stringify({
                success: true,
                id: result._id.str,
                name: result.name,
                registrationDate: result.registrationDate,
                lastLoginDate: result.lastLoginDate
            }));
        });
    });
});

// The user avatar
neon.get('/API/getUserAvatar', (req, res) => {
    var path = __dirname + '/avatar/default.png';
    fs.readFile(path, function(err, data){
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', data.length);
        res.send(data);
    });
})

// Add new file to the Database
neon.post('/API/addNewFile', (req, res) => {
    if((typeof req.session.userID) == 'undefined') {
        res.send(JSON.stringify({
            success: false,
            error: 'Not logged in'
        }));
        return;
    }
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
        MongoClient.connect(url, function(err, db){
            db.collection('files').insertOne({
                name: name,
                size: size,
                type: type,
                owner: req.session.userID,
                creationDate: Date.now(),
                status: 'uploading'
            }, function(err, result){
                var path = __dirname + '/filecenter/' + result.insertedId;
                fs.open(path, 'w', function(err, fd){
                    fs.ftruncate(fd, size, function(err){
                        fs.close(fd, function(){
                            res.send(JSON.stringify({
                                success: true,
                                id: result.insertedId
                            }));
                        });
                    });
                });
            });
        });
    });
    req.pipe(busboy);
});

// Append data to the file
neon.post('/API/appendData', (req, res) => {
    if((typeof req.session.userID) == 'undefined') {
        res.send(JSON.stringify({
            success: false,
            error: 'Not logged in'
        }));
        return;
    }
    var busboy = new Busboy({headers : req.headers});
    var tempPath = __dirname + '/temp/' + req.session.userID + '_' + Math.floor(Math.random()*100000);
    var tempFile = fs.createWriteStream(tempPath);
    var size, position, id;
    busboy.on('field', function(fieldName, val, fieldNameTruncated, valTruncated, encoding, mimetype) {
        switch (fieldName) {
            case 'size': size = val; break;
            case 'position': position = parseInt(val); break;
            case 'id': id = val;
        }
    });
    busboy.on('file', function(fieldName, file, fileName, encoding, mimetype) {
        file.pipe(tempFile);
    });
    busboy.on('finish', function(){
        fs.readFile(tempPath, function(err, data){
            var path = __dirname + '/filecenter/' + id;
            fs.open(path, 'r+', function(err, fd){
                fs.write(fd, data, 0, data.length, position, function(err, written, buffer){
                    fs.close(fd, function(){
                        fs.unlink(tempPath);
                        res.send(JSON.stringify({
                            success: true
                        }));
                    });
                });
            });
        });
    });
    req.pipe(busboy);
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
    var busboy = new Busboy({headers : req.headers});
    var id;
    busboy.on('field', function(fieldName, val, fieldNameTruncated, valTruncated, encoding, mimetype){
        if(fieldName == 'id') {
            id = val;
        }
    });
    busboy.on('finish', function(){
        MongoClient.connect(url, function(err, db){
            db.collection('files').updateOne({
                _id: new ObjectID(id)
            }, {
                $set: {status: 'complete'}
            }, function(err, result){
                res.send(JSON.stringify({
                    success: true
                }));
            });
        });
    });
    req.pipe(busboy);
});

// Get files
neon.get('/API/getFiles', (req, res) => {
    var skip = 0;
    var fileName = '';
    if((typeof req.query.skip) != 'undefined') {
        skip = req.query.skip;
    }
    MongoClient.connect(url, function(err, db){
        var callback = function(err, cursor){
            cursor.sort({creationDate : -1}).skip(skip * 10).limit(10).toArray(function(err, result){
                res.send(JSON.stringify({
                    success: true,
                    numberOfFiles: result.length,
                    files: result
                }));
                db.close();
            });
        }
        if((typeof req.query.fileName) != 'undefined') {
            db.collection('files').find({name : {$regex : `.*${req.query.fileName}.*`, $options : 'i'}}, callback);
        }
        else if((typeof req.query.fileID) != 'undefined') {
            db.collection('files').find({_id : {$q : new ObjectID(req.query.fileID)}}, callback);
        }
        else {
            db.collection('files').find(callback);
        }
    });
});

// Get the thumb/icon for the file
neon.get('/API/getFileThumb', (req, res) => {
    if((typeof req.query.fileID) !='undefined' && validator.validObjectID(req.query.fileID)) {
        MongoClient.connect(url, function(err, db){
            db.collection('files').findOne({_id : {$eq : new ObjectID(req.query.fileID)}}, function(db, result){
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
                var icon = type.indexOf(result.type) + 1;
                var path = __dirname + '/extension/' + icon + '.png';
                var file = fs.createReadStream(path, {buffer : 1024 * 1024});
                res.setHeader('Content-Type', 'image/png');
                file.pipe(res);
            });
        });
        return;
    }
    res.setHeader('Content-Type', 'image/png');
    var path = __dirname + '/extension/0.png';
    fs.readFile(path, function(err, data){
        res.send(data);
    });
});

// Download the file
neon.get('/API/getTheFile', (req, res) => {
    if((typeof req.query.fileID) == 'undefined' || !validator.validObjectID(req.query.fileID)) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
            success: false,
            error: 'File ID is not provided or it is not valid'
        }));
    }
    else {
        MongoClient.connect(url, function(err, db){
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
