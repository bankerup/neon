// Copyright (c) 2016 bankerup.me
// License (MIT)
// Neon: File hosting and sharing script

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
var Tinybuffer = require('./tinybuffer.js');

// Neon application
var neon = express();
var neonDB;
var config;
var store;

// Load the configurations file
config = JSON.parse(fs.readFileSync(__dirname + '/config.json', {encoding : 'utf8'}));

// Session

store = new MongoDBStore({uri: config.sessionStore, collection: 'sessions'});
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

// connect to the db
MongoClient.connect(config.databaseURL, function(err, db){
    if((err != null) || db == null) {
        console.dir(err);
        process.exit();
    }

    neonDB = db;
    // Start the server
    neon.listen(config.port, () => {
        console.log('Neon listening on port ' + config.port);
    });
});

// Client side
neon.use(express.static(__dirname + '/client'));

// Parse post data
neon.use(function(req, res, next){
    if(req.method == 'POST') {
        req.post = [];
        req.noOfParameters = 0;
        req.file = new Tinybuffer.Buffer();
        req.noOfFiles = 0;
        req.mimetype = '';
        try {
            var busboy = new Busboy({
                headers: req.headers,
                limits: {
                    files: 1,
                    fileSize: 1024*1024
                }
            });
            busboy.on('field', function(fieldName, val, fieldNameTruncated, valTruncated, encoding, mimetype){
                req.post[fieldName] = val;
                req.noOfParameters++;
            });
            // Save incoming files
            busboy.on('file', function(fieldName, file, fileName, encoding, mimetype) {
                file.on('data', function(chunk){
                    req.file.append(chunk);
                });
                file.on('end', function(){
                    req.noOfFiles++;
                    req.mimetype = mimetype;
                });
            });
            busboy.on('finish', function(){
                next();
            });
            req.pipe(busboy);
        } catch(err) {
            next(err);
        }
    }
    else {
        next();
    }
});

// Server API

// Add new user
neon.post('/API/addNewUser', (req, res, next) => {
    // It should receive 3 parameters
    // name for username, password for password, and email for email address
    if(req.noOfParameters != 3) {
        return next(new Error('Parameters mismatch'));
    }
    // Check for the existance of the parameters
    if((typeof req.post['name']) == 'undefined') {
        return next(new Error('You must provide a name'));
    }
    if((typeof req.post['email']) == 'undefined') {
        return next(new Error('You must provide an email'));
    }
    if((typeof req.post['password']) == 'undefined') {
        return next(new Error('You must provide a password'));
    }
    // Validate the name
    if(!validator.validName(req.post['name'])){
        return next(new Error('Invalid user name'));
    }
    // Validate the email
    if(!validator.validEmail(req.post['email'])){
        return next(new Error('Invalid email address'));
    }
    // Validate the password
    if(!validator.validPassword(req.post['password'])){
        return next(new Error('Invalid password'));
    }
    // Check if the email address has been used before
    neonDB.collection('users').findOne({email : req.post['email']}, function(err, result){
        if(err != null) {
            return next(new Error('Email address checking error'));
        }
        // The email address has been used before
        if(result != null) {
            return next(new Error('Please select another email address'));
        }
        // The email address is new
        neonDB.collection('users').insertOne({
            name: req.post['name'],
            email: req.post['email'],
            password: crypto.createHash('sha256').update(req.post['password']).digest('hex'),
            registrationDate: Date.now(),
            lastLoginDate: Date.now(),
            status: 'pending'
        }, function(err, result){
            if(err != null) {
                return next(new Error('Data storing error'));
            }
            // The user was succussfuly added to the database
            res.json({success: true});
            next();
        });
    });
});

// User login
neon.post('/API/userLogin', (req, res, next) => {
    // User should not be logged in
    if((typeof req.session.userID) != 'undefined') {
        return next(new Error('Already logged in'));
    }
    // It should receive 2 parameters
    // password for password, and email for email address
    if(req.noOfParameters != 2) {
        return next(new Error('Parameters mismatch'));
    }
    // Check for the existance of the parameters
    if((typeof req.post['email']) == 'undefined') {
        return next(new Error('You must provide an email'));
    }
    if((typeof req.post['password']) == 'undefined') {
        return next(new Error('You must provide a password'));
    }
    // Validate the parameters
    if(!validator.validEmail(req.post['email'])) {
        return next(new Error('Invalid email address'));
    }
    if(!validator.validPassword(req.post['password'])) {
        return next(new Error('Invalid password'));
    }
    neonDB.collection('users').findOne({ $and: [{
        email: {$eq: req.post['email']},
        password: {$eq: crypto.createHash('sha256').update(req.post['password']).digest('hex')}}]
    }, function(err, result) {
        if(err != null) {
            return next(new Error('Data retrieval error'));
        }
        // Invalid email address and/or password
        if(result == null) {
            return next(new Error('Invalid credentials'));
        }
        // Successful login
        req.session.userID = result._id;
        res.json({
            success: true,
            name: result.name
        });
        next();
    });
});

