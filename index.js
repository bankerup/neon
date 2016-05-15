// Dependencies
var express = require('express');
var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);
var Busboy = require('busboy');
var validator = require('./validator.js');
var MongoClient = require('mongodb').MongoClient;
var crypto = require('crypto');
var fs = require('fs');

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
    var name, size, type;
    busboy.on('field',function(fieldName, val, fieldNameTruncated, valTruncated, encoding, mimetype){
        switch (fieldName) {
            case 'name': name = val; break;
            case 'size': size = val; break;
            case 'type': type = val;
        }
    });
});
// Start the server
neon.listen(8080, () => {
    console.log('Neon listening on port 8080');
});
