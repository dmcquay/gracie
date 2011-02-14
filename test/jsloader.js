var vows = require('vows'),
    assert = require('assert'),
    JSLoader = require('.././jsloader.js').JSLoader,
    testSrc = './test/test-src',
    testSrcDirs = [testSrc + '/test-src-1', testSrc + '/test-src-2'];

vows.describe('JSLoader').addBatch({
    'when we create a new JSLoader': {
        topic: function() { return new JSLoader([testSrcDirs[0]]) },

        'we get an instance of JSLoader': function(topic) {
            assert.ok(topic instanceof JSLoader);
        },

        'srcDirs is defined': function(topic) {
            assert.ok(typeof(topic.srcDirs) !== 'undefined');
        },

        'srcDirs is an array': function(topic) {
            assert.ok(topic.srcDirs instanceof Array);
        }
    },

    'the result of getContent with one srcDir and no files': {
        topic: function() {
            var loader = new JSLoader([testSrcDirs[0]]);
            loader.getContent([], this.callback);
        },

        'is an empty string': function(topic) {
            assert.equal(typeof(topic), 'string');
            assert.equal(topic.length, 0);
        }
    },

    'the result of getContent with one srcDir and one file': {
        topic: function() {
            var loader = new JSLoader([testSrcDirs[0]]);
            loader.getContent(['a.js'], this.callback);
        },

        'is equal to the contents of that file': function(topic) {
            assert.equal(topic, "var a = 1;\n");
        }
    },

    'the result of getContent with one srcDir and two files': {
        topic: function() {
            var loader = new JSLoader([testSrcDirs[0]]);
            loader.getContent(['a.js', 'b.js'], this.callback);
        },

        'is equal to the contents of both files': function(topic) {
            assert.equal(topic, "var a = 1;\nvar b = 2;\n");
        }
    },

    'the result of getContent with two srcDirs and three files': {
        topic: function() {
            var loader = new JSLoader(testSrcDirs);
            loader.getContent(['a.js', 'b.js', 'c.js'], this.callback);
        },

        'is equal to the contents of all files': function(topic) {
            assert.equal(topic, "var a = 1;\nvar b = 2;\nvar c = 3;\n");
        }
    },

    'the result of getContent with one file and one dependency': {
        topic: function() {
            var loader = new JSLoader(testSrcDirs);
            loader.getContent(['d.js'], this.callback);
        },

        'is equal to the contents of d and the dependency a': function(topic) {
            assert.equal(topic, "var a = 1;\nvar d = 4;\n");
        }
    },

    'the result of getContent with a duplicate dependency': {
        topic: function() {
            var loader = new JSLoader([testSrc + '/duplicate-dependency']);
            loader.getContent(['a.js'], this.callback);
        },

        'contains the content of the dependency only once': function(topic) {
            assert.equal(topic, "c\nb\na\n");
        }
    },

    'the result of getContent with multiple dependencies in one file': {
        topic: function() {
            var loader = new JSLoader([testSrc + '/multi-dependencies']);
            loader.getContent(['a.js'], this.callback);
        },

        'contains both dependencies': function(topic) {
            assert.equal(topic, "b\nc\na\n");
        }
    }
}).export(module);
