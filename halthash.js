'use strict';

/**
 * Implementation of the Halting Key Derivation Function (HKDF)
 *  as described by "Halting Password Puzzles: Hard-to-break
 *  Encryption from Human-memorable Keys" by Xavier Boyen.
 *
 * Because the name "HKDF" already refers to HMAC-KDF, this project
 *  refers to it as "halthash".
**/

let halt = (() => {
	/* Node.js preamble */
	if(typeof module !== "undefined" && module.exports) {
		var {Worker} = require("webworker-threads");

		const crypto = require("crypto");
		var H = async x => {
			return crypto.createHash("sha256").update(x).digest();
		}

		var genSalt = () => {
			return crypto.randomBytes(32);
		}

		var isEqual = (x, y) => {
			return x.equals(y);
		}

		/**
		 * Yield control to the event loop so we don't take up everything.
		**/
		var yieldControl = () => {
			return new Promise((ok, no) => {
				process.nextTick(ok);
			});
		}
	}
	/* Browser preamble */
	else {
		var H = async x => {
			return new Uint8Array(await crypto.subtle.digest("SHA-256", x));
		}

		var genSalt = () => {
			return crypto.getRandomValues(new Uint8Array(32));
		}

		var isEqual = (x, y) => {
			for(let i = 0; i < x.length; ++i) {
				if(x[i] !== y[i]) {
					return false;
				}
			}
			return true;
		}

		var yieldControl = () => {
			return new Promise((ok, no) => {
				setTimeout(ok);
			})
		}
	}

	/**
	 * Hash two buffers appended together
	**/
	/* async */ function H2(a, b) {
		let ab = new Uint8Array(64);
		ab.set(a);
		ab.set(b, 32);
		return H(ab);
	}

	// Get n modulo m where n is a big number in a uint8array
	function bigmod(n, m) {
	  let c = 1, r = 0;

	  for(let i = 0; i < n.length; ++i) {
			// ab % m = ((a % m) * (b % m)) % m
			// a = digit, b = base
			r = (((n[i]%m)*(c%m))%m + r)%m;
			c = (256*c)%m;
	  }

	  return r;
	}

	/**
	 * Process the password for use in the algorithm
	**/
	async function init(pw, salt) {
		return await H2(
			await H(new TextEncoder("UTF-8").encode(pw)), salt
		);
	}

	/**
	 * Execute a step of the algorithm
	**/
	async function step(y, z, rep) {
		y.push(z);

		for(let i = 0; i < rep; ++i) {
			z = await H2(z, y[bigmod(z, y.length)]);
		}

		return z;
	}

	return {
		/**
		 * Prepare the halthash parameters given a password. Returns
		 *  a promise with an additional stop() method which is to be
		 *  called when the preparation should finish.
		 *
		 * The promise resolves with {key, verify: {halt, salt}}
		**/
		prepare(pw, rep=10) {
			if(typeof pw !== "string") {
				throw new TypeError("halt.extract password is not a string");
			}
			if(typeof rep !== "number") {
				throw new TypeError("halt.extract rep is not a number");
			}

			let cont = true;
			let promise = (async () => {
				let salt = genSalt();
				let y = [], z = await init(pw, salt);

				do {
					await yieldControl();
					z = await step(y, z, rep);
				} while(cont);

				return {
					key: await H2(z, salt),
					verify: {
						halt: await H2(y[0], z),
						salt
					}
				};
			})();
			promise.stop = function() {
				cont = false;
			}

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
		extract(pw, verify, rep=10) {
			let {halt, salt} = verify;

			if(typeof pw !== "string") {
				throw new TypeError("halt.extract password is not a string");
			}
			if(!(halt && salt)) {
				throw new TypeError("halt.extract verify is malformed")
			}
			if(typeof rep !== "number") {
				throw new TypeError("halt.extract rep is not a number");
			}

			let cont = true;
			let promise = (async () => {
				let y = [], z = await init(pw, salt);

				do {
					await yieldControl();

					z = await step(y, z, rep);

					if(isEqual(await H2(y[0], z), halt)) {
						return await H2(z, salt);
					}
				} while(cont);

				return null;
			})();
			promise.stop = function() {
				cont = false;
			}

			return promise;
		}
	};
})();

if(typeof module !== "undefined" && module.exports) {
	module.exports = halt;
}
