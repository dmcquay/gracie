var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    uglify = require('uglify-js'),
    Request = require('./request').Request,
    Response = require('./response').Response,
    File = require('./file').File,
    ResponseCache = require('./responseCache').ResponseCache;

var Server = function(srcDirs, opt) {
    if (srcDirs.length == 0) {
        throw new Error('no source directories provided');
    }
    this.setSourceDirectories(srcDirs);
    this.initOptions();
    this.setOptions(opt);
    this.responseCache = new ResponseCache();
};

Server.prototype.setSourceDirectories = function(srcDirs) {
    srcDirs = srcDirs.slice(0);
    for (var i = 0; i < srcDirs.length; i++) {
        if (/\/$/.test(srcDirs[i])) {
            srcDirs[i] = srcDirs[i].substring(0, srcDirs[i].length - 1);
        }
    }
    this.srcDirs = srcDirs;
};

Server.prototype.initOptions = function() {
    this.opt = { debug: false };
};

Server.prototype.setOptions = function(opt) {
    opt = opt || {};
    for (var key in opt) this.opt[key] = opt[key];
};

Server.prototype.getContent = function(files, callback, minify) {
    var self = this, request;

    if (files.length == 0) return callback('No files requested');
    request = new Request(files, minify);

    if (response = this.responseCache.get(request)) return callback(null, response);

    this.readFilesWithDependencies(request, function(err, request) {
        if (err) return callback(err);
        response = self.buildResponse(request);
        callback(null, response);
        self.responseCache.put(request, response);
    });
};

Server.prototype.readFilesWithDependencies = function(request, callback) {
    var self = this;

    var readFileWithDependencies = function(fileIdx) {
        var file = request.files[fileIdx];
        
        self.findFile(file.path, function(err, filePath) {
            if (err) return callback(err);
            file.resolvedPath = filePath;
            file.loadContent(function(err) {
            	request.addFilesIfUnique(file.dependencies);
            	if (fileIdx < request.files.length - 1) {
                    return readFileWithDependencies(fileIdx + 1);
                } else {
                    return callback(null, request);
                }
            });
        });
    };
    readFileWithDependencies(0);
};

Server.prototype.buildResponse = function(request) {
    var response = new Response(), i;
    request.sortFilesByDependencies();
    response.content = '';
    for (i = 0; i < request.files.length; i++) {
    	response.content += request.files[i].content;
    }
    if (request.minify) response.content = this.minifyContent(response.content);
    response.lastModified = new Date();
    return response;
};

Server.prototype.findFile = function(file, callback) {
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

Server.prototype.minifyContent = function(content) {
    content = uglify.parser.parse(content);
    content = uglify.uglify.ast_mangle(content);
    content = uglify.uglify.ast_squeeze(content);
    content = uglify.uglify.gen_code(content);
    return content;
};

module.exports.Server = Server;