// User logout
neon.get('/API/userLogout', (req, res, next) => {
    store.destroy(req.sessionID, function(err){
        if(err != null) {
            return next(new Error('An error occurred while destroying the session data'));
        }
        req.session.regenerate(function(err){
            if(err != null) {
                return next(new Error('An error occurred while regenerating the session data'));
            }
            res.json({
                success: true
            });
            next();
        });
    });
});

// Infromation about the user
neon.get('/API/getUserInfo', (req, res, next) => {
    if((typeof req.session.userID) == 'undefined') {
        return next(new Error('Not logged in'));
    }
    neonDB.collection('users').findOne({_id : {$eq : req.session.userID}}, function(err, result){
        if((err != null) || (result == null)) {
            return next(new Error('Data retrieval error'));
        }
        res.json({
            success: true,
            id: result._id.str,
            name: result.name,
            bio: ((typeof result.bio) == 'undefined')?'':result.bio,
            registrationDate: result.registrationDate,
            lastLoginDate: result.lastLoginDate
        });
        next();
    });
});

// The user avatar
neon.get('/API/getUserAvatar', (req, res, next) => {
  if((typeof req.session.userID) == 'undefined') {
    // Not logged in does not have a profile photo
    return next();
  }
  fs.access(__dirname + '/avatar/' + req.session.userID, fs.R_OK, function(err) {
    if(err != null) {
      // Does not have profile photo
      return next();
    }
    neonDB.collection('users').findOne({_id: {$eq: req.session.userID}},{avatar: 1},function(err, result) {
      if((err != null) || (result ==null)) {
        // Database error
        return next();
      }
      fs.readFile(__dirname + '/avatar/' + req.session.userID, function(err, data){
        if((err != null) || (data == null)) {
          // Error reading the file
          return next();
        }
        res.setHeader('Content-Type', result.avatar);
        res.setHeader('Content-Length', data.length);
        res.send(data);
      });
    });
  });
});

neon.get('/API/getUserAvatar', (req, res, next) => {
  var path = __dirname + '/avatar/default.png';
  fs.readFile(path, function(err, data){
    if(err != null) {
        return next(new Error('Data retrieval error'));
    }
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', data.length);
    res.send(data);
  });
});

// Add new file to the Database
neon.post('/API/addNewFile', (req, res, next) => {
    // See if the user is logged in
    if((typeof req.session.userID) == 'undefined') {
        return next(new Error('Not logged in'));
    }
    // It should receive 3 parameters
    // name for file name, size for file size, and type for file type
    if(req.noOfParameters != 3) {
        return next(new Error('Parameters mismatch'));
    }
    // Check for the existance of the parameters
    if((typeof req.post['name']) == 'undefined') {
        return next(new Error('Missing file name'));
    }
    if((typeof req.post['size']) == 'undefined') {
        return next(new Error('Missing file size'));
    }
    if((typeof req.post['type']) == 'undefined') {
        return next(new Error('Missing file type'));
    }
    // Validate user provided data
    if(!validator.validFileName(req.post['name'])) {
        return next(new Error('Invalid file name'));
    }
    if(!validator.validFileSize(req.post['size'])) {
        return next(new Error('Invalid file size'));
    }
    if(!validator.validFileType(req.post['type'])) {
        return next(new Error('Invalid file type'));
    }
    // Add the file to the database
    neonDB.collection('files').insertOne({
        name: req.post['name'],
        size: parseInt(req.post['size']),
        download: 0,
        type: req.post['type'],
        owner: req.session.userID,
        creationDate: Date.now(),
        status: 'uploading'
    }, function(err, result){
        if((err != null) || (result == null)) {
            return next(new Error('Data insertion error'));
        }
        // Create a file on the disk for storing the data
        var path = __dirname + '/filecenter/' + result.insertedId;
        fs.open(path, 'w', function(err, fd) {
            if((err != null) || ((typeof fd) == 'undefined')) {
                return next(new Error('File creation error'));
            }
            // Set the file size
            fs.ftruncate(fd, parseInt(req.post['size']), function(err) {
                if(err != null) {
                    return next(new Error('Unable to set the file size'));
                }
                // The file size was sat successfully
                res.json({
                    success: true,
                    id: result.insertedId
                });
                fs.close(fd, function() {});
                next();
            });
        });
    });
});

