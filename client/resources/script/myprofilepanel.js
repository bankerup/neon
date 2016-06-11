myprofile.tab.addEventListener('click', function(event){
    app.panelSwitcher.show(myprofile.panel);
});

myprofile.avatar.change.addEventListener('change', function(event) {
  app.request.file('API/updateAvatar', this.files[0], function(res){
    if(!res.success){
      console.log(res.error);
    }
    // Update user avatar
    user.tab.children[0].style.backgroundImage = `url(/API/getUserAvatar?time=${Date.now()})`;
    myprofile.avatar.image.style.backgroundImage = `url(/API/getUserAvatar?time=${Date.now()})`;
  });
});

myprofile.bio.save.addEventListener('click', function(event){
  app.request.post('API/updateBio', {bio: myprofile.bio.content.value}, function(res){
    if(!res.success){
      console.log(res.error);
    }
  });
});
