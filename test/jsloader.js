var vows = require('vows'),
    assert = require('assert'),
    JSLoader = require('.././jsloader.js').JSLoader,
    testSrcDirs = ['./test-src'];

vows.describe('JSLoader').addBatch({
    'when we create a new JSLoader': {
        topic: function() { return new JSLoader(testSrcDirs) },

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

    'the result of getContent with no files': {
        topic: function() {
            var loader = new JSLoader(testSrcDirs);
            loader.getContent([], this.callback);
        },

        'is an empty string': function(topic) {
            assert.equal(typeof(topic), 'string');
            assert.equal(topic.length, 0);
        }
    },

    'the result of getContent with one file': {
        topic: function() {
            var loader = new JSLoader(testSrcDirs);
            loader.getContent(['test1.js'], this.callback);
        },

        'is equal to the contents of that file': function(topic) {
            assert.equal(topic, "var a = 1;\n");
        }
    }
}).export(module);
