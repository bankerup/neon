// Application status
var app = {
  user: {
    loggedIn: false,
    id: '',
    name: '',
    bio: '',
    registrationDate: Date.now(),
    lastLoginDate: Date.now()
  },
  getFileOptions: {}
}

// Create new instance of panel switcher
app.panelSwitcher = new PanelSwitcher(home.panel);

// Create an instance of Request
app.request = new Request();

// Change the status to logged in
app.doLogin = function() {
    app.request.get('API/getUserInfo', {}, function(res){
        // User is not logged in
        if(!res.success) {
            console.log(res.error);
            return;
        }
        app.user.loggedIn = true;
        app.user.id = res.id;
        app.user.name = res.name;
        app.user.bio = res.bio;
        app.user.registrationDate = Date(res.registrationDate);
        app.user.lastLogin = Date(res.lastLogin);
        user.tab.children[0].style.backgroundImage = `url(/API/getUserAvatar?time=${Date.now()})`;
        myprofile.avatar.image.style.backgroundImage = `url(/API/getUserAvatar?time=${Date.now()})`
        myprofile.bio.content.value = app.user.bio;
    });
};

// Log the user out
app.doLogout = function() {
    app.request.get('API/userLogout', {}, function(res){
        if(!res.success) {
            console.log(res.error);
            return;
        }
        app.user.loggedIn = false;
        app.user.id = '';
        app.user.name = '';
        app.user.registrationDate = Date.now();
        app.user.lastLogin = Date.now();
        user.tab.children[0].style.backgroundImage = '';
        user.menu.style.display = 'none';
    });
}

// Get the files from server to display them
app.getFiles = function(options) {
    app.getFileOptions = options;
    app.request.get('API/getFiles', options, function(res){
        if(!res.success) {
            console.log(res.error);
            return;
        }
        home.panel.innerHTML = '';
        for(var i=0; i<res.numberOfFiles; i++) {
            home.panel.innerHTML +=`
                <div class="item">
                    <div class="item-header">
                        <p>${res.files[i].name.substr(0, 30)}</p>
                    </div>
                    <div class="item-content">
                        <div class="icon" style="background-image : url('API/getFileThumb?fileID=${res.files[i]._id}');"></div>
                    </div>
                    <div class="item-footer">
                        <a class="button" href="API/getTheFileContent?fileID=${res.files[i]._id}" target="_self">download</a>
                    </div>
                </div>`;
        }
        if(res.numberOfFiles != 0) home.panel.innerHTML +=
            `<div class="get-more-files">
                <button class="button" onclick="app.getMoreFiles()">load more</button>
            </div>`;
    });
}

// Get more files from server to display them
app.getMoreFiles = function() {
     app.getFileOptions.skip = app.getFileOptions.skip + 1;
     app.request.get('API/getFiles', app.getFileOptions, function(res){
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
             downloadAnchor.setAttribute('href', `API/getTheFileContent?fileID=${res.files[i]._id}`);
             downloadAnchor.setAttribute('target', '_self');
             downloadAnchor.appendChild(document.createTextNode('Download'));
             itemFooter.appendChild(downloadAnchor);
             item.appendChild(itemFooter);
             home.panel.insertBefore(item, home.panel.lastChild);
         }
         home.panel.removeChild(home.panel.lastChild);
         if(res.numberOfFiles != 0) home.panel.innerHTML +=
            `<div class='get-more-files'>
                <button class="button" onclick="app.getMoreFiles()">load more</button>
            </div>`;
     });
 }

// Get single file from the server and display it
app.getFile = function(event) {
    event.preventDefault();
    app.panelSwitcher.show(home.panel);
    var fileID = event.currentTarget.dataset.fileId;
    var fileName = event.currentTarget.dataset.fileName;
    home.panel.innerHTML =`
        <div class="item">
            <div class="item-header">
                <p>${fileName.substr(0, 30)}</p>
            </div>
            <div class="item-content">
                <div class="icon" style="background-image : url('API/getFileThumb?fileID=${fileID}');"></div>
            </div>
            <div class="item-footer">
                <a class="button" href="API/getTheFileContent?fileID=${fileID}" target="_self">download</a>
            </div>
        </div>`;
}

// Delete file
app.deleteFile = function(event) {
  var button = event.currentTarget;
  var fileID = button.dataset.fileId;
  app.request.post('API/deleteFile', {id: fileID}, function(res){
    if(!res.success){
      console.log(res.error);
      return;
    }
    button.disabled = true;
    button.style.borderColor = 'transparent';
    button.style.background = 'transparent';
    button.style.color =  'red';
    button.style.fontWeight = '400';
    button.style.cursor=  'default';
    button.innerHTML = 'deleted';
  });
}

// Format size in nice format
app.niceSize = function(size) {
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
