var JSLoader = require('./jsloader').JSLoader,
    url = require('url'),
    crypto = require('crypto');

var handleRequest = function(req, res, jsloader) {
    var files, query;
    query = url.parse(req.url, true).query;

    if (typeof(query) === 'undefined' || typeof(query.sources) === 'undefined' || /\.\./.test(query.sources)) {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end("ERROR: Missing or invalid sources parameter.\n");
        return;
    }

    files = query.sources.split(',');
    minify = false;
    if (query.minify) minify = true;
    jsloader.getContent(files, function(err, response) {
        var hash;
        if (err) {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end("ERROR: " + err + "\n");
        } else {
            if (!response.digest) {
                hash = crypto.createHash('md5');
                hash.update(response.content);
                response.digest = hash.digest(encoding='hex');
            }
            res.writeHead(200, {
                'Content-Type': 'application/x-javascript',
                'Last-Modified': response.lastModified.toUTCString(),
                'ETag': response.digest
            });
            res.end(response.content);
        }
    }, minify);
};

var connectMiddleware = function(urlPath, srcDirs) {
    var jsloader = new JSLoader(srcDirs);
    return function(req, res, next) {
        var pathname = url.parse(req.url).pathname;
        if (pathname === urlPath) {
            handleRequest(req, res, jsloader);
        } else {
            req.jsloader = jsloader;
            next();
        }
    };
};

module.exports = connectMiddleware;
