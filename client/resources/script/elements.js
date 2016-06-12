// Get the elements
var getElement = function(element) {
    return document.getElementById(element)
}

var getElements = function(element) {
    return document.getElementsByClassName(element)
}

// They key elements
var toggle = getElement('toggle');
var menu = getElement('menu');
var user = {
  menu: getElement('user-menu'),
  tab: getElement('user-tab')
}
var logout = {
  tab: getElement('logout-tab')
}
var search = {
  bar: getElement('search-bar'),
  suggestions: getElement('suggestions')
}
var home = {
  tab: getElement('home-tab'),
  panel: getElement('home-panel')
}
var about = {
  tab: getElement('about-tab'),
  panel: getElement('about-panel')
}
var login = {
  panel: getElement('login-panel'),
  email: getElement('login-email'),
  password: getElement('login-password'),
  button: getElement('login-button'),
  warning: getElement('login-warning')
}
var register = {
  tab: getElement('register-tab'),
  panel: getElement('register-panel'),
  name: getElement('register-name'),
  email: getElement('register-email'),
  password: getElement('register-password'),
  button: getElement('register-button'),
  warning: getElement('register-warning')
}
var upload = {
  tab: getElement('upload-tab'),
  panel: getElement('upload-panel'),
  addFiles: getElement('add-files'),
  addFilesButton: getElement('add-files-button'),
  clearFiles: getElement('clear-files')
}
var myprofile = {
  tab: getElement('myprofile-tab'),
  panel: getElement('myprofile-panel'),
  avatar: {
    image: getElement('avatar-image'),
    change: getElement('change-avatar'),
    button: getElement('change-avatar-button')},
  bio: {
    content: getElement('bio-content'),
    save: getElement('save-bio')}
}
var myfiles = {
  tab: getElement('myfiles-tab'),
  panel: getElement('myfiles-panel'),
}