// Append data to the file
neon.post('/API/appendData', (req, res, next) => {
    // Check if the user is logged in
    if((typeof req.session.userID) == 'undefined') {
        return next(new Error('Not logged in'));
    }
    // It should receive 3 parameters and one file
    // id for file name, position for where to write the data, size for the size of the data
    // and file for the actual data
    if(req.noOfParameters != 3 || req.noOfFiles != 1) {
        return next(new Error('Parameters mismatch'));
    }
    // Check for the existance of the parameters
    if((typeof req.post['id']) == 'undefined') {
        return next(new Error('Missing id'));
    }
    if((typeof req.post['position']) == 'undefined') {
        return next(new Error('Missing position'));
    }
    if((typeof req.post['size']) == 'undefined') {
        return next(new Error('Missing size'));
    }
    // Validate the parameters
    if(!validator.validObjectID(req.post['id'])) {
        return next(new Error('Invalid id'));
    }
    if(!validator.validInteger(req.post['size'])) {
        return next(new Error('Invalid size'));
    }
    if(!validator.validInteger(req.post['position'])) {
        return next(new Error('Invalid position'));
    }
    // The length of data is different than the user provided length
    if(req.file.data.length != parseInt(req.post['size'])) {
        return next(new Error('Data length mismatch'));
    }
    neonDB.collection('files').findOne({_id : {$eq : new ObjectID(req.post['id'])}}, function(err, result){
        if((err != null) || (result == null)) {
            return next(new Error('Data retrieval error'));
        }
        // All the file data were already sent
        if(result.status != 'uploading') {
            return next(new Error('File is complete'));
        }
        // The user doesn't own this file
        if (result.owner.id != req.session.userID.id) {
            return next(new Error('Insufficient privileges'));
        }
        // Open the target file
        var path = __dirname + '/filecenter/' + req.post['id'];
        fs.open(path, 'r+', function(err, fd){
            if((err != null) || ((typeof fd) == 'undefined')) {
                // Close the file
                fs.close(fd, function(){});
                return next(new Error('Error while trying to open the destination'));
            }
            // Write the data to the target file
            fs.write(fd, req.file.data, 0, req.file.data.length, parseInt(req.post['position']), function(err, written, buffer){
                if(err != null) {
                    // Close the file
                    fs.close(fd, function(){});
                    return next(new Error('Error while writing the destination'));
                }
                // Close the file
                fs.close(fd, function(){});
                res.json({
                    success: true
                });
                next();
            });
        });
    });
});

// Mark the file complete
neon.post('/API/closeFile', (req, res, next) => {
    // Check if the user is logged in
    if((typeof req.session.userID) == 'undefined') {
        return next(new Error('Not logged in'));
    }
    // This method should get one parameter which is the file id
    if(req.noOfParameters != 1) {
        return next(new Error('Parameters mismatch'));
    }
    // Check the existance of parameters
    if((typeof req.post['id']) == 'undefined') {
        return next(new Error('Missing ID'));
    }
    // Validate the id
    if(!validator.validObjectID(req.post['id'])) {
        return next(new Error('Invalid ID'));
    }
    neonDB.collection('files').findOne({_id: {$eq : new ObjectID(req.post['id'])}}, function(err, result) {
        if((err != null) || (result == null)) {
            return next(new Error('Data retrieval error'));
        }
        // The user doesn't own the file [SECURITY]
        if(result.owner.id != req.session.userID.id) {
            return next(new Error('You do not own this file'));
        }
        // The file was already marked complete [SECURITY]
        if(result.status != 'uploading'){
            return next(new Error('File was already marked complete'));
        }
        neonDB.collection('files').updateOne({
            _id: new ObjectID(req.post['id'])
        }, {
            $set: {status: 'complete'}
        }, function(err, result){
            if((err != null) || (result == null)) {
                return next(new Error('Error while updating the data'));
            }
            res.json({
                success: true
            });
            next();
        });
    });
});

