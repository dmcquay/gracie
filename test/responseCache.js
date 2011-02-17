var vows = require('vows'),
    assert = require('assert'),
    ResponseCache = require('../lib/responseCache').ResponseCache,
    Response = require('../lib/response').Response,
    Request = require('../lib/request').Request;

vows.describe('ResponseCache').addBatch({
    'when we create a new ResponseCache': {
        topic: function() { return new ResponseCache() },

        'we get an instance of ResponseCache': function(cache) {
            assert.ok(cache instanceof ResponseCache);
        }
    },
    
    'when we put a reponse': {
    	topic: function() {
    		var cache = new ResponseCache(),
    			request = new Request(['a.js']),
    			response = new Response();
    		response.content = 'abcd';
    		cache.put(request, response);
    		return cache.get(request);
    	},
    	
    	'we can get it back out with get': function(response) {
    		assert.equal(response.content, 'abcd');
    	}
    }
}).export(module);
