var fs = require('fs'),
    path = require('path'),
    util = require('util');

var JSLoader = function(srcDirs, opt) {
    if (srcDirs.length == 0) {
        throw new Error('no source directories provided');
    }
    this.srcDirs = srcDirs;
    this.initOptions();
    this.setOptions(opt);
};

JSLoader.prototype.initOptions = function() {
    this.opt = {
        debug: false
    };
};

JSLoader.prototype.setOptions = function(opt) {
    opt = opt || {};
    for (var key in opt) {
        this.opt[key] = opt[key];
    }
};

JSLoader.prototype.getContent = function(files, callback) {
    var self = this;
    if (files.length == 0) {
        callback(null, '');
        return;
    }
    this.readFilesWithDependencies(files, function(err, fileDataList, fileDataMap) {
        var i, fileNames;
        if (self.opt.debug) {
            fileNames = [];
            for (i = 0; i < fileDataList.length; i++) {
                fileNames.push(fileDataList[i].file);
            }
            util.print('File Names: ' + fileNames.join(', ') + "\n");
            util.print('srcDirs' + self.srcDirs.join(', ') + "\n");
        }
        var content = self.getFileContentInOrderByDependencies(fileDataList, fileDataMap);
        callback(null, content);
    });
};

JSLoader.prototype.readFilesWithDependencies = function(files, callback) {
    var self = this,
        fileDataList = [], //need to guarantee order
        fileDataMap = {}; //also need fast lookup, so we will use these side-by-side

    var readFileWithDependencies = function(fileIdx) {
        var file = files[fileIdx];

        if (self.opt.debug) {
            util.print("Reading files with dependencies. fileIdx: " + fileIdx + "\n");
        }

        //don't repeat files we've already processed
        if (fileDataMap[file]) {
            if (fileIdx < files.length - 1) {
                readFileWithDependencies(fileIdx + 1);
                return;
            } else {
                if (self.opt.debug) {
                    util.print("Calling callback after reading files with dependencies (upper call)\n");
                }
                callback(null, fileDataList, fileDataMap);
                return;
            }
        }

        self.findFile(file, function(err, filePath) {
            var fileData;

            if (err) throw new Error(err);
            fs.readFile(filePath, 'utf8', function(err, data) {
                
                fileData = self.parseFileData(file, data);
                fileDataMap[file] = fileData;
                fileDataList.push(fileData);

                //add dependencies to file list
                files = files.concat(fileData.dependencies);

                if (fileIdx < files.length - 1) {
                    readFileWithDependencies(fileIdx + 1);
                    return;
                } else {
                    if (self.opt.debug) {
                        util.print("Calling callback after reading files with dependencies (lower call)\n");
                    }
                    callback(null, fileDataList, fileDataMap);
                    return;
                }
            });
        });
    };
    readFileWithDependencies(0);
};

JSLoader.prototype.parseFileData = function(file, data) {
    var dependencies = [],
        content = '',
        foundNonRequireLine = false,
        i, line, lines;
    //TODO: don't assume unix style line separator
    lines = data.split("\n");
    for (i = 0; i < lines.length; i++) {
        line = lines[i];
        if (!foundNonRequireLine && this.isRequireLine(line)) {
            dependencies.push(this.extractDependency(line));
        } else {
            foundNonRequireLine = true;
            if (line.length > 0) content += line + "\n";
        }
    }
    return {
        file: file,
        dependencies: dependencies,
        content: content
    };
};

JSLoader.prototype.isRequireLine = function(line) {
    return /^\/\/require/.test(line);
};

JSLoader.prototype.extractDependency = function(line) {
    return line.match(/^\/\/require (.*)$/)[1];
};

JSLoader.prototype.getFileContentInOrderByDependencies = function(fileDataList, fileDataMap) {
    var content = '',
        fileData;
    while (fileDataList.length > 0) {
        fileData = this.removeNextFileData(fileDataList);
        //content += '// File: ' + fileData.file + "\n";
        content += fileData.content;
    }
    return content;
};

JSLoader.prototype.removeNextFileData = function(fileDataList) {
    var i, fileData;
    for (i = 0; i < fileDataList.length; i++) {
        if (fileDataList[i].dependencies.length == 0) {
            fileData = fileDataList.splice(i, 1)[0];
            this.removeFromAllDependencies(fileDataList, fileData.file);
            return fileData;
        }
    }
    throw new Error('Unable to resolve dependencies. You probably have a circular dependency or a dependency on a file that is unavailable.');
};

JSLoader.prototype.removeFromAllDependencies = function(fileDataList, file) {
    var i, c, dependencies;
    for (i = 0; i < fileDataList.length; i++) {
        dependencies = fileDataList[i].dependencies;
        for (c = 0; c < dependencies.length; c++) {
            if (dependencies[c] == file) {
                dependencies.splice(c, 1);
            }
        }
    }
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
