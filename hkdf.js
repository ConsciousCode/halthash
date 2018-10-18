'use strict';

const program = require("commander");

program.
	version('0.1.0').
	arguments('<in> <out>').
	option('-q, --quiet', 'Suppress progress feedback').
	option('-p, --password <pw>', "Provide a password").
	action(function(inp, out, opt) {
		let is, os;

		if(inp === '-') {
			is = process.stdin;
		}
		else {
			is = fs.openSync(inp, 'r');
		}

		if(out === '-') {
			os = process.stdout;
		}
		else {
			os = fs.openSync(out, 'w');
		}


	}).parse(process.argv);
