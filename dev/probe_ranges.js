/*jshint node:true, esnext:true */
'use strict';

let probeRanges = (regexp) => {
	const ranges = [];
	let currentRange = null;

	for (let charCode = 0; charCode <= 0xFFFF; charCode++) {
		regexp.lastIndex = 0; // In case you want to use g flag
		if (regexp.test(String.fromCharCode(charCode))) {
			if (!currentRange) {
				currentRange = [charCode, charCode];
				ranges.push(currentRange);
			} else {
				currentRange[1] = charCode;
			}
		} else {
			currentRange = null;
		}
	}

	return ranges;
};

let _formatRanges = (ranges) => {
	if (ranges.length === 0) {
		return '[]';
	}

	let _hex = (v) => {
		let vHex = v.toString(16).toUpperCase();
		let padding = '0'.repeat(String(vHex).length % 2);
		return '0x' + padding + vHex;
	};

	return '[\n' + ranges.map((range) => `\t[${_hex(range[0])}, ${_hex(range[1])}]`).join(',\n') + '\n]';
};

[/\s/, /\S/].forEach((regexp) => {
	console.log(regexp);
	console.log(_formatRanges(probeRanges(regexp)));
});