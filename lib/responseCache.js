var ResponseCache = function() {
	this.cache = {};
};

ResponseCache.prototype.buildCacheKey = function(request) {
	var i, filePaths = [];
	for (i = 0; i < request.files.length; i++) {
		filePaths.push(request.files[i].path);
	}
    return filePaths.sort().join(',') + (request.minify ? '|min' : '');
};

ResponseCache.prototype.get = function(request) {
    var cacheKey = this.buildCacheKey(request);
    return this.cache[cacheKey];
};

ResponseCache.prototype.put = function(request, response) {
    var self = this,
        cacheKey = this.buildCacheKey(request);
    this.cache[cacheKey] = response;
    
    /*
    for (i = 0; i < request.fileDataList.length; i++) {
        if (!self.cacheFileDependencies[request.fileDataList[i].filePath]) {
            self.cacheFileDependencies[request.fileDataList[i].filePath] = [];
            (function(filePath) {
                fs.watchFile(filePath, function(curr, prev) {
                    var cacheKey = self.cacheFileDependencies[filePath];
                    //delete self.cache[cacheKey];
                });
            })(request.fileDataList[i].filePath);
        }
        self.cacheFileDependencies[request.fileDataList[i].filePath].push(cacheKey);
    }
    */
};

module.exports.ResponseCache = ResponseCache;
