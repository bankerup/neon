home.tab.addEventListener('click', function(event){
    app.getFiles({skip : 0});
    app.panelSwitcher.show(home.panel);
});
