'use strict';

var running = false, cont = true;
var halt, salt, z, rep, y = [];

function str2buf(str) {
	return new TextEncoder("UTF-8").encode(str);
}

function H(x) {
	return crypto.subtle.digest("SHA-256", x);
}

function H2(a, b) {
	let ab = new Uint8Array(64);
	
	ab.set(new Uint8Array(a));
	ab.set(new Uint8Array(b), 32);
	
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

function arr2hex(arr) {
	let s = "";
	arr = new Uint8Array(arr);
	for(let i = 0; i < arr.length; ++i) {
		if(arr[i] <= 0xf) {
			s += '0';
		}
		s += arr[i].toString(16);
	}
	return s;
}

async function forward() {
	y.push(z);
	
	for(let i = 0; i < rep; ++i) {
		z = await H2(z, y[bigmod(z, y.length - 1)]);
	}
}

function isEqual(x, y) {
	for(let i = 0; i < x.length; ++i) {
		if(x[i] !== y[i]) {
			return false;
		}
	}
	return true;
}

async function iter_loop() {
	await loop();
	if(cont) {
		setTimeout(iter_loop, 0);
	}
}

async function init(ev) {
	let pw = await H(str2buf(ev.data.pw));
	z = await H2(pw, salt);
	rep = ev.data.rep;
	
	running = true;
	iter_loop();
}
