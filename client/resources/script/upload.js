// The file uploader object
function FileUploader() {
    var fileUploader = this;
    // The container for the files
    fileUploader.files = [];
    // A flag to see if we are already sending a file
    fileUploader.isSending = false;
    // The current file
    fileUploader.currentFile = 0;
    // Append the new files to the list of files
    fileUploader.addFiles = function(files) {
        for(var i=0; i<files.length; i++) {
            fileUploader.files.push(files[i]);
        }
        fileUploader.startUploading();
    }
    fileUploader.startUploading = function() {
        // We aleady sent all the files
        if(fileUploader.currentFile >= fileUploader.files.length) {
            fileUploader.isSending =false;
            return;
        }
        // We are already sending something
        if(fileUploader.isSending) {
            return;
        }
        // Set the flag and send the file
        fileUploader.isSending =true;
        fileUploader.sendMeta(fileUploader.files[fileUploader.currentFile]);
    }
    // Send the metadata of the file to the server
    fileUploader.sendMeta = function(file) {
        request.post('API/addNewFile', {
            name: file.name,
            size: file.size,
            type: file.type
        }, function(res){
            if(!res.success) {
                console.log(res.error);
                fileUploader.isSending = false;
                fileUploader.currentFile++;
                setTimeout(fileUploader.startUploading(), 3000);
            }
            else {
                // Upload the file data
                fileUploader.uploadFile(res.id, file);
            }
        });
    }
    // Upload the file data
    fileUploader.uploadFile = function(id, file) {
        var myFile = new FileReader();
        // read the data from the file
        myFile.readAsArrayBuffer(file);
        // execute the following code after reading the data
        myFile.onload = function (event) {
            var item = document.getElementById('file' + fileUploader.currentFile);
            const chunkSize = 1024*1024;
            var myData = myFile.result;
            var sent = 0;
            var sentForProgressbar = 0;
            var total = myData.byteLength;
            var finished = false;
            var activeThreads = 0;
            // the sender object
            function MySender() {
                var mySender = this;
                var sentBySender = 0;
                mySender.sender = new XMLHttpRequest();
                mySender.sender.addEventListener('load', function () {
                    sentBySender = 0;
                    activeThreads--;
                    mySender.send();
                });
                mySender.sender.upload.addEventListener('progress', function(event) {
                    sentForProgressbar += (event.loaded - sentBySender);
                    var percent = Math.min(Math.ceil(sentForProgressbar/total*100),100);
                    item.children[0].children[0].setAttribute("style", "width: " + percent + "%; max-width: 100%;")
                    sentBysender = event.loaded;
                });
                mySender.send = function () {
                    if(!finished){
                        activeThreads++;
                        var myChunk = new Blob([myData.slice(sent, sent + chunkSize)], {type: 'application/bin'});
                        var myFormData = new FormData;
                        myFormData.append('data', myChunk);
                        myFormData.append('size', myChunk.size);
                        myFormData.append('position', sent);
                        myFormData.append('id', id);
                        // the place to send the data
                        mySender.sender.open('POST', 'API/appendData');
                        mySender.sender.send(myFormData);
                        sent += chunkSize;
                        if(sent >= total){
                            finished = true;
                        }
                    }
                    if(activeThreads == 0) {
                        fileUploader.isSending = false;
                        fileUploader.currentFile++;
                        // Mark the file as complete
                        var request = new XMLHttpRequest();
                        var myFormData = new FormData();
                        myFormData.append("id", id);
                        request.open("POST", "API/closeFile");
                        request.send(myFormData);
                        request.onreadystatechange = function(event) {
                            if((this.readyState === 4) && (this.status === 200)) {
                                setTimeout(fileUploader.startUploading(), 3000);
                            }
                        }
                    }
                }
            }
            (new MySender()).send();
            (new MySender()).send();
            (new MySender()).send();
            (new MySender()).send();
        }
    }
}
// New file uploader
uploader = new FileUploader();
// Prevent the browser from opening the files
document.addEventListener("dragover", function(event){
    event.preventDefault();
});
// Listen to the drop event so I can add the files to the list
document.addEventListener("drop", function(event){
    event.preventDefault();
    // Get the list of files
    var files = event.dataTransfer.files;
    // A pointer to the list
    var uploadWindow = document.getElementById("upload-window");
    // Loop through files
    // And add them to the table
    var order = uploader.files.length;
    for(var i=0; i<files.length; i++) {
        var item = `<div class="item" id="${"file" + (i + order)}">
                        <div class="progress">
                            <div class="fill"></div>
                        </div>
                        <p class="name">${files[i].name}</p>
                    </div>`;
        uploadWindow.innerHTML += item;
    }
    uploader.addFiles(files);
});
