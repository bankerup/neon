window.addEventListener('click', function(event){
    // Hide the user menu
    if(app.user.loggedIn) {
        if(user.menu.style.display == 'block') {
            user.menu.style.display = 'none';
        }
    }
});