// Get files
neon.get('/API/getFiles', (req, res, next) => {
    var skip = 0;
    if((typeof req.query.skip) != 'undefined') {
        if(!validator.validInteger(req.query.skip)) {
            return next(new Error('Skip must be an integer'));
        }
        else {
            skip = req.query.skip;
        }
    }
    var callback = function(err, cursor){
        if((err != null) || (cursor == null)) {
            return next(new Error('Error while searching for files'));
        }
        cursor.sort({creationDate : -1}).skip(skip * 10).limit(10).toArray(function(err, result){
            if((err != null) || (result == null)) {
                return next(new Error('Error getting the files'));
            }
            res.json({
                success: true,
                numberOfFiles: result.length,
                files: result
            });
        });
    }
    // If the file name was presented we will seach for files mactching the provided name
    if((typeof req.query.fileName) != 'undefined') {
        if(!validator.validFileName(req.query.fileName)) {
            return next(new Error('Invalid file name'));
        }
        return neonDB.collection('files').find({name : {$regex : `.*${req.query.fileName}.*`, $options : 'i'}, status: "complete"}, callback);
    }
    // Search for all files
    neonDB.collection('files').find({status: "complete"}, callback);
});

// Get the thumb/icon for the file
neon.get('/API/getFileThumb', (req, res, next) => {
    if(((typeof req.query.fileID) =='undefined') || !validator.validObjectID(req.query.fileID)) {
        var path = __dirname + '/extension/0.png';
        fs.readFile(path, function(err, data){
            if(err != null) {
                return next(new Error('Error while reading the file'));
            }
            res.setHeader('Content-Type', 'image/png');
            res.send(data);
        });
        return;
    }
    neonDB.collection('files').findOne({_id : {$eq : new ObjectID(req.query.fileID)}}, function(err, result){
        if((err != null) || (result == null)) {
            return next(new Error('Data retrieval error'));
        }
        const type = ['application/x-compressed', 'application/zip', 'application/x-zip-compressed',
                    'application/x-troff-msvideo', 'application/mac-binary',
                    'application/macbinary', 'application/octet-stream', 'application/x-binary',
                    'application/x-macbinary', 'application/x-bzip', 'application/x-bzip2',
                    'application/x-pointplus', 'application/msword', 'application/octet-stream',
                    'application/x-gzip', 'application/javascript', 'application/octet-stream',
                    'application/x-shockwave-flash', 'image/bmp', 'image/x-windows-bmp',
                    'image/gif', 'image/jpeg', 'image/pjpeg', 'image/jpeg', 'image/pjpeg',
                    'image/png', 'text/x-asm', 'text/asp', 'text/plain', 'text/x-c',
                    'text/plain', 'text/x-c', 'text/css', 'text/html', 'text/html',
                    'text/html', 'video/avi', 'video/msvideo', 'video/x-msvideo',
                    'video/quicktime', 'video/mpeg', 'video/x-mpeg', 'video/x-mpeq2a',
                    'video/mpeg', 'video/x-mpeg', 'video/mpeg', 'video/mpeg', 'audio/mpeg',
                    'audio/x-mpeg', 'audio/mpeg3', 'audio/x-mpeg-3', 'audio/mpeg',
                    'audio/wav', 'audio/x-wav', 'multipart/x-gzip', 'multipart/x-zip'];
        var icon = type.indexOf(result.type) + 1;
        var path = __dirname + '/extension/' + icon + '.png';
        fs.readFile(path, function(err, data){
            if(err != null) {
                return next(new Error('Error while reading the file'));
            }
            res.setHeader('Content-Type', 'image/png');
            return res.send(data);
        });
    });
});

// Download the file
neon.get('/API/getTheFileContent', (req, res, next) => {
    // Check the user provided file id
    if((typeof req.query.fileID) == 'undefined' || !validator.validObjectID(req.query.fileID)) {
        return next(new Error('File ID is not provided or it is not valid'));
    }
    neonDB.collection('files').findOne({
        _id : {$eq : new ObjectID(req.query.fileID)}
    }, function(err, result){
        if(err != null) {
            return next(new Error('Result retrieval error'));
        }
        if(result == null) {
            return next(new Error('File not found'));
        }
        // Increment the download count for the files
        neonDB.collection('files').updateOne({_id : {$eq : new ObjectID(req.query.fileID)}}, {$inc: {download: 1}});
        var path = __dirname + '/filecenter/' + req.query.fileID;
        var file = fs.createReadStream(path, {buffer : 1024 * 1024});
        res.setHeader('Content-Type', result.type);
        res.setHeader('Content-Length', result.size);
        res.setHeader('Content-Disposition', 'attachment; filename*=UTF-8\'\'' + encodeURIComponent(result.name));
        file.pipe(res);
    });
});

