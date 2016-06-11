upload.tab.addEventListener('click', function(event){
    if(app.user.loggedIn) {
        app.panelSwitcher.show(upload.panel);
    }
    else {
        app.panelSwitcher.show(login.panel);
    }
});

upload.clearFiles.addEventListener('click', function(event) {
  for(item of upload.panel.children[2].children) {
    if(item.children[2].style.display == 'block') {
      item.style.display = 'none';
    }
  }
});
