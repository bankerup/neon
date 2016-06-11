// Copyright (c) 2016 bankerup.me
// The MIT License (MIT)
// Simple http client for testing Neon

var https = require('https');
var http = require('http');
var url = require('url');
var querystring = require('querystring');
var fs = require('fs');
var TinyBuffer = require('../tinybuffer.js');
var boundary = '----bankerup1991wjf84ug6mes';

// Method: (GET, or POST)
// HREF: ex http://localhost:8080
// Data: the parameters of the request
// Cookie: cookie string to send with the request

exports.request = function(method, href, data, cookie, callback) {
    var urlObject = url.parse(href);
    var body = '', options;
    options = {
        protocol: urlObject.protocol,
        hostname: urlObject.hostname,
        port: urlObject.port,
        path: urlObject.path,
        method: method,
        headers: {
          'cookie' : cookie
        }
    }
    if(method == 'POST') {
        body = formData(data, boundary);
        options.headers = {
            'Content-Type': 'multipart/form-data; boundary=' + boundary,
            'Content-Length': body.length,
            'cookie' : cookie
        }
    }
    else if(method == 'GET') {
        options.path += '?' + querystring.stringify(data);
    }
    var req = (options.protocol == 'http:' ? http : https).request(options, function(res){
        var body = new TinyBuffer.Buffer();
        res.on('data', function(chunk){
            body.append(chunk);
        })
        res.on('end', function(){
            var responseJSON = {};
            if(/json/.test(res.headers['content-type'])) {
                try {
                    responseJSON = JSON.parse(body.toString());
                }
                catch(err) {
                    responseJSON = {};
                }
            }
            callback({
                statusCode: res.statusCode,
                contentType: res.headers['content-type'],
                contentLength: res.headers['content-length'],
                cookie: (typeof res.headers['set-cookie'] == 'undefined') ? '' : res.headers['set-cookie'][0].substr(0, res.headers['set-cookie'][0].indexOf(';')),
                response: body.data,
                responseJSON: responseJSON
            });
        });
    });

    req.write(body);
    req.end();
}

var formData = function(data, boundary) {
    var crlf = '\r\n';
    var body = new TinyBuffer.Buffer();
    for(item in data) {
        body.append('--' + boundary + crlf);
        if(item == 'file') {
          body.append(`Content-Disposition: form-data; name="${item}"; filename="blob"` + crlf);
          body.append(`Content-Type: ${data[item].type}` + crlf + crlf);
          body.append(data[item].data).append(crlf);
        }
        else {
          body.append(`Content-Disposition: form-data; name="${item}"` + crlf + crlf);
          body.append(data[item]).append(crlf);
        }
    }
    body.append('--' + boundary + '--');
    return body.data;
}
