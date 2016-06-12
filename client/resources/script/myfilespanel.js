myfiles.tab.addEventListener('click', function(event){
  app.panelSwitcher.show(myfiles.panel);
  app.request.get('API/myFiles', {}, function(res){
    if(!res.success){
      console.log(res.error);
      return;
    }
    var files = '';
    for(var i=0; i<res.numberOfFiles; i++) {
      var size = app.niceSize(res.files[i].size);
      files += `<div class="item">
                  <div class="name"><p>${res.files[i].name}</p></div>
                  <div class="delete"><button class="button" onclick="app.deleteFile(event)" data-file-id=${res.files[i]._id}>Delete</button></div>
                </div>`;
      var x = `<tr>
        <td class="name">${res.files[i].name}</td>
        <td class="size">${size}</td>
        <td class="type">${res.files[i].type}</td>
        <td class="delete"><button class="button" onclick="app.deleteFile(event)" data-file-id=${res.files[i]._id}>Delete</button></td>
      </tr>`
    }
    myfiles.panel.children[1].innerHTML = files;
  });
});
