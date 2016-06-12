register.tab.addEventListener('click', function(event) {
    event.preventDefault();
    app.panelSwitcher.show(register.panel);
});

register.button.addEventListener('click', function(event){
    register.warning.style.display = 'none';
    register.button.value = 'Wait ...';
    register.button.disabled = true;
    app.request.post('API/addNewUser', {
        name : register.name.value,
        email : register.email.value,
        password : register.password.value
    }, function(res) {
        register.button.value = 'Register';
        register.button.disabled = false;
        // Registration failed. Show error message
        if(res.success != true) {
            register.warning.innerHTML = `<span class="message">${res.error}</span>`;
            register.warning.style.display = 'block';
        }
        // Registration succeed. Show login panel
        else {
            register.name.value = register.email.value = register.password.value = '';
            app.panelSwitcher.show(login.panel);
        }
    });
});
