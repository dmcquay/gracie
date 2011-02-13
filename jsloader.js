var fs = require('fs'),
    path = require('path');

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
    this.loadContent(function(err, content) {
        callback(null, content);
    });
};

JSLoader.prototype.loadContent = function(callback) {
    var self = this,
        content = '',
        numFilesRead = 0,
        i, srcDir, file;
    srcDir = this.srcDirs[0];
    for (i = 0; i < this.files.length; i++) {
        this.findFile(this.files[i], function(err, filePath) {
            if (err) throw new Error(err);
            content += fs.readFileSync(filePath, 'utf8');
            numFilesRead++;
            if (numFilesRead == self.files.length) {
                callback(null, content);
            }
        });
    }
};

JSLoader.prototype.findFile = function(file, callback) {
    var filePath = this.srcDirs[0] + '/' + file;

    path.exists(filePath, function(exists) {
        if (exists) {
            callback(null, filePath);
        } else {
            callback('cannot find file "' + file + '"');
        }
    });
};

module.exports.JSLoader = JSLoader;
