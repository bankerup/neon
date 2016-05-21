// Get the elements
var getElement = function(element) {
    return document.getElementById(element)
}

// They key elements
var toggle = getElement('toggle');
var searchBar = getElement('search-bar');
var suggestions = getElement('suggestions');
var menu = getElement('menu');
var homeTab = getElement('home-tab');
var aboutTab = getElement('about-tab');
var uploadTab = getElement('upload-tab');
var userMenu = getElement('user-menu');
var userTab = getElement('user-tab');
var logoutTab = getElement('logout-tab');
var homeWindow = getElement('home-window');
var aboutWindow = getElement('about-window');
var loginWindow = getElement('login-window');
var loginEmail = getElement('login-email');
var loginPassword = getElement('login-password');
var loginButton = getElement('login-button');
var loginWarning = getElement('login-warning');
var registerWindow = getElement('register-window');
var registerName = getElement('register-name');
var registerEmail = getElement('register-email');
var registerPassword = getElement('register-password');
var registerButton = getElement('register-button');
var registerWarning = getElement('register-warning');
var registerTab = getElement('register-tab');
var uploadWindow = getElement('upload-window');

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
            if((this.readyState == 4) && (this.status == '200')) {
                var result = JSON.parse(this.response);
                callback(result);
            }
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
            if((this.readyState == 4) && (this.status == '200')) {
                var result = JSON.parse(this.response);
                callback(result);
            }
        }
    }
}

// Create an instance of Request
var request = new Request();

// Application status
var userLoggedin = false;
var userID = '';
var userName = '';
var userRegistrationDate = Date.now();
var userLastLogin = Date.now();
var getFileOptions = {};

//Switch from one window to another
var WindowsSwitcher = function(currentWindow) {
    this.currentWindow = currentWindow;
    this.show = function(whichWindow) {
        this.currentWindow.setAttribute('style', 'display : none');
        this.currentWindow = whichWindow;
        this.currentWindow.setAttribute('style', 'display : block');
        window.scroll(0, 0);
    }
}

var windowsSwitcher = new WindowsSwitcher(homeWindow);

homeTab.addEventListener('click', function(event){
    event.preventDefault();
    getFiles({skip : 0});
    windowsSwitcher.show(homeWindow);
});

aboutTab.addEventListener('click', function(event) {
    event.preventDefault();
    windowsSwitcher.show(aboutWindow);
});

userTab.addEventListener('click', function(event) {
    event.stopPropagation();
    if(userLoggedin) {
        userMenu.setAttribute('style', 'display : block');
        return;
    }
    windowsSwitcher.show(loginWindow);
});

registerTab.addEventListener('click', function(event) {
    event.preventDefault();
    windowsSwitcher.show(registerWindow);
});

uploadTab.addEventListener('click', function(event){
    event.preventDefault();
    if(!userLoggedin) {
        windowsSwitcher.show(loginWindow);
        return;
    }
    windowsSwitcher.show(uploadWindow);
});

logoutTab.addEventListener('click', function(event){
    event.preventDefault();
    doLogout();
});

registerButton.addEventListener('click', function(event){
    registerWarning.style.display = 'none';
    registerButton.value = 'Wait ...';
    registerButton.disabled = true;
    request.post('API/addNewUser', {
        name : registerName.value,
        email : registerEmail.value,
        password : registerPassword.value
    }, function(res) {
        registerButton.value = 'Register';
        registerButton.disabled = false;
        // Registration failed. Show error message
        if(res.success != true) {
            registerWarning.innerHTML = `<span class="message">${res.error}</span>`;
            registerWarning.style.display = 'block';
        }
        // Registration succeed. Show login window
        else {
            registerName.value = registerEmail.value = registerPassword.value = '';
            windowsSwitcher.show(loginWindow);
        }
    });
});

loginButton.addEventListener('click', function(event){
    loginWarning.style.display = 'none';
    loginButton.value = 'Wait ...';
    loginButton.disabled = true;
    request.post('API/userLogin', {
        email : loginEmail.value,
        password : loginPassword.value
    }, function(res){
        loginButton.value = "Login";
        loginButton.disabled = false;
        // Login failed. Show error message
        if(res.success != true) {
            loginWarning.innerHTML = `<span class="message">${res.error}</span>`;
            loginWarning.style.display = 'block';
        }
        else {
            loginEmail.value = loginPassword.value = '';
            doLogin();
            windowsSwitcher.show(homeWindow);
        }
    });
});

window.addEventListener('click', function(event){
    // Hide the user menu
    if(userLoggedin) {
        if(userMenu.style.display == 'block') {
            userMenu.style.display = 'none';
        }
    }
});

// Change the status to logged in
function doLogin() {
    request.get('API/getUserInfo', {}, function(res){
        // User is not logged in
        if(!res.success) {
            console.log(res.error);
            return;
        }
        userLoggedin = true;
        userID = res.id;
        userName = res.name;
        userRegistrationDate = Date(res.registrationDate);
        userLastLogin = Date(res.lastLogin);
        userTab.children[0].style.backgroundImage = `url(/API/getUserAvatar?time=${Date.now()})`;
    });
};

// Log the user out
function doLogout() {
    request.get('API/userLogout', {}, function(res){
        userLoggedin = false;
        userID = '';
        userName = '';
        userRegistrationDate = Date.now();
        userLastLogin = Date.now();
        userTab.children[0].style.backgroundImage = '';
        userMenu.style.display = 'none';
    });
}

