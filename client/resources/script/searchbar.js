// Get suggestions from the server when searching for a file
search.bar.addEventListener('input', function(event){
    var name = this.value;
    app.request.get('API/getFiles', {fileName : name}, function(res){
        if(!res.success) {
            console.log(res.error);
            return;
        }
        var output = '<ul>';
        for(var i=0; i<res.numberOfFiles; i++) {
            output += `<li><a href="" data-file-name="${res.files[i].name}" data-file-id="${res.files[i]._id}" onclick="app.getFile(event)">${res.files[i].name}</a></li>`;
        }
        search.suggestions.innerHTML = output + '</ul>';
        search.suggestions.style.display = 'block';
    });
});

// Hide the suggestions if the search bar got unfocused
search.bar.addEventListener('blur', function(event){
    this.value = '';
    setTimeout(function(){search.suggestions.style.display = 'none';}, 100);
});

// Get the files from the server and display them
search.bar.addEventListener('keyup', function(event){
    if(event.keyCode != 13) {
        return;
    }
    var fileName = this.value;
    this.blur();
    app.getFiles({skip : 0, fileName: fileName});
    app.panelSwitcher.show(home.panel);
});
