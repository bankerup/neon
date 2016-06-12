user.tab.addEventListener('click', function(event) {
    event.stopPropagation();
    if(app.user.loggedIn) {
        user.menu.setAttribute('style', 'display : block');
    }
    else {
        app.panelSwitcher.show(login.panel);
    }
});

logout.tab.addEventListener('click', function(event){
    app.doLogout();
    app.panelSwitcher.show(home.panel);
});


// Show/hide the menu
toggle.addEventListener('click', function(event){
    menu.style.display = (menu.style.display == 'block' ? '' : 'block');
});
