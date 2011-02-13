var JSLoader = require('./jsloader').JSLoader,
    url = require('url'),
    loader = new JSLoader(['./test/test-src-1', './test/test-src-2']);

var http = require('http');
http.createServer(function (req, res) {
    var files, content;
    files = url.parse(req.url).pathname.slice(1).split(',');
    content = loader.getContent(files, function(err, content) {
        res.writeHead(200, {'Content-Type': 'text/javascript'});
        res.end(content);
    });
}).listen(8124, "127.0.0.1");
console.log('Server running at http://127.0.0.1:8124/');
