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
        readFileFunc;

    readFileFunc = function(i) {
        self.findFile(self.files[i], function(err, filePath) {
            if (err) throw new Error(err);
            fs.readFile(filePath, 'utf8', function(err, data) {
                content += data;
                if (++i < self.files.length) {
                    readFileFunc(i);
                } else {
                    callback(null, content);
                }
            });
        });
    };
    readFileFunc(0);
};

JSLoader.prototype.findFile = function(file, callback) {
    var self = this,
        checkFileFunc;
    
    checkFileFunc = function(i) {
        var filePath = self.srcDirs[i] + '/' + file;
        path.exists(filePath, function(exists) {
            if (exists) {
                callback(null, filePath);
            } else if (++i < self.srcDirs.length) {
                checkFileFunc(i);
            } else {
                callback('cannot find file "' + file + '"');
            }
        });
    }
    checkFileFunc(0);
};

module.exports.JSLoader = JSLoader;
