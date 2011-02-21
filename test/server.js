var vows = require('vows'),
    assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    temp = require('temp'),
    Server = require('../lib/server.js').Server,
    testSrc = './test/test-src',
    testSrcDirs = [testSrc + '/test-src-1', testSrc + '/test-src-2'];

vows.describe('Server').addBatch({
    'when we create a new Server': {
        topic: function() { return new Server(testSrcDirs.concat(['/test/with/extra/slash/'])) },

        'we get an instance of Server': function(topic) {
            assert.ok(topic instanceof Server);
        },

        'srcDirs is defined': function(topic) {
            assert.ok(typeof(topic.srcDirs) !== 'undefined');
        },

        'srcDirs is an array': function(topic) {
            assert.ok(topic.srcDirs instanceof Array);
        },

        'extra slash is removed from last srcDir': function(topic) {
            var dir = topic.srcDirs[topic.srcDirs.length-1];
            assert.equal(dir, '/test/with/extra/slash');
        }
    },

    'the result of getContent with one srcDir and no files': {
        topic: function() {
            var server = new Server([testSrcDirs[0]]);
            server.getContent([], this.callback);
        },

        'is an error': function(err, response) {
            assert.ok(err && err.length > 0);
            assert.isUndefined(response);
        }
    },

    'the result of getContent with one srcDir and one file': {
        topic: function() {
            var server = new Server([testSrcDirs[0]]);
            server.getContent(['a.js'], this.callback);
        },

        'is equal to the contents of that file': function(response) {
            assert.equal(response.content, "var a = 1;\n");
        }
    },

    'the result of getContent with one srcDir and two files': {
        topic: function() {
            var server = new Server([testSrcDirs[0]]);
            server.getContent(['a.js', 'b.js'], this.callback);
        },

        'is equal to the contents of both files': function(response) {
            assert.equal(response.content, "var a = 1;\nvar b = 2;\n");
        }
    },

    'the result of getContent with two srcDirs and three files': {
        topic: function() {
            var server = new Server(testSrcDirs);
            server.getContent(['a.js', 'b.js', 'c.js'], this.callback);
        },

        'is equal to the contents of all files': function(response) {
            assert.equal(response.content, "var a = 1;\nvar b = 2;\nvar c = 3;\n");
        }
    },

    'the result of getContent with one file and one dependency': {
        topic: function() {
            var server = new Server(testSrcDirs);
            server.getContent(['d.js'], this.callback);
        },

        'is equal to the contents of d and the dependency a': function(response) {
            assert.equal(response.content, "var a = 1;\nvar d = 4;\n");
        }
    },

    'the result of getContent with a duplicate dependency': {
        topic: function() {
            var server = new Server([testSrc + '/duplicate-dependency']);
            server.getContent(['a.js', 'c.js'], this.callback);
        },

        'contains the content of the dependency only once': function(response) {
            assert.equal(response.content, "c\nb\na\n");
        }
    },

    'the result of getContent with multiple dependencies in one file': {
        topic: function() {
            var server = new Server([testSrc + '/multi-dependencies']);
            server.getContent(['a.js'], this.callback);
        },

        'contains both dependencies': function(response) {
            assert.equal(response.content, "b\nc\na\n");
        }
    },

    'the result of getContent in complex example (chat)': {
        topic: function() {
            var server = new Server([testSrc + '/chat']);
            server.getContent(['chat.js'], this.callback);
        },

        'contains correct output': function(response) {
            assert.equal(response.content, "vend/jquery-1.4.2.min.js\nvend/jquery.cookie.js\nPCHAT/controller/Chat.js\nchat.js\n");
        }
    }
}).export(module);
