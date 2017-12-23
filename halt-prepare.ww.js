'use strict';

importScripts('common.ww.js');

async function loop() {
	await forward();
}

onmessage = async function(ev) {
	// Second message is the halt command
	if(running) {
		postMessage({
			key: await H2(z, salt),
			verify: {
				halt: await H2(y[0], z),
				salt
			}
		});
		cont = false;
	}
	// First message sets up the exec environment
	else {
		salt = crypto.getRandomValues(new Uint8Array(32));
		init(ev);
	}
}
