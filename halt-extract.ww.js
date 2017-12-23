'use strict';

importScripts('common.ww.js');

async function loop() {
	await forward();
	
	// Generate the successful halt message
	if(isEqual(new Uint8Array(await H2(y[0], z)), halt)) {
		postMessage(await H2(z, salt));
		cont = false;
	}
}

onmessage = async function(ev) {
	// First message sets up the exec environment
	({halt, salt} = ev.data.verify);
	init(ev);
}
