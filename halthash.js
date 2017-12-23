'use strict';

var module;
if(module && module.exports) {
	var Worker = require("webworker-threads").Worker;
}

let halt = {
	/**
	 * Prepare the halthash parameters given a password. Returns
	 *  a promise with an additional stop() method which is to be
	 *  called when the preparation should finish.
	 *
	 * The promise resolves with {key, verify}
	**/
	prepare: function(pw, rep=10) {
		let res, promise = new Promise((ok, no) => {
			res = ok;
		});
		
		let worker = new Worker('halt-prepare.ww.js');
		worker.onmessage = function(ev) {
			res(ev.data);
			worker.terminate();
		}
		promise.stop = function() {
			worker.postMessage({});
		}
		worker.postMessage({pw, rep});
		
		return promise;
	},
	/**
	 * Generate the halthash parameters given a password and
	 *  verification data. Returns a promise which will either call
	 *  then() when the verification is passed, or else stop when
	 *  stop() is called to cancel the extraction.
	 *
	 * The promise resolves with the key.
	**/
	extract: function(pw, verify, rep=10) {
		let res, rej, promise = new Promise((ok, no) => {
			res = ok;
			rej = no;
		});
		
		let worker = new Worker('halt-extract.ww.js');
		worker.onmessage = function(ev) {
			res(ev.data);
			worker.terminate();
		}
		promise.stop = function() {
			worker.terminate();
			rej(new Error("Hash halted prematurely"));
		}
		worker.postMessage({pw, rep, verify});
		
		return promise;
	}
};

if(module && module.exports) {
	module.exports = halt;
}
