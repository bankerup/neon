var toggle = document.getElementById("toggle");
var menu = document.getElementById("menu");
toggle.addEventListener("click", function(event){
    menu.style.display = (menu.style.display == "block" ? "" : "block");
});
