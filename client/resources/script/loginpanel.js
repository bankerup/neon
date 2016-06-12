login.button.addEventListener('click', function(event){
    login.warning.style.display = 'none';
    login.button.value = 'Wait ...';
    login.button.disabled = true;
    app.request.post('API/userLogin', {
        email : login.email.value,
        password : login.password.value
    }, function(res){
        login.button.value = "Login";
        login.button.disabled = false;
        // Login failed. Show error message
        if(res.success != true) {
            login.warning.innerHTML = `<span class="message">${res.error}</span>`;
            login.warning.style.display = 'block';
        }
        else {
            login.email.value = login.password.value = '';
            app.doLogin();
            app.panelSwitcher.show(home.panel);
        }
    });
});
