/*jshint node:true, esnext:true */
'use strict';

let escapeChar = (character) => {
	if (
		character === ']' ||
		character === '/' ||
		character === '\\' ||
		character === '\u2028' ||
		character === '\u2029'
	) {
		return '\\' + character;
	}
	if (character === '\r') {
		return '\\r';
	}
	if (character === '\n') {
		return '\\n';
	}
	return character;
};

let rangeString = (fromCharCode, toCharCode) => {
	if (fromCharCode === toCharCode) {
		return escapeChar(String.fromCharCode(fromCharCode));
	} else if (fromCharCode === toCharCode - 1) {
		return (
			escapeChar(String.fromCharCode(fromCharCode)) +
			escapeChar(String.fromCharCode(toCharCode))
		);
	} else {
		return (
			escapeChar(String.fromCharCode(fromCharCode)) +
			'-' +
			escapeChar(String.fromCharCode(toCharCode))
		);
	}
};


let classString = (ranges, negated) => {
	const CHAR_CODE_DASH = 0x2D;
	const CHAR_CODE_CARET = 0x5E;

	let rangesCopy = []; // Do not modify the original array

	for (let range of ranges) {
		if (
			!range.special &&
			range.to - range.from === 1 &&
			(range.to === CHAR_CODE_DASH || range.from === CHAR_CODE_DASH)
		) {
			// Split range of two chars of one of these chars is dash
			rangesCopy.push({
				from: range.from,
				to: range.from
			});
			rangesCopy.push({
				from: range.to,
				to: range.to
			});
		} else {
			rangesCopy.push(range);
		}
	}

	let dashSanitized = false;
	for (let i = rangesCopy.length; i--; ){
		let range = rangesCopy[i];
		if (!negated && i === 0 && range.from === CHAR_CODE_CARET) {
			// Move range starting with caret to the end
			rangesCopy.splice(i, 1);
			rangesCopy.push(range);
		} else if (!dashSanitized && i !== 0 && range.from === CHAR_CODE_DASH && range.to === range.from) {
			// Move singular dash letter to the start
			rangesCopy.splice(i, 1);
			rangesCopy.unshift(range);
		}
	}

	console.log(rangesCopy);

	// Assemble the string
	let retVal = '';
	for (let i = 0; i < rangesCopy.length; i++) {
		let range = rangesCopy[i];
		if (range.special) {
			retVal += range.toString();
			continue;
		}

		let str = rangeString(range.from, range.to);
		if (!negated && i === 0 && str.charCodeAt(0) === CHAR_CODE_CARET) {
			str = '\\' + str;
		} else if (i !== 0 && i !== rangesCopy.length - 1 && str.charCodeAt(0) === CHAR_CODE_DASH) {
			str = '\\' + str;
		}

		retVal += str;
	}

	if (negated) {
		return '[^' + retVal + ']';
	} else {
		return '[' + retVal + ']';
	}
};

exports.escapeChar = escapeChar;
exports.classString = classString;