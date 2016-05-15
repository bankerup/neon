var fs = require('fs');
fs.open(__dirname + '/temp/temp.bin', 'w', function(err, fd){
    fs.ftruncate(fd, 1024, function(err){
        fs.close(fd, function(){
            console.log('done');
        })
    })
});
