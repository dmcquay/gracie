//Roles that JSLoader plays (to help me split them out to separate classes):
//  * load content from cache
//  * resolve file paths
//  * read files
//  * check file source for dependencies
//  * represent files and their meta data in multiple data structures
//  * build order files must appear in output to satisfy dependencies
//  * build output
//  * minify output
//  * save content to cache
//  * listen to file changes to expire cached objects

var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    uglify = require('uglify-js'),
    Request = require('./request').Request,
    Response = require('./response').Response;

var JSLoader = function(srcDirs, opt) {
    if (srcDirs.length == 0) {
        throw new Error('no source directories provided');
    }
    this.setSourceDirectories(srcDirs);
    this.initOptions();
    this.setOptions(opt);
    this.cache = {};
    this.cacheFileDependencies = {};
};

JSLoader.prototype.setSourceDirectories = function(srcDirs) {
    srcDirs = srcDirs.slice(0);
    for (var i = 0; i < srcDirs.length; i++) {
        if (/\/$/.test(srcDirs[i])) {
            srcDirs[i] = srcDirs[i].substring(0, srcDirs[i].length - 1);
        }
    }
    this.srcDirs = srcDirs;
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

JSLoader.prototype.getContent = function(files, callback, minify) {
    var self = this, request;

    if (files.length == 0) return callback('No files requested');
    request = new Request(files, minify);

    if (response = this.getResponseFromCache(request)) return callback(null, response.content);

    this.readFilesWithDependencies(request, function(err, request) {
        if (err) return callback(err);
        response = self.getFileContentInOrderByDependencies(request);
        if (minify) response.content = self.minifyContent(response.content);
        callback(null, response.content);
        self.saveToCache(request, response);
    });
};

JSLoader.prototype.readFilesWithDependencies = function(request, callback) {
    var self = this;

    var readFileWithDependencies = function(fileIdx) {
        var file = request.files[fileIdx];

        if (self.opt.debug) {
            util.print("Reading files with dependencies. fileIdx: " + fileIdx + "\n");
        }

        //don't repeat files we've already processed
        if (request.fileDataMap[file]) {
            if (fileIdx < request.files.length - 1) {
                readFileWithDependencies(fileIdx + 1);
                return;
            } else {
                if (self.opt.debug) {
                    util.print("Calling callback after reading files with dependencies (upper call)\n");
                }
                callback(null, request);
                return;
            }
        }

        self.findFile(file, function(err, filePath) {
            var fileData;

            if (err) return callback(err);

            fs.readFile(filePath, 'utf8', function(err, data) {
                
                fileData = self.parseFileData(data);
                fileData.file = file;
                fileData.filePath = filePath;
                
                request.fileDataMap[file] = fileData;
                request.fileDataList.push(fileData);

                //add dependencies to file list
                request.files = request.files.concat(fileData.dependencies);

                if (fileIdx < request.files.length - 1) {
                    readFileWithDependencies(fileIdx + 1);
                    return;
                } else {
                    if (self.opt.debug) {
                        util.print("Calling callback after reading files with dependencies (lower call)\n");
                    }
                    callback(null, request);
                    return;
                }
            });
        });
    };
    readFileWithDependencies(0);
};

JSLoader.prototype.buildCacheKey = function(request) {
    return request.files.join(',') + (request.minify ? '|min' : '');
};

JSLoader.prototype.getResponseFromCache = function(request) {
    var cacheKey = this.buildCacheKey(request);
    return this.cache[cacheKey];
};

JSLoader.prototype.saveToCache = function(request, response) {
    var self = this,
        cacheKey = this.buildCacheKey(request);
    this.cache[cacheKey] = response;
    for (i = 0; i < request.fileDataList.length; i++) {
        if (!self.cacheFileDependencies[request.fileDataList[i].filePath]) {
            self.cacheFileDependencies[request.fileDataList[i].filePath] = [];
            (function(filePath) {
                fs.watchFile(filePath, function(curr, prev) {
                    var cacheKey = self.cacheFileDependencies[filePath];
                    delete self.cache[cacheKey];
                });
            })(request.fileDataList[i].filePath);
        }
        self.cacheFileDependencies[request.fileDataList[i].filePath].push(cacheKey);
    }
};

JSLoader.prototype.parseFileData = function(data) {
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

JSLoader.prototype.getFileContentInOrderByDependencies = function(request) {
    var content = '',
        fileDataList = request.fileDataList.slice(0),
        fileData,
        response = new Response();
    while (fileDataList.length > 0) {
        fileData = this.removeNextFileData(fileDataList);
        content += fileData.content;
    }
    response.content = content;
    return response;
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

JSLoader.prototype.minifyContent = function(content) {
    content = uglify.parser.parse(content);
    content = uglify.uglify.ast_mangle(content);
    content = uglify.uglify.ast_squeeze(content);
    content = uglify.uglify.gen_code(content);
    return content;
};

module.exports.JSLoader = JSLoader;
