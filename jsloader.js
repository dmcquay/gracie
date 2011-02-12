var fs = require('fs');

var JSLoader = function(srcDirs) {
    if (srcDirs.length == 0) {
        throw new Error('no source directories provided');
    }
    this.srcDirs = srcDirs;
};

JSLoader.prototype.getContent = function(files, callback) {
    if (typeof(files) === 'undefined' || files.length == 0) {
        callback(null, '');
        return;
    }
    this.files = files;
    this.loadContent();
    callback(null, this.content);
};

JSLoader.prototype.loadContent = function() {
    var i, srcDir, file;
    srcDir = this.srcDirs[0];
    this.content = '';
    for (i = 0; i < this.files.length; i++) {
        this.content += fs.readFileSync(srcDir + '/' + this.files[i], 'utf8');
    }
};

module.exports.JSLoader = JSLoader;
