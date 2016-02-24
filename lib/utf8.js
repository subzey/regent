/*jshint node:true, esnext:true */
'use strict';

const byteCount = (str) => {
	let sum = 0;

	for (let i=str.length; i--; ) {
		let charCode = str.charCodeAt(0);
		if (charCode < 0x0080) {
			sum += 1;
		} else if (charCode < 0x0800) {
			sum += 2;
		} else if (charCode < 0x10000) {
			sum += 3;
		} else {
			throw new RangeError(`char U+${charCode.toString(16)} is out of range`);
		}
	}

	return sum;
};

const charUgliness = (charCode) => {
	if (charCode === 0x09) { // Tab character
		return 1; // Low ugliness
	}

	if (charCode < 0x20) { // C0 control codes (ASCII special chars)
		return 2; // Medium ugliness
	}

	if (charCode > 0x7E && charCode < 0xA0) { // C1 control codes and DEL
		return 2; // Medium ugliness
	}

	if (charCode > 0xD7FF && charCode < 0xE000) { // Surrogates
		return 3; // Very ugly! (and long)
	}

	return 0; // Just a regular char
};

exports.byteCount = byteCount;
exports.charUgliness = charUgliness;