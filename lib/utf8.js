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

const _mayBeEscapedHash = {};

{
	for (let character of [
		'`', // inside template literal
		'\r', // inside string or regexp
		'\n', // inside string or regexp
		'$', // inside template literal or regexp
		'(', // inside regexp
		')', // inside regexp
		'*', // inside regexp
		'+', // inside regexp
		'.', // inside regexp
		'/', // inside regexp
		'?', // inside regexp
		'[', // inside regexp
		'\\', // anywhere
		']', // inside regexp class
		'^', // inside regexp
		'{', // inside template literal or regexp
		'|', // inside regexp
		'}', // inside regexp
		'\u2028', // inside string or regexp
		'\u2029', // inside string or regexp
	]) {
		_mayBeEscapedHash[character.charCodeAt(0)] = true;
	};
}


const getBestCharCodes = (from, to, amount) => {
	if (amount <= 0) {
		return [];
	}

	let localTo;
	if (from <= 0x7F) {
		localTo = Math.min(0x7F, to);
	} else if (from <= 0x07FF) {
		localTo = Math.min(0x07FF, to);
	} else if (from <= 0xFFFF) {
		localTo = Math.min(0xFFFF, to)
	} else {
		return [];
	}

	const available = localTo - from + 1;
	if (available > amount) {
		// We have plenty of choice
		const good = [];
		const escaped = [];

		for (let charCode = from; charCode <= localTo; charCode++) {
			if (_mayBeEscapedHash[charCode]){
				escaped.push(charCode);
			} else {
				good.push(charCode);
				if (good.length === amount) {
					return good;
				}
			}
		}
		return good.concat(escaped);
	} else {
		const all = [];
		for (let charCode = from; charCode <= localTo; charCode++) {
			all.push(charCode);
		}

		if (available < amount && to > localTo) {
			return all.concat(getBestCharCodes(localTo + 1, to, amount - available))
		} else {
			return all;
		}
	}
}


exports.byteCount = byteCount;
exports.charUgliness = charUgliness;
exports.getBestCharCodes = getBestCharCodes;