// Update user avatar
neon.post('/API/updateAvatar', function(req, res, next){
  // The user must be logged in
  if((typeof req.session.userID) == 'undefined'){
    return next(new Error('Not logged in'));
  }
  // Should receive image file
  if(req.noOfFiles != 1) {
    return next(new Error('No image file was provided'));
  }
  // Should receive image file
  if(!validator.validImageType(req.mimetype)) {
    return next(new Error('Not an image'));
  }
  neonDB.collection('users').updateOne({
    _id: {$eq: req.session.userID}
  },
  {
    $set: {avatar: req.mimetype}
  },
  function(err, result){
    if((err != null || result == null)){
      return next(new Error('DB error'));
    }
    var dst = fs.createWriteStream(__dirname + '/avatar/' + req.session.userID);
    dst.write(req.file.data, function(err) {
      if(err != null){
        next(new Error('Error saving the image'));
      }
      res.json({
        success: true
      });
    });
  });
});

// Update user bio
neon.post('/API/updateBio', function(req, res, next){
  // The user must be logged in
  if((typeof req.session.userID) == 'undefined'){
    return next(new Error('Not logged in'));
  }
  // Should receive one parameter
  if(req.noOfParameters != 1) {
    return next(new Error('Parameters mismatch'));
  }
  // Check for the existance of the parameter
  if((typeof req.post['bio']) == 'undefined'){
    return next(new Error('Missing bio'));
  }
  // Validate the bio
  if(!validator.validBio(req.post['bio'])) {
    return next(new Error('The bio contains invalid characters'));
  }
  neonDB.collection('users').updateOne({
    _id: {$eq: req.session.userID}
  },
  {
    $set: {bio: req.post['bio']}
  },
  function(err, result){
    if((err != null || result == null)){
      return next(new Error('DB error'));
    }
    res.json({
      success: true
    });
  });
});

// Get user's files
neon.get('/API/myFiles', (req, res, next) => {
  // The user must be logged in
  if((typeof req.session.userID) == 'undefined'){
    return next(new Error('Not logged in'));
  }
  neonDB.collection('files').find({owner : req.session.userID, status: "complete"}, {status: 0, owner: 0}, function(err, cursor){
      if((err != null) || (cursor == null)) {
          return next(new Error('Error while searching for files'));
      }
      cursor.sort({creationDate : -1}).toArray(function(err, result){
          if((err != null) || (result == null)) {
              return next(new Error('Error getting the files'));
          }
          res.json({
              success: true,
              numberOfFiles: result.length,
              files: result
          });
      });
  });
});

// Delete file
neon.post('/API/deleteFile', (req, res, next) => {
    // Check if the user is logged in
    if((typeof req.session.userID) == 'undefined') {
        return next(new Error('Not logged in'));
    }
    // This method should get one parameter which is the file id
    if(req.noOfParameters != 1) {
        return next(new Error('Parameters mismatch'));
    }
    // Check the existance of parameters
    if((typeof req.post['id']) == 'undefined') {
        return next(new Error('Missing ID'));
    }
    // Validate the id
    if(!validator.validObjectID(req.post['id'])) {
        return next(new Error('Invalid ID'));
    }
    neonDB.collection('files').findOne({_id: {$eq : new ObjectID(req.post['id'])}}, function(err, result) {
        if((err != null) || (result == null)) {
            return next(new Error('Data retrieval error'));
        }
        // The user doesn't own the file [SECURITY]
        if(result.owner.id != req.session.userID.id) {
            return next(new Error('You do not own this file'));
        }
        neonDB.collection('files').updateOne({
            _id: new ObjectID(req.post['id'])
        }, {
            $set: {status: 'deleted'}
        }, function(err, result){
            if((err != null) || (result == null)) {
                return next(new Error('Error while updating the data'));
            }
            res.json({
                success: true
            });
            next();
        });
    });
});

// Error handler
// Error handler should be defined last
neon.use(function(err, req, res, next){
    res.json({
        success: false,
        error: err.message
    });
});