// Get the files from server to display them
function getFiles(options) {
    getFileOptions = options;
    request.get('API/getFiles', options, function(res){
        if(!res.success) {
            console.log(res.error);
            return;
        }
        homeWindow.innerHTML = '';
        for(var i=0; i<res.numberOfFiles; i++) {
            homeWindow.innerHTML +=`
                <div class="item">
                    <div class="item-header">
                        <p>${res.files[i].name.substr(0, 30)}</p>
                    </div>
                    <div class="item-content">
                        <div class="icon" style="background-image : url('API/getFileThumb?fileID=${res.files[i]._id}');"></div>
                    </div>
                    <div class="item-footer">
                        <a class="button" href="API/getTheFile?fileID=${res.files[i]._id}" target="_self">download</a>
                    </div>
                </div>`;
        }
        if(res.numberOfFiles != 0) homeWindow.innerHTML +=
            `<div class="get-more-files">
                <input type="button" class="button" value="load more" onclick="getMoreFiles()">
            </div>`;
    });
}

// Get more files from server to display them
 function getMoreFiles() {
     getFileOptions.skip = getFileOptions.skip + 1;
     request.get('API/getFiles', getFileOptions, function(res){
         if(!res.success) {
             console.log(res.error);
             return;
         }
         for(var i=0; i<res.numberOfFiles; i++) {
             var item = document.createElement('div');
             item.setAttribute('class', 'item');
             item.setAttribute('data-file-id', res.files[i].id);
             var itemHeader = document.createElement('div');
             itemHeader.setAttribute('class', 'item-header');
             var title = document.createElement('p');
             title.appendChild(document.createTextNode(res.files[i].name.substr(0, 30)));
             itemHeader.appendChild(title);
             item.appendChild(itemHeader);
             var itemContent = document.createElement('div');
             itemContent.setAttribute('class', 'item-content');
             var icon = document.createElement('div');
             icon.setAttribute('class', 'icon');
             icon.style.backgroundImage = `url('API/getFileThumb?fileID=${res.files[i]._id}')`;
             itemContent.appendChild(icon);
             item.appendChild(itemContent);
             var itemFooter = document.createElement('div');
             itemFooter.setAttribute('class', 'item-footer');
             var downloadAnchor = document.createElement("a");
             downloadAnchor.setAttribute('class', 'button');
             downloadAnchor.setAttribute('href', `API/getTheFile?fileID=${res.files[i]._id}`);
             downloadAnchor.setAttribute('target', '_self');
             downloadAnchor.appendChild(document.createTextNode('Download'));
             itemFooter.appendChild(downloadAnchor);
             item.appendChild(itemFooter);
             homeWindow.insertBefore(item, homeWindow.lastChild);
         }
         homeWindow.removeChild(homeWindow.lastChild);
         if(res.numberOfFiles != 0) homeWindow.innerHTML +=
            `<div class='get-more-files'>
                <input type="button" class="button" value="load more" onclick="getMoreFiles()">
            </div>`;
     });
 }

// Get suggestions from the server when searching for a file
searchBar.addEventListener('input', function(event){
    var name = this.value;
    request.get('API/getFiles', {fileName : name}, function(res){
        if(!res.success) {
            console.log(res.error);
            return;
        }
        var output = '<ul>';
        for(var i=0; i<res.numberOfFiles; i++) {
            output += `<li><a href="" data-file-name="${res.files[i].name}" data-file-id="${res.files[i]._id}" onclick="getFile(event)">${res.files[i].name}</a></li>`;
        }
        suggestions.innerHTML = output + '</ul>';
        suggestions.style.display = 'block';
    });
});

// Hide the suggestions if the search bar got unfocused
searchBar.addEventListener('blur', function(event){
    this.value = '';
    setTimeout(function(){suggestions.style.display = 'none';}, 100);
});

// Get the files from the server and display them
searchBar.addEventListener('keyup', function(event){
    if(event.keyCode != 13) {
        return;
    }
    var fileName = this.value;
    this.blur();
    getFiles({skip : 0, fileName: fileName});
});

// Get single file from the server and display it
function getFile(event) {
    event.preventDefault();
    var fileID = event.currentTarget.dataset.fileId;
    var fileName = event.currentTarget.dataset.fileName;
    homeWindow.innerHTML =`
        <div class="item">
            <div class="item-header">
                <p>${fileName.substr(0, 30)}</p>
            </div>
            <div class="item-content">
                <div class="icon" style="background-image : url('API/getFileThumb?fileID=${fileID}');"></div>
            </div>
            <div class="item-footer">
                <a class="button" href="API/getTheFile?fileID=${fileID}" target="_self">download</a>
            </div>
        </div>`;
}

// Show/hide the menu
toggle.addEventListener('click', function(event){
    menu.style.display = (menu.style.display == 'block' ? '' : 'block');
});

// Format size in nice format
function niceSize(size) {
    var i = 0;
    var unit = ['B', 'KB', 'MB', 'GB'];
    while(size >= 1024) {
        size = Math.floor(size/1024);
        i++;
    }
    if(i > unit.length) { // the file is too big
        return 'TB+';
    }
    return size + ' ' + unit[i];
}

// Show the home page
homeTab.click();

// Try to login
doLogin();
