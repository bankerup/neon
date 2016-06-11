//Switch from one window to another
var PanelSwitcher = function(currentPanel) {
    this.currentPanel = currentPanel;
    this.show = function(whichPanel) {
        this.currentPanel.setAttribute('style', 'display : none');
        this.currentPanel = whichPanel;
        this.currentPanel.setAttribute('style', 'display : block');
        window.scroll(0, 0);
    }
}
