// Make AJAX request
function Request() {
    // Make a post request
    this.post = function(method, data, callback) {
        var connection = new XMLHttpRequest();
        var formData = new FormData();
        for(var key in data) {
            formData.append(key, data[key]);
        }
        connection.open('POST', `/${method}`);
        connection.send(formData);
        connection.onreadystatechange = function(event) {
            if(this.readyState == 4) {
                if(this.status == '200') {
                    var result = JSON.parse(this.response);
                    callback(result);
                }
                else {
                    var result = {
                        success: false,
                        error: 'Server error status:' + this.status
                    }
                    callback(result);
                }
            }
        }
        connection.ontimeout = function(event) {
            console.log('Connection timed out. Try again in 1 seconds');
            window.setTimeout(function(){
                connection.send(formData);
            }, 1000);
        }
    }

    // Make a get request
    this.get = function(method, data, callback) {
        var connection = new XMLHttpRequest();
        var uriData = '?';
        for(var key in data) {
            uriData += key + '=' + encodeURIComponent(data[key]) + '&';
        }
        // Remove the last &
        uriData = uriData.substr(0, uriData.length - 1);
        connection.open('GET', `/${method}${uriData}`);
        connection.send();
        connection.onreadystatechange = function(event) {
            if(this.readyState == 4) {
                if(this.status == '200') {
                    var result = JSON.parse(this.response);
                    callback(result);
                }
                else {
                    var result = {
                        success: false,
                        error: 'Server error status:' + this.status
                    }
                    callback(result);
                }
            }
        }
        connection.ontimeout = function(event) {
            console.log('Connection timed out. Try again in 1 seconds');
            window.setTimeout(function(){
                connection.send(formData);
            }, 1000);
        }
    }

    // Make a post request
    this.file = function(method, file, callback) {
        var connection = new XMLHttpRequest();
        var formData = new FormData();
        formData.append('file', file);
        connection.open('POST', `/${method}`);
        connection.send(formData);
        connection.onreadystatechange = function(event) {
            if(this.readyState == 4) {
                if(this.status == '200') {
                    var result = JSON.parse(this.response);
                    callback(result);
                }
                else {
                    var result = {
                        success: false,
                        error: 'Server error status:' + this.status
                    }
                    callback(result);
                }
            }
        }
        connection.ontimeout = function(event) {
            console.log('Connection timed out. Try again in 1 seconds');
            window.setTimeout(function(){
                connection.send(formData);
            }, 1000);
        }
    }
}
