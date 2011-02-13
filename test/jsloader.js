var vows = require('vows'),
    assert = require('assert'),
    JSLoader = require('.././jsloader.js').JSLoader,
    testSrcDirs = ['./test-src-1', './test-src-2'];

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
            loader.getContent(['test1.js'], this.callback);
        },

        'is equal to the contents of that file': function(topic) {
            assert.equal(topic, "var a = 1;\n");
        }
    },

    'the result of getContent with one srcDir and two files': {
        topic: function() {
            var loader = new JSLoader([testSrcDirs[0]]);
            loader.getContent(['test1.js', 'test2.js'], this.callback);
        },

        'is equal to the contents of both files': function(topic) {
            assert.equal(topic, "var a = 1;\nvar b = 2;\n");
        }
    }/*,

    'the result of getContent with two srcDirs and three files': {
        topic: function() {
            var loader = new JSLoader(testSrcDirs);
            loader.getContent(['test1.js', 'test2.js', 'test3.js'], this.callback);
        },

        'is equal to the contents of all files': function(topic) {
            assert.equal(topic, "var a = 1;\nvar b = 2;\nvar c = 3;\n");
        }
    }*/
}).export(module);
