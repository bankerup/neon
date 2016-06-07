var expect = require('chai').expect;
var httpclient = require('./httpclient.js');

describe('Neon', function(){
    var url = 'http://localhost:8080/';
    var cookie = '';
    var fileID = '';
    describe('API/addNewUser', function(){
        it('Should respond with JSON', function(done){
            httpclient.request('POST', url + 'API/addNewUser', {}, cookie, function(res){
                expect(res.contentType).to.match(/application\/json/);
                done();
            });
        });
        it('Should respond with "Parameters mismatch"', function(done){
            httpclient.request('POST', url + 'API/addNewUser', {}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Parameters mismatch');
                done();
            });
        });
        it('Should respond with "You must provide a name"', function(done){
            httpclient.request('POST', url + 'API/addNewUser', {dummy: '', email: '', password: ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('You must provide a name');
                done();
            });
        });
        it('Should respond with "You must provide an email"', function(done){
            httpclient.request('POST', url + 'API/addNewUser', {name: '', dummy: '', password: ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('You must provide an email');
                done();
            });
        });
        it('Should respond with "You must provide a password"', function(done){
            httpclient.request('POST', url + 'API/addNewUser', {name: '', email: '', dummy: ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('You must provide a password');
                done();
            });
        });
        it('Should respond with "Invalid user name"', function(done){
            httpclient.request('POST', url + 'API/addNewUser', {name: 'xy1', email: '', password: ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Invalid user name');
                done();
            });
        });
        it('Should respond with "Invalid email address"', function(done){
            httpclient.request('POST', url + 'API/addNewUser', {name: 'user', email: 'user@user.c', password: ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Invalid email address');
                done();
            });
        });
        it('Should respond with "Invalid password"', function(done){
            httpclient.request('POST', url + 'API/addNewUser', {name: 'user', email: 'user@user.com', password: '123'}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Invalid password');
                done();
            });
        });
        it('Success should be true', function(done){
            httpclient.request('POST', url + 'API/addNewUser', {name: 'user', email: 'user@user.com', password: '12345678'}, cookie, function(res){
                expect(res.responseJSON.success).to.equal(true);
                done();
            });
        });
        it('Should respond with "Please select another email address"', function(done){
            httpclient.request('POST', url + 'API/addNewUser', {name: 'user', email: 'user@user.com', password: '12345678'}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Please select another email address');
                done();
            });
        });
        it('Success should be true', function(done){
            httpclient.request('POST', url + 'API/addNewUser', {name: 'me', email: 'me@user.com', password: '12345678'}, '', function(res){
                expect(res.responseJSON.success).to.equal(true);
                done();
            });
        });
    });
    describe('API/userLogin', function(){
        it('Should respond with "Parameters mismatch"', function(done){
            httpclient.request('POST', url + 'API/userLogin', {}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Parameters mismatch');
                done();
            });
        });
        it('Should respond with "You must provide an email"', function(done){
            httpclient.request('POST', url + 'API/userLogin', {para1: '', para2: ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('You must provide an email');
                done();
            });
        });
        it('Should respond with "You must provide a password"', function(done){
            httpclient.request('POST', url + 'API/userLogin', {email : '', para2 : ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('You must provide a password');
                done();
            });
        });
        it('Should respond with "Invalid email address"', function(done){
            httpclient.request('POST', url + 'API/userLogin', {email : '', password : ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Invalid email address');
                done();
            });
        });
        it('Should respond with "Invalid password"', function(done){
            httpclient.request('POST', url + 'API/userLogin', {email : 'user@user.com', password : ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Invalid password');
                done();
            });
        });
        it('Should respond with "Invalid credentials"', function(done){
            httpclient.request('POST', url + 'API/userLogin', {email : 'user@user.com', password : '123456789'}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Invalid credentials');
                done();
            });
        });
        it('Success should be true', function(done){
            httpclient.request('POST', url + 'API/userLogin', {email : 'user@user.com', password : '12345678'}, cookie, function(res){
                expect(res.responseJSON.success).to.equal(true);
                cookie = res.cookie;
                done();
            });
        });
        it('Should respond with "Already logged in"', function(done){
            httpclient.request('POST', url + 'API/userLogin', {}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Already logged in');
                done();
            });
        });
    });
    describe('API/userLogout', function(){
        it('Success should be true', function(done){
            httpclient.request('GET', url + 'API/userLogout', {}, '', function(res){
                expect(res.responseJSON.success).to.equal(true);
                done();
            });
        });
    });
    describe('API/getUserInfo', function(){
        it('Should respond with "Not logged in"', function(done){
            httpclient.request('GET', url + 'API/getUserInfo', {}, '', function(res){
                expect(res.responseJSON.error).to.equal('Not logged in');
                done();
            });
        });
        it('Success should be true', function(done){
            httpclient.request('GET', url + 'API/getUserInfo', {}, cookie, function(res){
                expect(res.responseJSON.success).to.equal(true);
                done();
            });
        });
    });
    describe('API/getUserAvatar', function(){
        it('Should return user avatar', function(done){
            httpclient.request('GET', url + 'API/getUserAvatar', {}, '', function(res) {
                expect(res.contentType).to.match(/image/);
                done();
            });
        });
    });
    describe('API/addNewFile', function(){
        it('Should respond with "Not logged in"', function(done){
            httpclient.request('POST', url + 'API/addNewFile', {}, '', function(res){
                expect(res.responseJSON.error).to.equal('Not logged in');
                done();
            });
        });
        it('Should respond with "Parameters mismatch"', function(done){
            httpclient.request('POST', url + 'API/addNewFile', {}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Parameters mismatch');
                done();
            });
        });
        it('Should respond with "Missing file name"', function(done){
            httpclient.request('POST', url + 'API/addNewFile', {dummy: '', size: '', type: ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Missing file name');
                done();
            });
        });
        it('Should respond with "Missing file size"', function(done){
            httpclient.request('POST', url + 'API/addNewFile', {name: '', dummy: '', type: ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Missing file size');
                done();
            });
        });
        it('Should respond with "Missing file type"', function(done){
            httpclient.request('POST', url + 'API/addNewFile', {name: '', size: '', dummy: ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Missing file type');
                done();
            });
        });
        it('Should respond with "Invalid file name"', function(done){
            httpclient.request('POST', url + 'API/addNewFile', {name: '', size: '', type: ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Invalid file name');
                done();
            });
        });
        it('Should respond with "Invalid file size"', function(done){
            httpclient.request('POST', url + 'API/addNewFile', {name: 'file.bin', size: '', type: ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Invalid file size');
                done();
            });
        });
        it('Should respond with "Invalid file type"', function(done){
            httpclient.request('POST', url + 'API/addNewFile', {name: 'file.bin', size: '5000', type: ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Invalid file type');
                done();
            });
        });
        it('Success should be true', function(done){
            httpclient.request('POST', url + 'API/addNewFile', {name: 'file.txt', size: '30', type: 'text/plain'}, cookie, function(res){
                expect(res.responseJSON.success).to.equal(true);
                fileID = res.responseJSON.id;
                done();
            });
        });
    });
    describe('API/appendData', function(){
        it('Should respond with "Not logged in"', function(done){
            httpclient.request('POST', url + 'API/appendData', {}, '', function(res){
                expect(res.responseJSON.error).to.equal('Not logged in');
                done();
            });
        });
        it('Should respond with "Parameters mismatch"', function(done){
            httpclient.request('POST', url + 'API/appendData', {}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Parameters mismatch');
                done();
            });
        });
        it('Should respond with "Missing id"', function(done){
            httpclient.request('POST', url + 'API/appendData', {dummy: '', position: '', size: '', file: ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Missing id');
                done();
            });
        });
        it('Should respond with "Missing position"', function(done){
            httpclient.request('POST', url + 'API/appendData', {id: '', dummy: '', size: '', file: ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Missing position');
                done();
            });
        });
        it('Should respond with "Missing size"', function(done){
            httpclient.request('POST', url + 'API/appendData', {id: '', position: '', dummy: '', file: ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Missing size');
                done();
            });
        });
        it('Should respond with "Parameters mismatch"', function(done){
            httpclient.request('POST', url + 'API/appendData', {id: '', position: '', size: '', dummy: ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Parameters mismatch');
                done();
            });
        });
        it('Should respond with "Invalid id"', function(done){
            httpclient.request('POST', url + 'API/appendData', {id: '', position: '', size: '', file: ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Invalid id');
                done();
            });
        });
        it('Should respond with "Invalid size"', function(done){
            httpclient.request('POST', url + 'API/appendData', {id: fileID, size: '', position: '', file: ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Invalid size');
                done();
            });
        });
        it('Should respond with "Invalid position"', function(done){
            httpclient.request('POST', url + 'API/appendData', {id: fileID, size: '10', position: '', file: ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Invalid position');
                done();
            });
        });
        it('Should respond with "Data length mismatch"', function(done){
            httpclient.request('POST', url + 'API/appendData', {id: fileID, size: '10', position: '0', file: ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Data length mismatch');
                done();
            });
        });
        it('Success should be true', function(done){
            httpclient.request('POST', url + 'API/appendData', {id: fileID, size: '10', position: '0', file: 'my-x1-name'}, cookie, function(res){
                expect(res.responseJSON.success).to.equal(true);
                done();
            });
        });
        it('Success should be true', function(done){
            httpclient.request('POST', url + 'API/appendData', {id: fileID, size: '10', position: '20', file: 'muhammed..'}, cookie, function(res){
                expect(res.responseJSON.success).to.equal(true);
                done();
            });
        });
        it('Success should be true', function(done){
            httpclient.request('POST', url + 'API/appendData', {id: fileID, size: '10', position: '10', file: '-x2-is-x3-'}, cookie, function(res){
                expect(res.responseJSON.success).to.equal(true);
                done();
            });
        });
        it('Should respond with "Insufficient privileges"', function(done){
            httpclient.request('POST', url + 'API/userLogin', {email: 'me@user.com', password: '12345678'}, '', function(res){
                expect(res.responseJSON.success).to.equal(true);
                httpclient.request('POST', url + 'API/appendData', {id: fileID, size: '0', position: '0', file: ''}, res.cookie, function(res){
                    expect(res.responseJSON.error).to.equal('Insufficient privileges');
                    done();
                });
            });
        });
    });
    describe('API/closeFile', function(){
        it('Should respond with "Not logged in"', function(done){
            httpclient.request('POST', url + 'API/closeFile', {}, '', function(res){
                expect(res.responseJSON.error).to.equal('Not logged in');
                done();
            });
        });
        it('Should respond with "Parameters mismatch"', function(done){
            httpclient.request('POST', url + 'API/closeFile', {}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Parameters mismatch');
                done();
            });
        });
        it('Should respond with "Missing ID"', function(done){
            httpclient.request('POST', url + 'API/closeFile', {dummy: ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Missing ID');
                done();
            });
        });
        it('Should respond with "Invalid ID"', function(done){
            httpclient.request('POST', url + 'API/closeFile', {id: ''}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('Invalid ID');
                done();
            });
        });
        it('Should respond with "You do not own this file"', function(done){
            httpclient.request('POST', url + 'API/userLogin', {email: 'me@user.com', password: '12345678'}, '', function(res){
                expect(res.responseJSON.success).to.equal(true);
                httpclient.request('POST', url + 'API/closeFile', {id: fileID}, res.cookie, function(res){
                    expect(res.responseJSON.error).to.equal('You do not own this file');
                    done();
                });
            });
        });
        it('Success should be true', function(done){
            httpclient.request('POST', url + 'API/closeFile', {id: fileID}, cookie, function(res){
                expect(res.responseJSON.success).to.equal(true);
                done();
            });
        });
        it('Should respond with "File was already marked complete"', function(done){
            httpclient.request('POST', url + 'API/closeFile', {id: fileID}, cookie, function(res){
                expect(res.responseJSON.error).to.equal('File was already marked complete');
                done();
            });
        });
    });
    describe('API/getFiles', function(){
        it('Should respond with "Skip must be an integer"', function(done){
            httpclient.request('GET', url + 'API/getFiles', {skip: ''}, '', function(res){
                expect(res.responseJSON.error, 'Skip must be an integer');
                done();
            });
        });
        it('Should respond with "Invalid file name"', function(done){
            httpclient.request('GET', url + 'API/getFiles', {skip: '0', fileName: 'hd**'}, '', function(res){
                expect(res.responseJSON.error, 'Invalid file name');
                done();
            });
        });
        it('Success should be true', function(done){
            httpclient.request('GET', url + 'API/getFiles', {}, '', function(res){
                expect(res.responseJSON.success, true);
                done();
            });
        });
        it('Success should be true', function(done){
            httpclient.request('GET', url + 'API/getFiles', {skip: '1'}, '', function(res){
                expect(res.responseJSON.success, true);
                done();
            });
        });
        it('Success should be true', function(done){
            httpclient.request('GET', url + 'API/getFiles', {fileName: 'hd'}, '', function(res){
                expect(res.responseJSON.success, true);
                done();
            });
        });
    });
    describe('API/getFileThumb', function() {
        it('Should respond with an image', function(done){
            httpclient.request('GET', url + 'API/getFileThumb', {}, '', function(res) {
                expect(res.contentType).to.match(/image/);
                done();
            });
        });
    });
    describe('API/getTheFileContent', function() {
        it('Should respond with "File ID is not provided or it is not valid"', function(done) {
            httpclient.request('GET', url + 'API/getTheFileContent', {}, '', function(res){
                expect(res.responseJSON.error).to.equal('File ID is not provided or it is not valid');
                done();
            });
        });
        it('Should respond with a text file', function(done) {
            httpclient.request('GET', url + 'API/getTheFileContent', {fileID: fileID}, '', function(res){
                expect(res.contentType).to.match(/text/);
                done();
            });
        });
    });
});
